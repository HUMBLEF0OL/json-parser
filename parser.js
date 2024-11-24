/**
 * Read input from the file
 * pass it to the parser function
 * return result
 */

const fs = require('fs');

// const testCases = ['fail1.json', 'fail2.json', 'fail3.json', 'fail4.json', 'fail5.json'];
const testCases = ['fail1.json'];
// const testCases = ['pass1.json', 'pass2.json', 'pass3.json', 'pass4.json', 'pass5.json']
// const testCases = ['pass2.json']

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

const generateStack = (data) => {
    let stack = [];
    let valueToken = "";
    let startValueToken = false;
    let isEscaped = false;


    for (let i = 0; i < data.length; i++) {
        let element = data.charAt(i);
        // console.log(`i:${i}:${element}:${typeof element}`)

        if (whitespaces.includes(element)) {
            if (startValueToken) {
                valueToken += element;
            }
            continue;
        }

        else if (structuralToken.includes(element) && !startValueToken) {
            // structural token may also lie in the value
            if (valueToken) {
                stack.push(valueToken.trim());
                valueToken = "";
            }
            stack.push(element);
        }

        else if (element === "\"") {
            if (!startValueToken) {
                startValueToken = true;
                valueToken = "\"";
            } else if (isEscaped) {
                valueToken += element;
                isEscaped = false;
            } else {
                valueToken += "\"";
                // Don't combine consecutive strings
                stack.push(valueToken);
                valueToken = "";
                startValueToken = false;
            }
        }

        else if (startValueToken && element === "\\") {
            // Check for escape sequences
            let backslashCount = 0;
            for (let j = i; j >= 0 && data.charAt(j) === "\\"; j--) {
                backslashCount++;
            }

            isEscaped = backslashCount % 2 !== 0;
            valueToken += "\\";
        }

        else if (isEscaped) {
            if (element === 'u') {
                if (data.length < i + 5) {
                    throw new Error('Incomplete Unicode escape sequence');
                }
                const sequence = data.slice(i + 1, i + 5);
                if (!/^[0-9a-fA-F]{4}$/.test(sequence)) {
                    throw new Error('Invalid Unicode escape sequence');
                }
                const unicodeChar = String.fromCharCode(parseInt(sequence, 16));
                // valueToken = valueToken.slice(0, -1); // Remove the last backslash
                valueToken += unicodeChar;
                i += 4;
            } else if (element in escapeMap) {
                // valueToken = valueToken.slice(0, -1); // Remove the last backslash
                valueToken += escapeMap[element];
            } else {
                throw new Error(`Invalid escape sequence: \\${element}`);
            }
            isEscaped = false;
        }

        else {
            valueToken += element;
            let nextChar = data.charAt(i + 1);
            let isTerminating = (i + 1 === data.length) ||
                structuralToken.includes(nextChar) ||
                whitespaces.includes(nextChar);

            if (!startValueToken && isTerminating) {
                // Handle negative numbers and scientific notation as single tokens
                stack.push(valueToken.trim());
                valueToken = "";
            }
        }
    }

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

const parseStack = (tokens) => {
    let index = 0;
    let depth = 0;
    primaryChecker(tokens);

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
    const parseString = () => {
        let token = tokens[index++];
        // skip the starting the trailing "
        if (token.charAt(0) === '"' && token.charAt(token.length - 1) === '"') {
            // Check if the string contains unescaped control characters
            // const unescapedControlCharRegex = /[^\x20\x09\x0A\x0D\x21\x23-\x5B\x5D\x5E-\x7A\x7E]/;  // Matches unescaped control characters
            // if (unescapedControlCharRegex.test(token)) {
            //     throw new Error("Invalid characters in string. Control characters must be escaped.");
            // }
            const value = token.slice(1, -1).replaceAll("\\", "");
            return value;
        }
        throw new Error('Keys must be quoted');
    }
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

testCases.forEach(filePath => {
    try {
        let data = fs.readFileSync(`./test/${filePath}`, { encoding: 'utf-8', flag: 'r' });
        // console.log("data is: ", data, typeof data);
        const stack = generateStack(data);
        console.log(stack)
        const result = parseStack(stack);
        console.log(result)

    } catch (err) {
        console.log(err);

    }

})

module.exports = {
    generateStack,
    parseStack
}