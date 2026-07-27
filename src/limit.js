
export const UNSIGNED_MINIMUM = 0n;
export const UNSIGNED_MAXIMUM = 4294967295n;

export const UNSIGNED_8_MINIMUM = 0n;
export const UNSIGNED_8_MAXIMUM = 255n;

export const UNSIGNED_16_MINIMUM = 0n;
export const UNSIGNED_16_MAXIMUM = 65535n;

export const UNSIGNED_32_MINIMUM = 0n;
export const UNSIGNED_32_MAXIMUM = 4294967295n;

export const UNSIGNED_64_MINIMUM = 0n;
export const UNSIGNED_64_MAXIMUM = (1n << 64n) - 1n;

export const INTEGER_MINIMUM = -2147483648n;
export const INTEGER_MAXIMUM = 2147483647n;

export const INTEGER_8_MINIMUM = -128n;
export const INTEGER_8_MAXIMUM = 127n;

export const INTEGER_16_MINIMUM = -32768n;
export const INTEGER_16_MAXIMUM = 32767n;

export const INTEGER_32_MINIMUM = -2147483648n;
export const INTEGER_32_MAXIMUM = 2147483647n;

export const INTEGER_64_MINIMUM = -(1n << 63n);
export const INTEGER_64_MAXIMUM = (1n << 63n) - 1n;

export const REAL_MINIMUM_VALUE = -3.4028234663852886e38;
export const REAL_MAXIMUM_VALUE = 3.4028234663852886e38;

export const DOUBLE_MINIMUM_VALUE = -Number.MAX_VALUE;
export const DOUBLE_MAXIMUM_VALUE = Number.MAX_VALUE;

const defaultLimits = {
    unsigned: {
        isInteger: true,
        minimum: UNSIGNED_64_MINIMUM,
        maximum: UNSIGNED_64_MAXIMUM
    },
    integer: {
        isInteger: true,
        minimum: INTEGER_64_MINIMUM,
        maximum: INTEGER_64_MAXIMUM
    },
    enumerated: {
        isInteger: true,
        minimum: UNSIGNED_64_MINIMUM,
        maximum: UNSIGNED_64_MAXIMUM
    },
    real: {
        isInteger: false,
        minimum: REAL_MINIMUM_VALUE,
        maximum: REAL_MAXIMUM_VALUE
    },
    double: {
        isInteger: false,
        minimum: DOUBLE_MINIMUM_VALUE,
        maximum: DOUBLE_MAXIMUM_VALUE
    }
}

export function getLimitValue(type, name) {
    const defaultLimit = defaultLimits[type.base];
    const limit = type[name];
    if (limit === undefined) {
        return defaultLimit[name];
    }
    if (defaultLimit.isInteger) {
        return BigInt(limit);
    }
    const number = Number(limit);
    if (String(limit).trim() === '' || !Number.isFinite(Number(limit))) {
        throw new SyntaxError(`Invalid numeric value: '${limit}'`);
    }
    return number;
}

export function getLimit(type) {
    const minimum = getLimitValue(type, 'minimum');
    const maximum = getLimitValue(type, 'maximum');
    return { base: type.base, minimum, maximum };
}
