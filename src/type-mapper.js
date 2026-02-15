// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

export class TypeMapper {
    constructor(language, mappings) {
        this.language = language;
        this.mappings = mappings;
    }

    /**
     * Map a BACnet type to a language-specific type
     * @param {string} bacnetType - The BACnet type name
     * @returns {string} The language-specific type
     */
    mapType(bacnetType) {
        // Check direct mapping first
        if (this.mappings.types[bacnetType]) {
            return this.mappings.types[bacnetType];
        }

        // Check for pattern-based mappings
        for (const [pattern, mapping] of Object.entries(this.mappings.patterns || {})) {
            const regex = new RegExp(pattern);
            if (regex.test(bacnetType)) {
                return mapping;
            }
        }

        // Default: convert to PascalCase or language convention
        return this.convertToNamingConvention(bacnetType);
    }

    /**
     * Convert a name to the language's naming convention
     * @param {string} name - The name to convert
     * @param {string} context - The context (type, field, enum, etc.)
     * @returns {string} The converted name
     */
    convertToNamingConvention(name, context = 'type') {
        const convention = this.mappings.namingConventions?.[context] || 'PascalCase';
        
        switch (convention) {
            case 'PascalCase':
                return this.toPascalCase(name);
            case 'camelCase':
                return this.toCamelCase(name);
            case 'snake_case':
                return this.toSnakeCase(name);
            case 'SCREAMING_SNAKE_CASE':
                return this.toScreamingSnakeCase(name);
            case 'kebab-case':
                return this.toKebabCase(name);
            default:
                return name;
        }
    }

    toPascalCase(str) {
        if (!str || typeof str !== 'string') return str;
        return str.split(/[-_\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }

    toCamelCase(str) {
        if (!str || typeof str !== 'string') return str;
        const pascal = this.toPascalCase(str);
        return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    }

    toSnakeCase(str) {
        if (!str || typeof str !== 'string') return str;
        return str.toLowerCase().replace(/[-\s]+/g, '_');
    }

    toScreamingSnakeCase(str) {
        if (!str || typeof str !== 'string') return str;
        return str.toUpperCase().replace(/[-\s]+/g, '_');
    }

    toKebabCase(str) {
        if (!str || typeof str !== 'string') return str;
        return str.toLowerCase().replace(/[_\s]+/g, '-');
    }

    /**
     * Get file extension for the language
     * @returns {string} The file extension
     */
    getFileExtension() {
        return this.mappings.fileExtension || '.txt';
    }

    /**
     * Get namespace/package format
     * @param {string} namespace - The namespace to format
     * @returns {string} The formatted namespace declaration
     */
    formatNamespace(namespace) {
        const template = this.mappings.namespaceTemplate || '';
        return template.replace('{namespace}', namespace);
    }
}
