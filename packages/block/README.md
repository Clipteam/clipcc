# ClipCC Blocks (clipcc-block)

[README.md for Scratch Blocks](https://github.com/scratchfoundation/scratch-blocks/blob/develop/README.md)

## Introduction

ClipCC Blocks is a project based on [Blockly](https://github.com/RaspberryPiFoundation/blockly) and [Scratch Blocks](https://github.com/scratchfoundation/scratch-blocks) that provides a design specification and codebase for building creative computing interfaces. Together with the [ClipCC Virtual Machine (VM)](https://github.com/scratchfoundation/scratch-vm) (a fork of [Scratch VM](https://github.com/scratchfoundation/scratch-editor/tree/develop/packages/scratch-vm)) this codebase allows for the rapid design and development of visual programming interface. ClipCC Blocks uses Blockly in an unforked way that most custom functionalities are developed with public Blockly API, and some are implemented with monkey-patching. Unlike [Blockly](https://github.com/RaspberryPiFoundation/blockly), Scratch Blocks does not use [code generators](https://developers.google.com/blockly/guides/create-custom-blocks/code-generation/overview), but rather leverages the VM to create highly dynamic, interactive programming environments.

*This project is in active development and should be considered a "developer preview" at this time.*

## Getting Started

This requires you to have Git and Node.js installed. We recommend you to have Node.js >= 18.0.

```bash
git clone https://github.com/Clipteam/clipcc.git
yarn install
cd packages/block
```

Open a Command Prompt or Terminal in the repository and run:

```bash
yarn start
```

Then go to [http://localhost:8071/](http://localhost:8071/) (or specifying it with environment variable `PORT`) to debug with the playground.

## Testing

Tests are written in [Jest](https://jestjs.io/docs/api). Run:

```bash
yarn test
```

To get the test coverage, run:

```bash
yarn coverage
```

## Internationalization

All translation messages are in `msg/messages.js`. Translation strings should be given in one of the following format:

- A message should begin with `Blockly.XXX =`. A description message begin with `///` can exist before it.
- If the description contains `{{Notranslate}}`, it will be treated as a constant value and won't be translated.
- If the message is assigned from another message, it will be an alias of that message.

```js
/// Here is a description of the following message.
Blockly.SOME_KEY = 'Some value';

Blockly.ANOTHER_KEY = Blockly.SOME_KEY;

/// {{Notranslate}} Constants
Blockly.CONSTANT = '20';
```

Run the following command to generate JSON file:

```bash
yarn i18n:src
```
