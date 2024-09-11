const toCamelCase = (str) => {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

const toSnakeCase = (str) => {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

const convertToCamelCase = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(v => convertToCamelCase(v));
    } else if (obj !== null && obj !== undefined && typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            const newKey = toCamelCase(key);
            result[newKey] = convertToCamelCase(obj[key]); // Recursively convert nested objects
            return result;
        }, {});
    }
    return obj; // Return primitives or null/undefined as-is
};

const convertToSnakeCase = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(v => convertToSnakeCase(v));
    } else if (obj !== null && obj !== undefined && typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            const newKey = toSnakeCase(key);
            result[newKey] = convertToSnakeCase(obj[key]); // Recursively convert nested objects
            return result;
        }, {});
    }
    return obj; // Return primitives or null/undefined as-is
};

module.exports = {
    convertToCamelCase,
    convertToSnakeCase,
};
