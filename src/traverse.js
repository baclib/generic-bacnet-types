// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

/**
 * @module traverse
 * 
 * Generic traversal engine for BACnet type definitions.
 * 
 * This module provides a transformer-agnostic traversal mechanism that walks through
 * BACnet definition hierarchies (definitions -> traits -> items) and invokes transformer
 * methods at each level. It can be used for various purposes including:
 * - Output generation (markdown, HTML, JSON, etc.)
 * - Validation and type checking
 * - Data transformation and mapping
 * - Code generation
 * - Database schema creation
 * 
 * All loaded definitions are deeply frozen to prevent accidental mutations.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively freezes an object and all nested objects/arrays to make them deeply immutable.
 * This prevents accidental mutations of the loaded definitions throughout the application.
 * 
 * @param {Object|Array} object - The object to freeze recursively
 * @returns {Object|Array} The frozen object
 */
function deepFreeze(object) {
    if (object && typeof object === 'object' && !Object.isFrozen(object)) {
        Object.freeze(object);
        Object.getOwnPropertyNames(object).forEach(property => deepFreeze(object[property]));
    }
    return object;
}

const definitionsDir = path.join(__dirname, '..', 'definitions');

/**
 * Loads and validates all JSON definition files from the definitions directory.
 * Each definition is weakly validated for required properties (name, alias) and then
 * deeply frozen to ensure immutability. The entire definitions array is also frozen.
 * 
 * @returns {Promise<Array>} A frozen array of frozen definition objects
 * @throws {Error} If the definitions directory cannot be read
 */
async function loadDefinitions() {
    const definitions = [];
    const files = (await fs.readdir(definitionsDir)).filter(file => file.endsWith('.json'));

    for (const file of files) {
        try {
            const filePath = path.join(definitionsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const definition = JSON.parse(content);

            // Validate that definition has required properties
            if (!definition.name || !definition.alias) {
                console.warn(`Warning: ${file} missing required properties (name/alias)`);
                continue;
            }

            // Deeply freeze the definition to prevent mutations
            deepFreeze(definition);
            definitions.push(definition);
        } catch (error) {
            console.error(`Error loading ${file}:`, error.message);
        }
    }

    // Freeze the entire array to prevent adding/removing definitions
    return deepFreeze(definitions);
}

// Load all definitions at module initialization
const definitions = await loadDefinitions();

/**
 * Recursively traverses traits and their nested items.
 * 
 * Traits can have different types of items:
 * - bits: For bit-string types
 * - values: For enumerated types
 * - options: For choice types
 * - fields: For sequence types
 * 
 * This function calls the appropriate transformer methods and handles nested structures
 * by recursively calling itself when items have their own traits.
 * 
 * @param {Object} context - Processing context
 * @param {string} context.fullname - Dot-separated path to this element
 * @param {Object} context.traits - The traits object being processed
 * @param {Array} context.ancestors - Array of parent contexts
 * @param {number} context.level - Current nesting level
 * @param {Object} transformer - Transformer instance with handler methods
 */
function traverseTraits(context, transformer) {
    const traits = context.traits;
    const level = context.level;

    // Determine what kind of items this trait has (bits, values, options, or fields)
    context.items = traits.bits ?? traits.values ?? traits.options ?? traits.fields;

    // Notify transformer that we're starting to process this trait
    transformer.startTraits(context);

    if (context.items?.length) {
        const lastIndex = context.items.length - 1;

        context.items.forEach((item, index) => {
            // Create a new isolated context for this item to prevent cross-contamination
            const itemContext = {
                item,
                level,
                fullname: context.fullname + '.' + item.name,
                ancestors: [...context.ancestors, context],
                isFirst: index === 0,
                isLast: index === lastIndex,
                index,
                userContext: context.userContext
            };

            // Notify transformer that we're starting an item
            transformer.startItem(itemContext);

            // If this item has nested traits (e.g., nested sequences or choices), 
            // recursively traverse them
            if (item.type?.base) {
                const nestedContext = {

                    thisName: item.name,
                    thisAlias: item.alias,

                    traits: item.type,
                    level: level + 1,
                    fullname: itemContext.fullname,
                    ancestors: itemContext.ancestors,
                    userContext: itemContext.userContext
                };

                traverseTraits(nestedContext, transformer);
            }

            // Notify transformer that we're done with this item
            transformer.endItem(itemContext);
        });
    }

    // Notify transformer that we're done with this trait
    transformer.endTraits(context);
}

/**
 * Traverses all BACnet definitions and invokes transformer methods for each element.
 * 
 * This is the main entry point for processing definitions. It walks through each
 * definition and calls the transformer's handler methods in this order:
 * 1. startDefinition(context)
 * 2. startTraits(context) - if the definition has traits
 * 3. For each item: startItem(context), (recursive traversal if nested), endItem(context)
 * 4. endTraits(context) - if the definition has traits
 * 5. endDefinition(context)
 * 6. afterProcessing(result) - optional lifecycle hook after all definitions are processed
 * 
 * The transformer must implement these handler methods:
 * - startDefinition(context)
 * - endDefinition(context)
 * - startTraits(context)
 * - endTraits(context)
 * - startItem(context)
 * - endItem(context)
 * - afterProcessing(result) - optional
 * 
 * @param {Object} transformer - Transformer instance with handler methods
 * @param {Object} [options={}] - Processing options (reserved for future use)
 * @returns {Promise<Object>} Processing result with counts: { totalCount, processedCount, errorCount }
 */
export async function traverseDefinitions(transformer, options = {}) {

    await transformer.start?.();

    let totalCount = definitions.length;
    let processedCount = 0;
    let errorCount = 0;

    // Process each definition
    for (const definition of definitions) {
        try {
            // Create initial context for this definition
            const context = {

                thisName: definition.name,                                 // Short name of the definition
                thisAlias: definition.alias,                               // Alias of the definition

                definition,                                                 // The definition object
                fullname: definition.name,                                  // Fully qualified name
                isPrimitive: Object.hasOwn(definition, 'primitive'),        // Is this a primitive type?
                traits: definition.type?.base ? definition.type : null,     // Traits if applicable
                ancestors: [],                                              // Parent contexts (empty at top)
                level: 0                                                    // Nesting level (0 = top)
            };

            // Notify transformer we're starting this definition
            transformer.startDefinition(context);

            // If this definition has traits, traverse them
            if (context.traits) {
                traverseTraits(context, transformer);
            }

            // Notify transformer we're done with this definition
            transformer.endDefinition(context);

            processedCount++;
        }
        catch (error) {
            console.error(`Error processing definition ${definition.name}:`, error.message);
            errorCount++;
        }
    }

    // Build result summary
    const result = { totalCount, processedCount, errorCount };

    // Call optional lifecycle hook if transformer provides it
    if (typeof transformer.afterProcessing === 'function') {
        await transformer.afterProcessing(result);
    }

    return result;
}

/**
 * Export the loaded definitions for external use.
 * All definitions are deeply frozen and immutable.
 */
export { definitions };
