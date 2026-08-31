import type {BlockCommentState, proceduresSerializer} from 'clipcc-block';
import type RenderedTarget from '../sprites/rendered-target';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SB3Project {
    targets: SB3Target[];
    monitors?: SB3Monitor[];
    extensions?: string[];
    meta: SB3Meta;
    projectVersion: 3;
}

export interface SB3Meta {
    semver: string;
    vm: string;
    agent: string;
    origin?: string;
}

export type SB3Target = (SB3Stage | SB3Sprite) & {projectVersion: 3};

export interface SB3BaseTarget {
    isStage: boolean;
    name: string;
    variables: { [id: string]: SB3Variable };
    lists: { [id: string]: SB3List };
    broadcasts: { [id: string]: string };
    blocks: { [id: string]: SB3Block };
    comments: { [id: string]: SB3Comment };
    currentCostume: number;
    costumes: SB3Costume[];
    sounds: SB3Sound[];
    volume: number;
    layerOrder: number;
    tempo?: number;
    videoTransparency?: number;
    videoState?: 'on' | 'off' | 'on-flipped';
    textToSpeechLanguage?: string;
}

export interface SB3Stage extends SB3BaseTarget {
    isStage: true;
}

export interface SB3Sprite extends SB3BaseTarget {
    isStage: false;
    visible: boolean;
    x: number;
    y: number;
    size: number;
    direction: number;
    draggable: boolean;
    rotationStyle: 'all around' | 'left-right' | 'don\'t rotate';
}

/** [name, value, isCloud] */
export type SB3Variable = [string, string | number, true?];
/** [name, listItems] */
export type SB3List = [string, (string | number)[]];

export interface SB3Costume {
    assetId: string;
    name: string;
    bitmapResolution?: number;
    md5ext?: string;
    dataFormat: string;
    rotationCenterX?: number;
    rotationCenterY?: number;
}

export interface SB3Sound {
    assetId: string;
    name: string;
    dataFormat: string;
    format?: string;
    rate?: number;
    sampleCount?: number;
    md5ext?: string;
}

export type SB3Block = SB3ComplexBlock | SB3BlockPrimitive;

export interface SB3ComplexBlock {
    opcode: string;
    next?: string | null;
    parent?: string | null;
    inputs: { [name: string]: SB3Input };
    fields: { [name: string]: SB3Field };
    shadow: boolean;
    topLevel: boolean;
    x?: number;
    y?: number;
    mutation?: SB3Mutation;
    comment?: string;
}

/** 1: shadow, 2: no shadow, 3: obscured shadow */
export type SB3Input = [1 | 2 | 3, string | SB3BlockPrimitive];

/** [value, id] */
export type SB3Field = [string, string | null];

export interface SB3Mutation {
    tagName: string;
    /** XML children structure or similar? Usually serialized as properties on the object in JSON if not XML. */
    children: any[];
    /** In SB3 JSON, mutation is an object with properties corresponding to the XML attributes. */
    proccode?: string;
    argumentids?: string;
    argumentnames?: string;
    argumentdefaults?: string;
    warp?: string | boolean;
    hasnext?: string | boolean;
    [key: string]: any;
}

export type SB3BlockPrimitive =
    | SB3NumberPrimitive
    | SB3ColorPrimitive
    | SB3TextPrimitive
    | SB3BroadcastPrimitive
    | SB3VariablePrimitive
    | SB3ListPrimitive;

/** [type, value] */
export type SB3NumberPrimitive = [4 | 5 | 6 | 7 | 8, string | number];
/** [type, value] */
export type SB3ColorPrimitive = [9, string | number];
/** [type, value] */
export type SB3TextPrimitive = [10, string | number];
/** [type, name, id] */
export type SB3BroadcastPrimitive = [11, string, string];
/** [type, name, id, x, y] */
export type SB3VariablePrimitive = [12, string, string, number?, number?];
/** [type, name, id, x, y] */
export type SB3ListPrimitive = [13, string, string, number?, number?];

export interface SB3Comment {
    blockId?: string | null;
    x: number;
    y: number;
    width: number;
    height: number;
    minimized: boolean;
    text: string;
}

export interface SB3Monitor {
    id: string;
    mode: 'default' | 'large' | 'slider' | 'list';
    opcode: string;
    params: { [key: string]: any };
    spriteName?: string | null;
    value: string | number | any[];
    width: number;
    height: number;
    x: number;
    y: number;
    visible: boolean;
    sliderMin?: number;
    sliderMax?: number;
    isDiscrete?: boolean;
}

// --- SB3->VM intermediate data ---
export interface ImportedProject {
    /**
     * the imported Scratch 3.0 target objects.
     */
    targets: RenderedTarget[];
    /**
     * the ID of each extension actually used by this project.
     */
    extensions: ImportedExtensionsInfo;
}

export interface ImportedExtensionsInfo {
    /**
     * the ID of each extension actually in use by blocks in this project.
     */
    extensionIDs: Set<string>;
    /**
     * map of ID => URL from project metadata. May not match extensionIDs.
     */
    extensionURLs: Map<string, string>;
}

// --- VM runtime block presentation, used by engine/blocks and serialization/sb3. ---

export interface VMBlock {
    id: string;
    opcode: string;
    next: string | null;
    parent: string | null;
    inputs: Record<string, VMInput>;
    fields: Record<string, VMField>;
    shadow: boolean;
    topLevel: boolean;
    x?: number;
    y?: number;
    mutation?: VMMutation;
    comment?: string;
    commentData?: BlockCommentState;
    isMonitored?: boolean;
    targetId?: string | null;
}

export interface VMInput {
    name: string;
    block: string | null;
    shadow: string | null;
}

export interface VMField {
    name: string;
    value?: string;
    id?: string;
    variableType?: string;
}


/** The full procedure extra state for definition and prototypes. */
export type ProcedureMutation = proceduresSerializer.ProcedureExtraState;

export interface DynamicExtensionBlockMutation {
    blockInfo?: Record<string, unknown>;
}

/** General block mutation */
export type VMMutation = {
    tagName?: string;
    children?: VMMutation[];
    [key: string]: unknown;
};
