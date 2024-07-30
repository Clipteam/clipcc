import { Component } from "react";


// Copied from clip-frontend-resurrection
interface SelfInfo {
    id: number;
    name: string;
    has_password: boolean;
    has_checkin: boolean;
    phone: string;
    email: string;
    avatar: string;
    bio: string;
    badge_type: number;
    badge_text: string;
    created_at: string;
    updated_at: string;
}

export interface WrappedGUIProps {
    id: string;
    authorId?: number;
    authorUsername?: string;
    authorThumbnailUrl?: string;
    backpackHost?: string;
    backpackVisible?: boolean;
    basePath: string;
    projectId?: number;
    projectTitle?: string;
    projectHost: string;
    canUseCloud?: boolean;
    hasCloudPermission?: boolean;
    cloudHost: string;
    assetHost: string;
    cdnHost: string;
    isShared?: boolean;
    canEditTitle?: boolean;
    canRemix?: boolean;
    canSave?: boolean;
    canShare?: boolean;
    canCreateNew?: boolean;
    userInfo?: SelfInfo;
    userToken?: string;
    userPermissions?: string[];
    enableCommunity?: boolean;
    isPlayerOnly?: boolean;
    guiWidth?: number;
    openSourceLevel?: number;
    onProjectLoaded? (): void;
    onVmInit? (vm: unknown): void;
    onStorageInit? (storage: unknown): void;
    onGreenFlag? (): void;
    onRef? (ref: unknown): void;
    onUpdateUserToken? (token: string): void;
}

declare class WrappedGUI extends Component<WrappedGUIProps> {}
