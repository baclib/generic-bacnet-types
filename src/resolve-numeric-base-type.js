// SPDX-FileCopyrightText: Copyright 2024-2026 The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import fs from 'node:fs/promises';
import path from 'node:path';
import util from 'node:util';
import { fileURLToPath } from 'node:url';

const INTEGER_BASES = new Set(['unsigned', 'integer', 'enumerated']);
const FLOAT_BASES = new Set(['real', 'double']);
const SUPPORTED_BASES = new Set([...INTEGER_BASES, ...FLOAT_BASES]);

// Fixed 64-bit integer boundaries.
export const UINT64_MAX_VALUE = (1n << 64n) - 1n;
export const INT64_MAX_VALUE = (1n << 63n) - 1n;
export const INT64_MIN_VALUE = -(1n << 63n);

// IEEE 754 single-precision (32-bit) float max finite value.
export const FLOAT32_MAX_VALUE = 3.4028234663852886e38;

const TYPE_LIMITS = {
    unsigned: {
        minimum: 0n,
        maximum: UINT64_MAX_VALUE
    },
    integer: {
        minimum: INT64_MIN_VALUE,
        maximum: INT64_MAX_VALUE
    },
    enumerated: {
        minimum: 0n,
        maximum: UINT64_MAX_VALUE
    },
    real: {
        minimum: -FLOAT32_MAX_VALUE,
        maximum: FLOAT32_MAX_VALUE
    },
    double: {
        minimum: -Number.MAX_VALUE,
        maximum: Number.MAX_VALUE
    }
};

function parseBigIntLike(value, fieldName) {
    if (typeof value === 'number') {
        if (!Number.isFinite(value) || !Number.isInteger(value)) {
            throw new Error(`${fieldName} must be an integer number or integer string.`);
        }
        return BigInt(value);
    }

    if (typeof value === 'string' && /^-?[0-9]+$/.test(value)) {
        return BigInt(value);
    }

    throw new Error(`${fieldName} must be an integer number or integer string.`);
}

function parseNumberLike(value, fieldName) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new Error(`${fieldName} must be a number.`);
    }
    return value;
}

function toTraitsObject(input) {
    if (!input || typeof input !== 'object') {
        throw new Error('Input must be an object.');
    }

    // Accept either a full definition object or a direct traits object.
    if (input.type && typeof input.type === 'object' && !Array.isArray(input.type)) {
        return input.type;
    }

    return input;
}

export function resolveNumericBaseType(input) {
    const traits = toTraitsObject(input);
    const base = traits.base;

    if (typeof base !== 'string' || !SUPPORTED_BASES.has(base)) {
        throw new Error(`'${String(base)}' is not a supported bases of ${[...SUPPORTED_BASES].join(', ')}.`);
    }

    if (INTEGER_BASES.has(base)) {
        const limits = TYPE_LIMITS[base];
        const minValue = traits.minimum === undefined
            ? limits.minimum
            : parseBigIntLike(traits.minimum, 'minimum');
        const maxValue = traits.maximum === undefined
            ? limits.maximum
            : parseBigIntLike(traits.maximum, 'maximum');

        if ((base === 'unsigned' || base === 'enumerated') && minValue < 0n) {
            throw new Error(`Base '${base}' requires minimum >= 0.`);
        }

        if (minValue < limits.minimum || maxValue > limits.maximum) {
            throw new Error(
                `Base '${base}' supports only the 64-bit range ${limits.minimum}..${limits.maximum}.`
            );
        }

        if (minValue > maxValue) {
            throw new Error('minimum must be <= maximum.');
        }

        return {
            base,
            minValue,
            maxValue
        };
    }

    const limits = TYPE_LIMITS[base];
    const minValue = traits.minimum === undefined
        ? limits.minimum
        : parseNumberLike(traits.minimum, 'minimum');
    const maxValue = traits.maximum === undefined
        ? limits.maximum
        : parseNumberLike(traits.maximum, 'maximum');

    if (minValue < limits.minimum || maxValue > limits.maximum) {
        if (base === 'real') {
            throw new Error(
                `Base 'real' supports only 32-bit float range ${limits.minimum}..${limits.maximum}.`
            );
        }
        throw new Error(
            `Base '${base}' supports only range ${limits.minimum}..${limits.maximum}.`
        );
    }

    if (minValue > maxValue) {
        throw new Error('minimum must be <= maximum.');
    }

    return {
        base,
        minValue,
        maxValue
    };
}

async function runCli() {
    const inputPath = process.argv[2];
    if (!inputPath) {
        console.error('Usage: node src/resolve-numeric-base-type.js <path-to-definition-or-traits-json>');
        process.exitCode = 1;
        return;
    }

    const absoluteInputPath = path.resolve(process.cwd(), inputPath);
    const text = await fs.readFile(absoluteInputPath, 'utf-8');
    const input = JSON.parse(text);
    const resolved = resolveNumericBaseType(input);

    console.log('Resolved numeric type:');
    console.log(util.inspect(resolved, { depth: null, colors: false }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    runCli().catch(error => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    });
}
