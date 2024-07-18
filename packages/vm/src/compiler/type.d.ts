interface IRBaseInst {
    opcode: string;
}

interface IRBinaryInst extends IRBaseInst {
    left: IRBaseInst;
    right: IRBaseInst;
}

interface IRConstant extends IRBaseInst {
    opcode: 'constant';
    value: any;
}

interface IRIdentifier extends IRBaseInst {
    opcode: 'identifier';
    name: string,
    id: string;
    scope: 'target' | 'stage';
}

interface IRWhileInst extends IRBaseInst {
    opcode: 'control.while';
    test: IRBaseInst;
    body: IRBaseInst[];
}

interface IRRepeatInst extends IRBaseInst {
    opcode: 'control.repeat';
    times: IRBaseInst;
    body: IRBaseInst[];
}

interface IRIfElseInst extends IRBaseInst {
    opcode: 'control.ifelse';
    test: IRBaseInst;
    consequent: IRBaseInst[];
    alternate: IRBaseInst[];
}

interface IRWaitInst extends IRBaseInst {
    opcode: 'control.wait';
    duration: IRBaseInst;
}

interface IRAddInst extends IRBinaryInst {
    opcode: 'op.add';
}

interface IRSubInst extends IRBinaryInst {
    opcode: 'op.sub';
}

interface IRLoadInst extends IRBaseInst {
    opcode: 'var.load';
    variable: IRIdentifier;
}

interface IRStoreInst extends IRBaseInst {
    opcode: 'var.store';
    variable: IRIdentifier;
    value: IRBaseInst;
}

type IRInst = IRConstant | IRIdentifier |
    IRWhileInst | IRRepeatInst | IRIfElseInst | IRWaitInst |
    IRAddInst | IRSubInst | IRLoadInst | IRStoreInst;
