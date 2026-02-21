// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

using System.Buffers.Binary;
using System.Collections.Concurrent;
using TextEncoding = System.Text.Encoding;

namespace Baclib.Bacnet.Types;

/// <summary>
/// Provides encoding and decoding functionality for BACnet character strings.
/// Supports UTF-8, UCS-2, UCS-4, ISO-8859-1, JIS X 0208, and DBCS character sets.
/// This class is thread-safe.
/// </summary>
/// <remarks>
/// <para>
/// <b>Extensibility:</b> Inherit from this class to customize character encoding behavior.
/// Override <see cref="JisX0208Encoding"/> to use a different JIS encoding,
/// or override <see cref="GetString"/> for complete control over decoding logic.
/// </para>
/// <para>
/// <b>Thread Safety:</b> All public methods are thread-safe and can be called concurrently.
/// The internal DBCS encoding cache uses <see cref="System.Collections.Concurrent.ConcurrentDictionary{TKey, TValue}"/>
/// for safe concurrent access.
/// </para>
/// <para>
/// <b>Usage:</b> Use <see cref="Default"/> for standard encoding, or create a custom instance
/// and assign it to <see cref="CharacterString.Encoder"/> during application startup.
/// </para>
/// </remarks>
/// <example>
/// <code>
/// // Custom encoder with different JIS encoding
/// public class CustomEncoder : CharacterEncoder
/// {
///     protected override TextEncoding JisX0208Encoding => GetDbcsEncoding(20932); // EUC-JP
/// }
/// 
/// // Configure at startup
/// CharacterString.Encoder = new CustomEncoder();
/// </code>
/// </example>
public class CharacterEncoder
{
    /// <summary>
    /// Gets the default character encoder instance.
    /// </summary>
    public static CharacterEncoder Default { get; } = new();

    /// <summary>
    /// UTF-8 encoding instance.
    /// </summary>
    private static readonly TextEncoding _utf8Encoding = TextEncoding.UTF8;

    /// <summary>
    /// UCS-2 (Big Endian Unicode) encoding instance.
    /// </summary>
    private static readonly TextEncoding _ucs2Encoding = TextEncoding.BigEndianUnicode;

    /// <summary>
    /// UCS-4 (UTF-32) encoding instance.
    /// </summary>
    private static readonly TextEncoding _ucs4Encoding = TextEncoding.UTF32;

    /// <summary>
    /// ISO-8859-1 (Latin-1) encoding instance.
    /// </summary>
    private static readonly TextEncoding _isoEncoding = TextEncoding.Latin1;

    /// <summary>
    /// Cache for DBCS encodings, indexed by code page.
    /// Thread-safe cache using ConcurrentDictionary.
    /// </summary>
    private readonly ConcurrentDictionary<int, TextEncoding> _dbcsEncodings = new();

    /// <summary>
    /// Gets the JIS X 0208 (Shift-JIS) encoding instance.
    /// Default uses code page 932.
    /// </summary>
    /// <remarks>
    /// Override this property in derived classes to use a different JIS encoding.
    /// Common alternatives include:
    /// <list type="bullet">
    /// <item><description>932 - Shift-JIS (default)</description></item>
    /// <item><description>20932 - EUC-JP</description></item>
    /// <item><description>50220 - ISO-2022-JP</description></item>
    /// </list>
    /// </remarks>
    protected virtual TextEncoding JisX0208Encoding => GetDbcsEncoding(932);

    /// <summary>
    /// Gets or creates a DBCS encoding for the specified code page.
    /// Encodings are cached to avoid repeated creation. This method is thread-safe.
    /// </summary>
    /// <param name="codePage">The code page number.</param>
    /// <returns>The encoding instance for the specified code page.</returns>
    /// <exception cref="ArgumentException">Thrown if the code page is not supported.</exception>
    public TextEncoding GetDbcsEncoding(int codePage)
    {
        return _dbcsEncodings.GetOrAdd(codePage, static cp => TextEncoding.GetEncoding(cp));
    }

    /// <summary>
    /// Decodes a BACnet character string from raw bytes.
    /// </summary>
    /// <param name="data">The raw BACnet bytes including the character set encoding identifier.</param>
    /// <param name="charSet">Outputs the character set detected from the data.</param>
    /// <returns>The decoded string value.</returns>
    /// <exception cref="ArgumentException">Thrown if <paramref name="data"/> is empty or invalid for the specified character set.</exception>
    /// <exception cref="NotSupportedException">Thrown if the character set is not supported.</exception>
    public virtual string GetString(ReadOnlySpan<byte> data, out CharacterSet charSet)
    {
        if (data.Length < 1)
        {
            throw new ArgumentException("Data must not be empty.", nameof(data));
        }
        charSet = (CharacterSet)data[0];
        switch (charSet)
        {
            case CharacterSet.Utf8:
                return _utf8Encoding.GetString(data[1..]);
            case CharacterSet.Ucs4:
                return _ucs4Encoding.GetString(data[1..]);
            case CharacterSet.Ucs2:
                return _ucs2Encoding.GetString(data[1..]);
            case CharacterSet.Iso:
                return _isoEncoding.GetString(data[1..]);
            case CharacterSet.Dbcs:
                if (data.Length < 3)
                {
                    throw new ArgumentException("Data must include code page bytes.", nameof(data));
                }
                var codePage = BinaryPrimitives.ReadUInt16BigEndian(data[1..3]);
                var encoding = GetDbcsEncoding(codePage);
                return encoding.GetString(data[3..]);
            case CharacterSet.Jis:
                return JisX0208Encoding.GetString(data[1..]);
            default:
                throw new NotSupportedException($"Unsupported character set: {charSet}");
        }
    }

    /// <summary>
    /// Encodes the specified string into a byte array using the given character set, prefixing the result with a byte
    /// that identifies the character set.
    /// </summary>
    /// <remarks>The returned byte array always begins with a single byte indicating the character set used
    /// for encoding. Supported character sets include UTF-8, UCS-2, UCS-4, ISO, and JIS. DBCS is not supported and will
    /// result in an exception.</remarks>
    /// <param name="value">The string value to encode. Cannot be null.</param>
    /// <param name="charSet">The character set to use for encoding the string. Determines the encoding format and the prefix byte.</param>
    /// <returns>A byte array containing the character set identifier followed by the encoded bytes of the input string.</returns>
    /// <exception cref="NotImplementedException">Thrown if <paramref name="charSet"/> is <see cref="CharacterSet.Dbcs"/>, as DBCS encoding is not implemented.</exception>
    /// <exception cref="NotSupportedException">Thrown if <paramref name="charSet"/> specifies an unsupported character set.</exception>
    public byte[] GetBytes(string value, CharacterSet charSet)
    {
        ArgumentNullException.ThrowIfNull(value);

        var encoding = charSet switch
        {
            CharacterSet.Utf8 => _utf8Encoding,
            CharacterSet.Ucs4 => _ucs4Encoding,
            CharacterSet.Ucs2 => _ucs2Encoding,
            CharacterSet.Iso => _isoEncoding,
            CharacterSet.Jis => JisX0208Encoding,
            CharacterSet.Dbcs => throw new NotImplementedException("DBCS encoding with custom code page is not implemented in this method."),
            _ => throw new NotSupportedException($"Unsupported character set: {charSet}")
        };

        var encodedBytes = encoding.GetBytes(value);
        var result = new byte[encodedBytes.Length + 1];
        result[0] = (byte)charSet;
        encodedBytes.CopyTo(result, 1);
        return result;
    }

    /// <summary>
    /// Encodes the specified string into a byte array using the given code page, prefixing the result with a header
    /// that identifies the character set and code page.
    /// </summary>
    /// <remarks>The returned byte array begins with a three-byte header: the first byte indicates the
    /// character set, and the next two bytes specify the code page in big-endian format. The remainder of the array
    /// contains the encoded representation of the input string using the specified code page.</remarks>
    /// <param name="value">The string to encode. Cannot be null.</param>
    /// <param name="codePage">The code page identifier to use for encoding the string. Must correspond to a supported DBCS code page.</param>
    /// <returns>A byte array containing a header with the character set and code page information, followed by the encoded bytes
    /// of the input string.</returns>
    public byte[] GetBytes(string value, int codePage)
    {
        ArgumentNullException.ThrowIfNull(value);
        var encoding = GetDbcsEncoding(codePage);
        var codePageBytes = new byte[3];
        codePageBytes[0] = (byte)CharacterSet.Dbcs;
        BinaryPrimitives.WriteUInt16BigEndian(codePageBytes.AsSpan(1), (ushort)codePage);
        var dbcsBytes = encoding.GetBytes(value);
        return [.. codePageBytes, .. dbcsBytes];
    }
}
