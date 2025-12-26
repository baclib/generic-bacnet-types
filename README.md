# Generic BACnet Types

A project for maintaining BACnet data types in a generic way, with tools to generate source code for different programming languages.

> [!IMPORTANT]
> **Note:** This project is under active development. APIs may change as the project evolves.

> [!IMPORTANT]
> **To Potential Contributors:** This project is in its initial phase, with foundational decisions and architecture still being established. Direct code contributions are challenging at this stage without internal knowledge of the project's direction and design goals.
>
> However, we warmly welcome feedback, ideas, and suggestions that will help shape the project as it matures.

## Overview

This project provides and maintains BACnet data types in a generic, language-agnostic way. The core idea is to define BACnet types using JSON files, enabling:

- **Automatic generation of concrete structures** for various programming languages (C#, C/C++, Rust, JavaScript, etc.)
- **Building user interfaces and documentation** directly from the generic type definitions
- **Facilitating interoperability** and consistency across BACnet implementations

### Features

- **JSON-based type definitions**: All BACnet types are described in JSON format for easy parsing and transformation.
- **Multi-language support**: Planned generators will create type definitions for popular languages, making integration straightforward.
- **ASN.1 Parsing and Encoding/Decoding**: Future development will include parsers for ASN.1 code generation, enabling conversion between BACnet binary representations and language-specific structures (e.g., C# classes).
- **UI and Documentation Generation**: The generic format allows for automated creation of user interfaces and technical documentation.

### Roadmap

- Add generators for C#, C/C++, Rust, JavaScript, and more
- Implement ASN.1 parsers and encoders/decoders
- Provide tools for UI and documentation generation

### Usage

1. **Define BACnet types** in the `definitions/` directory using JSON files.
2. **Run generators** (planned) to produce code or documentation for your target language or platform.
3. **Integrate** the generated types into your BACnet application or tooling.

## The BAClib Initiative

The BAClib Initiative is a primarily recreational effort dedicated to building automation and control, providing free, libre, and open source software for everyone. Drawing on decades of experience with BACnet protocols and implementations, this initiative aims to create modern, well-designed tools and libraries that benefit the entire building automation community.

As a volunteer-driven project developed in contributors' free time, progress follows the natural pace of recreational development rather than commercial timelines.

## License

Copyright 2024-2025, The BAClib Initiative and Contributors

All project files are provided under the terms of the [Eclipse Public License - v 2.0](https://www.eclipse.org/legal/epl-2.0/).

Additionally the corresponding [SPDX Identifier `EPL-2.0`](https://spdx.org/licenses/EPL-2.0.html) is placed in all relevant files to clearly indicate the project license.

> [!NOTE]
> The Eclipse Public License 2.0 (EPL-2.0) is a business-friendly open source license that permits permissive incorporation into proprietary software. Unlike copyleft licenses, EPL-2.0 allows you to integrate this library into commercial applications without requiring disclosure of your proprietary source code. Only modifications to the library itself must be shared under the same license.






