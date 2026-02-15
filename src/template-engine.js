// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import Handlebars from 'handlebars';
import fs from 'fs/promises';
import { readFileSync } from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const partials =  Object.freeze([
    'empty',
    'primitive', 'primitive-native',
    'number', 'unsigned', 'integer', 'real', 'double',
    'enumerated',
    'octet-string', 'character-string', 'bit-string',
    'date', 'time',
    'immanence',
    'choice', 'sequence', 'sequence-of']);

export class TemplateEngine {
    constructor(typeMapper) {
        this.typeMapper = typeMapper;
        this.templateCache = new Map();
        this.registerHelpers();
        this.registerPartials();
    }

    /**
     * Register Handlebars partials
     */
    registerPartials() {
        const dir = path.join(__dirname, '..', 'templates', 'csharp');

        for (const partialName of partials) {
            const partialPath = path.join(dir, `${partialName}.hbs`);
            const partialContent = readFileSync(partialPath, 'utf-8');
            Handlebars.registerPartial(partialName, partialContent);
        }
    }


    /**
     * Register Handlebars helpers
     */
    registerHelpers() {
        // Helper to convert names to naming conventions
        Handlebars.registerHelper('pascalCase', (str) => {
            return this.typeMapper.toPascalCase(str);
        });

        Handlebars.registerHelper('camelCase', (str) => {
            return this.typeMapper.toCamelCase(str);
        });

        Handlebars.registerHelper('snakeCase', (str) => {
            return this.typeMapper.toSnakeCase(str);
        });

        Handlebars.registerHelper('screamingSnakeCase', (str) => {
            return this.typeMapper.toScreamingSnakeCase(str);
        });

        Handlebars.registerHelper('upperCase', (str) => {
            return str.toUpperCase();
        });

        Handlebars.registerHelper('mapType', (type) => {
            return this.typeMapper.mapType(type);
        });

        // Helper for conditional rendering
        Handlebars.registerHelper('eq', (a, b) => {
            return a === b;
        });

        Handlebars.registerHelper('ne', (a, b) => {
            return a !== b;
        });

        // Helper to format descriptions as comments
        Handlebars.registerHelper('comment', (text, style) => {
            if (!text) return '';
            
            switch (style) {
                case 'csharp':
                case 'java':
                    return `/// ${text}`;
                case 'rust':
                    return `/// ${text}`;
                case 'typescript':
                case 'javascript':
                    return `/** ${text} */`;
                default:
                    return `// ${text}`;
            }
        });

        Handlebars.registerHelper('nest', function(data, options) {
            const content = options.fn(this);
            if (data.classHierarchy.length === 0) {
                return content;
            }
            let start = ''
            let end = ''
            data.classHierarchy.forEach((className, index) => {
                const indention = ' '.repeat(index * 4);
                start += `${indention}public partial record class ${className}\n${indention}{\n`;
                end = `${indention}}\n` + end;
            });
            const indentation = ' '.repeat(data.classHierarchy.length * 4);
            const indentedContent = start + indentation + content.replace(/\n/g, '\n' + indentation).trim() + '\n' + end;
            return new Handlebars.SafeString(indentedContent);
        });

        Handlebars.registerHelper('apply', function(data) {
            const base = data.baseType;
            if (partials.includes(base)) {
                return base;
            }
            if (Number.isInteger(data.primitive)) {
                return 'primitive-native';
            }
            return 'immanence';
            console.log(`Unknown base type: ${base} for ${data.thisName}`);

            return 'empty';
        });
    }

    /**
     * Load a template file
     * @param {string} templatePath - Path to the template file
     * @returns {Promise<Function>} Compiled template function
     */
    async loadTemplate(templatePath) {
        if (this.templateCache.has(templatePath)) {
            return this.templateCache.get(templatePath);
        }

        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const compiledTemplate = Handlebars.compile(templateContent);
        this.templateCache.set(templatePath, compiledTemplate);
        
        return compiledTemplate;
    }

    /**
     * Render a template with data
     * @param {string} templatePath - Path to the template file
     * @param {Object} data - Data to pass to the template
     * @returns {Promise<string>} Rendered template
     */
    async render(templatePath, data) {
        const template = await this.loadTemplate(templatePath);
        return template(data);
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.templateCache.clear();
    }
}
