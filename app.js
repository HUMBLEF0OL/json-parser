/**
 * Read input from the file
 * pass it to the parser function
 * return result
 */

const fs = require('fs');

// const testCases = ['fail1.json', 'fail2.json', 'fail3.json', 'fail4.json', 'fail5.json'];
const testCases = ['pass4.json'];

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

const generateStack = (data) => {
    let stack = [];
    let valueToken = "";
    let startValueToken = false;
    let isEscaped = false;


    for (let i = 0; i < data.length; i++) {
        let element = data.charAt(i);
        console.log(`i:${i}:${element}:${typeof element}`)

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


const parseData = (data) => {
    const stack = generateStack(data);
    console.log(stack);
}

testCases.forEach(filePath => {

    let data = fs.readFileSync(`./test/${filePath}`, { encoding: 'utf-8', flag: 'r' });
    // console.log("data is: ", data, typeof data);
    parseData(data);

})

