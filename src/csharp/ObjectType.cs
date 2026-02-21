// SPDX-FileCopyrightText: Copyright 2024-2026, The BAClib Initiative and Contributors
// SPDX-License-Identifier: EPL-2.0

namespace Baclib.Bacnet.Types;

/// <summary>
/// Represents the enumeration BACnetObjectType as defined in ANSI/ASHRAE 135-2024 Clause 20.6.
/// </summary>
public enum ObjectType : ushort
{
    /// <summary>
    /// Represents an analog input object.
    /// </summary>
    AnalogInput = 0,

    /// <summary>
    /// Represents an analog output object.
    /// </summary>
    AnalogOutput = 1,

    /// <summary>
    /// Represents an analog value object.
    /// </summary>
    AnalogValue = 2,

    /// <summary>
    /// Represents a binary input object.
    /// </summary>
    BinaryInput = 3,

    /// <summary>
    /// Represents a binary output object.
    /// </summary>
    BinaryOutput = 4,

    /// <summary>
    /// Represents a binary value object.
    /// </summary>
    BinaryValue = 5,

    /// <summary>
    /// Represents a calendar object.
    /// </summary>
    Calendar = 6,

    /// <summary>
    /// Represents a command object.
    /// </summary>
    Command = 7,

    /// <summary>
    /// Represents a device object.
    /// </summary>
    Device = 8,

    /// <summary>
    /// Represents an event enrollment object.
    /// </summary>
    EventEnrollment = 9,

    /// <summary>
    /// Represents a file object.
    /// </summary>
    File = 10,

    /// <summary>
    /// Represents a group object.
    /// </summary>
    Group = 11,

    /// <summary>
    /// Represents a loop object.
    /// </summary>
    Loop = 12,

    /// <summary>
    /// Represents a multi-state input object.
    /// </summary>
    MultiStateInput = 13,

    /// <summary>
    /// Represents a multi-state output object.
    /// </summary>
    MultiStateOutput = 14,

    /// <summary>
    /// Represents a notification class object.
    /// </summary>
    NotificationClass = 15,

    /// <summary>
    /// Represents a program object.
    /// </summary>
    Program = 16,

    /// <summary>
    /// Represents a schedule object.
    /// </summary>
    Schedule = 17,

    /// <summary>
    /// Represents an averaging object.
    /// </summary>
    Averaging = 18,

    /// <summary>
    /// Represents a multi-state value object.
    /// </summary>
    MultiStateValue = 19,

    /// <summary>
    /// Represents a trend log object.
    /// </summary>
    TrendLog = 20,

    /// <summary>
    /// Represents a life safety point object.
    /// </summary>
    LifeSafetyPoint = 21,

    /// <summary>
    /// Represents a life safety zone object.
    /// </summary>
    LifeSafetyZone = 22,

    /// <summary>
    /// Represents an accumulator object.
    /// </summary>
    Accumulator = 23,

    /// <summary>
    /// Represents a pulse converter object.
    /// </summary>
    PulseConverter = 24,

    /// <summary>
    /// Represents an event log object.
    /// </summary>
    EventLog = 25,

    /// <summary>
    /// Represents a global group object.
    /// </summary>
    GlobalGroup = 26,

    /// <summary>
    /// Represents a trend log multiple object.
    /// </summary>
    TrendLogMultiple = 27,

    /// <summary>
    /// Represents a load control object.
    /// </summary>
    LoadControl = 28,

    /// <summary>
    /// Represents a structured view object.
    /// </summary>
    StructuredView = 29,

    /// <summary>
    /// Represents an access door object.
    /// </summary>
    AccessDoor = 30,

    /// <summary>
    /// Represents a timer object.
    /// </summary>
    Timer = 31,

    /// <summary>
    /// Represents an access credential object.
    /// </summary>
    AccessCredential = 32,

    /// <summary>
    /// Represents an access point object.
    /// </summary>
    AccessPoint = 33,

    /// <summary>
    /// Represents an access rights object.
    /// </summary>
    AccessRights = 34,

    /// <summary>
    /// Represents an access user object.
    /// </summary>
    AccessUser = 35,

    /// <summary>
    /// Represents an access zone object.
    /// </summary>
    AccessZone = 36,

    /// <summary>
    /// Represents a credential data input object.
    /// </summary>
    CredentialDataInput = 37,

    /// <summary>
    /// Represents a bit string value object.
    /// </summary>
    BitstringValue = 39,

    /// <summary>
    /// Represents a character string value object.
    /// </summary>
    CharacterstringValue = 40,

    /// <summary>
    /// Represents a date pattern value object.
    /// </summary>
    DatepatternValue = 41,

    /// <summary>
    /// Represents a date value object.
    /// </summary>
    DateValue = 42,

    /// <summary>
    /// Represents a datetime pattern value object.
    /// </summary>
    DatetimepatternValue = 43,

    /// <summary>
    /// Represents a datetime value object.
    /// </summary>
    DatetimeValue = 44,

    /// <summary>
    /// Represents an integer value object.
    /// </summary>
    IntegerValue = 45,

    /// <summary>
    /// Represents a large analog value object.
    /// </summary>
    LargeAnalogValue = 46,

    /// <summary>
    /// Represents an octet string value object.
    /// </summary>
    OctetstringValue = 47,

    /// <summary>
    /// Represents a positive integer value object.
    /// </summary>
    PositiveIntegerValue = 48,

    /// <summary>
    /// Represents a time pattern value object.
    /// </summary>
    TimepatternValue = 49,

    /// <summary>
    /// Represents a time value object.
    /// </summary>
    TimeValue = 50,

    /// <summary>
    /// Represents a notification forwarder object.
    /// </summary>
    NotificationForwarder = 51,

    /// <summary>
    /// Represents an alert enrollment object.
    /// </summary>
    AlertEnrollment = 52,

    /// <summary>
    /// Represents a channel object.
    /// </summary>
    Channel = 53,

    /// <summary>
    /// Represents a lighting output object.
    /// </summary>
    LightingOutput = 54,

    /// <summary>
    /// Represents a binary lighting output object.
    /// </summary>
    BinaryLightingOutput = 55,

    /// <summary>
    /// Represents a network port object.
    /// </summary>
    NetworkPort = 56,

    /// <summary>
    /// Represents an elevator group object.
    /// </summary>
    ElevatorGroup = 57,

    /// <summary>
    /// Represents an escalator object.
    /// </summary>
    Escalator = 58,

    /// <summary>
    /// Represents a lift object.
    /// </summary>
    Lift = 59,

    /// <summary>
    /// Represents a staging object.
    /// </summary>
    Staging = 60,

    /// <summary>
    /// Represents an audit log object.
    /// </summary>
    AuditLog = 61,

    /// <summary>
    /// Represents an audit reporter object.
    /// </summary>
    AuditReporter = 62,

    /// <summary>
    /// Represents a color object.
    /// </summary>
    Color = 63,

    /// <summary>
    /// Represents a color temperature object.
    /// </summary>
    ColorTemperature = 64
}
