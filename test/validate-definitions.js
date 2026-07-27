// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const testDirectoryPath = import.meta.dirname;
const schemaDirectoryPath = path.resolve(testDirectoryPath, '../schemas');
const definitionDirectoryPath = path.resolve(testDirectoryPath, '../definitions');

const ajv = new Ajv2020({ allErrors: true, strict: false });

async function loadSchemas(directoryPath) {
    const fileNames = (await fs.readdir(directoryPath))
        .filter(file => file.endsWith('.json'));

    for (const fileName of fileNames) {
        const filePath = path.join(directoryPath, fileName);
        const fileText = await fs.readFile(filePath, 'utf-8');
        const schema = JSON.parse(fileText);
        ajv.addSchema(schema, `https://baclib.github.io/${fileName}`);
    }
}

function formatError(error) {
    const pathPart = error.instancePath || '/';
    const keywordPart = error.keyword;
    const messagePart = error.message ?? 'validation error';
    return `${pathPart} [${keywordPart}] ${messagePart}`;
}

async function validateDefinitions(directoryPath) {
    const schemaId = 'https://baclib.github.io/type-definition.json';
    const validate = ajv.getSchema(schemaId);
    if (!validate) {
        throw new Error(`Could not get schema: ${schemaId}`);
    }

    const fileNames = (await fs.readdir(directoryPath))
        .filter(file => file.endsWith('.json') && !file.startsWith('0'))
        .sort();

    let validCount = 0;
    const invalidFiles = [];

    for (const fileName of fileNames) {
        const filePath = path.join(directoryPath, fileName);
        const fileText = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileText);
        const valid = validate(data);

        if (valid) {
            validCount += 1;
            continue;
        }

        invalidFiles.push({
            fileName,
            errors: (validate.errors ?? []).map(formatError)
        });
    }

    return {
        total: fileNames.length,
        valid: validCount,
        invalid: invalidFiles.length,
        invalidFiles
    };
}

function printReport(report) {
    console.log('Definition Validation Report');
    console.log('----------------------------');
    console.log(`Total files:   ${report.total}`);
    console.log(`Valid files:   ${report.valid}`);
    console.log(`Invalid files: ${report.invalid}`);

    if (report.invalid === 0) {
        console.log('Status: PASS');
        return;
    }

    console.log('Status: FAIL');
    console.log('');

    for (const entry of report.invalidFiles) {
        console.log(`- ${entry.fileName}`);
        for (const error of entry.errors.slice(0, 5)) {
            console.log(`  * ${error}`);
        }
        if (entry.errors.length > 5) {
            console.log(`  * ... ${entry.errors.length - 5} more error(s)`);
        }
    }
}

async function main() {
    try {
        await loadSchemas(schemaDirectoryPath);
        const report = await validateDefinitions(definitionDirectoryPath);
        printReport(report);

        if (report.invalid > 0) {
            process.exitCode = 1;
        }
    } catch (error) {
        console.error('Validation failed due to runtime error.');
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}

await main();
