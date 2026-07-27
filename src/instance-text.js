// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import fs from 'fs/promises';
import path from 'path';

const HEX_PATTERN = /^[0-9a-fA-F]+$/;

function ensureObject(value, message) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(message);
	}
}

function validateEnvelope(instance, sourceLabel) {
	ensureObject(instance, `Invalid instance JSON in ${sourceLabel}: top-level must be an object`);

	if (instance.root !== 'BAClib') {
		throw new Error(`Invalid instance JSON in ${sourceLabel}: root must be \"BAClib\"`);
	}

	if (typeof instance.type !== 'string' || !instance.type.trim()) {
		throw new Error(`Invalid instance JSON in ${sourceLabel}: type must be a non-empty string`);
	}

	if (!Array.isArray(instance.data)) {
		throw new Error(`Invalid instance JSON in ${sourceLabel}: data must be an array`);
	}
}

function validateDataEntry(entry, sourceLabel, index) {
	if (typeof entry !== 'string') {
		throw new Error(`Invalid data entry in ${sourceLabel} at index ${index}: entry must be a string`);
	}
}

function parseHexToBytes(hex, sourceLabel, index) {
	if (!HEX_PATTERN.test(hex)) {
		throw new Error(`Invalid hex string in ${sourceLabel} at index ${index}: \"${hex}\" contains non-hex characters`);
	}

	if ((hex.length % 2) !== 0) {
		throw new Error(`Invalid hex string in ${sourceLabel} at index ${index}: \"${hex}\" has odd length`);
	}

	const bytes = [];
	for (let i = 0; i < hex.length; i += 2) {
		bytes.push(Number.parseInt(hex.slice(i, i + 2), 16));
	}

	return bytes;
}

async function readIncludeFile(includeRef, currentDir) {
	const trimmed = includeRef.trim();
	if (!trimmed) {
		throw new Error('Invalid include reference: missing target after ">"');
	}

	const candidates = [];
	const asGiven = path.resolve(currentDir, trimmed);
	candidates.push(asGiven);

	if (!trimmed.toLowerCase().endsWith('.json')) {
		candidates.push(`${asGiven}.json`);
	}

	for (const candidate of candidates) {
		try {
			const text = await fs.readFile(candidate, 'utf8');
			return { filePath: candidate, text };
		} catch (error) {
			if (error?.code !== 'ENOENT') {
				throw new Error(`Failed to read include file \"${candidate}\": ${error.message}`);
			}
		}
	}

	throw new Error(`Unresolved include reference: \"${trimmed}\" from \"${currentDir}\"`);
}

async function expandDataEntries(instance, sourceFilePath, includeStack) {
	const sourceLabel = sourceFilePath ?? '<inline-json>';
	const currentDir = sourceFilePath ? path.dirname(sourceFilePath) : process.cwd();
	const expandedBytes = [];

	for (let i = 0; i < instance.data.length; i++) {
		const rawEntry = instance.data[i];
		validateDataEntry(rawEntry, sourceLabel, i);

		const entry = rawEntry.trim();
		if (!entry) {
			continue;
		}

		if (entry.startsWith('#')) {
			continue;
		}

		if (entry.startsWith('>')) {
			const includeTarget = entry.slice(1);
			const includeFile = await readIncludeFile(includeTarget, currentDir);

			if (includeStack.includes(includeFile.filePath)) {
				const cyclePath = [...includeStack, includeFile.filePath].join(' -> ');
				throw new Error(`Include cycle detected: ${cyclePath}`);
			}

			const includedInstance = JSON.parse(includeFile.text);
			validateEnvelope(includedInstance, includeFile.filePath);

			const nestedBytes = await expandDataEntries(
				includedInstance,
				includeFile.filePath,
				[...includeStack, includeFile.filePath]
			);

			expandedBytes.push(...nestedBytes);
			continue;
		}

		expandedBytes.push(...parseHexToBytes(entry, sourceLabel, i));
	}

	return expandedBytes;
}

/**
 * Parses an instance JSON text into a normalized object with Uint8Array data.
 * Includes are resolved relative to filePath when provided.
 *
 * @param {string} text - Raw JSON text.
 * @param {Object} [options] - Parse options.
 * @param {string} [options.filePath] - Optional source file path for include resolution.
 * @returns {Promise<{root: string, type: string, data: Uint8Array}>}
 */
export async function parseInstanceText(text, options = {}) {
	if (typeof text !== 'string') {
		throw new Error('parseInstanceText expects a JSON string as input');
	}

	const instance = JSON.parse(text);
	const sourceLabel = options.filePath ?? '<inline-json>';
	validateEnvelope(instance, sourceLabel);

	const includeStack = options.filePath ? [path.resolve(options.filePath)] : [];
	const bytes = await expandDataEntries(instance, options.filePath, includeStack);

	return {
		root: instance.root,
		type: instance.type,
		data: new Uint8Array(bytes)
	};
}

/**
 * Reads and parses an instance JSON file.
 *
 * @param {string} filePath - Path to the instance JSON file.
 * @returns {Promise<{root: string, type: string, data: Uint8Array}>}
 */
export async function parseInstanceFile(filePath) {
	if (typeof filePath !== 'string' || !filePath.trim()) {
		throw new Error('parseInstanceFile expects a non-empty file path');
	}

	const resolvedPath = path.resolve(filePath);
	const text = await fs.readFile(resolvedPath, 'utf8');
	return parseInstanceText(text, { filePath: resolvedPath });
}
