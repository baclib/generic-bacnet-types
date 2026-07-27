# Structure of Instance Files

This document compactly describes the JSON format for instance files (for example in the `instances/` folder).

## 1) Top-Level Structure

Each instance file is a JSON object with exactly these fields:

- `root` (required): must always be the string `BAClib`
- `type` (required): type name as a string
- `data` (required): array of strings

Example:

```json
{
  "root": "BAClib",
  "type": "calendar-entry",
  "data": [
    "0E",
    "0C",
    "00000002",  "# optional comment",
    "> date-pattern-xyz",
    "0F"
  ]
}
```

## 2) Rules for `data`

Each entry in `data` is a string and is interpreted as follows:

1. Comment:
  - If an entry starts with `#`, it is a comment.
  - Comment entries are ignored.

2. Include:
  - If an entry starts with `>`, it is an include instruction.
  - The remaining part of the string is a file name/identifier.
  - The referenced file is read, and its `data` is inserted at that position.
  - The same rules apply recursively to all inserted entries.

3. Hex bytes:
  - All other entries must be hexadecimal strings.
  - Only characters `[0-9a-fA-F]` are allowed.
  - Length may be arbitrary, but must always be even (byte pairs).
  - Valid examples: `"0E"`, `"00000002"`, `"19"`
  - Invalid examples: `"0"`, `"0G"`, `"ABC"`

## 3) Include Resolution

For `> name`, the parser attempts to load the referenced file (for example `name.json` in the same search path).

- The loaded file must also conform to this specification.
- `root`, `type`, and `data` are read from it; only `data` is used for insertion.
- It is recommended to detect include cycles and abort with an error.

## 4) Parse Result

After full resolution (comments removed, includes expanded, hex parsed), the result is a JavaScript object:

```js
{
  root: "BAClib",
  type: "...",
  data: Uint8Array
}
```

The following applies:

- `root`: unchanged from the main file (`"BAClib"`)
- `type`: unchanged from the main file
- `data`: byte sequence from all valid hex entries, in the order of the final expanded list

## 5) Error Cases (at minimum)

The parser should abort with an error in these cases:

- `root !== "BAClib"`
- missing `type` or `type` is not a string
- missing `data` or `data` is not an array
- invalid hex string (invalid characters or odd length)
- unresolved include reference
- include cycle