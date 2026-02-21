// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

namespace Baclib.Bacnet.Types;

/// <summary>
/// Represents a BACnet Object Identifier consisting of an object type and instance number.
/// Defined in ANSI/ASHRAE 135-2024 Clause 20.2.14.
/// </summary>
/// <remarks>
/// The ObjectIdentifier is stored internally as a single 32-bit unsigned integer value
/// with the following bit layout:
/// - Bits 22-31: Object type (10 bits, values 0-1023)
/// - Bits 0-21: Instance number (22 bits, values 0-4194303)
/// This design ensures efficient memory usage (4 bytes) and aligns with the BACnet wire format.
/// </remarks>
public readonly record struct ObjectIdentifier
{
    /// <summary>
    /// Maximum allowed instance number (2^22 - 1 = 4194303).
    /// </summary>
    public const uint MaxInstanceNumber = 0x3FFFFF;

    /// <summary>
    /// Maximum allowed object type value (2^10 - 1 = 1023).
    /// </summary>
    public const ObjectType MaxObjectType = (ObjectType)0x3FF;

    /// <summary>
    /// Gets the encoded 32-bit value containing both object type and instance number.
    /// </summary>
    public uint Value { get; }

    /// <summary>
    /// Gets the BACnet object type extracted from bits 22-31.
    /// </summary>
    public ObjectType Type => (ObjectType)(Value >> 22);

    /// <summary>
    /// Gets the object instance number extracted from bits 0-21 (0-4194303).
    /// </summary>
    public uint Instance => Value & MaxInstanceNumber;

    /// <summary>
    /// Creates a BACnet Object Identifier from an object type and instance number.
    /// </summary>
    /// <param name="type">The BACnet object type (0-1023).</param>
    /// <param name="instance">The object instance number (0-4194303).</param>
    /// <exception cref="ArgumentOutOfRangeException">Thrown when type exceeds 1023 or instance exceeds 4194303.</exception>
    public ObjectIdentifier(ObjectType type, uint instance)
    {
        ArgumentOutOfRangeException.ThrowIfGreaterThan((uint)type, (uint)MaxObjectType, nameof(type));
        ArgumentOutOfRangeException.ThrowIfGreaterThan(instance, MaxInstanceNumber, nameof(instance));
        Value = ((uint)type << 22) | instance;
    }

    /// <summary>
    /// Creates a BACnet Object Identifier from an encoded 32-bit value.
    /// </summary>
    /// <param name="value">The encoded 32-bit value containing both type and instance.</param>
    public ObjectIdentifier(uint value)
    {
        Value = value;
    }

    /// <summary>
    /// Returns a string representation of the object identifier.
    /// </summary>
    /// <returns>A string in the format "ObjectType:Instance" (e.g., "AnalogInput:42").</returns>
    public override string ToString()
    {
        return $"{Type}:{Instance}";
    }
}
