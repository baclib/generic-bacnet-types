// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

namespace Baclib.Bacnet.Types;

/// <summary>
/// Represents a BACnet Character String value with encoding information.
/// Defined in ANSI/ASHRAE 135-2024 Clause 20.2.9.
/// </summary>
/// <remarks>
/// BACnet Character Strings contain both the encoded text data and a character set identifier.
/// Supports multiple encodings including UTF-8, UCS-2, UCS-4, ISO-8859-1, JIS X 0208, and DBCS.
/// The string value is decoded and stored alongside the encoding metadata for efficient access.
/// </remarks>
public readonly record struct CharacterString
{
    /// <summary>
    /// The backing field for the character encoder.
    /// Uses volatile semantics to ensure thread-safe reads and writes.
    /// </summary>
    private static CharacterEncoder _encoder = CharacterEncoder.Default;

    /// <summary>
    /// Gets or sets the character encoder used for decoding BACnet character strings.
    /// Defaults to <see cref="CharacterEncoder.Default"/>.
    /// </summary>
    /// <remarks>
    /// <para>
    /// This property uses volatile semantics to ensure thread-safe access.
    /// Set this property once during application startup before any <see cref="CharacterString"/> 
    /// instances are created to avoid race conditions during initialization.
    /// </para>
    /// <para>
    /// <b>Custom Encoding:</b> Inherit from <see cref="CharacterEncoder"/> and override:
    /// <list type="bullet">
    /// <item><description><see cref="CharacterEncoder.JisX0208Encoding"/> - to customize JIS encoding</description></item>
    /// <item><description><see cref="CharacterEncoder.GetString"/> - for complete decoding control</description></item>
    /// <item><description><see cref="CharacterEncoder.GetBytes(string, CharacterSet)"/> - for custom encoding</description></item>
    /// </list>
    /// </para>
    /// </remarks>
    /// <example>
    /// <code>
    /// // At application startup:
    /// CharacterString.Encoder = new CustomCharacterEncoder();
    /// 
    /// // Or use a custom JIS encoding:
    /// public class CustomEncoder : CharacterEncoder
    /// {
    ///     protected override TextEncoding JisX0208Encoding => GetDbcsEncoding(20932); // EUC-JP
    /// }
    /// </code>
    /// </example>
    public static CharacterEncoder Encoder
    {
        get => Volatile.Read(ref _encoder);
        set
        {
            ArgumentNullException.ThrowIfNull(value);
            Volatile.Write(ref _encoder, value);
        }
    }

    /// <summary>
    /// Predefined UTF-8 identifier byte array.
    /// </summary>
    private static readonly byte[] _utf8Data = [(byte)CharacterSet.Utf8];

    /// <summary>
    /// Predefined UCS-2 identifier byte array.
    /// </summary>
    private static readonly byte[] _ucs2Data = [(byte)CharacterSet.Ucs2];

    /// <summary>
    /// Predefined UCS-4 identifier byte array.
    /// </summary>
    private static readonly byte[] _ucs4Data = [(byte)CharacterSet.Ucs4];

    /// <summary>
    /// Predefined ISO-8859-1 identifier byte array.
    /// </summary>
    private static readonly byte[] _isoData = [(byte)CharacterSet.Iso];

    /// <summary>
    /// Predefined JIS X 0208 identifier byte array.
    /// </summary>
    private static readonly byte[] _jisData = [(byte)CharacterSet.Jis];

    /// <summary>
    /// The raw BACnet character string data, including the encoding identifier.
    /// Always initialized to a valid array (never null).
    /// </summary>
    private readonly byte[] _data = [];

    /// <summary>
    /// Gets the BACnet character set identifier.
    /// </summary>
    public CharacterSet CharSet => (CharacterSet)_data[0];

    /// <summary>
    /// Gets the string value converted from the BACnet character string.
    /// </summary>
    public string Value { get; } = string.Empty;

    /// <summary>
    /// Gets the length of the string value.
    /// </summary>
    public int Length => Value.Length;

    /// <summary>
    /// Gets the code page for DBCS character sets.
    /// </summary>
    /// <exception cref="InvalidOperationException">Thrown if the character set is not DBCS.</exception>
    public int CodePage => CharSet == CharacterSet.Dbcs && _data.Length >= 3
        ? (_data[1] << 8) | _data[2]
        : throw new InvalidOperationException("Code page is only available for DBCS character sets.");

    /// <summary>
    /// Creates a CharacterString from a .NET string using UTF-8 encoding.
    /// </summary>
    /// <param name="value">The string value.</param>
    /// <exception cref="ArgumentNullException">Thrown if <paramref name="value"/> is null.</exception>
    public CharacterString(string value)
    {
        ArgumentNullException.ThrowIfNull(value);
        _data = _utf8Data;
        Value = value;
    }

    /// <summary>
    /// Creates a CharacterString from a .NET string using the specified BACnet character set, excluding DBCS.
    /// </summary>
    /// <param name="value">The string value.</param>
    /// <param name="charSet">The BACnet character set to use.</param>
    /// <exception cref="ArgumentNullException">Thrown if <paramref name="value"/> is null.</exception>
    /// <exception cref="ArgumentOutOfRangeException">Thrown if DBCS is specified (use the codePage constructor instead).</exception>
    /// <exception cref="NotSupportedException">Thrown if the character set is not supported.</exception>
    public CharacterString(string value, CharacterSet charSet)
    {
        ArgumentNullException.ThrowIfNull(value);
        _data = charSet switch
        {
            CharacterSet.Utf8 => _utf8Data,
            CharacterSet.Ucs4 => _ucs4Data,
            CharacterSet.Ucs2 => _ucs2Data,
            CharacterSet.Iso => _isoData,
            CharacterSet.Dbcs => throw new ArgumentOutOfRangeException(nameof(charSet), "DBCS string cannot be created with this constructor."),
            CharacterSet.Jis => _jisData,
            _ => throw new NotSupportedException($"Unsupported character set: {charSet}"),
        };
        Value = value;
    }

    /// <summary>
    /// Creates a CharacterString from a .NET string using DBCS encoding with the specified code page.
    /// </summary>
    /// <param name="value">The string value.</param>
    /// <param name="codePage">The code page for DBCS encoding (must be between 0 and 65535).</param>
    /// <exception cref="ArgumentNullException">Thrown if <paramref name="value"/> is null.</exception>
    /// <exception cref="ArgumentOutOfRangeException">Thrown if <paramref name="codePage"/> is not between 0 and 65535.</exception>
    public CharacterString(string value, int codePage)
    {
        ArgumentNullException.ThrowIfNull(value);
        if (codePage < ushort.MinValue || codePage > ushort.MaxValue)
        {
            throw new ArgumentOutOfRangeException(nameof(codePage), $"Code page must be between {ushort.MinValue} and {ushort.MaxValue}.");
        }
        _data = [(byte)CharacterSet.Dbcs, (byte)(codePage >> 8), (byte)codePage];
        Value = value;
    }

    /// <summary>
    /// Creates a CharacterString from raw BACnet bytes.
    /// </summary>
    /// <param name="data">The raw BACnet bytes including the character set encoding identifier.</param>
    /// <exception cref="ArgumentException">Thrown if <paramref name="data"/> is empty or invalid for the specified character set.</exception>
    /// <exception cref="NotSupportedException">Thrown if the character set is not supported.</exception>
    public CharacterString(ReadOnlySpan<byte> data)
    {
        if (data.Length < 1)
        {
            throw new ArgumentException("Data must not be empty.", nameof(data));
        }
        Value = Encoder.GetString(data, out var charSet);
        _data = charSet switch
        {
            CharacterSet.Utf8 => _utf8Data,
            CharacterSet.Ucs4 => _ucs4Data,
            CharacterSet.Ucs2 => _ucs2Data,
            CharacterSet.Iso => _isoData,
            CharacterSet.Dbcs => data.Length >= 3 ? data.ToArray() : throw new ArgumentException("Data too short for DBCS character set.", nameof(data)),
            CharacterSet.Jis => data.ToArray(),
            _ => throw new NotSupportedException($"Unsupported character set: {charSet}")
        };
    }

    /// <summary>
    /// Gets the BACnet-encoded byte representation of this character string, including the charset identifier.
    /// </summary>
    /// <returns>A byte array containing the encoded character string data.</returns>
    public byte[] ToBytes()
    {
        if (Value.Length == 0)
        {
            return [.. _data];
        }

        if (CharSet == CharacterSet.Dbcs)
        {
            return Encoder.GetBytes(Value, CodePage);
        }

        return Encoder.GetBytes(Value, CharSet);
    }

    /// <summary>
    /// Copies the BACnet-encoded character string data to the destination span.
    /// </summary>
    /// <param name="destination">The destination span to copy the data to. Must be at least as large as the encoded data.</param>
    /// <exception cref="ArgumentException">Thrown when the destination span is too small.</exception>
    public void CopyTo(Span<byte> destination)
    {
        _data.CopyTo(destination);
    }

    /// <summary>
    /// Returns the charset identifier and, for JIS/DBCS created from BACnet bytes, the complete raw data as a read-only span.
    /// </summary>
    /// <returns>
    /// A read-only span containing the charset identifier (1 byte), optional code page (2 bytes for DBCS),
    /// and for JIS/DBCS created from raw BACnet bytes, the complete encoded character data.
    /// </returns>
    /// <remarks>
    /// <para>
    /// For JIS and DBCS character sets created from raw BACnet bytes, this returns the complete
    /// raw byte data including the charset identifier. This allows processing the original encoded
    /// bytes when the text encoding is not available or doesn't fully support the raw data.
    /// </para>
    /// <para>
    /// For CharacterStrings created from .NET strings, this only returns the charset identifier
    /// (1 byte for most encodings, 3 bytes for DBCS with code page). To get the full encoded
    /// representation, use <see cref="ToBytes"/> instead.
    /// </para>
    /// </remarks>
    public ReadOnlySpan<byte> AsSpan() => _data;

    /// <summary>
    /// Converts the CharacterString to its string representation.
    /// </summary>
    /// <returns>The decoded string value.</returns>
    public override string ToString() => Value;

    /// <summary>
    /// Implicitly converts a string to a CharacterString using UTF-8 encoding.
    /// </summary>
    /// <param name="value">The string value.</param>
    public static implicit operator CharacterString(string value) => new(value);
}
