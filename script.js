const fs = require('fs');
const path = require('path');
const { generateStack, parseStack } = require('./parser');


class JsonParserTester {
    constructor(testDir = './test') {
        this.testDir = testDir;
        this.passCount = 0;
        this.failCount = 0;
        this.unexpectedResults = [];
    }

    // get test files
    getTestFiles() {
        try {
            const files = fs.readdirSync(this.testDir);
            const testFiles = {
                pass: files.filter(file => file.startsWith('pass')),
                fail: files.filter(file => file.startsWith('fail'))
            };
            console.log("files are: ", testFiles)
            return testFiles;
        } catch (err) {
            console.log("Failed to read files from directory: ", err);
            process.exit(1);
        }
    }

    // execute the test file
    runTest(filename, expectedToPass) {
        const filePath = path.join(this.testDir, filename);
        console.log(`\nTesting ${filename}...`);

        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const stack = generateStack(data);
            const result = parseStack(stack);

            if (expectedToPass) {
                console.log('✅ Pass: Successfully parsed JSON');
                this.passCount++;
            } else {
                console.log('❌ Fail: Expected failure but got success');
                this.unexpectedResults.push({
                    file: filename,
                    expected: 'fail',
                    actual: 'pass',
                    result
                });
                this.failCount++;
            }
        } catch (err) {
            if (expectedToPass) {
                console.log('❌ Fail: Expected success but got error:', err.message);
                this.unexpectedResults.push({
                    file: filename,
                    expected: 'pass',
                    actual: 'fail',
                    error: err.message
                });
                this.failCount++;
            } else {
                console.log('✅ Pass: Got expected error:', err.message);
                this.passCount++;
            }
        }
    }

    // execute all 
    runAllTests() {
        console.log("Starting JSON Parser Tests....\n")
        const testFiles = this.getTestFiles();

        console.log("Running PASS Tests...");
        // pass files
        testFiles.pass.forEach(file => {
            this.runTest(file, true);
        })

        // fail files
        testFiles.fail.forEach(file => {
            this.runTest(file, false);
        })

        this.generateReport(testFiles);
    }

    // generate report
    generateReport(testFiles) {
        const totalTests = testFiles.pass.length + testFiles.fail.length;

        console.log('\n=== Test Summary ===');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${this.passCount}`);
        console.log(`Failed: ${this.failCount}`);
        console.log(`Success Rate: ${((this.passCount / totalTests) * 100).toFixed(2)}%`);

        if (this.unexpectedResults.length > 0) {
            console.log('\n=== Unexpected Results ===');
            this.unexpectedResults.forEach(result => {
                console.log(`\nFile: ${result.file}`);
                console.log(`Expected: ${result.expected}`);
                console.log(`Actual: ${result.actual}`);
                if (result.error) {
                    console.log(`Error: ${result.error}`);
                }
                if (result.result) {
                    console.log(`Parsed Result: ${JSON.stringify(result.result, null, 2)}`);
                }
            });
        }
    }
}

const tester = new JsonParserTester();
tester.runAllTests();