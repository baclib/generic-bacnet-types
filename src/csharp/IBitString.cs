namespace Baclib.Bacnet.Types;

/// <summary>
/// Represents a BACnet Bit String primitive data type as defined in ANSI/ASHRAE 135-2024 Clause 20.2.10.
/// </summary>
public interface IBitString : IReadOnlyCollection<bool>
{
    /// <summary>
    /// Gets the number of bits in this bit string.
    /// </summary>
    /// <value>The number of bits (0 to the maximum capacity of the implementation).</value>
    new int Count { get; }

    /// <summary>
    /// Gets the value of a bit at the specified index.
    /// Bits are indexed from 0 (LSB) to Count-1 (MSB within the used range).
    /// </summary>
    /// <param name="index">The zero-based bit index (0 to Count-1).</param>
    /// <returns><c>true</c> if the bit is set; otherwise, <c>false</c>.</returns>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when <paramref name="index"/> is negative or is out of range (0 to Count-1).</exception>
    bool this[int index] { get; }

    /// <summary>
    /// Converts a bit string to a string representation of '0' and '1' characters.
    /// Characters are ordered LSB first: from index 0 to Count-1, left to right.
    /// </summary>
    /// <typeparam name="T">The type implementing IBitString.</typeparam>
    /// <param name="bitString">The bit string to convert.</param>
    /// <returns>A string of '0' and '1' characters representing the bit string, or an empty string if Count is 0.</returns>
    static string ToString<T>(T bitString) where T : IBitString
    {
        if (bitString.Count == 0)
        {
            return string.Empty;
        }

        return string.Create(bitString.Count, bitString, static (chars, bits) =>
        {
            for (int i = 0; i < chars.Length; i++)
            {
                chars[i] = bits[i] ? '1' : '0';
            }
        });
    }

    /// <summary>
    /// Returns an enumerator that iterates through the bit string.
    /// Bits are enumerated from index 0 (LSB) to Count-1.
    /// </summary>
    /// <returns>An enumerator for the bit string.</returns>
    IEnumerator<bool> IEnumerable<bool>.GetEnumerator()
    {
        for (int i = 0; i < Count; i++)
        {
            yield return this[i];
        }
    }

    /// <inheritdoc/>
    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
    {
        return GetEnumerator();
    }
}
