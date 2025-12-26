// SPDX-FileCopyrightText: Copyright 2024-2025, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const originDirectoryPath = import.meta.dirname;
const templatesPath = path.join(originDirectoryPath, '../templates');

const definitionsPath = new URL('../definitions/', import.meta.url);
const definitionsFiles = await fs.readdir(definitionsPath);
const definitions = new Map();

const bitStringSet = new Set();
const enumeratedSet = new Set();

for (const file of definitionsFiles) {
    if (file.endsWith('.json')) {
        const filePath = new URL(file, definitionsPath);
        const content = await fs.readFile(filePath, 'utf8');
        const definition = JSON.parse(content);
        definitions.set(definition.id, definition);
        definitions.set(definition.name, definition);

        switch (definition.base) {
            case 'bit-string':
                bitStringSet.add(definition);
                break;
            case 'enumerated':
                enumeratedSet.add(definition);
                break;
            default:
                break;
        }
    }
}

async function readTemplate(templateName, values = {}) {
    const templatePath = path.join(templatesPath, templateName);
    let result = await fs.readFile(templatePath, 'utf8');
    for (const [key, value] of Object.entries(values)) {
        result = result.replaceAll(`{{${key}}}`, value);
    }
    return result;
}

const templates = {
    bitStringBytes: await readTemplate('bit-string-bytes.cs.txt'),
    bitStringFlagsFixed: await readTemplate('bit-string-flags-fixed.cs.txt'),
    bitStringFlagsVariable: await readTemplate('bit-string-flags-variable.cs.txt'),
    enumeration: await readTemplate('enumeration.cs.txt'),
};

function getBitStringContext(definition, language) {
    if (language !== 'csharp') {
        throw new Error(`Unsupported language: ${language}`);
    }
    const maximum = definition.maximum;
    let result = {
        typeName: aliasToPascalCase(definition.id),
        bacnetName: definition.name,
        baseType: 'array',
        baseBits: Math.ceil(maximum / 8) * 8,
        bitCount: definition.maximum + 1,
        hasRange: definition.minimum !== maximum,
        items: [...definition.items].sort((a, b) => a.value - b.value),
    };

    // Create a HEX mask value for up to 64 bits
    let mask = null;
    if (maximum < 64) {
        // (1 << (maximum + 1)) - 1, but for 32+ bits use BigInt
        if (maximum < 32) {
            mask = (1 << (maximum + 1)) - 1;
            mask = '0x' + mask.toString(16).toUpperCase();
        } else {
            mask = (BigInt(1) << BigInt(maximum + 1)) - BigInt(1);
            mask = '0x' + mask.toString(16).toUpperCase();
        }
    } else if (maximum === 63) {
        // Special case for 64 bits: all bits set
        mask = '0xFFFFFFFFFFFFFFFF';
    }
    result.flagsMask = mask;
    if (maximum < 8) {
        result.baseType = 'byte';
    }
    else if (maximum < 16) {
        result.baseType = 'ushort';
    }
    else if (maximum < 32) {
        result.baseType = 'uint';
    }
    else if (maximum < 64) {
        result.baseType = 'ulong';
    }

    const template = result.hasRange
        ? (result.baseType === 'array' ? templates.bitStringBytes : templates.bitStringFlagsVariable)
        : templates.bitStringFlagsFixed;
    result.template = template;

    return result;
}

function indent(content, level = 0) {
    const padding = ' '.repeat(level * 4);
    return content
        .split(os.EOL)
        .map(line => (line.length > 0 ? padding + line : line))
        .join(os.EOL);
}

function aliasToPascalCase(alias) {
    const parts = alias.split('-');
    const startIdx = /^\d+$/.test(parts[0]) ? 1 : 0;
    return parts
        .slice(startIdx)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

function getEnumBaseType(maximum) {
    if (maximum < 256) {
        return 'byte';
    }
    if (maximum < 65536) {
        return 'ushort';
    }
    return 'uint';
}

async function generateCSharpEnum(enumeration, level) {
    const enumName = aliasToPascalCase(enumeration.id);
    const bacnetName = enumeration.name;
    const maximum = enumeration.maximum;
    const baseType = getEnumBaseType(maximum);
    const items = [...enumeration.items].sort((a, b) => a.value - b.value);

    let itemsString = '';
    items.forEach((item, index) => {
        const comma = index < items.length - 1 ? ',' : '';
        itemsString += `    /// <summary>${os.EOL}    /// ${item.description || ''}${os.EOL}    /// </summary>${os.EOL}`;
        itemsString += `    ${aliasToPascalCase(item.name)} = ${item.value}${comma}${os.EOL}`;
        if (index < items.length - 1) {
            itemsString += os.EOL;
        }
    });

    let content = templates.enumeration
        .replace('{{BACNET_NAME}}', bacnetName)
        .replace('{{ENUM_NAME}}', enumName)
        .replace('{{BASE_TYPE}}', baseType)
        .replace('{{ITEMS}}', itemsString.trimEnd());
    return indent(content, level);
}

async function generateCsharpEnumFile(outputDirectoryPath, enumeration) {
    const content = await readTemplate('file-start.cs.txt', {
        NAMESPACES: '',
    }) + os.EOL + await generateCSharpEnum(enumeration, 0);

    const fileName = `${aliasToPascalCase(enumeration.id)}.cs`;
    const filePath = path.join(outputDirectoryPath, fileName);

    console.debug(`--- ${filePath} ---`);
    console.debug(content);

    await fs.writeFile(filePath, content, 'utf8');
}

async function generateBitString(definition, language, level) {
    if (language !== 'csharp') {
        throw new Error(`Unsupported language: ${language}`);
    }
    const context = getBitStringContext(definition, language);
    let itemsContent = '';
    context.items.forEach(item => {
        itemsContent += `    /// <summary>${os.EOL}    /// ${item.description || ''}${os.EOL}    /// </summary>${os.EOL}`;
        itemsContent += `    public bool ${aliasToPascalCase(item.name)} => this[${item.bit}];${os.EOL}${os.EOL}`;
    });
    const content = context.template
        .replaceAll('{{BACNET_NAME}}', context.bacnetName)
        .replaceAll('{{TYPE_NAME}}', context.typeName)
        .replaceAll('{{FLAGS_TYPE}}', context.baseType)
        .replaceAll('{{FLAGS_MASK}}', context.flagsMask)
        .replaceAll('{{BASE_BITS}}', context.baseBits)
        .replaceAll('{{BIT_COUNT}}', context.bitCount)
        .replaceAll('{{MINIMUM_BIT_COUNT}}', definition.minimum + 1)
        .replaceAll('{{MAXIMUM_BIT_COUNT}}', definition.maximum + 1)
        .replaceAll('{{ITEMS}}', itemsContent.trimEnd());
    return indent(content, level);
}

async function generateBitStringFile(outputDirectoryPath, definition, language) {
    if (language !== 'csharp') {
        throw new Error(`Unsupported language: ${language}`);
    }
    const content = await readTemplate('file-start.cs.txt', {
        NAMESPACES: `${os.EOL}using System.Collections;${os.EOL}`,
    }) + os.EOL + await generateBitString(definition, language, 0);

    const fileName = `${aliasToPascalCase(definition.id)}.cs`;
    const filePath = path.join(outputDirectoryPath, fileName);

    console.debug(`--- ${filePath} ---`);
    console.debug(content);

    await fs.writeFile(filePath, content, 'utf8');
}

async function generateCode(outputDirectoryPath, definition, language) {
    if (language !== 'csharp') {
        throw new Error(`Unsupported language: ${language}`);
    }
    await fs.mkdir(outputDirectoryPath, { recursive: true });
    switch (definition.base) {
        case 'enumerated':
            await generateCsharpEnumFile(outputDirectoryPath, definition);
            break;
        case 'bit-string':
            await generateBitStringFile(outputDirectoryPath, definition, language);
            break;
        default:
            throw new Error(`Unsupported definition base for code generation: ${definition.base}`);
    }
}

export {
    bitStringSet,
    enumeratedSet,
    generateCode,
};
