# Development Workflow

> We use Yarn(classic) for development.
> Please make sure you have Python3, Node.js and Yarn installed on your machine.

After cloning ClipCC, run `yarn install` to install dependencies.

To get started:

1. Run `yarn run build:full`.
2. Run `yarn run start` to launch the dev server
3. See http://localhost:8601/.

# Commands

You can run several commands:

-   `yarn run start` Start the GUI's dev-server.
-   `yarn run test:unit` Launch unit tests.
-   `yarn run build:full` Runs build for all packages.
-   `yarn run build:dist` Runs build for all packages in production mode.
-   `translation:build` Runs build for translation.
-   `yarn run translation:pull` Pull translation from remote.

# Commit Rules
We have set up pre-commit hook. For the use of gitmoji, please refer to [here](https://github.com/carloscuesta/gitmoji/blob/master/packages/gitmojis/src/gitmojis.json).
In order to comply with the CLA, you need to sign-off every commit.

# Branch rules
The current development branch is named using ``dev/[version number]``. Beyond that, any branch should start with ``feat/``.
The ``master`` branch contains the contents of the latest stable release. **Commits should never be pushed directly to the master branch except for merge conflicts!**

# Pre Check

Before you create a pull request, please check the following todo:

-   Pre commit hooks passed, please don't ignore it.
-   Keep linear history, use ``git pull --rebase`` to sync latest changes.
-   Build passed.
-   No debug output.
-   Make sure you have reviewed.

# License

By contributing to ClipCC, you agree that your contributions will be licensed under its AGPL-3.0 license and CLA.