[中文版本](./CONTRIBUTING-zh-cn.md)
# Development Workflow

> We use Yarn(classic) as default package manager.
> Please make sure you have Python3, Node.js and Yarn installed on your machine.

After cloning ClipCC, run `yarn install` to install dependencies.

To get started:

1. Run `yarn run build:full` to build all clipcc-related packages.
2. Run `yarn run start` to launch the dev server.
3. See http://localhost:8601/.

# Commands

You can run several commands:

-   `yarn run start` Start the GUI's dev-server.
-   `yarn run test` Run unit tests.
-   `yarn run build:full` Runs build for all packages.
-   `yarn run build:dist` Runs build for all packages in production mode.
-   `translation:build` Runs build for translation.
-   `yarn run translation:pull` Pull translation from remote.

# Commit Rules
1. Before committing, you need use ``yarn changeset add`` to add changesets for the packages involved in the commit changes. Please strictly follow the regulations in https://semver.org/.
2. We have set up pre-commit hook. For the use of gitmoji, please refer to [here](https://github.com/carloscuesta/gitmoji/blob/master/packages/gitmojis/src/gitmojis.json).
3. In order to comply with the CLA, you need to sign-off every commit.

# Branch Rules
The current development branch is named using ``dev/[version number]``. Beyond that, any branch should start with ``feat/``.   
The ``master`` branch contains the contents of the latest stable release. **Commits should never be pushed directly to the master branch except for handling merge conflicts!**   
When we create the next major version of the development branch (Eg: dev/3.2) we need to use ``yarn changeset pre enter next`` to enter prerelease mode.   
Similarly, when the development branch is merged to master, we need to use ``yarn changeset pre exit`` before releasing the package.

# Pull-Request Rules

Before you create a pull request, please check the following todo:

-   Pre commit hooks passed, please don't ignore it.
-   Keep linear history, use ``git pull --rebase`` to sync latest changes.
-   Build passed.
-   No debug output.
-   If there's a bug-fix pull request, add unit test for it.
-   Make sure you have reviewed.

# License

By contributing to ClipCC, you agree that your contributions will be licensed under its AGPL-3.0 license and CLA.