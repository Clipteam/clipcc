import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const OPEN_MENU = 'scratch-gui/menus/OPEN_MENU';
const CLOSE_MENU = 'scratch-gui/menus/CLOSE_MENU';

const MENU_ABOUT = 'aboutMenu';
const MENU_ACCOUNT = 'accountMenu';
const MENU_EDIT = 'editMenu';
const MENU_FILE = 'fileMenu';
const MENU_LANGUAGE = 'languageMenu';
const MENU_LOGIN = 'loginMenu';
const MENU_MODE = 'modeMenu';
const MENU_SETTINGS = 'settingsMenu';
const MENU_THEME = 'themeMenu';
const MENU_FPS = 'fpsMenu';

type MenuName =
    | typeof MENU_ABOUT
    | typeof MENU_ACCOUNT
    | typeof MENU_EDIT
    | typeof MENU_FILE
    | typeof MENU_LANGUAGE
    | typeof MENU_LOGIN
    | typeof MENU_MODE
    | typeof MENU_SETTINGS
    | typeof MENU_THEME
    | typeof MENU_FPS;

class Menu {
    id: string;
    children: Menu[];
    parent: Menu | null;

    constructor (id: string) {
        this.id = id;
        this.children = [];
        this.parent = null;
    }

    addChild (menu: Menu): Menu {
        this.children.push(menu);
        menu.parent = this;
        return this;
    }

    descendants (): Menu[] {
        return this.children.flatMap(child => [child, ...child.descendants()]);
    }

    siblings (): Menu[] {
        if (!this.parent) return [];

        return this.parent.children.filter(child => child.id !== this.id);
    }

    findById (id: string): Menu | null {
        if (this.id === id) return this;

        for (const child of this.children) {
            const found = child.findById(id);
            if (found) return found;
        }

        return null;
    }
}

// Structure of nested menus, used for collapsing submenus logic.
const rootMenu = new Menu('root')
    .addChild(
        new Menu(MENU_SETTINGS)
            .addChild(new Menu(MENU_LANGUAGE))
            .addChild(new Menu(MENU_FPS))
            .addChild(new Menu(MENU_THEME))
    )
    .addChild(new Menu(MENU_FILE))
    .addChild(new Menu(MENU_EDIT))
    .addChild(new Menu(MENU_MODE))
    .addChild(new Menu(MENU_SETTINGS))
    .addChild(new Menu(MENU_LOGIN))
    .addChild(new Menu(MENU_ACCOUNT))
    .addChild(new Menu(MENU_ABOUT));

export type MenusState = Record<MenuName, boolean>;

const initialState: MenusState = {
    [MENU_ABOUT]: false,
    [MENU_ACCOUNT]: false,
    [MENU_EDIT]: false,
    [MENU_FILE]: false,
    [MENU_LANGUAGE]: false,
    [MENU_LOGIN]: false,
    [MENU_MODE]: false,
    [MENU_SETTINGS]: false,
    [MENU_THEME]: false,
    [MENU_FPS]: false
};

type OpenMenuAction = BaseAction<typeof OPEN_MENU> & {
    menu: MenuName;
};

type CloseMenuAction = BaseAction<typeof CLOSE_MENU> & {
    menu: MenuName;
};

const reducer = function (state: MenusState = initialState, action: AnyAction): MenusState {
    switch (action.type) {
    case OPEN_MENU: {
        const menu = rootMenu.findById(action.menu);
        if (!menu) return state;
        // Close siblings when opening a menu
        const toClose = menu.siblings().flatMap(sibling => [sibling, ...sibling.descendants()]);

        return {
            ...state,
            [action.menu]: true,
            ...Object.fromEntries(toClose.map(({id}) => [id, false]))
        };
    }
    case CLOSE_MENU: {
        const menu = rootMenu.findById(action.menu);
        if (!menu) return state;
        // Close this menu and any submenus
        const toClose = [menu, ...menu.descendants()];

        return {
            ...state,
            ...Object.fromEntries(toClose.map(({id}) => [id, false]))
        };
    }
    default:
        return state;
    }
};
const openMenu = (menu: MenuName): OpenMenuAction => ({
    type: OPEN_MENU,
    menu: menu
});
const closeMenu = (menu: MenuName): CloseMenuAction => ({
    type: CLOSE_MENU,
    menu: menu
});

const openAboutMenu = (): OpenMenuAction => openMenu(MENU_ABOUT);
const closeAboutMenu = (): CloseMenuAction => closeMenu(MENU_ABOUT);
const aboutMenuOpen = (state: {scratchGui: {menus: MenusState}}): boolean => state.scratchGui.menus[MENU_ABOUT];

const openAccountMenu = (): OpenMenuAction => openMenu(MENU_ACCOUNT);
const closeAccountMenu = (): CloseMenuAction => closeMenu(MENU_ACCOUNT);
const accountMenuOpen = (state: {scratchGui: {menus: MenusState}}): boolean => state.scratchGui.menus[MENU_ACCOUNT];

const openEditMenu = (): OpenMenuAction => openMenu(MENU_EDIT);
const closeEditMenu = (): CloseMenuAction => closeMenu(MENU_EDIT);
const editMenuOpen = (state: {scratchGui: {menus: MenusState}}): boolean => state.scratchGui.menus[MENU_EDIT];

const openFileMenu = (): OpenMenuAction => openMenu(MENU_FILE);
const closeFileMenu = (): CloseMenuAction => closeMenu(MENU_FILE);
const fileMenuOpen = (state: {scratchGui: {menus: MenusState}}): boolean => state.scratchGui.menus[MENU_FILE];

const openLanguageMenu = (): OpenMenuAction => openMenu(MENU_LANGUAGE);
const closeLanguageMenu = (): CloseMenuAction => closeMenu(MENU_LANGUAGE);
const languageMenuOpen = (state: {scratchGui: {menus: MenusState}}): boolean => state.scratchGui.menus[MENU_LANGUAGE];

const openFpsMenu = (): OpenMenuAction => openMenu(MENU_FPS);
const closeFpsMenu = (): CloseMenuAction => closeMenu(MENU_FPS);
const fpsMenuOpen = (state: {scratchGui: {menus: MenusState}}): boolean => state.scratchGui.menus[MENU_FPS];

const openLoginMenu = (): OpenMenuAction => openMenu(MENU_LOGIN);
const closeLoginMenu = (): CloseMenuAction => closeMenu(MENU_LOGIN);
const loginMenuOpen = (state: {scratchGui: {menus: MenusState}}): boolean => state.scratchGui.menus[MENU_LOGIN];

const openModeMenu = (): OpenMenuAction => openMenu(MENU_MODE);
const closeModeMenu = (): CloseMenuAction => closeMenu(MENU_MODE);
const modeMenuOpen = (state: {scratchGui: {menus: MenusState}}): boolean => state.scratchGui.menus[MENU_MODE];

const openSettingsMenu = (): OpenMenuAction => openMenu(MENU_SETTINGS);
const closeSettingsMenu = (): CloseMenuAction => closeMenu(MENU_SETTINGS);
const settingsMenuOpen = (state: {scratchGui: {menus: MenusState}}): boolean => state.scratchGui.menus[MENU_SETTINGS];

const openThemeMenu = (): OpenMenuAction => openMenu(MENU_THEME);
const closeThemeMenu = (): CloseMenuAction => closeMenu(MENU_THEME);
const themeMenuOpen = (state: {scratchGui: {menus: MenusState}}): boolean => state.scratchGui.menus[MENU_THEME];

export {
    reducer as default,
    initialState as menuInitialState,
    openAboutMenu,
    closeAboutMenu,
    aboutMenuOpen,
    openAccountMenu,
    closeAccountMenu,
    accountMenuOpen,
    openEditMenu,
    closeEditMenu,
    editMenuOpen,
    openFileMenu,
    closeFileMenu,
    fileMenuOpen,
    openLanguageMenu,
    closeLanguageMenu,
    languageMenuOpen,
    openFpsMenu,
    closeFpsMenu,
    fpsMenuOpen,
    openLoginMenu,
    closeLoginMenu,
    loginMenuOpen,
    openModeMenu,
    closeModeMenu,
    modeMenuOpen,
    openSettingsMenu,
    closeSettingsMenu,
    settingsMenuOpen,
    openThemeMenu,
    closeThemeMenu,
    themeMenuOpen
};
