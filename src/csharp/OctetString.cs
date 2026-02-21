// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

namespace Baclib.Bacnet.Types;

/// <summary>
/// Represents a BACnet OctetString value, an ordered sequence of bytes.
/// Defined in ANSI/ASHRAE 135-2024 Clause 20.2.8.
/// </summary>
/// <remarks>
/// OctetString provides an immutable wrapper around a byte array with type safety and convenience methods.
/// The data is copied on construction to ensure immutability. Use this type for BACnet octet string values
/// such as UUIDs, MAC addresses, or arbitrary binary data.
/// </remarks>
public readonly record struct OctetString
{
    /// <summary>
    /// The underlying byte array containing the octet string data.
    /// Always initialized to a valid array (never null).
    /// </summary>
    private readonly byte[] _data = [];

    /// <summary>
    /// Gets the empty OctetString with zero length.
    /// </summary>
    public static OctetString Empty { get; } = new([]);

    /// <summary>
    /// Gets the length of the octet string in bytes.
    /// </summary>
    public int Length => _data.Length;

    /// <summary>
    /// Gets a value indicating whether the octet string is empty (length is zero).
    /// </summary>
    public bool IsEmpty => Length == 0;

    /// <summary>
    /// Gets the byte at the specified index.
    /// </summary>
    /// <param name="index">The zero-based index of the byte to retrieve.</param>
    /// <returns>The byte at the specified index.</returns>
    /// <exception cref="ArgumentOutOfRangeException">Thrown if the index is out of range.</exception>
    public byte this[int index]
    {
        get
        {
            if (index < 0 || index >= _data.Length)
            {
                throw new ArgumentOutOfRangeException(nameof(index));
            }
            return _data[index];
        }
    }

    /// <summary>
    /// Creates a BACnet OctetString from a read-only span of bytes.
    /// </summary>
    /// <param name="data">The byte span to copy.</param>
    public OctetString(ReadOnlySpan<byte> data)
    {
        _data = [.. data];
    }

    /// <summary>
    /// Creates a BACnet OctetString from a byte array.
    /// </summary>
    /// <param name="data">The byte array to wrap. The data is copied to ensure immutability.</param>
    /// <exception cref="ArgumentNullException">Thrown if <paramref name="data"/> is null.</exception>
    public OctetString(byte[] data)
    {
        ArgumentNullException.ThrowIfNull(data);
        _data = [.. data];
    }

    /// <summary>
    /// Creates a BACnet OctetString from a hexadecimal string representation.
    /// </summary>
    /// <param name="hexString">A hexadecimal string (e.g., "48656C6C6F").</param>
    /// <returns>A OctetString containing the decoded bytes.</returns>
    /// <exception cref="ArgumentNullException">Thrown if <paramref name="hexString"/> is null.</exception>
    /// <exception cref="FormatException">Thrown if the <paramref name="hexString"/> is invalid.</exception>
    public static OctetString FromHex(string hexString)
    {
        ArgumentNullException.ThrowIfNull(hexString);
        return new(Convert.FromHexString(hexString));
    }

    /// <summary>
    /// Returns the octet string as a read-only span of bytes.
    /// </summary>
    /// <returns>A read-only span containing the bytes.</returns>
    public ReadOnlySpan<byte> AsSpan() => _data;

    /// <summary>
    /// Returns a copy of the octet string as a byte array.
    /// </summary>
    /// <returns>A new byte array containing a copy of the data.</returns>
    public byte[] ToArray() => [.. _data];

    /// <summary>
    /// Converts the octet string to a hexadecimal string representation.
    /// </summary>
    /// <returns>A hexadecimal string (e.g., "48656C6C6F").</returns>
    public string ToHexString() => Convert.ToHexString(_data);

    /// <summary>
    /// Copies the octet string data to the destination span.
    /// </summary>
    /// <param name="destination">The destination span to copy the data to. Must be at least <see cref="Length"/> bytes in size.</param>
    /// <exception cref="ArgumentException">Thrown when the destination span is too small.</exception>
    public void CopyTo(Span<byte> destination)
    {
        _data.AsSpan().CopyTo(destination);
    }

    /// <summary>
    /// Returns a string representation of the BACnet OctetString.
    /// </summary>
    /// <returns>A string showing the hexadecimal content (truncated if longer than 60 characters).</returns>
    public override string ToString()
    {
        if (_data.Length == 0)
        {
            return string.Empty;
        }

        var hexString = Convert.ToHexString(_data);
        return hexString.Length > 60 ? hexString[..60] + "..." : hexString;
    }
}
