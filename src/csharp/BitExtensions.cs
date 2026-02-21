// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

namespace Baclib.Bacnet.Types;

/// <summary>
/// Provides bit-testing extension methods for integer-based flag containers.
/// </summary>
/// <remarks>
/// All methods test bits using MSB-first ordering within each numeric value:
/// - For an 8-bit value (byte) bit index 0 maps to the most-significant bit (value 0x80),
///   index 7 maps to the least-significant bit (value 0x01).
/// - For wider integral types the same MSB-first mapping applies (index 0 -> highest-order bit).
/// These helpers throw <see cref="ArgumentOutOfRangeException"/> when the index is out of the
/// valid range for the target type.
/// </remarks>
public static class BitExtensions
{
    /// <summary>
    /// Returns whether the bit at the specified zero-based <paramref name="index"/> is set in the <paramref name="flags"/> byte.
    /// </summary>
    /// <param name="flags">The byte containing bit flags.</param>
    /// <param name="index">Zero-based bit index (0 = MSB, 7 = LSB).</param>
    /// <returns><see langword="true"/> if the bit is set; otherwise <see langword="false"/>.</returns>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when <paramref name="index"/> is less than 0 or greater than 7.
    /// </exception>
    public static bool GetBit(this byte flags, int index)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(index, 0, nameof(index));
        ArgumentOutOfRangeException.ThrowIfGreaterThan(index, 7, nameof(index));
        return (flags & (1 << (7 - index))) != 0;
    }

    /// <summary>
    /// Returns the numeric value (0 or 1) of the bit at the specified zero-based <paramref name="index"/> in the <paramref name="flags"/> ushort.
    /// </summary>
    /// <param name="flags">The 16-bit value containing bit flags.</param>
    /// <param name="index">Zero-based bit index (0 = MSB of the 16-bit value, 15 = LSB).</param>
    /// <returns>Byte value 1 when the bit is set, otherwise 0.</returns>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when <paramref name="index"/> is less than 0 or greater than 15.
    /// </exception>
    public static bool GetBit(this ushort flags, int index)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(index, 0, nameof(index));
        ArgumentOutOfRangeException.ThrowIfGreaterThan(index, 15, nameof(index));
        return (flags & (1 << (15 - index))) != 0;
    }

    /// <summary>
    /// Returns whether the bit at the specified zero-based <paramref name="index"/> is set in the <paramref name="flags"/> uint.
    /// </summary>
    /// <param name="flags">The 32-bit value containing bit flags.</param>
    /// <param name="index">Zero-based bit index (0 = MSB of the 32-bit value, 31 = LSB).</param>
    /// <returns><see langword="true"/> if the bit is set; otherwise <see langword="false"/>.</returns>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when <paramref name="index"/> is less than 0 or greater than 31.
    /// </exception>
    public static bool GetBit(this uint flags, int index)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(index, 0, nameof(index));
        ArgumentOutOfRangeException.ThrowIfGreaterThan(index, 31, nameof(index));
        return (flags & (1u << (31 - index))) != 0;
    }

    /// <summary>
    /// Returns whether the bit at the specified zero-based <paramref name="index"/> is set in the <paramref name="flags"/> ulong.
    /// </summary>
    /// <param name="flags">The 64-bit value containing bit flags.</param>
    /// <param name="index">Zero-based bit index (0 = MSB of the 64-bit value, 63 = LSB).</param>
    /// <returns><see langword="true"/> if the bit is set; otherwise <see langword="false"/>.</returns>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when <paramref name="index"/> is less than 0 or greater than 63.
    /// </exception>
    public static bool GetBit(this ulong flags, int index)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(index, 0, nameof(index));
        ArgumentOutOfRangeException.ThrowIfGreaterThan(index, 63, nameof(index));
        return (flags & (1ul << (63 - index))) != 0;
    }

    /// <summary>
    /// Returns a value that preserves only the least-significant <paramref name="count"/> bits of <paramref name="flags"/>.
    /// </summary>
    /// <param name="flags">The 64-bit value containing bit flags.</param>
    /// <param name="count">The number of least-significant bits to preserve. Valid range is 0 through 63.</param>
    /// <returns>
    /// A value composed of the low-order <paramref name="count"/> bits of <paramref name="flags"/>; bits more significant
    /// than that are cleared. If <paramref name="count"/> is zero, the method returns 0.
    /// </returns>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when <paramref name="count"/> is less than 0 or greater than 63.
    /// </exception>
    public static ulong MaskBits(this ulong flags, int count)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(count, 0, nameof(count));
        ArgumentOutOfRangeException.ThrowIfGreaterThan(count, 63, nameof(count));

        if (count < 64)
        {
            ulong mask = (1UL << count) - 1;
            return flags & mask;
        }
        return flags;
    }
}
