// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import Handlebars from 'handlebars';
import fs from 'fs/promises';
import { readFileSync } from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const partials = Object.freeze([
    'number', 'unsigned', 'integer', 'real', 'double',
    'octet-string', 'character-string', 'bit-string', 'enumerated',
    'choice', 'sequence', 'sequence-of'
]);

export class TemplateEngine {
    constructor() {
        this.templateCache = new Map();
        this.registerHelpers();
        for (const name of partials) {
            Handlebars.registerPartial(name, this.getTemplateContent(name));
        }
    }

    /**
     * Get the content of a template file
     */
    getTemplateContent(templateName) {
        const templatePath = path.join(__dirname, '..', 'templates', 'csharp', `${templateName}.hbs`);
        return readFileSync(templatePath, 'utf-8');
    }

    /**
     * Register Handlebars helpers
     */
    registerHelpers() {
        Handlebars.registerHelper('nest', function (data, options) {
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
        Handlebars.registerHelper('apply', function (data) {
            const base = data.baseType;
            if (partials.includes(base)) {
                return base;
            }
            console.error(`Unknown base type: ${base} for ${data.thisName}`);
            return 'global-alias';

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
        if (!partials.includes(data.baseType)) {
            templatePath = path.join(path.dirname(templatePath), 'global-alias.hbs');
        }
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
