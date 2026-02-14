// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
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
import { CsharpTransformer } from './transformers/csharp-transformer.js';

// Create transformer instance with options
const transformer = new CsharpTransformer({
    indentSize: 4,
    maxPadding: 48,
    outputPath: 'definitions-output.md',
    directory: path.join(__dirname, '..', 'local-working-files', 'csharp-output'),
});

// Traverse all definitions using the markdown transformer
await traverseDefinitions(transformer);
