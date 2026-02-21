// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

namespace Baclib.Bacnet.Types;

/// <summary>
/// Represents a BACnet Time value consisting of 4 octets: hour, minute, second, and hundredths of a second.
/// Defined in ANSI/ASHRAE 135-2024 Clause 20.2.13.
/// </summary>
/// <remarks>
/// Time provides a BACnet-compliant time representation that supports wildcard values (255) for unspecified
/// or pattern-matching fields. The hour field represents hours 0-23, minute 0-59, second 0-59, and
/// hundredths 0-99, with 255 indicating an unspecified value for any field.
/// This type can be converted to and from .NET TimeSpan, TimeOnly, and DateTime types for specific times.
/// </remarks>
public readonly record struct TimePattern
{
    /// <summary>
    /// Wildcard value indicating an unspecified or "any" field value.
    /// </summary>
    public const byte Wildcard = 255;

    /// <summary>
    /// Gets the hour field (0-23, 255 = unspecified).
    /// </summary>
    public byte Hour { get; }

    /// <summary>
    /// Gets a value indicating whether the hour field is within valid BACnet range.
    /// </summary>
    /// <remarks>Valid values are 0-23 (specific hours) or 255 (unspecified).</remarks>
    public bool IsHourValid => Hour is <= 23 or Wildcard;

    /// <summary>
    /// Gets a value indicating whether this time has a specific hour value (0-23).
    /// </summary>
    public bool IsHourSpecific => Hour <= 23;

    /// <summary>
    /// Gets a value indicating whether the hour is unspecified (wildcard value 255).
    /// </summary>
    public bool IsHourUnspecified => Hour == Wildcard;

    /// <summary>
    /// Gets the minute field (0-59, 255 = unspecified).
    /// </summary>
    public byte Minute { get; }

    /// <summary>
    /// Gets a value indicating whether the minute field is within valid BACnet range.
    /// </summary>
    /// <remarks>Valid values are 0-59 (specific minutes) or 255 (unspecified).</remarks>
    public bool IsMinuteValid => Minute is <= 59 or Wildcard;

    /// <summary>
    /// Gets a value indicating whether this time has a specific minute value (0-59).
    /// </summary>
    public bool IsMinuteSpecific => Minute <= 59;

    /// <summary>
    /// Gets a value indicating whether the minute is unspecified (wildcard value 255).
    /// </summary>
    public bool IsMinuteUnspecified => Minute == Wildcard;

    /// <summary>
    /// Gets the second field (0-59, 255 = unspecified).
    /// </summary>
    public byte Second { get; }

    /// <summary>
    /// Gets a value indicating whether the second field is within valid BACnet range.
    /// </summary>
    /// <remarks>Valid values are 0-59 (specific seconds) or 255 (unspecified).</remarks>
    public bool IsSecondValid => Second is <= 59 or Wildcard;

    /// <summary>
    /// Gets a value indicating whether this time has a specific second value (0-59).
    /// </summary>
    public bool IsSecondSpecific => Second <= 59;

    /// <summary>
    /// Gets a value indicating whether the second is unspecified (wildcard value 255).
    /// </summary>
    public bool IsSecondUnspecified => Second == Wildcard;

    /// <summary>
    /// Gets the hundredths of a second field (0-99, 255 = unspecified).
    /// </summary>
    public byte Hundredths { get; }

    /// <summary>
    /// Gets a value indicating whether the hundredths field is within valid BACnet range.
    /// </summary>
    /// <remarks>Valid values are 0-99 (specific hundredths) or 255 (unspecified).</remarks>
    public bool IsHundredthsValid => Hundredths is <= 99 or Wildcard;

    /// <summary>
    /// Gets a value indicating whether this time has a specific hundredths value (0-99).
    /// </summary>
    public bool IsHundredthsSpecific => Hundredths <= 99;

    /// <summary>
    /// Gets a value indicating whether the hundredths is unspecified (wildcard value 255).
    /// </summary>
    public bool IsHundredthsUnspecified => Hundredths == Wildcard;

    /// <summary>
    /// Gets a value indicating whether all time fields are within valid BACnet ranges.
    /// </summary>
    /// <remarks>Returns true if hour, minute, second, and hundredths fields all contain valid BACnet values.</remarks>
    public bool IsValid => IsHourValid && IsMinuteValid && IsSecondValid && IsHundredthsValid;

    /// <summary>
    /// Gets a value indicating whether this time represents a fully specified time with no wildcards.
    /// </summary>
    /// <remarks>Returns true only if all fields contain specific numeric values (not wildcards).</remarks>
    public bool IsSpecific => IsHourSpecific && IsMinuteSpecific && IsSecondSpecific && IsHundredthsSpecific;

    /// <summary>
    /// Gets a value indicating whether this time is completely unspecified with all fields set to wildcard.
    /// </summary>
    /// <remarks>Returns true only if hour, minute, second, and hundredths are all wildcard (255).</remarks>
    public bool IsUnspecified => IsHourUnspecified && IsMinuteUnspecified && IsSecondUnspecified && IsHundredthsUnspecified;

    /// <summary>
    /// Creates a BACnet Time from individual field values.
    /// </summary>
    /// <param name="hour">Hour value (0-23, 255 = unspecified).</param>
    /// <param name="minute">Minute value (0-59, 255 = unspecified).</param>
    /// <param name="second">Second value (0-59, 255 = unspecified).</param>
    /// <param name="hundredths">Hundredths of a second value (0-99, 255 = unspecified).</param>
    /// <remarks>No validation is performed on the input values.</remarks>
    public TimePattern(byte hour, byte minute, byte second, byte hundredths)
    {
        Hour = hour;
        Minute = minute;
        Second = second;
        Hundredths = hundredths;
    }

    /// <summary>
    /// Creates a BACnet Time from a .NET <see cref="TimeSpan"/> value.
    /// </summary>
    /// <param name="time">The TimeSpan to convert.</param>
    /// <exception cref="ArgumentOutOfRangeException">Thrown if the TimeSpan is negative or exceeds 23:59:59.99.</exception>
    public TimePattern(TimeSpan time)
    {
        if (time < TimeSpan.Zero || time >= TimeSpan.FromDays(1))
        {
            throw new ArgumentOutOfRangeException(nameof(time), "Time must be between 00:00:00.00 and 23:59:59.99.");
        }

        Hour = (byte)time.Hours;
        Minute = (byte)time.Minutes;
        Second = (byte)time.Seconds;
        Hundredths = (byte)(time.Milliseconds / 10);
    }

    /// <summary>
    /// Creates a BACnet Time from a .NET <see cref="TimeOnly"/> value.
    /// </summary>
    /// <param name="time">The TimeOnly to convert.</param>
    public TimePattern(TimeOnly time)
    {
        Hour = (byte)time.Hour;
        Minute = (byte)time.Minute;
        Second = (byte)time.Second;
        Hundredths = (byte)(time.Millisecond / 10);
    }

    /// <summary>
    /// Creates a BACnet Time from a .NET <see cref="DateTime"/> value (extracts time portion).
    /// </summary>
    /// <param name="dateTime">The DateTime to convert.</param>
    public TimePattern(System.DateTime dateTime)
    {
        Hour = (byte)dateTime.Hour;
        Minute = (byte)dateTime.Minute;
        Second = (byte)dateTime.Second;
        Hundredths = (byte)(dateTime.Millisecond / 10);
    }

    /// <summary>
    /// Creates a BACnet Time from raw BACnet bytes.
    /// </summary>
    /// <param name="data">A span containing at least 4 bytes representing the time.</param>
    /// <exception cref="ArgumentException">Thrown if the data span is less than 4 bytes.</exception>
    public TimePattern(ReadOnlySpan<byte> data)
    {
        if (data.Length < 4)
        {
            throw new ArgumentException("Data must contain at least 4 bytes.", nameof(data));
        }

        Hour = data[0];
        Minute = data[1];
        Second = data[2];
        Hundredths = data[3];
    }

    /// <summary>
    /// Writes the BACnet Time to a span of bytes.
    /// </summary>
    /// <param name="destination">The destination span to write the 4 bytes to.</param>
    /// <exception cref="ArgumentException">Thrown if the destination span is less than 4 bytes.</exception>
    public void WriteTo(Span<byte> destination)
    {
        if (destination.Length < 4)
        {
            throw new ArgumentException("Destination must have at least 4 bytes.", nameof(destination));
        }

        destination[0] = Hour;
        destination[1] = Minute;
        destination[2] = Second;
        destination[3] = Hundredths;
    }

    /// <summary>
    /// Converts the BACnet Time to a .NET <see cref="TimeSpan"/> if it represents a specific time.
    /// </summary>
    /// <returns>A TimeSpan if the time is specific; otherwise, null.</returns>
    public TimeSpan? ToTimeSpan()
    {
        if (IsSpecific)
        {
            return new TimeSpan(0, Hour, Minute, Second, Hundredths * 10);
        }

        return null;
    }

    /// <summary>
    /// Converts the BACnet Time to a .NET <see cref="TimeOnly"/> if it represents a specific time.
    /// </summary>
    /// <returns>A TimeOnly if the time is specific; otherwise, null.</returns>
    public TimeOnly? ToTimeOnly()
    {
        if (IsSpecific)
        {
            return new TimeOnly(Hour, Minute, Second, Hundredths * 10);
        }

        return null;
    }

    /// <summary>
    /// Returns a string representation of the BACnet Time.
    /// </summary>
    /// <returns>A string in the format "HH:MM:SS.hh" with wildcard indicators.</returns>
    /// <remarks>
    /// Wildcards are shown as "**".
    /// Example outputs: "14:30:15.50", "**:**:**.00", "09:30:**.**".
    /// </remarks>
    public override string ToString()
    {
        var hourStr = Hour == Wildcard ? "**" : Hour.ToString("D2");
        var minuteStr = Minute == Wildcard ? "**" : Minute.ToString("D2");
        var secondStr = Second == Wildcard ? "**" : Second.ToString("D2");
        var hundredthsStr = Hundredths == Wildcard ? "**" : Hundredths.ToString("D2");

        return $"{hourStr}:{minuteStr}:{secondStr}.{hundredthsStr}";
    }

    /// <summary>
    /// Implicitly converts a .NET TimeSpan to a BACnet Time.
    /// </summary>
    /// <param name="time">The TimeSpan to convert.</param>
    public static implicit operator TimePattern(TimeSpan time) => new(time);

    /// <summary>
    /// Implicitly converts a .NET TimeOnly to a BACnet Time.
    /// </summary>
    /// <param name="time">The TimeOnly to convert.</param>
    public static implicit operator TimePattern(TimeOnly time) => new(time);
}
