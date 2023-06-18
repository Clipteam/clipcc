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

# Sync upstream

Since this project uses monorepo for code management, the only way to manually sync changes from upstream is through patching. Here is the basic procedure for syncing upstream changes:
## 1. generate patch
You need to manually generate a patch for a scratch repository, e.g. for ``scratch-gui``, I want to merge all changes from the ``allow-ts`` branch.   
To ensure that the original commit message is not lost, use ``git format-patch`` to generate the patch ([usage](https://git-scm.com/docs/git-format-patch)).   
We know from the commit history that the changes to this branch started with ``3a94170a``. So we use ``git format-patch 3a94170a`` to generate the patch.

## 2. Copy the patch to a separate directory and use the script to convert it
ClipCC comes with a basic patch conversion script. You can use this script to do the most basic processing of the patch file path and other information before you start.   
You can use ``yarn patch:convert [FOLDER_PATH] [PACKAGE_NAME]`` to convert all patch files in specific directory.   
Note that [PACKAGE_NAME] is the name of a subdirectory in the ``packages/`` directory, not the npm package name.   

## 3. Handle conflicts, then commit
In most cases, patches cannot be applied directly, and you will need to edit the patch to resolve conflicts.   
If you're not sure if the patch can be applied, you can use ``git apply --check [PATCH_PATH]`` to check.   
After all conflicts are resolved, you can use ``git am`` or ``git apply`` to apply the patch to the current branch.

# License

By contributing to ClipCC, you agree that your contributions will be licensed under its AGPL-3.0 license and CLA.