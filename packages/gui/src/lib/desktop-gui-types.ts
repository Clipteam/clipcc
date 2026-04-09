import type {ScratchStorage} from 'clipcc-storage';

export type DesktopAboutMenuItem = {
    title: string;
    onClick: () => void;
};

export type DesktopAboutMenu = (() => void) | DesktopAboutMenuItem[];

export type DesktopProjectTelemetryHandler = (event: string, metadata?: unknown) => void;

// @todo migrate src/component/gui.jsx to TypeScript and remove this file
export interface DesktopGuiInjectionProps {
    canEditTitle?: boolean;
    canModifyCloudData?: boolean;
    canSave?: boolean;
    isStandalone?: boolean;
    isScratchDesktop?: boolean;
    onClickAbout?: DesktopAboutMenu;
    onProjectTelemetryEvent?: DesktopProjectTelemetryHandler;
    onShowPrivacyPolicy?: () => Promise<void>;
    onStorageInit?: (storageInstance: ScratchStorage) => void;
    onUpdateProjectTitle?: (newTitle: string) => void;
}
