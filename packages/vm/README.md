## clipcc-vm
#### ClipCC VM is a library for representing, running, and maintaining the state of computer programs written using [ClipCC Blocks](../block/).

## Installation
This requires you to have Git and Node.js installed.

To install as a dependency for your own application:
```bash
pnpm install clipcc-vm
```
> you may need to follow root [contribution guide](../../CONTRIBUTING.md) to set up the development environment first.

## Running Development Server
This requires Node.js to be installed.

Run the development server in project root with:
```bash
pnpm vm start
```

## Playground
To view the Playground, make sure the dev server's running and go to [http://localhost:8073/playground/](http://localhost:8073/playground/) - you will be directed to the playground, which demonstrates various tools and internal state.

![VM Playground Screenshot](https://i.imgur.com/nOCNqEc.gif)


## Standalone Build
```bash
pnpm run build
```

```html
<script src="/path/to/dist/web/scratch-vm.js"></script>
<script>
    var vm = new window.VirtualMachine();
    // do things
</script>
```

## How to include in a Node.js App
For an extended setup example, check out the /src/playground directory, which includes a fully running VM instance.
```js
var VirtualMachine = require('clipcc-vm');
var vm = new VirtualMachine();

// Block events
Scratch.workspace.addChangeListener(vm.blockListener);

// Run threads
vm.start();
```

## Abstract Syntax Tree

#### Overview
The Virtual Machine constructs and maintains the state of an [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (AST) by listening to events emitted by the [clipcc-blocks](../block/) workspace via the `blockListener`. Each target (code-running object, for example, a sprite) keeps an AST for its blocks. At any time, the current state of an AST can be viewed by inspecting the `vm.runtime.targets[...].blocks` object.

#### Anatomy of a Block
The VM's block representation contains all the important information for execution and storage. Here's an example representing the "when key pressed" script on a workspace:
```json
{
  "_blocks": {
    "Q]PK~yJ@BTV8Y~FfISeo": {
      "id": "Q]PK~yJ@BTV8Y~FfISeo",
      "opcode": "event_whenkeypressed",
      "inputs": {
      },
      "fields": {
        "KEY_OPTION": {
          "name": "KEY_OPTION",
          "value": "space"
        }
      },
      "next": null,
      "topLevel": true,
      "parent": null,
      "shadow": false,
      "x": -69.333333333333,
      "y": 174
    }
  },
  "_scripts": [
    "Q]PK~yJ@BTV8Y~FfISeo"
  ]
}
```

## Testing
```bash
pnpm test
```

```bash
pnpm run coverage
```

## Publishing to GitHub Pages
```bash
pnpm run deploy
```

This will push the currently built playground to the gh-pages branch of the
currently tracked remote.  If you would like to change where to push to, add
a repo url argument:
```bash
pnpm run deploy -- -r <your repo url>
```
