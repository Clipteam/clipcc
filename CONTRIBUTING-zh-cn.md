[English version](./CONTRIBUTING.md)
# 开发流程

> 我们使用 Yarn(classic) 作为默认包管理器。
> 请确保你已经在电脑上安装了 Python3， Node.js and Yarn。

在克隆了 ClipCC 后， 执行 `yarn install` 来安装依赖。

在开始之前:

1. 运行 `yarn run build:full` 来编译所有与 ClipCC 相关的包。
2. 运行 `yarn run start` 来启动开发服务器。
3. 打开 http://localhost:8601/.

# 指令

你可以运行以下命令:

-   `yarn run start` 启动 GUI 部分开发服务器。
-   `yarn run test` 运行单元测试。
-   `yarn run build:full` 编译所有包。
-   `yarn run build:dist` 以生产模式编译所有包。
-   `translation:build` 生成翻译文件。
-   `yarn run translation:pull` 从远程拉取翻译。

# 提交规则
我们已经设置了 pre-commit 钩子。有关 Gitmoji 的使用，请参见[这里](https://github.com/carloscuesta/gitmoji/blob/master/packages/gitmojis/src/gitmojis.json).
为了遵守开发者贡献协议(CLA)， 你需要签出(sign-off)你的每一个 commit。

# 分支规则
当前开发分支以 ``dev/[version number]`` 的方式进行命名。除此之外，任何分支都应该以 ``feat/`` 作为命名开头。
``master``分支包含最新稳定版本的内容。 **除了处理合并冲突以外，任何时候都不应该直接将 commit 推送到该分支！**

# Pull-Request 规则

在创建一个 pull request 之前，请确保以下事项：

-   确保通过了 Pre commit 钩子，请不要忽视它。
-   确保线性历史，请使用 ``git pull --rebase`` 来同步最新更改。
-   编译通过。
-   没有调试输出。
-   如果这是一个漏洞修复相关的 pull request，请为它添加单元测试。
-   确保你已经 review 过一遍代码。

# 许可证

为 ClipCC 做贡献之前，您需要同意您的贡献将根据其 AGPL-3.0 许可证和开发者贡献协议(CLA)许可给 Clipteam。