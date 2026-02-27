/* eslint-disable no-unused-vars */

import * as ScratchBlocks from 'clipcc-block';

const blockSeparator = {
    kind: 'sep',
    gap: 36
};

/**
 * Create shadow input object for JSON toolbox
 * @param {string} type - The type of the shadow block
 * @param {object} [fields] - Field definitions
 * @returns {object} Shadow object
 */
const createShadow = (type, fields) => {
    if (fields) {
        return {
            shadow: {
                type,
                fields
            }
        };
    }
    return {
        shadow: {
            type
        }
    };
};

const motion = (isInitialSetup, isStage, targetId) => {
    const stageSelected = ScratchBlocks.Msg.MOTION_STAGE_SELECTED;

    const motionContents = [];
    if (isStage) {
        motionContents.push({
            kind: 'label',
            text: stageSelected
        });
    } else {
        motionContents.push(
            {
                kind: 'block',
                type: 'motion_movesteps',
                inputs: {
                    STEPS: createShadow('math_number', {NUM: 10})
                }
            },
            {
                kind: 'block',
                type: 'motion_turnright',
                inputs: {
                    DEGREES: createShadow('math_number', {NUM: 15})
                }
            },
            {
                kind: 'block',
                type: 'motion_turnleft',
                inputs: {
                    DEGREES: createShadow('math_number', {NUM: 15})
                }
            },
            blockSeparator,
            {
                kind: 'block',
                type: 'motion_goto',
                inputs: {
                    TO: {shadow: {type: 'motion_goto_menu'}}
                }
            },
            {
                kind: 'block',
                type: 'motion_gotoxy',
                inputs: {
                    X: createShadow('math_number', {NUM: 0}),
                    Y: createShadow('math_number', {NUM: 0})
                }
            },
            {
                kind: 'block',
                type: 'motion_glideto',
                inputs: {
                    SECS: createShadow('math_number', {NUM: 1}),
                    TO: {shadow: {type: 'motion_glideto_menu'}}
                }
            },
            {
                kind: 'block',
                type: 'motion_glidesecstoxy',
                inputs: {
                    SECS: createShadow('math_number', {NUM: 1}),
                    X: createShadow('math_number', {NUM: 0}),
                    Y: createShadow('math_number', {NUM: 0})
                }
            },
            blockSeparator,
            {
                kind: 'block',
                type: 'motion_pointindirection',
                inputs: {
                    DIRECTION: createShadow('math_angle', {NUM: 90})
                }
            },
            {
                kind: 'block',
                type: 'motion_pointtowards',
                inputs: {
                    TOWARDS: {shadow: {type: 'motion_pointtowards_menu'}}
                }
            },
            blockSeparator,
            {
                kind: 'block',
                type: 'motion_changexby',
                inputs: {
                    DX: createShadow('math_number', {NUM: 10})
                }
            },
            {
                kind: 'block',
                type: 'motion_setx',
                inputs: {
                    X: createShadow('math_number', {NUM: 0})
                }
            },
            {
                kind: 'block',
                type: 'motion_changeyby',
                inputs: {
                    DY: createShadow('math_number', {NUM: 10})
                }
            },
            {
                kind: 'block',
                type: 'motion_sety',
                inputs: {
                    Y: createShadow('math_number', {NUM: 0})
                }
            },
            blockSeparator,
            {kind: 'block', type: 'motion_ifonedgebounce'},
            blockSeparator,
            {kind: 'block', type: 'motion_setrotationstyle'},
            blockSeparator,
            {kind: 'block', type: 'motion_xposition', id: `${targetId}_xposition`},
            {kind: 'block', type: 'motion_yposition', id: `${targetId}_yposition`},
            {kind: 'block', type: 'motion_direction', id: `${targetId}_direction`}
        );
    }

    return {
        kind: 'category',
        name: '%{BKY_CATEGORY_MOTION}',
        categorystyle: 'motion',
        contents: motionContents
    };
};

const looks = (isInitialSetup, isStage, targetId, costumeName, backdropName) => {
    const hello = ScratchBlocks.Msg.LOOKS_HELLO;
    const hmm = ScratchBlocks.Msg.LOOKS_HMM;

    const looksContents = [];

    if (!isStage) {
        looksContents.push(
            {
                kind: 'block',
                type: 'looks_sayforsecs',
                inputs: {
                    MESSAGE: createShadow('text', {TEXT: hello}),
                    SECS: createShadow('math_number', {NUM: 2})
                }
            },
            {
                kind: 'block',
                type: 'looks_say',
                inputs: {
                    MESSAGE: createShadow('text', {TEXT: hello})
                }
            },
            {
                kind: 'block',
                type: 'looks_thinkforsecs',
                inputs: {
                    MESSAGE: createShadow('text', {TEXT: hmm}),
                    SECS: createShadow('math_number', {NUM: 2})
                }
            },
            {
                kind: 'block',
                type: 'looks_think',
                inputs: {
                    MESSAGE: createShadow('text', {TEXT: hmm})
                }
            },
            blockSeparator
        );
    }

    if (isStage) {
        looksContents.push(
            {
                kind: 'block',
                type: 'looks_switchbackdropto',
                inputs: {
                    BACKDROP: createShadow('looks_backdrops', {BACKDROP: backdropName})
                }
            },
            {
                kind: 'block',
                type: 'looks_switchbackdroptoandwait',
                inputs: {
                    BACKDROP: createShadow('looks_backdrops', {BACKDROP: backdropName})
                }
            },
            {kind: 'block', type: 'looks_nextbackdrop'}
        );
    } else {
        looksContents.push(
            {
                kind: 'block',
                type: 'looks_switchcostumeto',
                id: `${targetId}_switchcostumeto`,
                inputs: {
                    COSTUME: createShadow('looks_costume', {COSTUME: costumeName})
                }
            },
            {kind: 'block', type: 'looks_nextcostume'},
            {
                kind: 'block',
                type: 'looks_switchbackdropto',
                inputs: {
                    BACKDROP: createShadow('looks_backdrops', {BACKDROP: backdropName})
                }
            },
            {kind: 'block', type: 'looks_nextbackdrop'},
            blockSeparator,
            {
                kind: 'block',
                type: 'looks_changesizeby',
                inputs: {
                    CHANGE: createShadow('math_number', {NUM: 10})
                }
            },
            {
                kind: 'block',
                type: 'looks_setsizeto',
                inputs: {
                    SIZE: createShadow('math_number', {NUM: 100})
                }
            }
        );
    }

    looksContents.push(
        blockSeparator,
        {
            kind: 'block',
            type: 'looks_changeeffectby',
            inputs: {
                CHANGE: createShadow('math_number', {NUM: 25})
            }
        },
        {
            kind: 'block',
            type: 'looks_seteffectto',
            inputs: {
                VALUE: createShadow('math_number', {NUM: 0})
            }
        },
        {kind: 'block', type: 'looks_cleargraphiceffects'},
        blockSeparator
    );

    if (!isStage) {
        looksContents.push(
            {kind: 'block', type: 'looks_show'},
            {kind: 'block', type: 'looks_hide'},
            blockSeparator,
            {kind: 'block', type: 'looks_gotofrontback'},
            {
                kind: 'block',
                type: 'looks_goforwardbackwardlayers',
                inputs: {
                    NUM: createShadow('math_integer', {NUM: 1})
                }
            }
        );
    }

    if (isStage) {
        looksContents.push(
            {kind: 'block', type: 'looks_backdropnumbername', id: 'backdropnumbername'}
        );
    } else {
        looksContents.push(
            {kind: 'block', type: 'looks_costumenumbername', id: `${targetId}_costumenumbername`},
            {kind: 'block', type: 'looks_backdropnumbername', id: 'backdropnumbername'},
            {kind: 'block', type: 'looks_size', id: `${targetId}_size`}
        );
    }

    return {
        kind: 'category',
        name: '%{BKY_CATEGORY_LOOKS}',
        categorystyle: 'looks',
        contents: looksContents
    };
};

const sound = (isInitialSetup, isStage, targetId, soundName) => ({
    kind: 'category',
    name: '%{BKY_CATEGORY_SOUND}',
    categorystyle: 'sounds',
    contents: [
        {
            kind: 'block',
            type: 'sound_playuntildone',
            id: `${targetId}_sound_playuntildone`,
            inputs: {
                SOUND_MENU: createShadow('sound_sounds_menu', {SOUND_MENU: soundName})
            }
        },
        {
            kind: 'block',
            type: 'sound_play',
            id: `${targetId}_sound_play`,
            inputs: {
                SOUND_MENU: createShadow('sound_sounds_menu', {SOUND_MENU: soundName})
            }
        },
        {kind: 'block', type: 'sound_stopallsounds'},
        blockSeparator,
        {
            kind: 'block',
            type: 'sound_changeeffectby',
            inputs: {
                VALUE: createShadow('math_number', {NUM: 10})
            }
        },
        {
            kind: 'block',
            type: 'sound_seteffectto',
            inputs: {
                VALUE: createShadow('math_number', {NUM: 100})
            }
        },
        {kind: 'block', type: 'sound_cleareffects'},
        blockSeparator,
        {
            kind: 'block',
            type: 'sound_changevolumeby',
            inputs: {
                VOLUME: createShadow('math_number', {NUM: -10})
            }
        },
        {
            kind: 'block',
            type: 'sound_setvolumeto',
            inputs: {
                VOLUME: createShadow('math_number', {NUM: 100})
            }
        },
        {kind: 'block', type: 'sound_volume', id: `${targetId}_volume`}
    ]
});

const events = (isInitialSetup, isStage, targetId) => {
    const eventsContents = [
        {kind: 'block', type: 'event_whenflagclicked'},
        {kind: 'block', type: 'event_whenkeypressed'}
    ];

    if (isStage) {
        eventsContents.push({kind: 'block', type: 'event_whenstageclicked'});
    } else {
        eventsContents.push({kind: 'block', type: 'event_whenthisspriteclicked'});
    }

    eventsContents.push(
        {kind: 'block', type: 'event_whenbackdropswitchesto'},
        blockSeparator,
        {
            kind: 'block',
            type: 'event_whengreaterthan',
            inputs: {
                VALUE: createShadow('math_number', {NUM: 10})
            }
        },
        blockSeparator,
        {kind: 'block', type: 'event_whenbroadcastreceived'},
        {
            kind: 'block',
            type: 'event_broadcast',
            inputs: {
                BROADCAST_INPUT: {shadow: {type: 'event_broadcast_menu'}}
            }
        },
        {
            kind: 'block',
            type: 'event_broadcastandwait',
            inputs: {
                BROADCAST_INPUT: {shadow: {type: 'event_broadcast_menu'}}
            }
        }
    );

    return {
        kind: 'category',
        name: '%{BKY_CATEGORY_EVENTS}',
        categorystyle: 'event',
        contents: eventsContents
    };
};

const control = (isInitialSetup, isStage, targetId) => {
    const controlContents = [
        {
            kind: 'block',
            type: 'control_wait',
            inputs: {
                DURATION: createShadow('math_positive_number', {NUM: 1})
            }
        },
        blockSeparator,
        {
            kind: 'block',
            type: 'control_repeat',
            inputs: {
                TIMES: createShadow('math_whole_number', {NUM: 10})
            }
        },
        {kind: 'block', type: 'control_forever', id: 'forever'},
        blockSeparator,
        {kind: 'block', type: 'control_if'},
        {kind: 'block', type: 'control_if_else'},
        {kind: 'block', type: 'control_wait_until', id: 'wait_until'},
        {kind: 'block', type: 'control_repeat_until', id: 'repeat_until'},
        blockSeparator,
        {kind: 'block', type: 'control_stop'},
        blockSeparator
    ];

    if (isStage) {
        controlContents.push({
            kind: 'block',
            type: 'control_create_clone_of',
            inputs: {
                CLONE_OPTION: {shadow: {type: 'control_create_clone_of_menu'}}
            }
        });
    } else {
        controlContents.push(
            {kind: 'block', type: 'control_start_as_clone'},
            {
                kind: 'block',
                type: 'control_create_clone_of',
                inputs: {
                    CLONE_OPTION: {shadow: {type: 'control_create_clone_of_menu'}}
                }
            },
            {kind: 'block', type: 'control_delete_this_clone'}
        );
    }

    return {
        kind: 'category',
        name: '%{BKY_CATEGORY_CONTROL}',
        categorystyle: 'control',
        contents: controlContents
    };
};

const sensing = (isInitialSetup, isStage, targetId, hideNonVanillaBlocks) => {
    const name = ScratchBlocks.Msg.SENSING_ASK_TEXT;

    const sensingContents = [];

    if (!isStage) {
        sensingContents.push(
            {
                kind: 'block',
                type: 'sensing_touchingobject',
                inputs: {
                    TOUCHINGOBJECTMENU: {shadow: {type: 'sensing_touchingobjectmenu'}}
                }
            },
            {
                kind: 'block',
                type: 'sensing_touchingcolor',
                inputs: {
                    COLOR: {shadow: {type: 'colour_picker'}}
                }
            },
            {
                kind: 'block',
                type: 'sensing_coloristouchingcolor',
                inputs: {
                    COLOR: {shadow: {type: 'colour_picker'}},
                    COLOR2: {shadow: {type: 'colour_picker'}}
                }
            },
            {
                kind: 'block',
                type: 'sensing_distanceto',
                inputs: {
                    DISTANCETOMENU: {shadow: {type: 'sensing_distancetomenu'}}
                }
            },
            blockSeparator
        );
    }

    if (!hideNonVanillaBlocks) {
        sensingContents.push(
            {
                kind: 'block',
                type: 'sensing_distancebetweenposition',
                inputs: {
                    X1: createShadow('math_number', {NUM: 0}),
                    Y1: createShadow('math_number', {NUM: 0}),
                    X2: createShadow('math_number', {NUM: 1}),
                    Y2: createShadow('math_number', {NUM: 1})
                }
            },
            {
                kind: 'block',
                type: 'sensing_directionbetweenposition',
                inputs: {
                    X1: createShadow('math_number', {NUM: 0}),
                    Y1: createShadow('math_number', {NUM: 0}),
                    X2: createShadow('math_number', {NUM: 1}),
                    Y2: createShadow('math_number', {NUM: 1})
                }
            },
            {
                kind: 'block',
                type: 'sensing_colorat',
                inputs: {
                    X: createShadow('math_number', {NUM: 0}),
                    Y: createShadow('math_number', {NUM: 0})
                }
            },
            blockSeparator
        );
    }

    if (!isInitialSetup) {
        sensingContents.push({
            kind: 'block',
            type: 'sensing_askandwait',
            id: 'askandwait',
            inputs: {
                QUESTION: createShadow('text', {TEXT: name})
            }
        });
    }

    sensingContents.push(
        {kind: 'block', type: 'sensing_answer', id: 'answer'},
        blockSeparator,
        {
            kind: 'block',
            type: 'sensing_keypressed',
            inputs: {
                KEY_OPTION: {shadow: {type: 'sensing_keyoptions'}}
            }
        },
        {kind: 'block', type: 'sensing_mousedown'}
    );

    if (!hideNonVanillaBlocks) {
        sensingContents.push({
            kind: 'block',
            type: 'sensing_mousepressed',
            inputs: {
                MOUSE_OPTION: {shadow: {type: 'sensing_mouseoptions'}}
            }
        });
    }

    sensingContents.push(
        {kind: 'block', type: 'sensing_mousex'},
        {kind: 'block', type: 'sensing_mousey'}
    );

    if (!hideNonVanillaBlocks) {
        sensingContents.push(
            {kind: 'block', type: 'sensing_joystick_distance'},
            {kind: 'block', type: 'sensing_joystickx'},
            {kind: 'block', type: 'sensing_joysticky'}
        );
    }

    if (!isStage) {
        sensingContents.push(blockSeparator);
        sensingContents.push({kind: 'block', type: 'sensing_setdragmode', id: 'sensing_setdragmode'});
        sensingContents.push(blockSeparator);
    }

    sensingContents.push(
        blockSeparator,
        {kind: 'block', type: 'sensing_loudness', id: 'loudness'}
    );

    sensingContents.push(
        blockSeparator,
        {kind: 'block', type: 'sensing_timer', id: 'timer'},
        {kind: 'block', type: 'sensing_resettimer'},
        blockSeparator,
        {
            kind: 'block',
            type: 'sensing_of',
            id: 'of',
            inputs: {
                OBJECT: {shadow: {type: 'sensing_of_object_menu', id: 'sensing_of_object_menu'}}
            }
        },
        blockSeparator,
        {kind: 'block', type: 'sensing_current', id: 'current'},
        {kind: 'block', type: 'sensing_dayssince2000'},
        blockSeparator,
        {kind: 'block', type: 'sensing_username'}
    );

    if (!hideNonVanillaBlocks) {
        sensingContents.push(
            blockSeparator,
            {kind: 'block', type: 'sensing_operatingsystem'},
            {kind: 'block', type: 'sensing_clipcc_version'},
            blockSeparator,
            {kind: 'block', type: 'sensing_isturbomode'},
            {kind: 'block', type: 'sensing_turnonturbomode'},
            {kind: 'block', type: 'sensing_turnoffturbomode'}
        );
    }

    return {
        kind: 'category',
        name: '%{BKY_CATEGORY_SENSING}',
        categorystyle: 'sensing',
        contents: sensingContents
    };
};

const operators = (isInitialSetup, isStage, targetId, hideNonVanillaBlocks) => {
    const apple = ScratchBlocks.Msg.OPERATORS_JOIN_APPLE;
    const banana = ScratchBlocks.Msg.OPERATORS_JOIN_BANANA;
    const letter = ScratchBlocks.Msg.OPERATORS_LETTEROF_APPLE;

    const operatorsContents = [
        {
            kind: 'block',
            type: 'operator_add',
            inputs: {
                NUM1: createShadow('math_number'),
                NUM2: createShadow('math_number')
            }
        },
        {
            kind: 'block',
            type: 'operator_subtract',
            inputs: {
                NUM1: createShadow('math_number'),
                NUM2: createShadow('math_number')
            }
        },
        {
            kind: 'block',
            type: 'operator_multiply',
            inputs: {
                NUM1: createShadow('math_number'),
                NUM2: createShadow('math_number')
            }
        },
        {
            kind: 'block',
            type: 'operator_divide',
            inputs: {
                NUM1: createShadow('math_number'),
                NUM2: createShadow('math_number')
            }
        }
    ];

    if (!hideNonVanillaBlocks) {
        operatorsContents.push(
            {
                kind: 'block',
                type: 'operator_power',
                inputs: {
                    NUM1: createShadow('math_number'),
                    NUM2: createShadow('math_number')
                }
            },
            {
                kind: 'block',
                type: 'operator_bitand',
                inputs: {
                    NUM1: createShadow('math_number'),
                    NUM2: createShadow('math_number')
                }
            },
            {
                kind: 'block',
                type: 'operator_bitor',
                inputs: {
                    NUM1: createShadow('math_number'),
                    NUM2: createShadow('math_number')
                }
            },
            {
                kind: 'block',
                type: 'operator_bitxor',
                inputs: {
                    NUM1: createShadow('math_number'),
                    NUM2: createShadow('math_number')
                }
            },
            {
                kind: 'block',
                type: 'operator_bitnot',
                inputs: {
                    NUM1: createShadow('math_number')
                }
            },
            {
                kind: 'block',
                type: 'operator_bitlsh',
                inputs: {
                    NUM1: createShadow('math_number'),
                    NUM2: createShadow('math_number')
                }
            },
            {
                kind: 'block',
                type: 'operator_bitrsh',
                inputs: {
                    NUM1: createShadow('math_number'),
                    NUM2: createShadow('math_number')
                }
            },
            {
                kind: 'block',
                type: 'operator_bitursh',
                inputs: {
                    NUM1: createShadow('math_number'),
                    NUM2: createShadow('math_number')
                }
            }
        );
    }

    operatorsContents.push(
        blockSeparator,
        {
            kind: 'block',
            type: 'operator_random',
            inputs: {
                FROM: createShadow('math_number', {NUM: 1}),
                TO: createShadow('math_number', {NUM: 10})
            }
        },
        blockSeparator,
        {
            kind: 'block',
            type: 'operator_gt',
            inputs: {
                OPERAND1: createShadow('text'),
                OPERAND2: createShadow('text', {TEXT: '50'})
            }
        }
    );

    if (!hideNonVanillaBlocks) {
        operatorsContents.push({
            kind: 'block',
            type: 'operator_ge',
            inputs: {
                OPERAND1: createShadow('text'),
                OPERAND2: createShadow('text', {TEXT: '50'})
            }
        });
    }

    operatorsContents.push({
        kind: 'block',
        type: 'operator_lt',
        inputs: {
            OPERAND1: createShadow('text'),
            OPERAND2: createShadow('text', {TEXT: '50'})
        }
    });

    if (!hideNonVanillaBlocks) {
        operatorsContents.push({
            kind: 'block',
            type: 'operator_le',
            inputs: {
                OPERAND1: createShadow('text'),
                OPERAND2: createShadow('text', {TEXT: '50'})
            }
        });
    }

    operatorsContents.push(
        {
            kind: 'block',
            type: 'operator_equals',
            inputs: {
                OPERAND1: createShadow('text'),
                OPERAND2: createShadow('text', {TEXT: '50'})
            }
        }
    );

    if (!hideNonVanillaBlocks) {
        operatorsContents.push({
            kind: 'block',
            type: 'operator_nequals',
            inputs: {
                OPERAND1: createShadow('text'),
                OPERAND2: createShadow('text', {TEXT: '50'})
            }
        });
    }

    operatorsContents.push(
        blockSeparator,
        {kind: 'block', type: 'operator_and'},
        {kind: 'block', type: 'operator_or'},
        {kind: 'block', type: 'operator_not'},
        blockSeparator
    );

    if (!isInitialSetup) {
        if (!hideNonVanillaBlocks) {
            operatorsContents.push({
                kind: 'block',
                type: 'operator_indexof',
                inputs: {
                    POS: createShadow('math_whole_number', {NUM: 1}),
                    STRING: createShadow('text', {TEXT: `${apple} ${banana}`}),
                    SUBSTRING: createShadow('text', {TEXT: banana})
                }
            });
        }

        operatorsContents.push({
            kind: 'block',
            type: 'operator_join',
            inputs: {
                STRING1: createShadow('text', {TEXT: `${apple} `}),
                STRING2: createShadow('text', {TEXT: banana})
            }
        });

        if (!hideNonVanillaBlocks) {
            operatorsContents.push({
                kind: 'block',
                type: 'operator_join_multiple',
                id: 'operator_join_multiple',
                extraState: {
                    argumentids: ['STRING1', 'STRING2']
                },
                inputs: {
                    STRING1: createShadow('text', {TEXT: `${apple} `}),
                    STRING2: createShadow('text', {TEXT: banana})
                }
            });
        }

        operatorsContents.push(
            {
                kind: 'block',
                type: 'operator_letter_of',
                inputs: {
                    LETTER: createShadow('math_whole_number', {NUM: 1}),
                    STRING: createShadow('text', {TEXT: apple})
                }
            },
            {
                kind: 'block',
                type: 'operator_length',
                inputs: {
                    STRING: createShadow('text', {TEXT: apple})
                }
            },
            {
                kind: 'block',
                type: 'operator_contains',
                id: 'operator_contains',
                inputs: {
                    STRING1: createShadow('text', {TEXT: apple}),
                    STRING2: createShadow('text', {TEXT: letter})
                }
            }
        );
    }

    operatorsContents.push(
        blockSeparator,
        {
            kind: 'block',
            type: 'operator_mod',
            inputs: {
                NUM1: createShadow('math_number'),
                NUM2: createShadow('math_number')
            }
        },
        {
            kind: 'block',
            type: 'operator_round',
            inputs: {
                NUM: createShadow('math_number')
            }
        },
        blockSeparator,
        {
            kind: 'block',
            type: 'operator_mathop',
            inputs: {
                NUM: createShadow('math_number')
            }
        }
    );

    return {
        kind: 'category',
        name: '%{BKY_CATEGORY_OPERATORS}',
        categorystyle: 'operators',
        contents: operatorsContents
    };
};

const variables = (isInitialSetup, isStage, targetId) => ({
    kind: 'category',
    name: '%{BKY_CATEGORY_VARIABLES}',
    categorystyle: 'data',
    custom: 'VARIABLE'
});

const myBlocks = (isInitialSetup, isStage, targetId) => ({
    kind: 'category',
    name: '%{BKY_CATEGORY_MYBLOCKS}',
    categorystyle: 'more',
    custom: 'PROCEDURE'
});

/**
 * @param {!boolean} isInitialSetup - Whether the toolbox is for initial setup. If the mode is "initial setup",
 * blocks with localized default parameters (e.g. ask and wait) should not be loaded. (LLK/scratch-gui#5445)
 * @param {?boolean} isStage - Whether the toolbox is for a stage-type target. This is always set to true
 * when isInitialSetup is true.
 * @param {?string} targetId - The current editing target
 * @param {?Array.<object>} categories - optional array of `{id,json,xml}` for categories. This can include both core
 * and other extensions: core extensions will be placed in the normal Scratch order; others will go at the bottom.
 * @property {string} id - the extension / category ID.
 * @property {string} json - the JSON for this extension / category.
 * @property {string} xml - the `<category>...</category>` XML for this extension / category.
 * @param {?string} costumeName - The name of the default selected costume dropdown.
 * @param {?string} backdropName - The name of the default selected backdrop dropdown.
 * @param {?string} soundName -  The name of the default selected sound dropdown.
 * @param {?boolean} hideNonVanillaBlocks - hide non-vanilla blocks.
 * @returns {string} - a Blockly-style JSON document for the contents of the toolbox.
 */
const makeToolbox = function (
    isInitialSetup,
    isStage = true,
    targetId,
    categories = [],
    costumeName = '',
    backdropName = '',
    soundName = '',
    hideNonVanillaBlocks = false
) {
    isStage = isInitialSetup || isStage;

    // Convert xml toolbox to json.
    for (const category of categories) {
        if (category.json || !category.xml) continue;
        const toolbox = ScratchBlocks.utils.toolbox.convertToolboxDefToJson(
            `<xml style="display: none">${category.xml}</xml>`
        );
        if (!toolbox || toolbox.contents.length === 0) {
            // eslint-disable-next-line no-console
            console.warn(`Invalid toolbox xml for ${category.id}`);
            continue;
        }
        category.json = toolbox.contents[0];
    }

    categories = categories.slice();
    const moveCategory = categoryId => {
        const index = categories.findIndex(categoryInfo => categoryInfo.id === categoryId);
        if (index >= 0) {
            // remove the category from categories and return it
            const [categoryInfo] = categories.splice(index, 1);
            return categoryInfo.json;
        }
        // return `undefined`
    };

    const contents = [
        moveCategory('motion') || motion(isInitialSetup, isStage, targetId),
        moveCategory('looks') || looks(isInitialSetup, isStage, targetId, costumeName, backdropName),
        moveCategory('sound') || sound(isInitialSetup, isStage, targetId, soundName),
        moveCategory('event') || events(isInitialSetup, isStage, targetId),
        moveCategory('control') || control(isInitialSetup, isStage, targetId),
        moveCategory('sensing') || sensing(isInitialSetup, isStage, targetId, hideNonVanillaBlocks),
        moveCategory('operators') || operators(isInitialSetup, isStage, targetId, hideNonVanillaBlocks),
        moveCategory('data') || variables(isInitialSetup, isStage, targetId),
        moveCategory('procedures') || myBlocks(isInitialSetup, isStage, targetId)
    ];

    // Add remaining extension categories
    for (const extensionCategory of categories) {
        contents.push(extensionCategory.json);
    }

    return {
        kind: 'categoryToolbox',
        contents
    };
};

export default makeToolbox;
