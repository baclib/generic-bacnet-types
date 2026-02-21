// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

namespace Baclib.Bacnet.Types;

/// <summary>
/// Represents a BACnet Date value consisting of 4 octets: year, month, day, and day-of-week.
/// Defined in ANSI/ASHRAE 135-2024 Clause 20.2.11.
/// </summary>
/// <remarks>
/// Date provides a BACnet-compliant date representation that supports wildcard values (255) for unspecified
/// or pattern-matching fields, as well as special values for pattern matching (odd/even months and days, last day).
/// The year field represents years 1900-2154 (encoded as 0-254), with 255 indicating an unspecified year.
/// This type can be converted to and from .NET DateTime and DateOnly types for specific dates.
/// </remarks>
public readonly record struct DatePattern
{
    /// <summary>
    /// Wildcard value indicating an unspecified or "any" field value.
    /// </summary>
    public const byte Wildcard = 255;

    /// <summary>
    /// Gets the year field (0-254 represents 1900-2154, 255 = unspecified).
    /// </summary>
    public byte Year { get; }

    /// <summary>
    /// Gets a value indicating whether this date has a specific year value (0-254 representing 1900-2154).
    /// </summary>
    public bool IsYearSpecific => Year != Wildcard;

    /// <summary>
    /// Gets a value indicating whether the year is unspecified (wildcard value 255).
    /// </summary>
    public bool IsYearUnspecified => Year == Wildcard;

    /// <summary>
    /// Special value for Month indicating odd months (1, 3, 5, 7, 9, 11).
    /// </summary>
    public const byte OddMonth = 13;

    /// <summary>
    /// Special value for Month indicating even months (2, 4, 6, 8, 10, 12).
    /// </summary>
    public const byte EvenMonth = 14;

    /// <summary>
    /// Gets the month field (1-12 = Jan-Dec, 13 = odd months, 14 = even months, 255 = unspecified).
    /// </summary>
    public byte Month { get; }

    /// <summary>
    /// Gets a value indicating whether the month field is within valid BACnet range.
    /// </summary>
    /// <remarks>Valid values are 1-12 (specific months), 13 (odd), 14 (even), or 255 (unspecified).</remarks>
    public bool IsMonthValid => Month is (>= 1 and <= 12) or OddMonth or EvenMonth or Wildcard;

    /// <summary>
    /// Gets a value indicating whether this date has a specific month value (1-12).
    /// </summary>
    public bool IsMonthSpecific => Month is >= 1 and <= 12;

    /// <summary>
    /// Gets a value indicating whether the month is unspecified (wildcard value 255).
    /// </summary>
    public bool IsMonthUnspecified => Month == Wildcard;

    /// <summary>
    /// Gets a value indicating whether the month field specifies odd months (value 13).
    /// </summary>
    /// <remarks>Odd months are 1, 3, 5, 7, 9, and 11.</remarks>
    public bool IsMonthOdd => Month == OddMonth;

    /// <summary>
    /// Gets a value indicating whether the month field specifies even months (value 14).
    /// </summary>
    /// <remarks>Even months are 2, 4, 6, 8, 10, and 12.</remarks>
    public bool IsMonthEven => Month == EvenMonth;

    /// <summary>
    /// Special value for Day indicating the last day of the month (28, 29, 30, or 31).
    /// </summary>
    public const byte LastDay = 32;

    /// <summary>
    /// Special value for Day indicating odd days of the month.
    /// Odd days are 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, and 31.
    /// </summary>
    public const byte OddDay = 33;

    /// <summary>
    /// Special value for Day indicating even days of the month.
    /// Even days are 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, and 30.
    /// </summary>
    public const byte EvenDay = 34;

    /// <summary>
    /// Gets the day of month field (1-31, 32 = last day, 33 = odd days, 34 = even days, 255 = unspecified).
    /// </summary>
    public byte Day { get; }

    /// <summary>
    /// Gets a value indicating whether the day field is within valid BACnet range.
    /// </summary>
    /// <remarks>Valid values are 1-31 (specific days), 32 (last), 33 (odd), 34 (even), or 255 (unspecified).</remarks>
    public bool IsDayValid => Day is (>= 1 and <= 31) or LastDay or OddDay or EvenDay or Wildcard;

    /// <summary>
    /// Gets a value indicating whether this date has a specific day of month value (1-31).
    /// </summary>
    public bool IsDaySpecific => Day is >= 1 and <= 31;

    /// <summary>
    /// Gets a value indicating whether the day of month is unspecified (wildcard value 255).
    /// </summary>
    public bool IsDayUnspecified => Day == Wildcard;

    /// <summary>
    /// Gets a value indicating whether the day field specifies the last day of the month (value 32).
    /// </summary>
    /// <remarks>The last day varies by month: 28-31.</remarks>
    public bool IsDayLast => Day == LastDay;

    /// <summary>
    /// Gets a value indicating whether the day field specifies odd days of the month (value 33).
    /// </summary>
    /// <remarks>Odd days are 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, and 31.</remarks>
    public bool IsDayOdd => Day == OddDay;

    /// <summary>
    /// Gets a value indicating whether the day field specifies even days of the month (value 34).
    /// </summary>
    /// <remarks>Even days are 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, and 30.</remarks>
    public bool IsDayEven => Day == EvenDay;

    /// <summary>
    /// Gets the day of week field (1-7 = Monday-Sunday, 255 = unspecified).
    /// </summary>
    /// <remarks>1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 7 = Sunday.</remarks>
    public byte DayOfWeek { get; }

    /// <summary>
    /// Gets a value indicating whether the day of week field is within valid BACnet range.
    /// </summary>
    /// <remarks>Valid values are 1-7 (Monday-Sunday) or 255 (unspecified).</remarks>
    public bool IsDayOfWeekValid => DayOfWeek is (>= 1 and <= 7) or Wildcard;

    /// <summary>
    /// Gets a value indicating whether this date has a specific day of week value (1-7).
    /// </summary>
    public bool IsDayOfWeekSpecific => DayOfWeek is >= 1 and <= 7;

    /// <summary>
    /// Gets a value indicating whether the day of week is unspecified (wildcard value 255).
    /// </summary>
    public bool IsDayOfWeekUnspecified => DayOfWeek == Wildcard;

    /// <summary>
    /// Gets a value indicating whether all date fields are within valid BACnet ranges.
    /// </summary>
    /// <remarks>Returns true if year, month, day, and day of week fields all contain valid BACnet values.</remarks>
    public bool IsValid => IsMonthValid && IsDayValid && IsDayOfWeekValid;

    /// <summary>
    /// Gets a value indicating whether this date represents a fully specified date with no wildcards or special values.
    /// </summary>
    /// <remarks>Returns true only if all fields contain specific numeric values (not wildcards or pattern values).</remarks>
    public bool IsSpecific => IsYearSpecific && IsMonthSpecific && IsDaySpecific && IsDayOfWeekSpecific;

    /// <summary>
    /// Gets a value indicating whether this date is completely unspecified with all fields set to wildcard.
    /// </summary>
    /// <remarks>Returns true only if year, month, day, and day of week are all wildcard (255).</remarks>
    public bool IsUnspecified => IsYearUnspecified && IsMonthUnspecified && IsDayUnspecified && IsDayOfWeekUnspecified;

    private static readonly int[] s_daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    /// <summary>
    /// Determines whether the specified year, month, and day form a valid calendar date.
    /// </summary>
    /// <param name="year">The year (1900-2154).</param>
    /// <param name="month">The month (1-12).</param>
    /// <param name="day">The day (1-31).</param>
    /// <returns>True if the date is valid, accounting for leap years and days in month; otherwise, false.</returns>
    private static bool IsConsistent(int year, int month, int day)
    {
        if (year < 1900 || year > 2154 || month < 1 || month > 12 || day < 1 || day > 31)
        {
            return false;
        }

        var isLeapYear = (year % 4 == 0) && (year % 100 != 0 || year % 400 == 0);
        var lastDay = month == 2 && isLeapYear ? 29 : s_daysInMonth[month - 1];
        return day <= lastDay;
    }

    /// <summary>
    /// Creates a BACnet Date from individual field values.
    /// </summary>
    /// <param name="year">Year value (0-254 represents 1900-2154, 255 = unspecified).</param>
    /// <param name="month">Month value (1-12 = Jan-Dec, 13 = odd months, 14 = even months, 255 = unspecified).</param>
    /// <param name="day">Day value (1-31, 32 = last day, 33 = odd days, 34 = even days, 255 = unspecified).</param>
    /// <param name="dayOfWeek">Day of week value (1-7 = Monday-Sunday, 255 = unspecified).</param>
    /// <remarks>No validation is performed on the input values.</remarks>
    public DatePattern(byte year, byte month, byte day, byte dayOfWeek)
    {
        Year = year;
        Month = month;
        Day = day;
        DayOfWeek = dayOfWeek;
    }

    /// <summary>
    /// Creates a BACnet Date from a .NET <see cref="System.DateTime"/> value.
    /// </summary>
    /// <param name="dateTime">The DateTime to convert.</param>
    /// <exception cref="ArgumentOutOfRangeException">Thrown if the year is outside the valid BACnet range (1900-2154).</exception>
    public DatePattern(System.DateTime dateTime)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(dateTime.Year, 1900, nameof(dateTime));
        ArgumentOutOfRangeException.ThrowIfGreaterThan(dateTime.Year, 2154, nameof(dateTime));

        Year = (byte)(dateTime.Year - 1900);
        Month = (byte)dateTime.Month;
        Day = (byte)dateTime.Day;
        DayOfWeek = dateTime.DayOfWeek == System.DayOfWeek.Sunday ? (byte)7 : (byte)dateTime.DayOfWeek;
    }

    /// <summary>
    /// Creates a BACnet Date from a .NET <see cref="DateOnly"/> value.
    /// </summary>
    /// <param name="date">The DateOnly to convert.</param>
    /// <exception cref="ArgumentOutOfRangeException">Thrown if the year is outside the valid BACnet range (1900-2154).</exception>
    public DatePattern(DateOnly date)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(date.Year, 1900, nameof(date));
        ArgumentOutOfRangeException.ThrowIfGreaterThan(date.Year, 2154, nameof(date));

        Year = (byte)(date.Year - 1900);
        Month = (byte)date.Month;
        Day = (byte)date.Day;
        DayOfWeek = date.DayOfWeek == System.DayOfWeek.Sunday ? (byte)7 : (byte)date.DayOfWeek;
    }

    /// <summary>
    /// Creates a BACnet Date from raw BACnet bytes.
    /// </summary>
    /// <param name="data">A span containing at least 4 bytes representing the date.</param>
    /// <exception cref="ArgumentException">Thrown if the data span is less than 4 bytes.</exception>
    public DatePattern(ReadOnlySpan<byte> data)
    {
        if (data.Length < 4)
        {
            throw new ArgumentException("Data must contain at least 4 bytes.", nameof(data));
        }

        Year = data[0];
        Month = data[1];
        Day = data[2];
        DayOfWeek = data[3];
    }

    /// <summary>
    /// Writes the BACnet Date to a span of bytes.
    /// </summary>
    /// <param name="destination">The destination span to write the 4 bytes to.</param>
    /// <exception cref="ArgumentException">Thrown if the destination span is less than 4 bytes.</exception>
    public void WriteTo(Span<byte> destination)
    {
        if (destination.Length < 4)
        {
            throw new ArgumentException("Destination must have at least 4 bytes.", nameof(destination));
        }

        destination[0] = Year;
        destination[1] = Month;
        destination[2] = Day;
        destination[3] = DayOfWeek;
    }

    /// <summary>
    /// Converts the BACnet Date to a .NET <see cref="System.DateTime"/> if it represents a specific date.
    /// </summary>
    /// <returns>A DateTime if the date has specific year, month, and day values and is valid; otherwise, null.</returns>
    /// <remarks>
    /// Day of week validation is not enforced per BACnet standard (local matter).
    /// Returns null if any field is a wildcard or special value, or if the date is invalid.
    /// </remarks>
    public System.DateTime? ToDateTime()
    {
        if (IsConsistent(Year + 1900, Month, Day) && IsDayOfWeekValid) // per standard, it is local matter to check day of week
        {
            return new System.DateTime(1900 + Year, Month, Day);
        }

        return null;
    }

    /// <summary>
    /// Converts the BACnet Date to a .NET <see cref="DateOnly"/> if it represents a specific date.
    /// </summary>
    /// <returns>A DateOnly if the date has specific year, month, and day values and is valid; otherwise, null.</returns>
    /// <remarks>
    /// Day of week validation is not enforced per BACnet standard (local matter).
    /// Returns null if any field is a wildcard or special value, or if the date is invalid.
    /// </remarks>
    public DateOnly? ToDateOnly()
    {
        if (IsConsistent(Year + 1900, Month, Day) && IsDayOfWeekValid) // per standard, it is local matter to check day of week
        {
            return new DateOnly(1900 + Year, Month, Day);
        }

        return null;
    }

    /// <summary>
    /// Returns a string representation of the BACnet Date.
    /// </summary>
    /// <returns>A string in the format "YYYY-MM-DD/DayOfWeek" with special values represented as text.</returns>
    /// <remarks>
    /// Wildcards are shown as "*", odd/even as "odd"/"even", and last day as "last".
    /// Example outputs: "2024-12-05/4", "*-odd-last/*", "2025-01-*/3".
    /// </remarks>
    public override string ToString()
    {
        var year = Year == Wildcard ? "*" : (1900 + Year).ToString();
        var month = Month switch
        {
            Wildcard => "*",
            OddMonth => "odd",
            EvenMonth => "even",
            _ => Month.ToString("D2")
        };
        var dayOfMonth = Day switch
        {
            Wildcard => "*",
            LastDay => "last",
            OddDay => "odd",
            EvenDay => "even",
            _ => Day.ToString("D2")
        };
        var dayOfWeek = DayOfWeek == Wildcard ? "*" : DayOfWeek.ToString();

        return $"{year}-{month}-{dayOfMonth}/{dayOfWeek}";
    }

    /// <summary>
    /// Implicitly converts a .NET DateTime to a BACnet Date.
    /// </summary>
    /// <param name="dateTime">The DateTime to convert.</param>
    public static implicit operator DatePattern(System.DateTime dateTime) => new(dateTime);

    /// <summary>
    /// Implicitly converts a .NET DateOnly to a BACnet Date.
    /// </summary>
    /// <param name="date">The DateOnly to convert.</param>
    public static implicit operator DatePattern(DateOnly date) => new(date);
}
