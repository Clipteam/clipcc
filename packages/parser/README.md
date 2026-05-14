# clipcc-parser

Parser for Clipcc projects

## Overview

The Clipcc Parser is a [Node.js](https://nodejs.org) module that parses and validates
[ClipCC](https://github.com/Clipteam/clipcc) projects.

## API

### Installation

```sh
pnpm install clipcc-parser
```

### Basic Use

```js
const fs = require('fs');
const parser = require('clipcc-parser');

const buffer = fs.readFileSync('/path/to/project.sb2');
parser(buffer, function (err, project) {
    if (err) // handle the error
    // do something interesting
});
```

### "Info"

In addition to the `_meta` data described above, Clipcc projects include an attribute called `info` that *may*
include the following:

| Key               | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `flashVersion`    | Installed version of Adobe Flash                         |
| `swfVersion`      | Version of the Clipcc editor used to create the project |
| `userAgent`       | User agent used to create the project                    |
| `savedExtensions` | Array of Clipcc Extensions used in the project          |

## Testing

### Running the Test Suite

```sh
pnpm test
```

### Code Coverage Report

```sh
pnpm run coverage
```

### Performance Benchmarks / Stress Testing

```sh
make benchmark
```
