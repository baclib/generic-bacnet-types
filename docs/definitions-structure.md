# Aufbau von Definitionsdateien

Diese Doku beschreibt den strukturellen Aufbau der JSON-Dateien im Ordner `definitions/` und welche Felder in welchen Konstellationen erlaubt sind.

Basis der Regeln sind die Schemas im Ordner `schemas/`, insbesondere:
- `type-definition.json` (Top-Level)
- `type-reference.json`
- `type-traits.json`
- die bedingten Applicator-Schemas `if-*.json`

## 1) Top-Level Struktur einer Definition

Jede Datei in `definitions/` beschreibt genau einen Typ und ist ein JSON-Objekt.

Typische Struktur:

```json
{
  "metadata": {
    "SPDX-FileCopyrightText": "...",
    "SPDX-License-Identifier": "..."
  },
  "alias": "BACnetExample",
  "name": "example-type",
  "description": "Optionaler Klartext.",
  "type": {
    "base": "sequence",
    "fields": []
  }
}
```

### Erlaubte Top-Level Felder

- `name` (Pflicht): Typname im kebab-case Format
- `alias` (optional): alternativer Name, oft Zielsprachentyp
- `description` (optional): textuelle Beschreibung
- `metadata` (optional): freies Objekt mit Zusatzinfos
- `type`: Typdefinition als Referenz oder Traits
- `primitive`: Primitive-ID als Integer

Hinweis:
- Genau eines von beiden muss vorhanden sein: `type` oder `primitive`.
- Beide gleichzeitig sind unzulaessig.

## 2) Typ-Referenz (`type`)

`type` akzeptiert zwei Formen:

1. String-Referenz auf einen vorhandenen Typnamen
2. Objekt mit Traits (`type-traits`)

Beispiele:

```json
{ "type": "object-identifier" }
```

```json
{
  "type": {
    "base": "unsigned",
    "minimum": 0,
    "maximum": 100
  }
}
```

## 3) Traits-Grundstruktur

Wenn `type` ein Objekt ist, gilt:

- `base` (Pflicht): Basistyp
- `series` (optional):
  - `true/false` oder
  - Zahlenbereich fuer Listengroesse (Integer oder `{minimum, maximum}`)

Zusatzfelder sind von `base` abhaengig und werden durch die `if-*.json` Schemas freigeschaltet.

## 4) Bedingte Felder je `base`

## 4.1 `base: "sequence"`

Pflichtfeld:
- `fields`: Array mit mindestens 1 Eintrag

Jedes `field`-Element:
- `name` (Pflicht)
- `type` (Pflicht): String-Referenz oder verschachtelte Traits
- `context` (optional, Integer >= 0)
- `optional` (optional, Boolean)
- `alias` (optional)
- `description` (optional)

Beispiel:

```json
{
  "base": "sequence",
  "fields": [
    {
      "name": "object-identifier",
      "type": "object-identifier",
      "context": 0
    },
    {
      "name": "priority",
      "type": {
        "base": "unsigned",
        "minimum": 1,
        "maximum": 16
      },
      "context": 1,
      "optional": true
    }
  ]
}
```

## 4.2 `base: "choice"`

Pflichtfeld:
- `options`: Array (mindestens 1 Eintrag)

Jedes `option`-Element:
- `name` (Pflicht)
- `type` (Pflicht)
- `context` (optional)
- `alias` (optional)
- `description` (optional)

Beispiel:

```json
{
  "base": "choice",
  "options": [
    { "name": "null", "type": "null" },
    { "name": "lighting-command", "type": "lighting-command", "context": 0 }
  ]
}
```

## 4.3 `base: "enumerated"`

Optionale/typische Felder:
- `values`: Array von Enum-Eintraegen
  - Eintrag: `name` (Pflicht), `constant` (Pflicht, Integer >= 0), optional `alias`, `description`
- `minimum`, `maximum`: Wertebereich
- `extensible`: Boolean
- `range`: optionaler Bereich fuer extensible Semantik
- `ranges`: optionale Bereichsliste
- `proprietary`: proprietaerer Bereich (Objekt oder Array von Objekten)

Wichtig fuer 64-bit Faelle:
- Sehr grosse Grenzen koennen als String abgelegt sein (z. B. `"18446744073709551615"`).

Beispiel:

```json
{
  "base": "enumerated",
  "values": [
    { "name": "inactive", "constant": 0 },
    { "name": "active", "constant": 1 }
  ],
  "minimum": 0,
  "maximum": "18446744073709551615"
}
```

## 4.4 `base: "bit-string"`

Optionale/typische Felder:
- `bits`: Array von Bitdefinitionen
  - Eintrag: `name` (Pflicht), `position` (Pflicht, Integer >= 0), optional `alias`, `description`
- `length`: Laengenbegrenzung (Integer oder `{minimum, maximum}`)
- `extensible`, `range`, `ranges`, `proprietary`, `maximum` (wie bei erweiterbaren Typen)

Beispiel:

```json
{
  "base": "bit-string",
  "bits": [
    { "name": "monday", "position": 0 },
    { "name": "tuesday", "position": 1 }
  ]
}
```

## 4.5 Numerische Basistypen

### `base: "unsigned"`
- `minimum`, `maximum` erlaubt
- Werte nicht-negativ
- Fuer grosse 64-bit Grenzen sind auch numerische Strings erlaubt

### `base: "integer"`
- `minimum`, `maximum` erlaubt
- positive und negative Werte moeglich
- Fuer grosse 64-bit Grenzen sind auch numerische Strings erlaubt

### `base: "real"` oder `base: "double"`
- `minimum`, `maximum` als Number erlaubt

Beispiel:

```json
{
  "base": "integer",
  "minimum": "-9223372036854775808",
  "maximum": "9223372036854775807"
}
```

## 4.6 Laengenbasierte String/Binary Typen

Bei folgenden Basen ist `length` erlaubt:
- `octet-string`
- `character-string`
- `bit-string`

`length` kann sein:
- fester Integer
- oder Bereichsobjekt `{minimum, maximum}` (nicht-negativ)

Beispiel:

```json
{
  "base": "octet-string",
  "length": 3
}
```

## 5) Verschachtelung und Wiederverwendung

Innerhalb von `fields` und `options` kann `type` wieder ein Traits-Objekt sein.
Damit sind lokale Einschraenkungen moeglich, z. B. ein `unsigned` mit `minimum`/`maximum` nur fuer ein einzelnes Feld.

## 6) Namenskonventionen

- `name` folgt dem Pattern aus `type-name.json` (kebab-case, optionaler Vendor-Prefix)
- Feld- und Optionsnamen sind ebenfalls in kebab-case gehalten

## 7) Praktische Checkliste

Beim Erstellen einer neuen Definition:

1. Top-Level `name` setzen (Pflicht)
2. Genau eines definieren: `primitive` oder `type` (nicht beide)
3. Bei `type`: `base` setzen
4. Base-abhaengige Pflichtfelder setzen (`fields`, `options`, etc.)
5. Grenzen/Laengen nur in den fuer den Basistyp erlaubten Feldern angeben
6. Fuer sehr grosse Integer-Grenzen (64-bit) String-Repraesentation nutzen
7. Validierung ausfuehren:

```bash
npm run validate:definitions
```

## 8) Mini-Beispiele pro Muster

Primitive Definition:

```json
{
  "name": "boolean",
  "alias": "Boolean",
  "primitive": 1
}
```

Typreferenz als String:

```json
{
  "name": "my-object-ref",
  "type": "object-identifier"
}
```

Traits-Definition (Sequence):

```json
{
  "name": "my-sequence",
  "type": {
    "base": "sequence",
    "fields": [
      { "name": "id", "type": "unsigned", "context": 0 },
      { "name": "label", "type": "character-string", "context": 1, "optional": true }
    ]
  }
}
```
