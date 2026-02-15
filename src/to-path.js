// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { TypeMapper } from './type-mapper.js';
import { TemplateEngine } from './template-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
