// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import { existsSync, writeFileSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { BaseTransformer } from './base-transformer.js';
import { TemplateEngine } from '../template-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CsharpTransformer - Generates C# code from BACnet type definitions using Handlebars templates.
 * 
 * This transformer uses two main templates:
 * - basic-class.hbs: For simple type definitions (top-level classes)
 * - nested-class.hbs: For nested type hierarchies
 * 
 * Templates are located in templates/csharp/ and use the Handlebars template engine
 * with helpers registered in TemplateEngine (type mapping, case conversion, etc.)
 */
export class CsharpTransformer extends BaseTransformer {

    constructor(options = {}) {
        super(options);
        this.options = {
            indentSize: options.indentSize || 4,
            maxPadding: options.maxPadding || 48,
            outputPath: options.outputPath || 'definitions-output.md',
        };

        this.fileName = null;
        this.definitions = [];
        this.directory = this.joinRelativePath('..', '..', 'local-working-files', 'csharp');
        this.templatesDir = path.join(__dirname, '..', '..', 'templates', 'csharp');


        this.predefinedTypesDir = path.join(__dirname, '..', 'csharp');


        // Initialize template engine
        this.typeMapper = null;
        this.templateEngine = null;

        this.fileObjects = [];
    }

    async start() {
        await this.ensureDirectory(this.directory);
        this.templateEngine = new TemplateEngine();
    }

    getFileObject(context) {
        const classHierarchy = context.fullname.split('.').map((part, index) => (index ? 'T' : '') + this.toPascalCase(part));
        const fileName = classHierarchy.join('.') + '.cs';
        const className = classHierarchy.pop();
        const typeData = {
            fileName,
            bacnetName: context.thisAlias ?? context.thisName,
            className,
            classHierarchy,
            baseType: context.traits?.base ?? null,
            primitive: context.definition?.primitive ?? null,
            isAnonymous: !context.definition && Object.keys(context.traits).length !== 2,
            isBitString: context.traits?.base === 'bit-string',
            isChoice: context.traits?.base === 'choice',
            isEnumerated: context.traits?.base === 'enumerated',
            isSequence: context.traits?.base === 'sequence'
        };


        /*
        if (fileName.startsWith('AuthorizationScope')) {
            console.log('##################################\n', fileName, '\n##################################');
        }
                    */

        if (typeof context.definition?.type === 'string') {
            typeData.baseType = this.toPascalCase(context.definition.type);
            //console.log('##################################\n', typeData, '\n##################################');
        }


        if (typeData.baseType === 'unsigned' && (Object.hasOwn(context.traits, 'minimum') && Object.hasOwn(context.traits, 'maximum'))) {
            typeData.minValue = context.traits?.minimum ?? 0;
            typeData.maxValue = context.traits?.maximum ?? 0xFFFFFFFF;
            if (typeData.maxValue < 256) {
                typeData.underlyingType = 'byte';
            } else if (typeData.maxValue < 65536) {
                typeData.underlyingType = 'ushort';
            } else if (typeData.maxValue < 4294967296) {
                typeData.underlyingType = 'uint';
            }
            else {
                typeData.underlyingType = 'ulong';
            }
        }

        if (typeData.baseType === 'integer' && (Object.hasOwn(context.traits, 'minimum') || Object.hasOwn(context.traits, 'maximum'))) {
            typeData.minValue = context.traits?.minimum ?? 0;
            typeData.maxValue = context.traits?.maximum ?? 2147483647;
            if (typeData.minValue >= -128 && typeData.maxValue <= 127) {
                typeData.underlyingType = 'sbyte';
            } else if (typeData.minValue >= -32768 && typeData.maxValue <= 32767) {
                typeData.underlyingType = 'short';
            }
            else if (typeData.minValue >= -2147483648 && typeData.maxValue <= 2147483647) {
                typeData.underlyingType = 'int';
            }
            else {
                typeData.underlyingType = 'long';
            }
        }

        if (typeData.baseType === 'real' && (Object.hasOwn(context.traits, 'minimum') || Object.hasOwn(context.traits, 'maximum'))) {
            typeData.minValue = (context.traits?.minimum ?? 0) + 'f';
            typeData.maxValue = (context.traits?.maximum ?? 4711) + 'f';
            typeData.underlyingType = 'float';
        }

        if ((typeData.baseType === 'octet-string' || typeData.baseType === 'character-string' || typeData.baseType === 'bit-string') && Object.hasOwn(context.traits, 'length')) {
            typeData.hasLengthRange = !Number.isInteger(context.traits.length);
            typeData.length = context.traits.length;
        }


        return typeData;
    }

    getHierarchy(context) {
        const hierarchy = context.fullname.split('.').map((part, index) => (index ? 'T' : '') + this.toPascalCase(part));
        return hierarchy;
    }

    isSeries(context) {
        return context.traits && Object.hasOwn(context.traits, 'series') && context.traits.series !== false;
    }

    mapToNative(className) {
        switch (className) {
            case 'Integer': return 'int';
            case 'Real': return 'float';
            case 'Double': return 'double';
            case 'String': return 'string';
            default: return className;
        }
    }

    startDefinition(context) {
        if (!context.traits) {
            const fileObject = this.getFileObject(context);
            const nativeName = this.mapToNative(fileObject.className);
            if (nativeName !== fileObject.className) {
                fileObject.nativeType = nativeName;
            }
            this.fileObjects.push(fileObject);
        }
    }

    endDefinition(context) {
    }

    startTraits(context) {
        context.userContext = [];
    }

    endTraits(context) {

        const fileObject = this.getFileObject(context);
        const isSeries = this.isSeries(context);
        if (isSeries) {
            // series of ...
            const seriesObject = this.getFileObject(context);
            seriesObject.baseType = 'sequence-of';
            seriesObject.isSeries = true;
            seriesObject.hasSeriesSize = Number.isInteger(context.traits.series);
            seriesObject.seriesSize = seriesObject.hasSeriesSize ? context.traits.series : null;
            seriesObject.seriesType = seriesObject.isAnonymous ? 'TItem' : this.toPascalCase(context.traits.base);
            this.fileObjects.push(seriesObject);
            if (!fileObject.isAnonymous) {
                return;
            }
            // refine fileObject for series item
            fileObject.fileName = fileObject.fileName.replace(/cs$/, 'TItem.cs');
            fileObject.bacnetName = '???';
            fileObject.className = 'TItem';
            fileObject.classHierarchy.push(seriesObject.className);
        }

        fileObject.items = context.userContext;

        if (fileObject.baseType === 'bit-string') {
            fileObject.hasRange = Object.hasOwn(context.traits, 'length');
            if (fileObject.hasRange) {
                fileObject.minimum = context.traits.length.minimum;
                fileObject.maximum = context.traits.length.maximum;
            }
            else {
                fileObject.length = Math.max(...fileObject.items.map(item => item.position)) + 1;
            }
            console.log('Bit string', fileObject);
        }

        if (fileObject.baseType === 'enumerated') {
            const maximum = Number.isInteger(context.traits.maximum) ? context.traits.maximum : Math.max(...fileObject.items.map(item => item.constant));
            if (maximum < 256) {
                fileObject.enumBase = 'byte';
            } else if (maximum < 65536) {
                fileObject.enumBase = 'ushort';
            } else {
                fileObject.enumBase = 'uint';
            }
        }

        fileObject.flagBase = 'long';

        this.fileObjects.push(fileObject);
    }


    startItem(context) {
    }

    endItem(context) {
        const traits = context.ancestors.at(-1).traits;
        const base = traits.base;
        if (!['bit-string', 'choice', 'enumerated', 'sequence'].includes(base)) {
            throw new Error('Unexpected item type in endItem');
        }
        const { type, ...itemData } = context.item;
        itemData.name = this.toPascalCase(context.item.name);
        itemData.array = type?.series ?? false;
        if (type !== undefined) {
            if (['bit-string', 'enumerated'].includes(base)) {
                throw new Error(`Type not allowed in ${base} item`);
            }
            itemData.type = typeof type === 'string' ? this.mapToNative(this.toPascalCase(type)) : `T${itemData.name}`;
        }
        context.userContext.push(itemData);
    }

    async afterProcessing(result) {
        const predefinedFiles = await fs.readdir(this.predefinedTypesDir);
        for (const file of predefinedFiles) {
            if (file.startsWith('Baclib.Bacnet.Types.') || file.endsWith('.cs')) {
                const srcPath = path.join(this.predefinedTypesDir, file);
                const destPath = path.join(this.directory, file);
                await fs.copyFile(srcPath, destPath);
            }
        }
        const templatePath = path.join(this.templatesDir, 'levels.hbs');
        for (const fileObject of this.fileObjects) {
            const predefinedPath = path.join(this.predefinedTypesDir, fileObject.fileName);
            if (existsSync(predefinedPath)) {
                continue;
            }
            //console.log('Processing', fileObject.fileName);
            this.templateEngine.render(templatePath, fileObject).then(content => {
                writeFileSync(path.join(this.directory, fileObject.fileName), content);
            });
        }
    }
}
