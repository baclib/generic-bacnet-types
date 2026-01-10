// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

/**
 * Example: This demonstrates how to use the traverser with a transformer class
 * to process BACnet definitions and generate markdown output.
 */

import { traverseDefinitions } from './traverse.js';
import { MarkdownTransformer } from './markdown-transformer.js';

// Create transformer instance with options
const transformer = new MarkdownTransformer({
    indentSize: 4,
    maxPadding: 48,
    outputPath: 'definitions-output.md',
});

// Traverse all definitions using the markdown transformer
await traverseDefinitions(transformer);
