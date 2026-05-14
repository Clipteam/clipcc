import VirtualMachine from './virtual-machine';
import ArgumentType from './extension-support/argument-type';
import BlockType from './extension-support/block-type';

export default VirtualMachine;
export {ArgumentType, BlockType};

export * from './extension-support/extension-metadata';
export * as schema from './serialization/schema';
