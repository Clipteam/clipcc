import type {ScratchStorage} from 'clipcc-storage';

export type GUIConfigFactory = () => GUIConfig;

export interface GUIConfig {
  storage: GUIStorage
}

export interface GUIStorage {
  scratchStorage: ScratchStorage;

  // Called multiple times (as changes happen)
  setProjectHost?(host: string): void;
  setProjectToken?(token: string): void;
  setProjectMetadata?(projectId: string | null | undefined): void;
  setAssetHost?(host: string): void;
  setTranslatorFunction?(formatMessageFn: TranslatorFunction): void;
  setBackpackHost?(host: string): void;

  saveProject(projectId: number | null | undefined, vmState: any, params: {
    // TODO: Not sure about this type
    originalId: string,
    isCopy: boolean,
    isRemix: boolean,
    title: string
  }): Promise<{ id: string | number }>;

  // TODO: saveProjectThumbnail()
  // TODO: backpacks
}

export type TranslatorFunction = (msgObj: MessageObject, options?: {index: number}) => string;

export interface MessageObject {
  id: string;
  description: string;
  defaultMessage: string;
}
