
# JSON Parser

![npm](https://img.shields.io/npm/v/json-parser?style=flat-square)  ![Node Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen?style=flat-square)

A simple Node.js-based JSON parser and validator for checking the validity and structure of JSON data.

## Table of Contents

- [JSON Parser](#json-parser)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Scripts](#scripts)
  - [Development](#development)
    - [Prerequisites](#prerequisites)
    - [Code Quality](#code-quality)
    - [Testing](#testing)
  - [Contributing](#contributing)
  - [Additional Information](#additional-information)

---

## Introduction

The `json-parser` package provides an easy-to-use tool for parsing and validating JSON data. It checks the JSON format for structural correctness and identifies errors such as unbalanced brackets, improper quoting, or invalid characters. It can also parse valid JSON into JavaScript objects.

---

## Features

- Parses valid JSON data into JavaScript objects or arrays.
- Identifies invalid JSON structures, such as:
  - Mismatched or extra brackets.
  - Trailing commas in arrays or objects.
  - Invalid control characters in strings.
- Supports floating-point numbers, scientific notation, and standard JSON data types (`object`, `array`, `string`, `number`, `boolean`, and `null`).
- Detailed error messages to pinpoint the issue.

---

## Installation

To install the project locally, clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/HUMBLEFOOL/json-parser.git

# Navigate to the project directory
cd json-parser

# Install dependencies
npm install
```

---

## Usage

To run the parser, execute the following command:

```bash
npm start
```

You can modify `script.js` to input your JSON data.

Example JSON input:

```json
{
    "name": "json-parser",
    "version": "1.0.0",
    "description": "A simple JSON parser",
    "valid": true,
    "nested": {
        "array": [1, 2, 3],
        "nullValue": null
    }
}
```

Expected output:

```plaintext
JSON is valid. Parsed object:
{
    name: "json-parser",
    version: "1.0.0",
    description: "A simple JSON parser",
    valid: true,
    nested: {
        array: [1, 2, 3],
        nullValue: null
    }
}
```

---

## Scripts

The project includes the following npm scripts:

- **`npm start`**: Runs the parser.
- **`npm run test`**: Executes the main script for testing.
- **`npm run lint`**: Runs ESLint to check for code quality and style issues.

---

## Development

### Prerequisites

Ensure you have the following installed:

- **Node.js** (version 14.0.0 or later)
- **npm** (comes with Node.js)

### Code Quality

The project uses [ESLint](https://eslint.org/) with the Airbnb base configuration for code linting. To check code quality:

```bash
npm run lint
```

### Testing

You can test the parser functionality by modifying the JSON input in `script.js` and running:

```bash
npm test
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`feature/my-new-feature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push the branch (`git push origin feature/my-new-feature`).
5. Open a pull request.

For issues or bug reports, please visit the [Issues page](https://github.com/HUMBLEFOOL/json-parser/issues).

---


---

## Additional Information

- **Repository**: [GitHub](https://github.com/HUMBLEFOOL/json-parser)
- **Report Issues**: [GitHub Issues](https://github.com/HUMBLEFOOL/json-parser/issues)
- **Homepage**: [JSON Parser](https://github.com/HUMBLEFOOL/json-parser)

