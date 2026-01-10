// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

/**
 * @module markdown-transformer
 * 
 * Markdown output transformer for BACnet type definitions.
 * 
 * This transformer implements the standard transformer interface used by the traverser
 * engine. It converts BACnet type definitions into human-readable markdown format with:
 * - Hierarchical structure visualization (definitions -> traits -> items)
 * - Proper indentation for nested sequences and choices
 * - Syntax highlighting-friendly code blocks
 * - Automatic statistics tracking (definitions, primitives, items)
 * - Configurable formatting options (indent size, padding, output path)
 * 
 * The transformer accumulates output in memory and writes to file after all processing
 * is complete via the afterProcessing lifecycle hook.
 * 
 * Usage:
 * ```javascript
 * import { MarkdownTransformer } from './markdown-transformer.js';
 * import { traverseDefinitions } from './traverse.js';
 * 
 * const transformer = new MarkdownTransformer({
 *   indentSize: 4,
 *   maxPadding: 48,
 *   outputPath: 'definitions-output.md'
 * });
 * 
 * await traverseDefinitions(transformer);
 * ```
 */

import fs from 'fs/promises';

/**
 * Markdown transformer class that converts BACnet definitions to formatted markdown.
 * Implements the transformer interface required by the traverser engine.
 */
export class MarkdownTransformer {
    
    /**
     * Creates a new MarkdownTransformer instance.
     * 
     * Initializes formatting configuration, output buffer with markdown header,
     * and statistics counters for tracking processing metrics.
     * 
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.indentSize=4] - Number of spaces per indentation level
     * @param {number} [options.maxPadding=48] - Maximum padding for property names
     * @param {string} [options.outputPath='definitions-output.md'] - Path for output file
     */
    constructor(options = {}) {
        // Configuration - controls formatting behavior
        this.indentSize = options.indentSize || 4;    // Spaces per nesting level
        this.maxPadding = options.maxPadding || 48;   // Column alignment for property values
        this.outputPath = options.outputPath || 'definitions-output.md';
        
        // Initialize output buffer with markdown header and generation timestamp
        const now = new Date();
        this.output = `# BAClib | Generic BACnet Type Definitions \n\n_Generated: ${now.toISOString()}_`;

        // Statistics tracking - incremented during processing
        this.statistics = {
            definitions: 0,   // Total definitions processed
            primitives: 0,    // Primitive types (e.g., [1], [4])
            items: 0          // Individual items (fields, bits, values, options)
        };
    }

    /**
     * Handler invoked when starting to process a definition.
     * 
     * Creates the markdown section header and starts a code block for the definition.
     * Primitives are formatted as "name [tag]", complex types start their trait expansion,
     * and simple type aliases show their target type.
     * 
     * @param {Object} context - Processing context from traverser
     * @param {Object} context.definition - The definition being processed
     * @param {string} context.fullname - Fully qualified name of this element
     * @param {boolean} context.isPrimitive - Whether this is a primitive type (e.g., unsigned [1])
     * @param {Object} context.traits - The traits object if this is a complex type
     * @param {Array} context.ancestors - Array of parent contexts (empty for top-level definitions)
     */
    startDefinition(context) {
        // Update statistics counters
        this.statistics.definitions++;
        if (context.isPrimitive) {
            this.statistics.primitives++;
        }
        
        // Start markdown section with horizontal rule and heading
        // Format: "### BACnetDefinitionName"
        this.output += `\n\n---\n### ${context.definition.alias}\n\`\`\`\n${context.definition.name} `;
        
        // Primitives: show tag number (e.g., "unsigned [1]")
        if (context.isPrimitive) {
            this.output += `[${context.definition.primitive}]`;
        }
        // Simple type aliases: show target type (e.g., "string character-string")
        else if (!context.traits) {
            this.output += context.definition.type;
        }
        // Complex types: traits expansion handled by startTraits/endTraits
    }

    /**
     * Called when finishing processing a definition
     */
    endDefinition(context) {
        this.output += '\n```';
    }

    /**
     * Handler invoked when starting to process traits (sequence, choice, bitstring, enumerated, etc.).
     * 
     * Traits define the structure of complex types. This method formats the base type,
     * array notation, size constraints, and value ranges according to BACnet notation.
     * 
     * @param {Object} context - Processing context from traverser
     * @param {Object} context.traits - The traits being processed
     * @param {string} context.traits.base - Base type (sequence, choice, bit-string, enumerated, etc.)
     * @param {boolean|string} [context.traits.series] - Array notation: true for [], string for [series]
     * @param {number|Object} [context.traits.length] - Size constraint (simple number or {minimum, maximum})
     * @param {number} [context.traits.minimum] - Minimum value for range constraints
     * @param {number} [context.traits.maximum] - Maximum value for range constraints
     * @param {number} context.level - Current nesting level (0 = top-level)
     * @param {string} context.fullname - Fully qualified name of this element
     * @param {Array} context.ancestors - Array of parent contexts
     */
    startTraits(context) {
        const traits = context.traits;

        // Validate that we have a proper traits object
        if (!traits || !traits.base) {
            console.warn(`Invalid traits at path: ${context.fullname}`);
            return;
        }

        // Start with base type (sequence, choice, bit-string, enumerated, etc.)
        // Add array notation if present: "[]" or "[series-name]"
        let text = traits.base + (traits.series ? `[${traits.series === true ? '' : traits.series}]` : '');

        // Add SIZE constraint if present (for octet-string, character-string, bit-string)
        // Formats: "SIZE(6)", "SIZE(..255)", "SIZE(1..20)"
        if (traits.length) {
            if (Object.hasOwn(traits.length, 'minimum') || Object.hasOwn(traits.length, 'maximum')) {
                text += ` SIZE(${traits.length.minimum ?? ''}..${traits.length.maximum ?? ''})`;
            } else {
                text += ` SIZE(${traits.length})`;
            }
        }

        // Add value range constraint if present (for unsigned, integer, enumerated)
        // Formats: "(0..255)", "(..65535)", "(1..16)"
        if (Object.hasOwn(traits, 'minimum') || Object.hasOwn(traits, 'maximum')) {
            text += ` (${traits.minimum ?? ''}..${traits.maximum ?? ''})`;
        }

        // If this trait has items (bits, values, options, fields), open the structure
        if (context.items) {
            text += ' {';
        }

        this.output += text;
    }

    /**
     * Handler invoked when finishing processing traits.
     * 
     * Closes the structure opened by startTraits if it contained items.
     * The closing brace is indented to match the opening level.
     */
    endTraits(context) {
        const indention = this.#getIndent(context.level);
        // Only add closing brace if we opened one in startTraits (when items exist)
        if (context.items) {
            this.output += '\n' + indention + '}';
        }
    }

    /**
     * Handler invoked when starting to process an item (field, option, bit, value).
     * 
     * Items are the individual elements within traits:
     * - Fields in sequences
     * - Options in choices
     * - Bits in bit-strings
     * - Values in enumerations
     * 
     * Each item is formatted with proper indentation, optional markers, context tags,
     * and column-aligned type information.
     * 
     * @param {Object} context - Processing context from traverser
     * @param {Object} context.item - The item being processed
     * @param {string} context.item.name - Item name
     * @param {boolean} [context.item.optional] - Whether item is optional (adds '?' suffix)
     * @param {number} [context.item.context] - Context tag for explicit tagging (e.g., [0], [1])
     * @param {string|Object} [context.item.type] - Type reference or nested type structure
     * @param {number} [context.item.position] - Bit position (for bit-string bits)
     * @param {number} [context.item.constant] - Enumeration constant value
     * @param {number} context.level - Current nesting level
     * @param {string} context.fullname - Fully qualified name (e.g., "who-has-request.limits.device-instance-range-low-limit")
     * @param {Array} context.ancestors - Array of parent contexts
     * @param {boolean} context.isFirst - Whether this is the first item in the collection
     * @param {boolean} context.isLast - Whether this is the last item in the collection
     * @param {number} context.index - Zero-based index of this item
     */
    startItem(context) {
        // Update item counter
        this.statistics.items++;
        
        const item = context.item;
        const level = context.level;
        // Calculate indentation: base level indent + one additional indent for items
        const indention = this.#getIndent(level) + ' '.repeat(this.indentSize);

        // Start new line with proper indentation
        let text = '\n' + indention;
        let itemName = item.name || '<unnamed>';

        // Add optional marker ('?' suffix) for optional fields
        if (item.optional) {
            itemName += '?';
        }

        // Add explicit context tag if present (e.g., "[0] property-identifier")
        // Used in sequences for explicit tagging
        if (Object.hasOwn(item, 'context')) {
            itemName = `[${item.context}] ` + itemName;
        }

        // Pad item name for column alignment, then add type separator
        text += itemName.padEnd(this.maxPadding - indention.length, ' ') + ': ';

        // Append type/value information:
        // - String type: type reference (e.g., "object-identifier", "unsigned")
        // - Number position: bit position in bit-strings (e.g., "0", "1")
        // - Number constant: enumeration value (e.g., "0", "1", "255")
        // - Object type: complex nested type (handled recursively by traverser)
        if (typeof item.type === 'string') {
            text += item.type;
        }
        else if (typeof item.position === 'number') {
            text += item.position;
        }
        else if (typeof item.constant === 'number') {
            text += item.constant;
        }

        this.output += text;
    }

    /**
     * Called when finishing processing an item
     */
    endItem(context) {
        // No-op for now
    }

    /**
     * Optional lifecycle hook invoked after all definitions have been processed.
     * 
     * This method:
     * 1. Displays processing statistics to console
     * 2. Writes accumulated output to the configured file path
     * 3. Outputs the complete markdown to console for immediate review
     * 
     * @param {Object} result - Processing result from traverser
     * @param {number} result.totalCount - Total number of definitions found
     * @param {number} result.processedCount - Number of definitions successfully processed
     * @param {number} result.errorCount - Number of definitions that failed processing
     * @returns {Promise<void>}
     */
    async afterProcessing(result) {
        // Display processing statistics to console
        console.log(`Total definitions: ${result.totalCount}`);
        console.log(`Processed:         ${result.processedCount}`);
        console.log(`Errors:            ${result.errorCount}`);
        console.log('----------------------------------------');
        
        // Write the complete accumulated output to file
        await fs.writeFile(this.outputPath, this.output, 'utf8');
        console.log(`Output written to: ${this.outputPath}`);
        
        // Output to console for immediate inspection
        console.log(this.output);
    }

    /**
     * Calculates the indentation string for a given nesting level.
     * 
     * This private method generates consistent indentation throughout the output
     * based on the configured indentSize (default: 4 spaces per level).
     * 
     * @param {number} level - Nesting level (0 = no indent, 1 = one indent, etc.)
     * @returns {string} Indentation string (spaces repeated level × indentSize times)
     * @private
     */
    #getIndent(level) {
        return ' '.repeat(level * this.indentSize);
    }
}
