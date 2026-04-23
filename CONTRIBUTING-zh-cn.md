[English Version](./CONTRIBUTING.md)

# 开发流程

> 我们使用 pnpm 作为默认包管理器。
> 请确保你的机器上已安装 Node.js 和 pnpm。

克隆 ClipCC 后，运行 `pnpm install` 安装依赖。

在开始之前:

1. 运行 `pnpm run build:full` 构建所有 ClipCC 相关包。
2. 运行 `pnpm run start` 启动开发服务器。
3. 访问 <http://localhost:8601/>。

# 命令

你可以使用以下快捷命令：

- `pnpm run start` 启动 GUI 开发服务器。
- `pnpm run test` 运行单元测试。
- `pnpm run build:full` 构建所有包。
- `pnpm run build:dist` 以生产模式构建所有包。
- `pnpm run translation:build` 构建翻译文件。
- `pnpm run translation:pull` 从远程拉取翻译。

如需执行特定包的命令，运行 `pnpm run [package-name] [command]`，例如 `pnpm gui start`，这是 `pnpm --filter [package-name] run [command]` 的别名。

# 提交 (Commit) 规范

1. 提交前，请使用 `pnpm changeset add` 为本次提交涉及的包添加 changeset。请严格遵循 <https://semver.org/> 中的规范。
2. 我们已配置 pre-commit hook。关于具体允许的 Gitmoji，请参考[此处](https://github.com/carloscuesta/gitmoji/blob/master/packages/gitmojis/src/gitmojis.json)。
3. 为遵守 CLA，每次提交都需要进行 Sign-Off。

# 分支规范

当前开发分支命名格式为 `dev/[版本号]`。除此之外，所有分支都应应该以 `[scope, 例如 feat, fix, chore]/[对分支内容的基本描述]` 开头。  
`master` 分支包含最新稳定版本的内容。**除处理合并冲突外，请勿直接向 master 分支推送提交！**  
当我们创建下一个主要版本的开发分支（例如 dev/3.2）时，需使用 `pnpm changeset pre enter next` 进入预发布模式。  
同样，在开发分支合并到 master 时，需要在发包之前使用 `pnpm changeset pre exit`。

# Pull Request 规范

创建 Pull Request 前，请核对以下事项：

- 通过了 pre-commit 钩子检查，请不要忽略它。
- 若 PR 已进入 review 阶段，尽可能避免使用 rebase 而是直接使用 merge commit 来合并上游更改/解决冲突，以方便追踪变更历史。
- 构建与 lint 检查已通过。
- 若为 bug 修复类 PR，请为其添加单元测试以防止问题再次发生。
- 对于较大的 PR，建议先创建 issue 与我们讨论后再开始开发，并将其拆分为小块以便审查。
- 请确保你已自行审查代码，并为审查者提供充分的描述（遵循 PR 模板）。如果你使用了 AI 工具辅助编写代码，请务必仔细审查相关代码，并在 PR 描述中明确说明，同时附上所使用的提示词。

# 许可证

在向 ClipCC 贡献代码前，请先签署贡献者许可协议（CLA）。
