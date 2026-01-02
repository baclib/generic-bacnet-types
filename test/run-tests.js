// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import fs from 'node:fs/promises';
import path from 'node:path';

const testDirectoryPath = import.meta.dirname;
const testDataDirectoryPath = path.join(testDirectoryPath, 'data');

const schemaDirectoryPath = path.resolve(testDirectoryPath, '../schemas');

import Ajv2020 from 'ajv/dist/2020.js';
import test from 'node:test';
const ajv = new Ajv2020({ allErrors: false, strict: false });

const testData = new Map();

async function loadTestData(directoryPath) {
    const fileNames = (await fs.readdir(directoryPath)).filter(file => file.endsWith('.json'));
    for (const fileName of fileNames) {
        const match = fileName.match(/^([a-z]+)\.(valid|invalid).([1-9][1-9])\.json$/);
        if (!match) {
            continue;
        }
        const filePath = path.join(directoryPath, fileName);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        testData.set(fileName, {
            type: match[1],
            assertion: match[2],
            number: parseInt(match[3], 10),
            data: JSON.parse(fileContent)
        });
    }
}

async function loadSchemas(directoryPath) {
    const fileNames = (await fs.readdir(directoryPath)).filter(file => file.endsWith('.json'));
    for (const fileName of fileNames) {
        const filePath = path.join(directoryPath, fileName);
        const fileText = await fs.readFile(filePath, 'utf-8');
        const schema = JSON.parse(fileText);
        ajv.addSchema(schema, `https://baclib.github.io/${fileName}`);

    }
}

async function runTests(type, validate) {
    const tests = Array.from(testData.values()).filter(test => test.type === type);
    for (const testCase of tests) {
        test(`${type} test #${testCase.number} should be ${testCase.assertion}`, () => {
            const valid = validate(testCase.data);
            if (testCase.assertion === 'valid') {
                if (!valid) {
                    console.error(validate.errors);
                }
                if (!valid) {
                    throw new Error(`Expected valid but got invalid.`);
                }
            } else {
                if (valid) {
                    throw new Error(`Expected invalid but got valid.`);
                }
            }
        });
    }
}

async function main() {
    await loadSchemas(schemaDirectoryPath);
    await loadTestData(testDataDirectoryPath);
    for (const [id, schemaObj] of Object.entries(ajv.schemas)) {
        const match = id.match(/([a-z]+)-type\.json$/);
        if (!match) {
            continue;
        }
        const validate = ajv.getSchema(id);
        if (!validate) {
            throw new Error(`Could not get schema: ${id}`);
        }
        await runTests(match[1], validate);
    }
}

await main();
