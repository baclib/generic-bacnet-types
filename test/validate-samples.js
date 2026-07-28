// SPDX-FileCopyrightText: Copyright 2024-2026 The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import fs from 'node:fs/promises';
import path from 'node:path';

const testDirectoryPath = import.meta.dirname;
const samplesDirectoryPath = path.resolve(testDirectoryPath, 'samples');

function validateSampleStructure(data, fileName) {
    const errors = [];

    // Check required top-level fields
    if (!('metadata' in data)) {
        errors.push('missing required field: metadata');
    } else if (typeof data.metadata !== 'object') {
        errors.push('metadata must be an object');
    }

    if (!('root' in data)) {
        errors.push('missing required field: root');
    } else if (typeof data.root !== 'string') {
        errors.push('root must be a string');
    }

    if (!('type' in data)) {
        errors.push('missing required field: type');
    } else if (typeof data.type !== 'string') {
        errors.push('type must be a string');
    }

    if (!('asdu' in data)) {
        errors.push('missing required field: asdu');
    } else if (!Array.isArray(data.asdu)) {
        errors.push('asdu must be an array');
    } else if (data.asdu.length === 0) {
        errors.push('asdu array must not be empty');
    } else {
        // Validate each asdu element
        data.asdu.forEach((element, index) => {
            if (typeof element !== 'object' || element === null) {
                errors.push(`asdu[${index}] must be an object`);
                return;
            }

            // Check required asdu element fields
            if (!('name' in element)) {
                errors.push(`asdu[${index}] missing required field: name`);
            } else if (typeof element.name !== 'string') {
                errors.push(`asdu[${index}].name must be a string`);
            } else if (element.name.trim().length === 0) {
                errors.push(`asdu[${index}].name must not be empty`);
            }

            if (!('good' in element)) {
                errors.push(`asdu[${index}] missing required field: good`);
            } else if (typeof element.good !== 'boolean') {
                errors.push(`asdu[${index}].good must be a boolean`);
            }

            if (!('data' in element)) {
                errors.push(`asdu[${index}] missing required field: data`);
            } else if (!Array.isArray(element.data)) {
                errors.push(`asdu[${index}].data must be an array`);
            } else if (element.data.length === 0) {
                errors.push(`asdu[${index}].data array must not be empty`);
            }
        });
    }

    // Check for unexpected top-level fields
    const allowedFields = ['metadata', 'root', 'type', 'asdu'];
    const actualFields = Object.keys(data);
    for (const field of actualFields) {
        if (!allowedFields.includes(field)) {
            errors.push(`unexpected field: ${field}`);
        }
    }

    return errors;
}

async function validateSamples(directoryPath) {
    let fileNames;
    try {
        fileNames = (await fs.readdir(directoryPath))
            .filter(file => file.endsWith('.json'))
            .sort();
    } catch (error) {
        throw new Error(`Could not read samples directory: ${error.message}`);
    }

    let validCount = 0;
    const invalidFiles = [];

    for (const fileName of fileNames) {
        const filePath = path.join(directoryPath, fileName);
        try {
            const fileText = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(fileText);
            const errors = validateSampleStructure(data, fileName);

            if (errors.length === 0) {
                validCount += 1;
            } else {
                invalidFiles.push({ fileName, errors });
            }
        } catch (error) {
            invalidFiles.push({
                fileName,
                errors: [`Parse error: ${error.message}`]
            });
        }
    }

    return {
        total: fileNames.length,
        valid: validCount,
        invalid: invalidFiles.length,
        invalidFiles
    };
}

function printReport(report) {
    console.log('Sample Validation Report');
    console.log('------------------------');
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
        for (const error of entry.errors) {
            console.log(`  * ${error}`);
        }
    }
}

// Main
try {
    const report = await validateSamples(samplesDirectoryPath);
    printReport(report);
    process.exit(report.invalid === 0 ? 0 : 1);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
