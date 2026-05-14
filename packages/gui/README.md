# clipcc-gui
#### ClipCC GUI is a set of React components that comprise the interface for creating and running ClipCC projects

## Installation
This requires you to have Git and Node.js installed.

To install this package:
```bash
pnpm add clipcc-gui
```

If you want to edit/play yourself, you may need to follow root [contribution guide](../../CONTRIBUTING.md) to set up the development environment first. then run `pnpm gui start` in the project root to start a development server.

## Testing
### Documentation

You may want to review the documentation for [Jest](https://facebook.github.io/jest/docs/en/api.html) and [Enzyme](http://airbnb.io/enzyme/docs/api/) as you write your tests.

See [jest cli docs](https://facebook.github.io/jest/docs/en/cli.html#content) for more options.

### Running tests

*NOTE: If you're a Windows user, please run these scripts in Windows `cmd.exe`  instead of Git Bash/MINGW64.*

#### Main testing command

To run linter, unit tests, build, and integration tests, all at once:
```bash
pnpm test
```

#### Running unit tests

To run unit tests in isolation:
```bash
pnpm run test:unit
```

To run unit tests in watch mode (watches for code changes and continuously runs tests):
```bash
pnpm run test:unit -- --watch
```

You can run a single file of integration tests (in this example, the `button` tests):

```bash
$(pnpm bin)/jest --runInBand test/unit/components/button.test.jsx
```

#### Running integration tests

Integration tests use a headless browser to manipulate the actual HTML and javascript that the repo
produces. You will not see this activity (though you can hear it when sounds are played!).

Note that integration tests require you to first create a build that can be loaded in a browser:

```bash
pnpm run build
```

Then, you can run all integration tests:

```bash
pnpm run test:integration
```

Or, you can run a single file of integration tests (in this example, the `backpack` tests):

```bash
$(pnpm bin)/jest --runInBand test/integration/backpack.test.js
```

If you want to watch the browser as it runs the test, rather than running headless, use:

```bash
USE_HEADLESS=no $(pnpm bin)/jest --runInBand test/integration/backpack.test.js
```

## Understanding the project state machine

Since so much code throughout scratch-gui depends on the state of the project, which goes through many different phases of loading, displaying and saving, we created a "finite state machine" to make it clear which state it is in at any moment. This is contained in the file src/reducers/project-state.js .

It can be hard to understand the code in src/reducers/project-state.js . There are several types of data and functions used, which relate to each other:

### Loading states

These include state constant strings like:

* `NOT_LOADED` (the default state),
* `ERROR`,
* `FETCHING_WITH_ID`,
* `LOADING_VM_WITH_ID`,
* `REMIXING`,
* `SHOWING_WITH_ID`,
* `SHOWING_WITHOUT_ID`,
* etc.

### Transitions

These are names for the action which causes a state change. Some examples are:

* `START_FETCHING_NEW`,
* `DONE_FETCHING_WITH_ID`,
* `DONE_LOADING_VM_WITH_ID`,
* `SET_PROJECT_ID`,
* `START_AUTO_UPDATING`,

### How transitions relate to loading states

Like this diagram of the project state machine shows, various transition actions can move us from one loading state to another:

![Project state diagram](docs/project_state_diagram.svg)

_Note: for clarity, the diagram above excludes states and transitions relating to error handling._

#### Example

Here's an example of how states transition.

Suppose a user clicks on a project, and the page starts to load with URL https://scratch.mit.edu/projects/123456 .

Here's what will happen in the project state machine:

![Project state example](docs/project_state_example.png)

1. When the app first mounts, the project state is `NOT_LOADED`.
2. The `SET_PROJECT_ID` redux action is dispatched (from src/lib/project-fetcher-hoc.jsx), with `projectId` set to `123456`. This transitions the state from `NOT_LOADED` to `FETCHING_WITH_ID`.
3. The `FETCHING_WITH_ID` state. In src/lib/project-fetcher-hoc.jsx, the `projectId` value `123456` is used to request the data for that project from the server.
4. When the server responds with the data, src/lib/project-fetcher-hoc.jsx dispatches the `DONE_FETCHING_WITH_ID` action, with `projectData` set. This transitions the state from `FETCHING_WITH_ID` to `LOADING_VM_WITH_ID`.
5. The `LOADING_VM_WITH_ID` state. In src/lib/vm-manager-hoc.jsx, we load the `projectData` into Scratch's virtual machine ("the vm").
6. When loading is done, src/lib/vm-manager-hoc.jsx dispatches the `DONE_LOADING_VM_WITH_ID` action. This transitions the state from `LOADING_VM_WITH_ID` to `SHOWING_WITH_ID`
7. The `SHOWING_WITH_ID` state. Now the project appears normally and is playable and editable.
