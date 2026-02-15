// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

/**
 * Code Generator CLI
 * 
 * Usage:
 *   npm run generate                    # Generate for all languages
 *   npm run generate:csharp             # Generate C# code
 *   npm run generate -- --lang rust     # Generate Rust code
 */

import { CodeGenerator } from './generator.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const langIndex = args.indexOf('--lang');
const helpIndex = args.indexOf('--help');

// Available languages
const SUPPORTED_LANGUAGES = ['csharp', 'java', 'typescript', 'rust', 'cpp'];

function showHelp() {
    console.log(`
BACnet Type Code Generator
===========================

Generate source code from BACnet type definitions for multiple programming languages.

Usage:
  node src/generate.js [options]
  npm run generate                    # Generate for all languages
  npm run generate:csharp             # Generate C# only
  npm run generate:java               # Generate Java only
  npm run generate:typescript         # Generate TypeScript only
  npm run generate:rust               # Generate Rust only

Options:
  --lang <language>    Generate code for specific language (csharp, java, typescript, rust)
  --help               Show this help message

Supported Languages:
  ${SUPPORTED_LANGUAGES.map(lang => `  - ${lang}`).join('\n')}

Examples:
  node src/generate.js --lang csharp
  node src/generate.js --lang rust
  npm run generate
`);
}

async function generateForLanguage(language) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Generating ${language.toUpperCase()} code`);
    console.log(`${'='.repeat(60)}\n`);

    try {
        const generator = new CodeGenerator(language, {
            projectRoot: path.join(__dirname, '..')
        });
        await generator.run();
        return true;
    } catch (error) {
        console.error(`\n❌ Error generating ${language} code:`, error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        return false;
    }
}

async function main() {
    // Show help
    if (helpIndex !== -1) {
        showHelp();
        process.exit(0);
    }

    let languagesToGenerate = [];

    // Check for --lang argument
    if (langIndex !== -1 && args[langIndex + 1]) {
        const requestedLang = args[langIndex + 1].toLowerCase();
        
        if (!SUPPORTED_LANGUAGES.includes(requestedLang)) {
            console.error(`\n❌ Error: Unsupported language '${requestedLang}'`);
            console.error(`\nSupported languages: ${SUPPORTED_LANGUAGES.join(', ')}\n`);
            process.exit(1);
        }
        
        languagesToGenerate = [requestedLang];
    } else {
        // Generate for all languages
        languagesToGenerate = SUPPORTED_LANGUAGES;
    }

    console.log(`
╔════════════════════════════════════════════════════════════╗
║        BACnet Type Code Generator                          ║
║        Generating types for multiple languages             ║
╚════════════════════════════════════════════════════════════╝
`);

    const results = [];
    
    for (const language of languagesToGenerate) {
        const success = await generateForLanguage(language);
        results.push({ language, success });
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('Generation Summary');
    console.log(`${'='.repeat(60)}\n`);

    results.forEach(({ language, success }) => {
        const status = success ? '✅ Success' : '❌ Failed';
        console.log(`  ${status}: ${language}`);
    });

    const failedCount = results.filter(r => !r.success).length;
    
    console.log(`\n${'='.repeat(60)}\n`);

    if (failedCount > 0) {
        console.error(`⚠️  ${failedCount} language(s) failed to generate.`);
        process.exit(1);
    } else {
        console.log('🎉 All code generation completed successfully!');
        console.log(`\nGenerated files are in the 'output' directory.`);
        process.exit(0);
    }
}

// Run the generator
main().catch(error => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
});
