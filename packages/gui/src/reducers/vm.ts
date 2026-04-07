import type {AnyAction} from 'redux';
import VM from 'clipcc-vm';
import storage from '../lib/storage';
import type {BaseAction} from './common';

const SET_VM = 'scratch-gui/vm/SET_VM';
const defaultVM = new VM();
defaultVM.attachStorage(storage);
export type VmState = VM;

const initialState: VmState = defaultVM;

type SetVmAction = BaseAction<typeof SET_VM> & {
    vm: VM;
};

const reducer = function (state = initialState, action: AnyAction): VmState {
    switch (action.type) {
    case SET_VM:
        return action.vm;
    default:
        return state;
    }
};
const setVM = function (vm: VM): SetVmAction {
    return {
        type: SET_VM,
        vm: vm
    };
};

export {
    reducer as default,
    initialState as vmInitialState,
    setVM
};
