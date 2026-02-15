// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { TypeMapper } from './type-mapper.js';
import { TemplateEngine } from './template-engine.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const limits = {
    unsigned: [
        { type: 'byte', min: 0n, max: 0xFFn },
        { type: 'ushort', min: 0n, max: 0xFFFFn },
        { type: 'uint', min: 0n, max: 0xFFFFFFFFn },
        { type: 'ulong', min: 0n, max: 0xFFFFFFFFFFFFFFFFn }
    ],
    integer: [
        { type: 'sbyte', min: -0x80n, max: 0x7Fn },
        { type: 'short', min: -0x8000n, max: 0x7FFFn },
        { type: 'int', min: -0x80000000n, max: 0x7FFFFFFFn },
        { type: 'long', min: -0x8000000000000000n, max: 0x7FFFFFFFFFFFFFFFn }
    ],
    float: [
        { type: 'float', min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY }
    ],
    double: [
        { type: 'double', min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY }
    ]
};

function getUnderlyingType(traits) {
    const base = traits.base;
    let minimum = Object.hasOwn(traits, 'minimum');
    let maximum = Object.hasOwn(traits, 'maximum');
    switch (base) {
        case 'unsigned':
        case 'enumerated':
            minimum = minimum ? BigInt(traits.minimum) : 0n;
            maximum = maximum ? BigInt(traits.maximum) : 0xFFFFFFFFn;
            break;
        case 'real':
        case 'double':
            minimum = minimum ? Number(traits.minimum) : Number.NEGATIVE_INFINITY;
            maximum = maximum ? Number(traits.maximum) : Number.POSITIVE_INFINITY;
            break;
        case 'integer':
            minimum = minimum ? BigInt(traits.minimum) : -0x80000000n;
            maximum = maximum ? BigInt(traits.maximum) : 0x7FFFFFFFn;
            break;
        default:
            throw new Error(`Unsupported base type: ${base}`);
    }
    const ranges = limits[base === 'enumerated' ? 'unsigned' : base];
    for (const range of ranges) {
        if (minimum >= range.min && maximum <= range.max) {
            const min = minimum === range.min ? `${range.type}.MinValue` : minimum;
            const max = maximum === range.max ? `${range.type}.MaxValue` : maximum;
            return { base: traits.base, type: range.type, min: min, max: max };
        }
    }
    throw new Error(`No suitable underlying type found for base: ${base} with range [${minimum}, ${maximum}]`);
}

function getBaseTypeForNonNegativeInteger(value) {
    if (Number.isInteger(value) === false || value < 0) {
        throw new Error('Value must be a non-negative integer');
    }
    if (value <= 0xFF) return 'byte';
    if (value <= 0xFFFF) return 'ushort';
    if (value <= 0xFFFFFFFF) return 'uint';
    return 'ulong';
}

function getBaseForBitString(length) {
    if (Number.isInteger(length) === false || length < 0 || length > 64) {
        throw new Error('Value must be a non-negative integer');
    }
    let mask = null;
    if (length < 64) {
        // (1 << (length + 1)) - 1, but for 32+ bits use BigInt
        if (length < 32) {
            mask = (1 << (length + 1)) - 1;
            mask = '0x' + mask.toString(16).toUpperCase();
        } else {
            mask = (BigInt(1) << BigInt(length + 1)) - BigInt(1);
            mask = '0x' + mask.toString(16).toUpperCase();
        }
    } else if (length === 63) {
        // Special case for 64 bits: all bits set
        mask = '0xFFFFFFFFFFFFFFFF';
    }
    if (length <= 0xFF) return { bits: 8, type: 'byte', mask };
    if (length <= 0xFFFF) return { bits: 16, type: 'ushort', mask };
    if (length <= 0xFFFFFFFF) return { bits: 32, type: 'uint', mask };
    return { bits: 64, type: 'ulong', mask };
}




export class CodeGenerator {
    constructor(language, options = {}) {
        this.language = language;
        this.projectRoot = options.projectRoot || path.join(__dirname, '..');
        this.definitionsDir = options.definitionsDir || path.join(this.projectRoot, 'definitions');
        this.templatesDir = options.templatesDir || path.join(this.projectRoot, 'templates', language);
        this.outputDir = options.outputDir || path.join(this.projectRoot, 'output', language);

        this.typeMapper = null;
        this.templateEngine = null;
    }

    /**
     * Initialize the generator
     */
    async initialize() {
        // Load language mappings
        const mappingsPath = path.join(this.templatesDir, 'mappings.json');
        const mappingsContent = await fs.readFile(mappingsPath, 'utf-8');
        const mappings = JSON.parse(mappingsContent);

        this.typeMapper = new TypeMapper(this.language, mappings);
        this.templateEngine = new TemplateEngine(this.typeMapper);

        // Ensure output directory exists
        await fs.mkdir(this.outputDir, { recursive: true });
    }

    /**
     * Load all type definitions
     * @returns {Promise<Array>} Array of type definitions
     */
    async loadDefinitions() {
        const files = await fs.readdir(this.definitionsDir);
        const definitions = [];

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            const filePath = path.join(this.definitionsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const definition = JSON.parse(content);

            definitions.push({
                ...definition,
                sourceFile: file
            });
        }

        return definitions;
    }

    /**
     * Recursively collect all anonymous types from a definition
     * @param {Object} definition - Type definition
     * @param {string} parentName - Parent type name
     * @returns {Array} Array of anonymous type definitions with metadata
     */
    collectAnonymousTypes(definition, parentName = null) {
        const anonymousTypes = [];
        const typeName = parentName || this.typeMapper.convertToNamingConvention(definition.name, 'type');

        const processType = (typeRef, fieldName, contextName) => {
            if (!this.isAnonymousType(typeRef)) {
                return;
            }

            const category = this.getAnonymousTypeCategory(typeRef);
            const anonymousTypeName = this.typeMapper.convertToNamingConvention(
                `${contextName}_${fieldName}`,
                'type'
            );

            const anonymousDef = {
                name: `${contextName}_${fieldName}`,
                typeName: anonymousTypeName,
                alias: `${contextName}${fieldName}`,
                category: category,
                parentType: contextName,
                fieldName: fieldName,
                type: typeRef
            };

            anonymousTypes.push(anonymousDef);

            // Recursively process nested types
            if (category === 'sequence' && typeRef.fields) {
                typeRef.fields.forEach(field => {
                    processType(field.type, field.name, anonymousTypeName);
                });
            }

            if (category === 'choice' && typeRef.options) {
                typeRef.options.forEach(option => {
                    processType(option.type, option.name, anonymousTypeName);
                });
            }
        };

        // Process fields in sequences
        if (definition.type?.base === 'sequence' && definition.type.fields) {
            definition.type.fields.forEach(field => {
                processType(field.type, field.name, typeName);
            });
        }

        // Process options in choices
        if (definition.type?.base === 'choice' && definition.type.options) {
            definition.type.options.forEach(option => {
                processType(option.type, option.name, typeName);
            });
        }

        return anonymousTypes;
    }









    /**
     * Determine the type category of a definition
     * @param {Object} definition - Type definition
     * @returns {string} Type category (enumerated, sequence, primitive, etc.)
     */
    getTypeCategory(definition, utobject) {
        if (Object.hasOwn(definition, 'primitive')) {
            return null;
        }
        const base = definition.type.base;
        if (['unsigned', 'integer', 'real', 'double', 'enumerated'].includes(base) && (definition.type.minimum !== undefined || definition.type.maximum !== undefined)) {
            let utype = getUnderlyingType(definition.type);
            if (base !== 'enumerated') {

                console.log(`################Determined underlying type for ${definition.name}: ${utype.type}`);
                utobject.type = utype;
                return 'strongly-typed-primitive.cs';
            }
        }

        if (!base || base.startsWith('unsigned') || base.startsWith('integer') || base.startsWith('enumerated') || base.startsWith('octet-string')) {
            return null;
        }
        return definition.type.base;

        return 'unknown';
    }








    preparePrimitiveData(definition) {
        const utobject = {};
    }

    /**
     * Check if a type reference is an anonymous (inline) type definition
     * @param {string|Object} typeRef - Type reference (string name or object definition)
     * @returns {boolean} True if the type is anonymous
     */
    isAnonymousType(typeRef) {
        return typeof typeRef === 'object' && typeRef !== null && Object.hasOwn(typeRef, 'base');
    }

    /**
     * Get the category for an anonymous type definition
     * @param {Object} typeDefinition - Anonymous type definition
     * @returns {string} Type category
     */
    getAnonymousTypeCategory(typeDefinition) {
        if (!typeDefinition || !typeDefinition.base) {
            return 'unknown';
        }
        return typeDefinition.base;
    }

    /**
     * Process a field type recursively, handling anonymous types
     * @param {string|Object} fieldType - Field type (string reference or anonymous definition)
     * @param {string} fieldName - Field name for generating nested type names
     * @param {string} parentTypeName - Parent type name for context
     * @param {number} depth - Nesting depth (0 = top level)
     * @param {string} rootTypeName - Root parent type name for C# nested class references
     * @returns {Object} Processed field type information
     */
    processFieldType(fieldType, fieldName, parentTypeName, depth = 0, rootTypeName = null) {
        // If it's a string reference, just map it
        if (typeof fieldType === 'string') {
            return {
                isAnonymous: false,
                typeName: this.typeMapper.mapType(fieldType),
                originalType: fieldType
            };
        }

        // Handle anonymous type definition
        if (this.isAnonymousType(fieldType)) {
            const category = this.getAnonymousTypeCategory(fieldType);
            
            // For C#, use simple name without parent prefix for nested types
            const simpleTypeName = this.typeMapper.convertToNamingConvention(fieldName, 'type');
            
            // Build the full qualified name for C# (rootType.T.TypeName)
            const effectiveRootType = rootTypeName || parentTypeName;
            const qualifiedTypeName = depth === 0 
                ? `T.${simpleTypeName}`  // First level: T.TypeName
                : simpleTypeName;         // Deeper levels: just TypeName (already within T)
            
            // Full path for reference from outside
            const fullTypePath = depth === 0
                ? `${effectiveRootType}.T.${simpleTypeName}`
                : `${effectiveRootType}.T.${simpleTypeName}`;

            const result = {
                isAnonymous: true,
                category: category,
                typeName: qualifiedTypeName,         // e.g., "T.AccessMethod" or "AccessMethod"
                simpleTypeName: simpleTypeName,       // e.g., "AccessMethod"
                fullTypePath: fullTypePath,           // e.g., "ParentType.T.AccessMethod"
                depth: depth,
                rootTypeName: effectiveRootType,
                definition: fieldType,
                originalType: fieldType
            };

            // Recursively process nested structures
            if (category === 'sequence' && fieldType.fields) {
                result.fields = fieldType.fields.map(nestedField => ({
                    ...nestedField,
                    fieldName: this.typeMapper.convertToNamingConvention(nestedField.name, 'field'),
                    fieldTypeInfo: this.processFieldType(nestedField.type, nestedField.name, simpleTypeName, depth + 1, effectiveRootType),
                    originalName: nestedField.name
                }));
            }

            // Process choice options
            if (category === 'choice' && fieldType.options) {
                result.options = fieldType.options.map(option => ({
                    ...option,
                    optionName: this.typeMapper.convertToNamingConvention(option.name, 'field'),
                    optionTypeInfo: this.processFieldType(option.type, option.name, simpleTypeName, depth + 1, effectiveRootType),
                    originalName: option.name
                }));
            }

            // Process enumerated values
            if (category === 'enumerated' && fieldType.values) {
                const maximum = fieldType.maximum || Math.max(...fieldType.values.map(v => v.constant));
                result.enumBase = getBaseTypeForNonNegativeInteger(maximum);
                result.values = fieldType.values.map(value => ({
                    ...value,
                    enumName: this.typeMapper.convertToNamingConvention(value.name, 'enum'),
                    originalName: value.name
                }));
            }

            // Process bit-string bits
            if (category === 'bit-string' && fieldType.bits) {
                const maximum = fieldType.maximum || Math.max(...fieldType.bits.map(bit => bit.position));
                result.baseBits = getBaseForBitString(maximum).bits;
                result.baseType = getBaseForBitString(maximum).type;
                result.bitCount = maximum;
                result.flagsMask = getBaseForBitString(maximum).mask;
                result.bits = fieldType.bits.map(bit => ({
                    ...bit,
                    bitName: this.typeMapper.convertToNamingConvention(bit.name, 'enum'),
                    originalName: bit.name
                }));
            }

            return result;
        }

        // Fallback for unknown types
        return {
            isAnonymous: false,
            typeName: 'object',
            originalType: fieldType
        };
    }

    /**
     * Prepare data for template rendering
     * @param {Object} definition - Type definition
     * @returns {Object} Template data
     */
    prepareTemplateData(definition) {
        const utobject = {};
        const category = this.getTypeCategory(definition, utobject);
        const typeName = this.typeMapper.convertToNamingConvention(definition.name, 'type');

        const data = {
            name: definition.name,


            typeName: typeName,
            bacnetName: definition.alias,
            minValue: definition.type?.minimum,
            maxValue: definition.type?.maximum,

            alias: definition.alias,
            description: definition.description,
            category: category,
            primitive: definition.primitive,
            namespace: 'Baclib.Bacnet.Types',
            ...definition
        };

        if (utobject.type) {
            console.log(`######################Determined underlying type for ${definition.name}: ${utobject.type.type}`);
            data.underlyingType = utobject.type.type;
            data.minValue = utobject.type.min;
            data.maxValue = utobject.type.max;
        }

        // Process fields for sequences
        if (category === 'sequence' && definition.type?.fields) {
            data.fields = definition.type.fields.map(field => {
                const fieldTypeInfo = this.processFieldType(field.type, field.name, typeName);
                return {
                    ...field,
                    fieldName: this.typeMapper.convertToNamingConvention(field.name, 'field'),
                    fieldType: fieldTypeInfo.typeName,
                    fieldTypeInfo: fieldTypeInfo,
                    originalName: field.name
                };
            });
        }

        // Process options for choices
        if (category === 'choice' && definition.type?.options) {
            data.options = definition.type.options.map(option => {
                const optionTypeInfo = this.processFieldType(option.type, option.name, typeName);
                return {
                    ...option,
                    optionName: this.typeMapper.convertToNamingConvention(option.name, 'field'),
                    optionType: optionTypeInfo.typeName,
                    optionTypeInfo: optionTypeInfo,
                    originalName: option.name
                };
            });
        }

        // Process values for bit-strings
        if (category === 'bit-string' && definition.type?.bits) {
            const maximum = definition.type.maximum || Math.max(...definition.type.bits.map(bit => bit.position));
            data.baseBits = getBaseForBitString(maximum).bits;
            data.baseType = getBaseForBitString(maximum).type;
            data.bitCount = maximum;
            data.flagsMask = getBaseForBitString(maximum).mask;
            data.bits = definition.type.bits.map(bit => ({
                ...bit,
                bitName: this.typeMapper.convertToNamingConvention(bit.name, 'enum'),
                originalName: bit.name
            }));

        }

        // Process values for enumerations
        if (category === 'enumerated' && definition.type?.values) {
            const maximum = definition.type.maximum || Math.max(...definition.type.values.map(value => value.constant));
            data.enumBase = getBaseTypeForNonNegativeInteger(maximum);
            data.values = definition.type.values.map(value => ({
                ...value,
                enumName: this.typeMapper.convertToNamingConvention(value.name, 'enum'),
                originalName: value.name
            }));
        }

        // Collect nested types for C# (all anonymous types go into T static class)
        if (this.language === 'csharp') {
            data.nestedTypes = this.collectNestedTypesHierarchical(definition, typeName);
            data.hasNestedTypes = data.nestedTypes && data.nestedTypes.length > 0;
        }

        return data;
    }

    /**
     * Collect nested types hierarchically for C# generation
     * @param {Object} definition - Type definition
     * @param {string} parentTypeName - Parent type name
     * @returns {Array} Flat array of all nested type definitions
     */
    collectNestedTypesHierarchical(definition, parentTypeName) {
        const nestedTypes = [];

        const collectFromFieldType = (fieldType, fieldName, depth = 0) => {
            if (!this.isAnonymousType(fieldType)) {
                return;
            }

            const category = this.getAnonymousTypeCategory(fieldType);
            const simpleTypeName = this.typeMapper.convertToNamingConvention(fieldName, 'type');
            
            const nestedTypeDef = {
                typeName: simpleTypeName,
                category: category,
                depth: depth,
                definition: fieldType,
                parentField: fieldName
            };

            // Process based on category
            if (category === 'sequence' && fieldType.fields) {
                nestedTypeDef.fields = fieldType.fields.map(nestedField => ({
                    ...nestedField,
                    fieldName: this.typeMapper.convertToNamingConvention(nestedField.name, 'field'),
                    fieldTypeInfo: this.processFieldType(nestedField.type, nestedField.name, simpleTypeName, depth + 1, parentTypeName),
                    originalName: nestedField.name
                }));
            }

            if (category === 'choice' && fieldType.options) {
                nestedTypeDef.options = fieldType.options.map(option => ({
                    ...option,
                    optionName: this.typeMapper.convertToNamingConvention(option.name, 'field'),
                    optionTypeInfo: this.processFieldType(option.type, option.name, simpleTypeName, depth + 1, parentTypeName),
                    originalName: option.name
                }));
            }

            if (category === 'enumerated' && fieldType.values) {
                const maximum = fieldType.maximum || Math.max(...fieldType.values.map(v => v.constant));
                nestedTypeDef.enumBase = getBaseTypeForNonNegativeInteger(maximum);
                nestedTypeDef.values = fieldType.values.map(value => ({
                    ...value,
                    enumName: this.typeMapper.convertToNamingConvention(value.name, 'enum'),
                    originalName: value.name
                }));
            }

            if (category === 'bit-string' && fieldType.bits) {
                const maximum = fieldType.maximum || Math.max(...fieldType.bits.map(bit => bit.position));
                nestedTypeDef.baseBits = getBaseForBitString(maximum).bits;
                nestedTypeDef.baseType = getBaseForBitString(maximum).type;
                nestedTypeDef.bitCount = maximum;
                nestedTypeDef.flagsMask = getBaseForBitString(maximum).mask;
                nestedTypeDef.bits = fieldType.bits.map(bit => ({
                    ...bit,
                    bitName: this.typeMapper.convertToNamingConvention(bit.name, 'enum'),
                    originalName: bit.name
                }));
            }

            nestedTypes.push(nestedTypeDef);

            // Recursively collect from nested fields
            if (category === 'sequence' && fieldType.fields) {
                fieldType.fields.forEach(nestedField => {
                    collectFromFieldType(nestedField.type, nestedField.name, depth + 1);
                });
            }

            if (category === 'choice' && fieldType.options) {
                fieldType.options.forEach(option => {
                    collectFromFieldType(option.type, option.name, depth + 1);
                });
            }
        };

        // Collect from sequence fields
        if (definition.type?.base === 'sequence' && definition.type.fields) {
            definition.type.fields.forEach(field => {
                collectFromFieldType(field.type, field.name, 0);
            });
        }

        // Collect from choice options
        if (definition.type?.base === 'choice' && definition.type.options) {
            definition.type.options.forEach(option => {
                collectFromFieldType(option.type, option.name, 0);
            });
        }

        return nestedTypes;
    }

    /**
     * Generate code for a single definition
     * @param {Object} definition - Type definition
     * @returns {Promise<Object>} Generated code result
     */
    async generateForDefinition(definition) {
        const category = this.getTypeCategory(definition, {});
        if (!category) {
            return null;
        }

        const templatePath = path.join(this.templatesDir, `${category}.hbs`);
        console.log(`Using template: ${templatePath}`);

        // Check if template exists
        try {
            await fs.access(templatePath);
        } catch (error) {
            console.warn(`Template not found for category '${category}': ${templatePath}`);
            return null;
        }

        const data = this.prepareTemplateData(definition);
        const code = await this.templateEngine.render(templatePath, data);

        const typeName = this.typeMapper.convertToNamingConvention(definition.name, 'type');
        const fileName = `${typeName}${this.typeMapper.getFileExtension()}`;
        const outputPath = path.join(this.outputDir, fileName);

        return {
            definition,
            code,
            outputPath,
            fileName
        };
    }





















    /**
     * Generate code for all definitions
     * @returns {Promise<Array>} Array of generation results
     */
    async generateAll() {
        await this.initialize();
        const definitions = await this.loadDefinitions();
        const results = [];

        for (const definition of definitions) {
            try {
                const result = await this.generateForDefinition(definition);
                if (result) {
                    results.push(result);
                }
            } catch (error) {
                console.error(`Error generating code for ${definition.name}:`, error.message);
            }
        }

        return results;
    }

    /**
     * Write generated code to files
     * @param {Array} results - Generation results
     */
    async writeFiles(results) {
        for (const result of results) {
            await fs.writeFile(result.outputPath, result.code, 'utf-8');
            console.log(`Generated: ${result.fileName}`);
        }
    }

    /**
     * Run the complete generation process
     */
    async run() {
        console.log(`Generating code for ${this.language}...`);
        const results = await this.generateAll();
        await this.writeFiles(results);
        console.log(`\nGenerated ${results.length} files in ${this.outputDir}`);
    }
}
