// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

namespace Baclib.Bacnet.Types;

/// <summary>
/// Represents a BACnet Bit String primitive data type as defined in ANSI/ASHRAE 135-2024 Clause 20.2.10.
/// This implementation supports up to 32 bits which are stored in a <see cref="uint"/>, while the bit
/// count is stored in a single <see cref="byte"/>.
/// </summary>
/// <remarks>
/// <strong>Important:</strong> This type stores the bits in system-native format (LSB-first ordering),
/// which is <em>not</em> the same as the BACnet ASN.1 encoded wire format (MSB-first). Encoding and
/// decoding operations must perform bit order conversion when serializing to/from BACnet protocol data.
/// </remarks>
public readonly record struct BitString32 : IBitString
{
    /// <summary>
    /// The number of bits in this bit string.
    /// </summary>
    private readonly byte _count;

    /// <summary>
    /// Gets the number of bits in this bit string.
    /// </summary>
    public int Count => _count;

    /// <summary>
    /// Gets the underlying 32-bit unsigned integer containing the bits in system-native format.
    /// Only the lower <see cref="Count"/> bits are used; higher bits are always zero.
    /// </summary>
    public uint Flags { get; }

    /// <summary>
    /// Initializes a new instance of the <see cref="BitString32"/> struct.
    /// </summary>
    /// <param name="flags">The 32-bit unsigned integer containing the bits in system-native format (LSB-first).</param>
    /// <param name="count">The number of bits to use (0-32). Bits beyond this count will be masked to zero.</param>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when <paramref name="count"/> is greater than 32.</exception>
    public BitString32(uint flags, byte count)
    {
        ArgumentOutOfRangeException.ThrowIfGreaterThan(count, 32, nameof(count));
        _count = count;

        // Mask to keep only the used bits in system-native format (count bits from LSB to MSB)
        uint mask = count == 32 ? 0xFFFFFFFF : (1u << count) - 1;
        Flags = flags & mask;
    }

    /// <inheritdoc/>
    public bool this[int index]
    {
        get
        {
            ArgumentOutOfRangeException.ThrowIfNegative(index, nameof(index));
            ArgumentOutOfRangeException.ThrowIfGreaterThanOrEqual(index, Count, nameof(index));
            return (Flags & (1u << index)) != 0;
        }
    }

    /// <summary>
    /// Converts the bit string to a string representation of '0' and '1' characters.
    /// Characters are ordered LSB first: from index 0 to Count-1, left to right.
    /// </summary>
    /// <returns>A string of '0' and '1' characters representing the bit string, or an empty string if Count is 0.</returns>
    public override string ToString() => IBitString.ToString(this);
}