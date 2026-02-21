// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

namespace Baclib.Bacnet.Types;

/// <summary>
/// Represents a BACnet Null value, a distinct primitive type with no associated data.
/// Defined in ANSI/ASHRAE 135-2024 Clause 20.2.2.
/// </summary>
/// <remarks>
/// BACnet Null is encoded as a context/application tag with zero-length content.
/// All instances of Null are semantically equivalent. Use <see cref="Value"/> to reference the singleton instance.
/// </remarks>
public readonly record struct Null
{
    /// <summary>
    /// Gets the singleton BACnet Null value.
    /// </summary>
    public static Null Value { get; } = default;

    /// <summary>
    /// Returns a string representation of the BACnet Null value.
    /// </summary>
    /// <returns>The string "Null".</returns>
    public override string ToString() => "Null";
}
