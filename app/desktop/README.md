# clipcc-desktop
ClipCC as a standalone desktop application.

## Installation

### From GitHub

See [Releases](https://github.com/Clipteam/clipcc/releases).
We always release the latest version on GitHub, please download it from there if you want to be up-to-date.

### From Package Managers

### WinGet (Windows users)

> The WinGet package is maintained by the community and may not be up-to-date.

On Windows, you can use winget to install ClipCC.

```powershell
winget install ClipTeam.ClipCC
```
### AUR (Arch Linux users)

> The WinGet package is maintained by the community and may not be up-to-date.

For Arch Linux users, you can install the AUR package [clipcc](https://aur.archlinux.org/packages/clipcc) or [clipcc-beta-bin](https://aur.archlinux.org/packages/clipcc-beta-bin):
```bash
yay -S clipcc
```
Or
```bash
yay -S clipcc-beta-bin
```
_Note that these two packages conflict with each other._

## Development

> Since desktop is placed in the monorepo, you need to set up the monorepo first. Please refer to the [contributing guide](/CONTRIBUTING.md) for instructions.
> All commands below are run in the root directory.

You need to fetch library assets from server for the first time and need to update them:
```bash
pnpm desktop fetch-library
```
If you need to start the development server, run:
```bash
pnpm desktop start
```
It will use webpack-dev-server to serve the renderer process and use regular webpack to build and electron to serve the main process. The renderer process will automatically reload when you make changes, and restart the electron process when you make changes to the main or preload part.

To build the application for development purposes, run:
```bash
pnpm desktop bundle:dev # or pnpm desktop bundle:dir
```
The build artifacts will be placed in `dist/win32-unpacked`.
For production build, run:
```bash
pnpm desktop bundle:dist
```

You may need a code signing certificate and modify `.env` to build the application for production. Please refer to the [code signing guide](https://www.electron.build/code-signing) for more details.
