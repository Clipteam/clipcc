enum BlockType {
    COMMAND = 1,
    REPORTER = 2,
    BOOLEAN = 3,
    HAT = 5
}

enum ParameterType {
    NUMBER = 1,
    STRING = 2,
    BOOLEAN = 3,
    COLOR = 5,
    MATRIX = 6,
    NOTE = 7,
    ANGLE = 8
}

enum FilterType {
    SPRITE = 'sprite',
    STAGE = 'stage'
}

export {
    BlockType,
    ParameterType,
    FilterType
}
