/**
 * Read input from the file
 * pass it to the parser function
 * return result
 */

const structuralToken = ["{", "}", "[", "]", ":", ","];
const whitespaces = ["\t", "\n", "\r", " "];
const escapeMap = {
    'n': '\n',
    't': '\t',
    'b': '\b',
    'r': '\r',
    'f': '\f',
    '\\': '\\',
    '\"': '\"',
    '/': '/'
};
const MAX_DEPTH = 20;
/**
 * Generates a stack of tokens from a JSON-like string input. 
 * This function tokenizes the input by identifying structural tokens, strings, numbers, 
 * and handling escape sequences within string values.
 *
 * @param {string} data - The JSON-like string to tokenize.
 * @returns {string[]} - An array of tokens representing the JSON structure.
 *
 * @throws {Error} If there is an invalid escape sequence, incomplete Unicode escape, or an unterminated string.
 *
 * @example
 * // Example usage:
 * const input = '{"key": "value", "array": [1, 2, 3]}';
 * const tokens = generateStack(input);
 * console.log(tokens);
 * // Output:
 * // ['{', '"key"', ':', '"value"', ',', '"array"', ':', '[', '1', ',', '2', ',', '3', ']', '}']
 */
const generateStack = (data) => {
    // Stack to hold the parsed tokens
    let stack = [];
    // Temporary variable to store the current token being parsed
    let valueToken = "";
    // Flag to track if we're inside a string value
    let startValueToken = false;
    // Flag to track if the current character is escaped
    let isEscaped = false;

    for (let i = 0; i < data.length; i++) {
        let element = data.charAt(i);

        // Ignore whitespaces outside of string tokens
        if (!startValueToken && whitespaces.includes(element)) continue;

        // Handle double quotes (") that start or end string values
        if (element === '"' && !isEscaped) {
            if (!startValueToken) {
                // Start of a string value
                startValueToken = true;
                valueToken = '"';
            } else {
                // End of a string value
                valueToken += '"';
                stack.push(valueToken); // Add the completed string token to the stack
                valueToken = "";        // Reset for the next token
                startValueToken = false;
            }
            continue;
        }

        // If inside a string token, process its contents
        if (startValueToken) {
            if (isEscaped) {
                // Handle escape sequences
                if (element in escapeMap) {
                    // Valid escape character, map to its equivalent value
                    valueToken += escapeMap[element];
                } else if (element === "u") {
                    // Handle Unicode escape sequences (\uXXXX)
                    const unicode = data.slice(i + 1, i + 5);
                    if (!/^[0-9a-fA-F]{4}$/.test(unicode)) {
                        // Invalid Unicode escape sequence
                        throw new Error(`Invalid Unicode escape: \\u${unicode}`);
                    }
                    // Convert Unicode escape to its character equivalent
                    valueToken += String.fromCharCode(parseInt(unicode, 16));
                    i += 4; // Skip the next 4 characters of the Unicode sequence
                } else {
                    // Invalid escape sequence
                    throw new Error(`Illegal escape sequence: \\${element}`);
                }
                isEscaped = false; // Reset escape flag
            } else if (element === "\\") {
                // Start of an escape sequence
                isEscaped = true;
            } else if (/[\u0000-\u001F]/.test(element)) {
                // Reject control characters in JSON strings
                throw new Error("Control characters are not allowed in JSON strings");
            } else {
                // Regular character inside the string, append to valueToken
                valueToken += element;
            }
        } else if (structuralToken.includes(element)) {
            // Handle structural tokens (e.g., [, ], {, }, :, ,)
            if (valueToken) {
                // If there's a token being built, add it to the stack
                stack.push(valueToken.trim());
                valueToken = ""; // Reset for the next token
            }
            stack.push(element); // Add the structural token to the stack
        } else {
            // Append characters outside of strings and structural tokens to valueToken
            valueToken += element;
        }
    }

    // If we're still inside a string token, it's an unterminated string error
    if (startValueToken) {
        throw new Error("Unterminated string in JSON");
    }

    return stack;
};

const primaryChecker = (tokens) => {
    if (tokens[0] === '{' || tokens[0] === '[') {
        return true;  // Proceed with parsing
    }

    // Throw an error if the first token is not an object or array
    throw new Error("A JSON payload should be an object or array, not a string.");
};

/**
 * Parses a list of tokens representing a JSON string and returns the parsed result.
 * Validates the structure of the JSON data during parsing.
 *
 * @param {Array<string>} tokens - The tokenized representation of the JSON string. 
 * Each token is a part of the JSON structure such as `{`, `}`, `:`, `,`, booleans (`true`, `false`), 
 * numbers, strings, and `null`.
 * 
 * @returns {Object|Array|string|number|boolean|null} The parsed result (could be an object, array, string, 
 * number, boolean, or null).
 *
 * @throws {Error} Throws detailed error messages for invalid JSON, such as unexpected tokens, 
 * missing colons, unexpected commas, trailing commas, mismatched brackets or braces, and exceeding 
 * nesting depth.
 */
const parseStack = (tokens) => {
    let index = 0;
    let depth = 0;

    // Perform primary validation before parsing starts
    primaryChecker(tokens);

    /**
     * Parses a value based on its token.
     * 
     * @returns {Object|Array|string|number|boolean|null} The parsed value, which could be an object, array, 
     * string, number, boolean, or null.
     * @throws {Error} Throws an error if the token does not match a valid JSON value.
     */
    const parseValue = () => {
        const token = tokens[index];

        if (token === '{') {
            return parseObject();
        } else if (token === '[') {
            return parseArray();
        } else if (token === 'true') {
            index++;
            return true;
        } else if (token === 'false') {
            index++;
            return false;
        } else if (token === 'null') {
            index++;
            return null;
        } else if (/^-?(0|[1-9]\d*)(\.\d+)?(e[+-]?\d+)?$/i.test(token)) {
            index++;
            return parseFloat(token);
        } else if (token?.startsWith('"') && token?.endsWith('"')) {
            return parseString();
        } else {
            throw new Error(`Unexpected token: ${token}`);
        }
    }

    /**
     * Parses a JSON object (`{}`) and ensures proper key-value pairing, comma placement, and closing braces.
     * 
     * @returns {Object} The parsed object.
     * @throws {Error} Throws errors for invalid object structure such as missing colons, extra commas, or 
     * trailing commas.
     */
    const parseObject = () => {
        const obj = {};
        index++; // Skip '{'

        let expectingKey = true; // Indicates if we are expecting a key (after '{' or ',')

        while (tokens[index] !== '}') {
            if (expectingKey) {
                if (tokens[index] === ',') {
                    throw new Error(`Unexpected comma at position ${index}`);
                }
                const key = parseString();
                if (tokens[index] !== ':') {
                    throw new Error(`Expected ':' after key at position ${index}`);
                }
                index++; // Skip ':'
                const value = parseValue();
                obj[key] = value;
                expectingKey = false; // After a key-value pair, we expect ',' or '}'
            } else {
                if (tokens[index] === ',') {
                    index++; // Skip ','
                    expectingKey = true; // After a ',', we expect a key
                } else {
                    throw new Error(`Expected ',' or '}' at position ${index}, found "${tokens[index]}"`);
                }
            }
        }

        if (expectingKey && Object.keys(obj).length > 0) {
            // If we are still expecting a key but encountered '}', it's a trailing comma
            throw new Error(`Trailing comma in object at position ${index}`);
        }

        index++; // Skip '}'

        return obj;
    }

    /**
     * Parses a JSON array (`[]`) and ensures proper value separation, comma placement, and closing brackets.
     * 
     * @returns {Array} The parsed array.
     * @throws {Error} Throws errors for invalid array structure such as missing values, extra commas, or 
     * trailing commas.
     */
    const parseArray = () => {
        depth++;
        if (depth >= MAX_DEPTH) {
            throw new Error(`Maximum nesting depth of ${MAX_DEPTH} exceeded`);
        }
        const arr = [];
        index++; // Skip '['

        let expectingValue = true;

        while (tokens[index] !== ']') {
            if (expectingValue) {
                if (tokens[index] === ',') {
                    throw new Error(`Unexpected comma at position ${index}`);
                }
                arr.push(parseValue());
                expectingValue = false; // After a value, we expect either ',' or ']'
            } else {
                if (tokens[index] === ',') {
                    index++; // Skip ','
                    expectingValue = true; // After a ',', we expect a value
                } else {
                    throw new Error(`Expected ',' or ']' at position ${index}, found "${tokens[index]}"`);
                }
            }
        }

        if (expectingValue && arr.length > 0) {
            // If we are still expecting a value but encountered ']', it's a trailing comma
            throw new Error(`Trailing comma in array at position ${index}`);
        }

        index++; // Skip ']'
        depth--;

        // Check for invalid closing brackets
        if (depth < 0) {
            throw new Error(`Unexpected closing bracket ']' at position ${index}`);
        }

        return arr;
    }

    /**
     * Parses a JSON string and removes leading/trailing quotes. Handles escape sequences.
     * 
     * @returns {string} The parsed string.
     * @throws {Error} Throws an error if the string is not properly quoted.
     */
    const parseString = () => {
        let token = tokens[index++];

        if (token.charAt(0) === '"' && token.charAt(token.length - 1) === '"') {
            let content = token.slice(1, -1);
            content = content.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
                return String.fromCharCode(parseInt(grp, 16));
            });
            content = content.replace(/\\(.)/g, (match, char) => {
                if (escapeMap[char]) return escapeMap[char];
                throw new Error(`Invalid escape sequence: \\${char}`);
            });
            return content;
        }
        throw new Error('Keys must be quoted');
    };

    const result = parseValue();

    // Post-parse validation
    if (index < tokens.length) {
        throw new Error(`Unexpected token after root value at position ${index}: ${tokens[index]}`);
    }

    // Final depth check
    if (depth !== 0) {
        throw new Error('Mismatched brackets or braces');
    }

    return result;
}


module.exports = {
    generateStack,
    parseStack
}