// SPDX-FileCopyrightText: Copyright 2024-2026 The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Example: This demonstrates how to use the traverser with a transformer class
 * to process BACnet definitions and generate markdown output.
 */

import { traverseDefinitions } from './traverse.js';
import { MarkdownTransformer } from './markdown-transformer.js';

const outputDir = path.join(__dirname, '..', 'local-working-files');

// Ensure the output directory exists
await fs.mkdir(outputDir, { recursive: true });

// Create transformer instance with options
const transformer = new MarkdownTransformer({
    indentSize: 4,
    maxPadding: 48,
    outputPath: path.join(outputDir, 'definitions-output.md')
});

// Traverse all definitions using the markdown transformer
await traverseDefinitions(transformer);
