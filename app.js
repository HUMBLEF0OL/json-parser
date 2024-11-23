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

const generateStack = (data) => {
    let stack = [];
    let valueToken = "";
    let startValueToken = false;
    for (let i = 0; i < data.length; i++) {
        let element = data.charAt(i);
        console.log(`i:${i}:${element}:${typeof element}`)
        if (whitespaces.includes(element)) continue;
        else if (structuralToken.includes(element)) stack.push(element);
        else if (element === "\"") {
            // starting the string
            if (!startValueToken) {
                startValueToken = true;
                valueToken = "\"";
            }
            // ending the string
            else {
                valueToken += "\"";
                startValueToken = false;
                stack.push(valueToken);
                valueToken = "";
            }
        }
        else {
            valueToken += element;
            if (!startValueToken && ((i + 1 === data.length) || structuralToken.includes(data.charAt(i + 1)) || whitespaces.includes(data.charAt(i + 1)))) {
                stack.push(valueToken);
                valueToken = "";
            }
        }
    }
    return stack;
}

const parseData = (data) => {
    const stack = generateStack(data);
    console.log(stack);
}

testCases.forEach(filePath => {

    const data = fs.readFileSync(`./test/${filePath}`, { encoding: 'utf-8', flag: 'r' });
    // console.log("data is: ", data, typeof data);
    parseData(data);

})

