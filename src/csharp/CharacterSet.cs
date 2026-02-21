// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

namespace Baclib.Bacnet.Types;

/// <summary>
/// Specifies the character set encoding used for BACnet character strings.
/// The encoding is defined by the BACnet protocol and determines how string data is represented in the protocol data units.
/// Defined in ANSI/ASHRAE 135-2024 See 20.2.9.
/// </summary>
public enum CharacterSet : byte
{
    /// <summary>
    /// ISO 10646 (UTF-8) encoding.
    /// </summary>
    Utf8 = 0x00,

    /// <summary>
    /// IBM/Microsoft DBCS encoding. The initial octet is followed by two octets indicating the code page (big-endian).
    /// </summary>
    Dbcs = 0x01,

    /// <summary>
    /// JIS X 0208 encoding.
    /// </summary>
    Jis = 0x02,

    /// <summary>
    /// ISO 10646 (UCS-4) encoding. Each character is represented by four octets (Group-Plane-Row-Cell order).
    /// </summary>
    Ucs4 = 0x03,

    /// <summary>
    /// ISO 10646 (UCS-2) encoding. Each character is represented by two octets (Row-Cell order).
    /// </summary>
    Ucs2 = 0x04,

    /// <summary>
    /// ISO 8859-1 (Latin-1) encoding.
    /// </summary>
    Iso = 0x05
}
