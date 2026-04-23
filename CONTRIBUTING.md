[中文版本](./CONTRIBUTING-zh-cn.md)

# Development Workflow

> We use pnpm as default package manager.
> Please make sure you have Node.js and pnpm installed on your machine.

After cloning ClipCC, run `pnpm install` to install dependencies.

To get started:

1. Run `pnpm run build:full` to build all clipcc-related packages.
2. Run `pnpm run start` to launch the dev server.
3. See <http://localhost:8601/>.

# Commands

You can run several commands as shortcuts:

- `pnpm run start` Start the GUI's dev-server.
- `pnpm run test` Run unit tests.
- `pnpm run build:full` Runs build for all packages.
- `pnpm run build:dist` Runs build for all packages in production mode.
- `pnpm run translation:build` Runs build for translation.
- `pnpm run translation:pull` Pull translation from remote.

For package specific command, just run `pnpm run [package-name] [command]` like `pnpm gui start`. It's an alias of `pnpm --filter [package-name] run [command]`.

# Commit Rules

1. Before committing, you need use ``pnpm changeset add`` to add changesets for the packages involved in the commit changes. Please strictly follow the regulations in <https://semver.org/>.
2. We have set up pre-commit hook. For the use of gitmoji, please refer to [here](https://github.com/carloscuesta/gitmoji/blob/master/packages/gitmojis/src/gitmojis.json).
3. In order to comply with the CLA, you need to sign-off every commit.

# Branch Rules

The current development branch is named using ``dev/[version number]``. Beyond that, any branch should start with ``[scope, e.g., feat, fix, chore]/[brief description]``.   
The ``master`` branch contains the contents of the latest stable release. **Commits should never be pushed directly to the master branch except for handling merge conflicts!**   
When we create the next major version of the development branch (Eg: dev/3.2) we need to use ``pnpm changeset pre enter next`` to enter prerelease mode.   
Similarly, when the development branch is merged to master, we need to use ``pnpm changeset pre exit`` before releasing the package.

# Pull-Request Rules

Before you create a pull request, please check the following todo:

- Pre commit hooks passed, don't ignore it.
- If the PR has been ready-for-review, avoid using rebase and use merge commit to merge upstream changes or fix conflicts for better tracking of change history.
- Build and lint passed.
- No debug output.
- If there's a bug-fix pull request, add unit test to prevent regression.
- For large pull request, we recommend you to create a issue first and discuss with us before working on it, And split it into small pieces for easier review.
- Make sure you have reviewed by yourself and provides enough description for reviewers (follow the PR template). If you use AI tools to help you write code, please make sure to review the code carefully and explicitly mention it and provides prompts in the PR description.

# License

By contributing to ClipCC, please sign the Contributor License Agreement first (CLA).
