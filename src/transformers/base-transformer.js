// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import path from 'path';
import { fileURLToPath } from 'url';

export class BaseTransformer {
    constructor(options = {}) {
        this.options = options;
        // Provide __filename and __dirname helpers for file path resolution
        this.__filename = fileURLToPath(import.meta.url);
        this.__dirname = path.dirname(this.__filename);
    }

    // Example helper: join paths relative to this transformer file
    joinRelativePath(...segments) {
        return path.join(this.__dirname, ...segments);
    }

    // Example helper: ensure directory exists
    async ensureDirectory(dirPath) {
        const fs = await import('fs/promises');
        await fs.mkdir(dirPath, { recursive: true });
    }


    toPascalCase(kebabCase) {
        return kebabCase
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');
    }

    // Add more helpers as needed
}
