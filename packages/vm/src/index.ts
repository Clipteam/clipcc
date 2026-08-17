import VirtualMachine from './virtual-machine';
import ArgumentType from './extension-support/argument-type';
import BlockType from './extension-support/block-type';

export default VirtualMachine;
export {ArgumentType, BlockType};

// Types
export type * as extensions from './extension-support/extension-metadata';
export type * as schema from './serialization/schema';
export type * as sprites from './sprites/';
export type * as engine from './engine/';
export type * from './virtual-machine';
