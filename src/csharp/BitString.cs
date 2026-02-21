// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

namespace Baclib.Bacnet.Types;

/// <summary>
/// Represents a BACnet BitString primitive data type as defined in ANSI/ASHRAE 135-2024 Clause 20.2.10.
/// </summary>
/// <remarks>
/// A BitString is a sequence of zero or more bits, each of which can be independently set to 0 or 1.
/// BitStrings are commonly used in BACnet to represent status flags, configuration options, and bit-mapped values.
/// </remarks>
public readonly record struct BitString
{
    /// <summary>
    /// Shared empty bit string data to avoid allocations for empty instances.
    /// </summary>
    public static readonly byte[] EmptyData = [0];

    /// <summary>
    /// The raw BACnet-encoded data array.
    /// Format: First byte contains unused bits count (0-7), followed by bit data bytes.
    /// Empty bit string is represented as a single byte with value 0.
    /// </summary>
    private readonly byte[] _data = EmptyData;

    /// <summary>
    /// Creates a new BACnet-encoded data array for the specified bit count.
    /// </summary>
    /// <param name="bitCount">The number of bits to allocate.</param>
    /// <returns>A byte array with the first byte set to the unused bits count and remaining bytes zeroed.</returns>
    private static byte[] CreateData(int bitCount)
    {
        var byteCount = (bitCount + 7) / 8;
        var unusedBits = (8 - (bitCount % 8)) % 8;
        var data = new byte[byteCount + 1];
        data[0] = (byte)unusedBits;
        return data;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="BitString"/> class with the specified bit count.
    /// </summary>
    /// <param name="bitCount">The number of bits in the bit string.</param>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when bitCount is negative.</exception>
    public BitString(int bitCount)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(bitCount, 0, nameof(bitCount));

        _data = bitCount > 0 ? CreateData(bitCount) : EmptyData;
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="BitString"/> class from a boolean array.
    /// </summary>
    /// <param name="bits">The boolean array where true represents 1 and false represents 0.</param>
    /// <exception cref="ArgumentNullException">Thrown when bits is null.</exception>
    public BitString(bool[] bits)
    {
        ArgumentNullException.ThrowIfNull(bits);

        if (bits.Length == 0)
        {
            _data = EmptyData;
            return;
        }

        _data = CreateData(bits.Length);
        // Set bits MSB-first: array index 0 maps to MSB of first byte
        for (var i = 0; i < bits.Length; i++)
        {
            SetBit(i, bits[i]);
        }
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="BitString"/> class from BACnet-encoded data.
    /// </summary>
    /// <param name="source">The BACnet-encoded bit string data.</param>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when source is empty, unused bits count exceeds 7, or empty bit string has non-zero unused bits.
    /// </exception>
    public BitString(ReadOnlySpan<byte> source)
    {
        ArgumentOutOfRangeException.ThrowIfZero(source.Length, nameof(source));

        var unusedBits = source[0];
        ArgumentOutOfRangeException.ThrowIfGreaterThan(unusedBits, 7, nameof(source));

        if (source.Length == 1)
        {
            ArgumentOutOfRangeException.ThrowIfNotEqual(unusedBits, 0, nameof(source));
            _data = EmptyData;
            return;
        }

        _data = source.ToArray();
    }

    /// <summary>
    /// Gets an empty bit string (length 0).
    /// </summary>
    public static BitString Empty { get; } = new BitString(0);

    /// <summary>
    /// Gets the number of bits in this bit string.
    /// </summary>
    public int Length
    {
        get
        {
            if (_data.Length == 1)
            {
                return 0;
            }
            var byteCount = _data.Length - 1;
            var unusedBits = _data[0];
            return (byteCount * 8) - unusedBits;
        }
    }

    /// <summary>
    /// Gets a value indicating whether this bit string is empty (length 0).
    /// </summary>
    public bool IsEmpty => _data.Length == 1;

    /// <summary>
    /// Calculates the byte index and bit mask for a given bit position.
    /// </summary>
    /// <param name="bitIndex">The zero-based bit position.</param>
    /// <param name="byteIndex">Outputs the byte index in the data array (offset by 1 to skip unused bits count byte).</param>
    /// <param name="bitMask">Outputs the bit mask with a single bit set at the target position.</param>
    /// <remarks>
    /// Uses MSB-first bit ordering within each byte (bit 0 = MSB at position 7, bit 7 = LSB at position 0).
    /// </remarks>
    private static void CalculateIndexMask(int bitIndex, out int byteIndex, out int bitMask)
    {
        byteIndex = 1 + (bitIndex / 8);
        bitMask = 1 << (7 - (bitIndex % 8));  // MSB-first: bit 0 maps to position 7
    }

    /// <summary>
    /// Gets the value of a bit at the specified index without bounds checking.
    /// </summary>
    /// <param name="bitIndex">The zero-based bit position.</param>
    /// <returns>True if the bit is set (1), false otherwise (0).</returns>
    /// <remarks>
    /// Bits are indexed MSB-first within each byte according to BACnet specification.
    /// </remarks>
    private bool GetBit(int bitIndex)
    {
        CalculateIndexMask(bitIndex, out var byteIndex, out var bitMask);
        return (_data[byteIndex] & bitMask) != 0;
    }

    /// <summary>
    /// Sets the value of a bit at the specified index without bounds checking.
    /// </summary>
    /// <param name="bitIndex">The zero-based bit position.</param>
    /// <param name="value">True to set the bit (1), false to clear it (0).</param>
    /// <remarks>
    /// Bits are indexed MSB-first within each byte according to BACnet specification.
    /// </remarks>
    private void SetBit(int bitIndex, bool value)
    {
        CalculateIndexMask(bitIndex, out var byteIndex, out var bitMask);
        if (value)
        {
            _data[byteIndex] |= (byte)bitMask;
        }
        else
        {
            _data[byteIndex] &= (byte)~bitMask;
        }
    }

    /// <summary>
    /// Gets or sets the bit at the specified index.
    /// </summary>
    /// <param name="index">The zero-based index of the bit to get or set.</param>
    /// <returns>True if the bit is set (1), false otherwise (0).</returns>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when index is negative or greater than or equal to Length.
    /// </exception>
    public bool this[int index]
    {
        get
        {
            ArgumentOutOfRangeException.ThrowIfNegative(index);
            ArgumentOutOfRangeException.ThrowIfGreaterThanOrEqual(index, Length);

            return GetBit(index);
        }
        set
        {
            ArgumentOutOfRangeException.ThrowIfNegative(index);
            ArgumentOutOfRangeException.ThrowIfGreaterThanOrEqual(index, Length);

            SetBit(index, value);
        }
    }

    /// <summary>
    /// Gets all bits as a boolean array.
    /// </summary>
    /// <returns>A boolean array where true represents 1 and false represents 0.</returns>
    public bool[] GetBits()
    {
        if (Length == 0)
        {
            return [];
        }

        var result = new bool[Length];
        for (var i = 0; i < result.Length; i++)
        {
            result[i] = GetBit(i);
        }

        return result;
    }

    /// <summary>
    /// Returns the bit data bytes as a read-only span (excluding the unused bits count byte).
    /// </summary>
    /// <returns>A read-only span containing the bytes.</returns>
    public ReadOnlySpan<byte> AsSpan()
    {
        if (_data.Length == 1)
        {
            return [];
        }
        return _data.AsSpan(1);
    }

    /// <summary>
    /// Returns a string representation of this bit string.
    /// </summary>
    /// <returns>A string containing only '0' and '1' characters representing the bits.</returns>
    public override string ToString()
    {
        if (Length == 0)
        {
            return "";
        }

        return string.Create(Length, this, static (span, bitString) =>
        {
            for (var i = 0; i < span.Length; i++)
            {
                span[i] = bitString.GetBit(i) ? '1' : '0';
            }
        });
    }

    /// <summary>
    /// Copies the BACnet-encoded bit string data to the destination span.
    /// </summary>
    /// <param name="destination">The destination span to copy the data to. Must be at least <see cref="Length"/> bytes in size.</param>
    /// <exception cref="ArgumentException">Thrown when the destination span is too small.</exception>
    public void CopyTo(Span<byte> destination)
    {
        _data.AsSpan().CopyTo(destination);
    }
}
