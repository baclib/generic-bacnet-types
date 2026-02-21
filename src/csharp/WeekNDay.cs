// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

namespace Baclib.Bacnet.Types;

/// <summary>
/// Represents a BACnet WeekNDay value consisting of 3 octets: month, week, and day-of-week.
/// Used for scheduling recurring events (e.g., "second Tuesday of March").
/// Supports BACnet wildcard values (255) for unspecified fields.
/// </summary>
public readonly struct WeekNDay : IEquatable<WeekNDay>
{
    /// <summary>
    /// Wildcard value indicating an unspecified or "any" field value.
    /// </summary>
    public const byte Wildcard = 255;

    /// <summary>
    /// Special value for Month indicating odd months (1, 3, 5, 7, 9, 11).
    /// </summary>
    public const byte OddMonth = 13;

    /// <summary>
    /// Special value for Month indicating even months (2, 4, 6, 8, 10, 12).
    /// </summary>
    public const byte EvenMonth = 14;

    /// <summary>
    /// Week value for days numbered 1-7 of the month.
    /// </summary>
    public const byte Week1 = 1;

    /// <summary>
    /// Week value for days numbered 8-14 of the month.
    /// </summary>
    public const byte Week2 = 2;

    /// <summary>
    /// Week value for days numbered 15-21 of the month.
    /// </summary>
    public const byte Week3 = 3;

    /// <summary>
    /// Week value for days numbered 22-28 of the month.
    /// </summary>
    public const byte Week4 = 4;

    /// <summary>
    /// Week value for days numbered 29-31 of the month.
    /// </summary>
    public const byte Week5 = 5;

    /// <summary>
    /// Week value for the last 7 days of the month.
    /// </summary>
    public const byte LastWeek = 6;

    /// <summary>
    /// Week value for any of the 7 days prior to the last 7 days of the month.
    /// </summary>
    public const byte Week7DaysPriorToLast7 = 7;

    /// <summary>
    /// Week value for any of the 7 days prior to the last 14 days of the month.
    /// </summary>
    public const byte Week7DaysPriorToLast14 = 8;

    /// <summary>
    /// Week value for any of the 7 days prior to the last 21 days of the month.
    /// </summary>
    public const byte Week7DaysPriorToLast21 = 9;

    /// <summary>
    /// Gets the month field (1-12 = Jan-Dec, 13 = odd, 14 = even, 255 = any).
    /// </summary>
    public byte Month { get; }

    /// <summary>
    /// Gets the week of month field (1-9, 6 = last week, 7-9 = days prior to last weeks, 255 = any).
    /// </summary>
    public byte Week { get; }

    /// <summary>
    /// Gets the day of week field (1-7 = Mon-Sun, 255 = any).
    /// </summary>
    public byte DayOfWeek { get; }

    /// <summary>
    /// Gets a value indicating whether this value contains any wildcard fields.
    /// </summary>
    public bool HasWildcards => Month == Wildcard || Week == Wildcard || DayOfWeek == Wildcard;

    /// <summary>
    /// Gets a value indicating whether this represents a specific recurring event (no wildcards or special values).
    /// </summary>
    public bool IsSpecific => Month is >= 1 and <= 12 && Week is >= 1 and <= 9 && DayOfWeek is >= 1 and <= 7;

    /// <summary>
    /// Gets a value indicating whether all fields contain valid values according to the BACnet specification.
    /// </summary>
    /// <remarks>
    /// Valid values are:
    /// - Month: 1-14, 255
    /// - Week: 1-9, 255
    /// - DayOfWeek: 1-7, 255
    /// </remarks>
    public bool IsValid =>
        (Month is (>= 1 and <= 14 or Wildcard)) &&
        (Week is (>= 1 and <= 9 or Wildcard)) &&
        (DayOfWeek is (>= 1 and <= 7 or Wildcard));

    /// <summary>
    /// Creates a BACnet WeekNDay from individual field values.
    /// </summary>
    /// <param name="month">Month value (1-12 = Jan-Dec, 13 = odd, 14 = even, 255 = any).</param>
    /// <param name="week">Week of month value (1-9, 6 = last week, 7-9 = days prior to last weeks, 255 = any).</param>
    /// <param name="dayOfWeek">Day of week value (1-7 = Mon-Sun, 255 = any).</param>
    public WeekNDay(byte month, byte week, byte dayOfWeek)
    {
        Month = month;
        Week = week;
        DayOfWeek = dayOfWeek;
    }

    /// <summary>
    /// Creates a BACnet WeekNDay from raw BACnet bytes.
    /// </summary>
    /// <param name="data">A span containing at least 3 bytes representing the WeekNDay.</param>
    /// <exception cref="ArgumentException">Thrown if the data span is less than 3 bytes.</exception>
    public WeekNDay(ReadOnlySpan<byte> data)
    {
        if (data.Length < 3)
        {
            throw new ArgumentException("Data must contain at least 3 bytes.", nameof(data));
        }

        Month = data[0];
        Week = data[1];
        DayOfWeek = data[2];
    }

    /// <summary>
    /// Returns a string representation of the BACnet WeekNDay.
    /// </summary>
    /// <returns>A human-readable string describing the recurring event.</returns>
    public override string ToString()
    {
        var monthStr = Month switch
        {
            Wildcard => "any month",
            OddMonth => "odd months",
            EvenMonth => "even months",
            >= 1 and <= 12 => new System.DateTime(2000, Month, 1).ToString("MMMM"),
            _ => $"Month({Month})"
        };

        var weekStr = Week switch
        {
            Wildcard => "any week",
            Week1 => "days 1-7",
            Week2 => "days 8-14",
            Week3 => "days 15-21",
            Week4 => "days 22-28",
            Week5 => "days 29-31",
            LastWeek => "last 7 days",
            Week7DaysPriorToLast7 => "7 days prior to last 7 days",
            Week7DaysPriorToLast14 => "7 days prior to last 14 days",
            Week7DaysPriorToLast21 => "7 days prior to last 21 days",
            _ => $"Week({Week})"
        };

        var dayStr = DayOfWeek switch
        {
            Wildcard => "any day",
            >= 1 and <= 7 => ((DayOfWeek)(DayOfWeek == 7 ? 0 : DayOfWeek)).ToString(),
            _ => $"Day({DayOfWeek})"
        };

        return $"{weekStr} of {monthStr}, {dayStr}";
    }

    /// <summary>
    /// Determines whether the specified BACnet WeekNDay is equal to the current value.
    /// </summary>
    /// <param name="other">The WeekNDay to compare.</param>
    /// <returns>True if the values are equal; otherwise, false.</returns>
    public bool Equals(WeekNDay other)
    {
        return Month == other.Month && Week == other.Week && DayOfWeek == other.DayOfWeek;
    }

    /// <summary>
    /// Determines whether the specified object is equal to the current value.
    /// </summary>
    /// <param name="obj">The object to compare.</param>
    /// <returns>True if the object is a WeekNDay and equal to the current value; otherwise, false.</returns>
    public override bool Equals(object? obj)
    {
        return obj is WeekNDay other && Equals(other);
    }

    /// <summary>
    /// Returns the hash code for this value.
    /// </summary>
    /// <returns>A hash code for the current value.</returns>
    public override int GetHashCode()
    {
        return HashCode.Combine(Month, Week, DayOfWeek);
    }

    /// <summary>
    /// Determines whether two BACnet WeekNDay values are equal.
    /// </summary>
    public static bool operator ==(WeekNDay left, WeekNDay right) => left.Equals(right);

    /// <summary>
    /// Determines whether two BACnet WeekNDay values are not equal.
    /// </summary>
    public static bool operator !=(WeekNDay left, WeekNDay right) => !left.Equals(right);
}
