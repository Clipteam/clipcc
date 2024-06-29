import ScratchBlocks from 'clipcc-block';
import {defaultColors} from './themes';

const categorySeparator = {kind: 'sep', gap: 36};

const blockSeparator = {kind: 'sep', gap: 36}; // At default scale, about 28px

/* eslint-disable no-unused-vars */
const motion = function (isInitialSetup, isStage, targetId, colors) {
    const stageSelected = ScratchBlocks.ScratchMsgs.translate(
        'MOTION_STAGE_SELECTED',
        'Stage selected: no motion blocks'
    );
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    const category = {
        kind: 'category',
        name: '%{BKY_CATEGORY_MOTION}',
        id: 'motion',
        colour: colors.primary,
        secondaryColour: colors.tertiary,
        contents: []
    };

    const contents = category.contents;
    if (isStage) {
        contents.push({kind: 'label', text: stageSelected}, categorySeparator);
        return category;
    }

    contents.push({
        kind: 'block',
        type: 'motion_movesteps',
        inputs: {
            STEPS: {
                block: {
                    type: 'math_number',
                    fields: {NUM: '10'},
                    shadow: true
                }
            }
        }
    }, {
        kind: 'block',
        type: 'motion_turnright',
        inputs: {
            DEGREES: {
                block: {
                    type: 'math_number',
                    fields: {NUM: '15'},
                    shadow: true
                }
            }
        }
    }, {
        kind: 'block',
        type: 'motion_turnleft',
        inputs: {
            DEGREES: {
                block: {
                    type: 'math_number',
                    fields: {NUM: '15'},
                    shadow: true
                }
            }
        }
    },
    blockSeparator,
    {
        kind: 'block',
        type: 'motion_goto',
        inputs: {
            TO: {
                block: {
                    type: 'motion_goto_menu',
                    fields: {TO: '_random_'},
                    shadow: true
                }
            }
        }
    }, {
        kind: 'block',
        type: 'motion_gotoxy',
        id: 'motion_gotoxy',
        inputs: {
            X: {
                block: {
                    type: 'math_number',
                    id: 'movex',
                    fields: {NUM: '36'},
                    shadow: true
                }
            },
            Y: {
                block: {
                    type: 'math_number',
                    id: 'movey',
                    fields: {NUM: '28'},
                    shadow: true
                }
            }
        }
    },
    {
        kind: 'block',
        type: 'motion_glideto',
        id: 'motion_glideto',
        inputs: {
            SECS: {
                block: {
                    type: 'math_number',
                    fields: {NUM: '1'},
                    shadow: true
                }
            },
            TO: {
                block: {
                    type: 'motion_glideto_menu',
                    fields: {TO: '_random_'},
                    shadow: true
                }
            }
        }
    },
    {
        kind: 'block',
        type: 'motion_glidesecstoxy',
        inputs: {
            SECS: {
                block: {
                    type: 'math_number',
                    fields: {NUM: '1'},
                    shadow: true
                }
            },
            X: {
                block: {
                    type: 'math_number',
                    id: 'glidex',
                    fields: {NUM: '36'},
                    shadow: true
                }
            },
            Y: {
                block: {
                    type: 'math_number',
                    id: 'glidey',
                    fields: {NUM: '28'},
                    shadow: true
                }
            }
        }
    },
    blockSeparator,
    {
        kind: 'block',
        type: 'motion_pointindirection',
        id: 'motion_pointindirection',
        inputs: {
            DIRECTION: {
                block: {
                    type: 'math_angle',
                    fields: {NUM: '90'},
                    shadow: true
                }
            }
        }
    },
    {
        kind: 'block',
        type: 'motion_pointtowards',
        inputs: {
            TOWARDS: {
                block: {
                    type: 'motion_pointtowards_menu',
                    fields: {TOWARDS: '_mouse_'},
                    shadow: true
                }
            }
        }
    },
    blockSeparator,
    {
        kind: 'block',
        type: 'motion_changexby',
        inputs: {
            DX: {
                block: {
                    type: 'math_number',
                    fields: {NUM: '10'},
                    shadow: true
                }
            }
        }
    },
    {
        kind: 'block',
        type: 'motion_setx',
        inputs: {
            X: {
                block: {
                    type: 'math_number',
                    id: 'setx',
                    fields: {NUM: '36'},
                    shadow: true
                }
            }
        }
    },
    {
        kind: 'block',
        type: 'motion_changeyby',
        inputs: {
            DY: {
                block: {
                    type: 'math_number',
                    fields: {NUM: '10'},
                    shadow: true
                }
            }
        }
    },
    {
        kind: 'block',
        type: 'motion_sety',
        inputs: {
            Y: {
                block: {
                    type: 'math_number',
                    id: 'sety',
                    fields: {NUM: '28'},
                    shadow: true
                }
            }
        }
    },
    blockSeparator,
    {kind: 'block', type: 'motion_ifonedgebounce'},
    blockSeparator,
    {kind: 'block', type: 'motion_setrotationstyle'},
    blockSeparator,
    {
        kind: 'block',
        type: 'motion_xposition',
        id: `${targetId}_xposition`
    },
    {
        kind: 'block',
        type: 'motion_yposition',
        id: `${targetId}_yposition`
    },
    {
        kind: 'block',
        type: 'motion_direction',
        id: `${targetId}_direction`
    }, categorySeparator);
    return category;
};

const looks = function (isInitialSetup, isStage, targetId, costumeName, backdropName, colors) {
    const hello = ScratchBlocks.ScratchMsgs.translate('LOOKS_HELLO', 'Hello!');
    const hmm = ScratchBlocks.ScratchMsgs.translate('LOOKS_HMM', 'Hmm...');
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    const category = {
        kind: 'category',
        name: '%{BKY_CATEGORY_LOOKS}',
        id: 'looks',
        colour: colors.primary,
        secondaryColour: colors.tertiary,
        contents: []
    };

    const contents = category.contents;
    if (isStage) {
        contents.push(
            {
                kind: 'block',
                type: 'looks_switchbackdropto',
                inputs: {
                    BACKDROP: {
                        block: {
                            type: 'looks_backdrops',
                            fields: {BACKDROP: backdropName},
                            shadow: true
                        }
                    }
                }
            }, {
                kind: 'block',
                type: 'looks_switchbackdroptoandwait',
                inputs: {
                    BACKDROP: {
                        block: {
                            type: 'looks_backdrops',
                            fields: {BACKDROP: backdropName},
                            shadow: true
                        }
                    }
                }
            }, {kind: 'block', type: 'looks_nextbackdrop'}
        );
    } else {
        contents.push({
            kind: 'block',
            type: 'looks_sayforsecs',
            inputs: {
                MESSAGE: {
                    block: {
                        type: 'text',
                        fields: {TEXT: hello},
                        shadow: true
                    }
                },
                SECS: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '2'},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'looks_say',
            inputs: {
                MESSAGE: {
                    block: {
                        type: 'text',
                        fields: {TEXT: hello},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'looks_thinkforsecs',
            inputs: {
                MESSAGE: {
                    block: {
                        type: 'text',
                        fields: {TEXT: hmm},
                        shadow: true
                    }
                },
                SECS: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '2'},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'looks_think',
            inputs: {
                MESSAGE: {
                    block: {
                        type: 'text',
                        fields: {TEXT: hmm},
                        shadow: true
                    }
                }
            }
        },
        blockSeparator,
        {
            kind: 'block',
            type: 'looks_switchcostumeto',
            id: `${targetId}_switchcostumeto`,
            inputs: {
                COSTUME: {
                    block: {
                        type: 'looks_costume',
                        fields: {COSTUME: costumeName},
                        shadow: true
                    }
                }
            }
        },
        {kind: 'block', type: 'looks_nextcostume'},
        {
            kind: 'block',
            type: 'looks_switchbackdropto',
            inputs: {
                BACKDROP: {
                    block: {
                        type: 'looks_backdrops',
                        fields: {BACKDROP: backdropName},
                        shadow: true
                    }
                }
            }
        },
        {kind: 'block', type: 'looks_nextbackdrop'},
        blockSeparator,
        {
            kind: 'block',
            type: 'looks_changesizeby',
            inputs: {
                CHANGE: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '10'},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'looks_setsizeto',
            inputs: {
                SIZE: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '100'},
                        shadow: true
                    }
                }
            }
        }
        );
    }
    contents.push(
        blockSeparator,
        {
            kind: 'block',
            type: 'looks_changeeffectby',
            inputs: {
                CHANGE: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '25'},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'looks_seteffectto',
            inputs: {
                VALUE: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '0'},
                        shadow: true
                    }
                }
            }
        },
        {kind: 'block', type: 'looks_cleargraphiceffects'},
        blockSeparator
    );

    if (isStage) {
        contents.push({kind: 'block', type: 'looks_backdropnumbername', id: 'backdropnumbername'});
    } else {
        contents.push(
            {kind: 'block', type: 'looks_show'},
            {kind: 'block', type: 'looks_hide'},
            blockSeparator,
            {kind: 'block', type: 'looks_gotofrontback'},
            {
                kind: 'block',
                type: 'looks_goforwardbackwardlayers',
                inputs: {
                    NUM: {
                        block: {
                            type: 'math_integer',
                            fields: {NUM: '1'},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'looks_costumenumbername',
                id: `${targetId}_costumenumbername`
            },
            {kind: 'block', type: 'looks_backdropnumbername', id: 'backdropnumbername'},
            {
                kind: 'block',
                type: 'looks_size',
                id: `${targetId}_size`
            }
        );
    }
    contents.push(categorySeparator);

    return category;
};

const sound = function (isInitialSetup, isStage, targetId, soundName, colors) {
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    return {
        kind: 'category',
        name: '%{BKY_CATEGORY_SOUND}',
        id: 'sound',
        colour: colors.primary,
        secondaryColour: colors.tertiary,
        contents: [{
            kind: 'block',
            type: 'sound_playuntildone',
            id: `${targetId}_sound_playuntildone`,
            inputs: {
                SOUND_MENU: {
                    block: {
                        type: 'sound_sounds_menu',
                        fields: {SOUND_MENU: soundName},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'sound_play',
            id: `${targetId}_sound_play`,
            inputs: {
                SOUND_MENU: {
                    block: {
                        type: 'sound_sounds_menu',
                        fields: {SOUND_MENU: soundName},
                        shadow: true
                    }
                }
            }
        },
        {kind: 'block', type: 'sound_stopallsounds'},
        blockSeparator,
        {
            kind: 'block',
            type: 'sound_changeeffectby',
            inputs: {
                VALUE: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '10'},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'sound_seteffectto',
            inputs: {
                VALUE: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '100'},
                        shadow: true
                    }
                }
            }
        },
        {kind: 'block', type: 'sound_cleareffects'},
        blockSeparator,
        {
            kind: 'block',
            type: 'sound_changevolumeby',
            inputs: {
                VOLUME: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '-10'},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'sound_setvolumeto',
            inputs: {
                VOLUME: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '100'},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'sound_volume',
            id: `${targetId}_volume`
        },
        categorySeparator
        ]
    };
};

const events = function (isInitialSetup, isStage, targetId, colors) {
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    return {
        kind: 'category',
        name: '%{BKY_CATEGORY_EVENTS}',
        id: 'events',
        colour: colors.primary,
        secondaryColour: colors.tertiary,
        contents: [
            {kind: 'block', type: 'event_whenflagclicked'},
            {kind: 'block', type: 'event_whenkeypressed'},
            isStage ? {kind: 'block', type: 'event_whenstageclicked'} :
                {kind: 'block', type: 'event_whenthisspriteclicked'},
            {kind: 'block', type: 'event_whenbackdropswitchesto'},
            blockSeparator,
            {
                kind: 'block',
                type: 'event_whengreaterthan',
                inputs: {
                    VALUE: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: '10'},
                            shadow: true
                        }
                    }
                }
            },
            blockSeparator,
            {kind: 'block', type: 'event_whenbroadcastreceived'},
            {
                kind: 'block',
                type: 'event_broadcast',
                inputs: {
                    BROADCAST_INPUT: {
                        block: {
                            type: 'event_broadcast_menu',
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'event_broadcastandwait',
                inputs: {
                    BROADCAST_INPUT: {
                        block: {
                            type: 'event_broadcast_menu',
                            shadow: true
                        }
                    }
                }
            },
            categorySeparator
        ]
    };
};

const control = function (isInitialSetup, isStage, targetId, colors) {
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    const category = {
        kind: 'category',
        name: '%{BKY_CATEGORY_CONTROL}',
        id: 'control',
        colour: colors.primary,
        secondaryColour: colors.tertiary,
        contents: [
            {
                kind: 'block',
                type: 'control_wait',
                inputs: {
                    DURATION: {
                        block: {
                            type: 'math_positive_number',
                            fields: {NUM: '1'},
                            shadow: true
                        }
                    }
                }
            },
            blockSeparator,
            {
                kind: 'block',
                type: 'control_repeat',
                inputs: {
                    TIMES: {
                        block: {
                            type: 'math_whole_number',
                            fields: {NUM: '10'},
                            shadow: true
                        }
                    }
                }
            },
            {kind: 'block', type: 'control_forever'},
            blockSeparator,
            {kind: 'block', type: 'control_if'},
            {kind: 'block', type: 'control_if_else'},
            {kind: 'block', type: 'control_wait_until', id: 'wait_until'},
            {kind: 'block', type: 'control_repeat_until', id: 'repeat_until'},
            blockSeparator,
            {kind: 'block', type: 'control_stop'},
            blockSeparator

        ]
    };
    if (isStage) {
        category.contents.push({
            kind: 'block',
            type: 'control_create_clone_of',
            inputs: {
                CLONE_OPTION: {
                    block: {
                        type: 'control_create_clone_of_menu',
                        shadow: true
                    }
                }
            }
        });
    } else {
        category.contents.push(
            {kind: 'block', type: 'control_start_as_clone'},
            {
                kind: 'block',
                type: 'control_create_clone_of',
                inputs: {
                    CLONE_OPTION: {
                        block: {
                            type: 'control_create_clone_of_menu',
                            shadow: true
                        }
                    }
                }
            },
            {kind: 'block', type: 'control_delete_this_clone'});
    }

    category.contents.push(categorySeparator);
    return category;
};

const sensing = function (isInitialSetup, isStage, targetId, colors, hideNonVanillaBlocks) {
    const name = ScratchBlocks.ScratchMsgs.translate('SENSING_ASK_TEXT', 'What\'s your name?');
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    const category = {
        kind: 'category',
        name: '%{BKY_CATEGORY_SENSING}',
        id: 'sensing',
        colour: colors.primary,
        secondaryColour: colors.tertiary,
        contents: []
    };
    if (!hideNonVanillaBlocks) {
        category.contents.push({
            kind: 'block',
            type: 'sensing_distancebetweenposition',
            inputs: {
                X1: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '0'},
                        shadow: true
                    }
                },
                Y1: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '0'},
                        shadow: true
                    }
                },
                X2: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '1'},
                        shadow: true
                    }
                },
                Y2: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '1'},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'sensing_directionbetweenposition',
            inputs: {
                X1: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '0'},
                        shadow: true
                    }
                },
                Y1: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '0'},
                        shadow: true
                    }
                },
                X2: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '1'},
                        shadow: true
                    }
                },
                Y2: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '1'},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'sensing_colorat',
            inputs: {
                X: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '0'},
                        shadow: true
                    }
                },
                Y: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '0'},
                        shadow: true
                    }
                }
            }
        }, blockSeparator);
    }
    if (!isInitialSetup) {
        category.contents.push({
            kind: 'block',
            type: 'sensing_askandwait',
            id: 'askandwait',
            inputs: {
                QUESTION: {
                    block: {
                        type: 'text',
                        fields: {TEXT: name},
                        shadow: true
                    }
                }
            }
        });
    }
    category.contents.push(
        {kind: 'block', type: 'sensing_answer', id: 'answer'},
        blockSeparator,
        {
            kind: 'block',
            type: 'sensing_keypressed',
            inputs: {
                KEY_OPTION: {
                    block: {
                        type: 'sensing_keyoptions',
                        shadow: true
                    }
                }
            }
        },
        {kind: 'block', type: 'sensing_mousedown'},
    );
    if (!hideNonVanillaBlocks) {
        category.contents.push({
            kind: 'block',
            type: 'sensing_mousepressed',
            inputs: {
                MOUSE_OPTION: {
                    block: {
                        type: 'sensing_mouseoptions',
                        shadow: true
                    }
                }
            }
        });
    }
    category.contents.push(
        {kind: 'block', type: 'sensing_mousex'},
        {kind: 'block', type: 'sensing_mousey'}
    );
    if (!hideNonVanillaBlocks) {
        category.contents.push(
            {kind: 'block', type: 'sensing_joystick_distance'},
            {kind: 'block', type: 'sensing_joystickx'},
            {kind: 'block', type: 'sensing_joysticky'}
        );
    }
    if (!isStage) {
        category.contents.push(
            blockSeparator,
            {kind: 'block', type: 'sensing_setdragmode', id: 'sensing_setdragmode'},
            blockSeparator
        );
    }
    category.contents.push(
        blockSeparator,
        {kind: 'block', type: 'sensing_loudness'},
        blockSeparator
    );
    if (!hideNonVanillaBlocks) {
        category.contents.push(
            {kind: 'block', type: 'sensing_isturbomode'},
            {kind: 'block', type: 'sensing_turnonturbomode'},
            {kind: 'block', type: 'sensing_turnoffturbomode'}
        );
    }
    category.contents.push(
        blockSeparator,
        {kind: 'block', type: 'sensing_timer', id: 'timer'},
        {kind: 'block', type: 'sensing_resettimer'},
        blockSeparator,
        {
            kind: 'block',
            type: 'sensing_of',
            inputs: {
                OBJECT: {
                    block: {
                        type: 'sensing_of_object_menu',
                        id: 'sensing_of_object_menu',
                        shadow: true
                    }
                }
            }
        },
        blockSeparator,
        {kind: 'block', type: 'sensing_current', id: 'current'},
        {kind: 'block', type: 'sensing_dayssince2000'},
        blockSeparator,
        {kind: 'block', type: 'sensing_username'}
    );

    if (!hideNonVanillaBlocks) {
        category.contents.push(
            {kind: 'block', type: 'sensing_operatingsystem'},
            {kind: 'block', type: 'sensing_clipcc_version'}
        );
    }
    category.contents.push(categorySeparator);
    return category;
};

const operators = function (isInitialSetup, isStage, targetId, colors, hideNonVanillaBlocks) {
    const apple = ScratchBlocks.ScratchMsgs.translate('OPERATORS_JOIN_APPLE', 'apple');
    const banana = ScratchBlocks.ScratchMsgs.translate('OPERATORS_JOIN_BANANA', 'banana');
    const letter = ScratchBlocks.ScratchMsgs.translate('OPERATORS_LETTEROF_APPLE', 'a');
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    const category = {
        kind: 'category',
        name: '%{BKY_CATEGORY_OPERATORS}',
        id: 'operators',
        colour: colors.primary,
        secondaryColour: colors.tertiary,
        contents: [
            {
                kind: 'block',
                type: 'operator_add',
                inputs: {
                    NUM1: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    },
                    NUM2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_subtract',
                inputs: {
                    NUM1: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    },
                    NUM2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_multiply',
                inputs: {
                    NUM1: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    },
                    NUM2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_divide',
                inputs: {
                    NUM1: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    },
                    NUM2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    }
                }
            }
        ]
    };
    if (!hideNonVanillaBlocks) {
        category.contents.push(
            {
                kind: 'block',
                type: 'operator_power',
                inputs: {
                    NUM1: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    },
                    NUM2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_bitand',
                inputs: {
                    NUM1: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    },
                    NUM2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_bitor',
                inputs: {
                    NUM1: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    },
                    NUM2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_bitxor',
                inputs: {
                    NUM1: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    },
                    NUM2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_bitnot',
                inputs: {
                    NUM1: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_bitlsh',
                inputs: {
                    NUM1: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    },
                    NUM2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_bitrsh',
                inputs: {
                    NUM1: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    },
                    NUM2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_bitursh',
                inputs: {
                    NUM1: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    },
                    NUM2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: ''},
                            shadow: true
                        }
                    }
                }
            }
        );
    }
    category.contents.push(
        blockSeparator,
        {
            kind: 'block',
            type: 'operator_random',
            inputs: {
                FROM: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '1'},
                        shadow: true
                    }
                },
                TO: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '10'},
                        shadow: true
                    }
                }
            }
        },
        blockSeparator,
        {
            kind: 'block',
            type: 'operator_gt',
            inputs: {
                OPERAND1: {
                    block: {
                        type: 'text',
                        fields: {TEXT: ''},
                        shadow: true
                    }
                },
                OPERAND2: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '50'},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'operator_lt',
            inputs: {
                OPERAND1: {
                    block: {
                        type: 'text',
                        fields: {TEXT: ''},
                        shadow: true
                    }
                },
                OPERAND2: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '50'},
                        shadow: true
                    }
                }
            }
        }
    );
    if (!hideNonVanillaBlocks) {
        category.contents.push(
            {
                kind: 'block',
                type: 'operator_ge',
                inputs: {
                    OPERAND1: {
                        block: {
                            type: 'text',
                            fields: {TEXT: ''},
                            shadow: true
                        }
                    },
                    OPERAND2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: '50'},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_le',
                inputs: {
                    OPERAND1: {
                        block: {
                            type: 'text',
                            fields: {TEXT: ''},
                            shadow: true
                        }
                    },
                    OPERAND2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: '50'},
                            shadow: true
                        }
                    }
                }
            }
        );
    }
    category.contents.push(
        {
            kind: 'block',
            type: 'operator_equals',
            inputs: {
                OPERAND1: {
                    block: {
                        type: 'text',
                        fields: {TEXT: ''},
                        shadow: true
                    }
                },
                OPERAND2: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: '50'},
                        shadow: true
                    }
                }
            }
        }
    );
    if (!hideNonVanillaBlocks) {
        category.contents.push(
            {
                kind: 'block',
                type: 'operator_nequals',
                inputs: {
                    OPERAND1: {
                        block: {
                            type: 'text',
                            fields: {TEXT: ''},
                            shadow: true
                        }
                    },
                    OPERAND2: {
                        block: {
                            type: 'math_number',
                            fields: {NUM: '50'},
                            shadow: true
                        }
                    }
                }
            }
        );
    }
    category.contents.push(
        blockSeparator,
        {kind: 'block', type: 'operator_and'},
        {kind: 'block', type: 'operator_or'},
        {kind: 'block', type: 'operator_not'},
        blockSeparator
    );
    if (!isInitialSetup) {
        if (!hideNonVanillaBlocks) {
            category.contents.push(
                {
                    kind: 'block',
                    type: 'operator_indexof',
                    inputs: {
                        POS: {
                            block: {
                                type: 'math_whole_number',
                                fields: {NUM: '1'},
                                shadow: true
                            }
                        },
                        STRING: {
                            block: {
                                type: 'text',
                                fields: {TEXT: `${apple} ${banana}`},
                                shadow: true
                            }
                        },
                        SUBSTRING: {
                            block: {
                                type: 'text',
                                fields: {TEXT: banana},
                                shadow: true
                            }
                        }
                    }
                }
            );
        }
        category.contents.push(
            {
                kind: 'block',
                type: 'operator_join',
                inputs: {
                    STRING1: {
                        block: {
                            type: 'text',
                            fields: {TEXT: `${apple} `},
                            shadow: true
                        }
                    },
                    STRING2: {
                        block: {
                            type: 'text',
                            fields: {TEXT: banana},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_letter_of',
                inputs: {
                    LETTER: {
                        block: {
                            type: 'math_whole_number',
                            fields: {NUM: '1'},
                            shadow: true
                        }
                    },
                    STRING: {
                        block: {
                            type: 'text',
                            fields: {TEXT: apple},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_length',
                inputs: {
                    STRING: {
                        block: {
                            type: 'text',
                            fields: {TEXT: apple},
                            shadow: true
                        }
                    }
                }
            },
            {
                kind: 'block',
                type: 'operator_contains',
                inputs: {
                    STRING1: {
                        block: {
                            type: 'text',
                            fields: {TEXT: apple},
                            shadow: true
                        }
                    },
                    STRING2: {
                        block: {
                            type: 'text',
                            fields: {TEXT: letter},
                            shadow: true
                        }
                    }
                }
            },
        );
    }
    category.contents.push(
        blockSeparator,
        {
            kind: 'block',
            type: 'operator_mod',
            inputs: {
                NUM1: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: ''},
                        shadow: true
                    }
                },
                NUM2: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: ''},
                        shadow: true
                    }
                }
            }
        },
        {
            kind: 'block',
            type: 'operator_round',
            inputs: {
                NUM: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: ''},
                        shadow: true
                    }
                }
            }
        },
        blockSeparator,
        {
            kind: 'block',
            type: 'operator_mathop',
            inputs: {
                NUM: {
                    block: {
                        type: 'math_number',
                        fields: {NUM: ''},
                        shadow: true
                    }
                }
            }
        },
        categorySeparator
    );
    return category;
};

const variables = function (isInitialSetup, isStage, targetId, colors) {
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    return {
        kind: 'category',
        name: '%{BKY_CATEGORY_VARIABLES}',
        id: 'variables',
        colour: colors.primary,
        secondaryColour: colors.tertiary,
        custom: 'VARIABLE'
    };
};

const myBlocks = function (isInitialSetup, isStage, targetId, colors) {
    // Note: the category's secondaryColour matches up with the blocks' tertiary color, both used for border color.
    return {
        kind: 'category',
        name: '%{BKY_CATEGORY_MYBLOCKS}',
        id: 'myBlocks',
        colour: colors.primary,
        secondaryColour: colors.tertiary,
        custom: 'PROCEDURE'
    };
};

/**
 * @param {!boolean} isInitialSetup - Whether the toolbox is for initial setup. If the mode is "initial setup",
 * blocks with localized default parameters (e.g. ask and wait) should not be loaded. (LLK/scratch-gui#5445)
 * @param {?boolean} isStage - Whether the toolbox is for a stage-type target. This is always set to true
 * when isInitialSetup is true.
 * @param {?string} targetId - The current editing target
 * @param {?Array.<object>} categoriesContents - optional content array for categories. This can include both core
 * and other extensions: core extensions will be placed in the normal Scratch order; others will go at the bottom.
 * @param {?string} costumeName - The name of the default selected costume dropdown.
 * @param {?string} backdropName - The name of the default selected backdrop dropdown.
 * @param {?string} soundName -  The name of the default selected sound dropdown.
 * @param {?object} colors - The colors for the theme.
 * @param {?boolean} hideNonVanillaBlocks - hide non-vanilla blocks.
 * @returns {object} - a ScratchBlocks-style toolbox definition for the contents of the toolbox.
 */
const makeToolboxContents = function (isInitialSetup, isStage = true, targetId, categoriesContents = [],
    costumeName = '', backdropName = '', soundName = '', colors = defaultColors,
    hideNonVanillaBlocks = false) {
    isStage = isInitialSetup || isStage;
    const gap = categorySeparator;

    categoriesContents = categoriesContents.slice();
    const moveCategory = categoryId => {
        const index = categoriesContents.findIndex(categoryInfo => categoryInfo.id === categoryId);
        if (index >= 0) {
            // remove the category from categoriesXML and return its XML
            const [categoryInfo] = categoriesContents.splice(index, 1);
            return categoryInfo;
        }
    };

    const motionContents = moveCategory('motion') || motion(isInitialSetup, isStage, targetId, colors.motion);
    const looksContents = moveCategory('looks') ||
        looks(isInitialSetup, isStage, targetId, costumeName, backdropName, colors.looks);
    const soundContents = moveCategory('sound') || sound(isInitialSetup, isStage, targetId, soundName, colors.sounds);
    const eventsContents = moveCategory('event') || events(isInitialSetup, isStage, targetId, colors.event);
    const controlContents = moveCategory('control') || control(isInitialSetup, isStage, targetId, colors.control);
    const sensingContents = moveCategory('sensing') ||
        sensing(isInitialSetup, isStage, targetId, colors.sensing, hideNonVanillaBlocks);
    const operatorsContents = moveCategory('operators') ||
        operators(isInitialSetup, isStage, targetId, colors.operators, hideNonVanillaBlocks);
    const variablesContents = moveCategory('data') || variables(isInitialSetup, isStage, targetId, colors.data);
    const myBlocksContents = moveCategory('procedures') || myBlocks(isInitialSetup, isStage, targetId, colors.more);

    const everything = [
        motionContents, gap,
        looksContents, gap,
        soundContents, gap,
        eventsContents, gap,
        controlContents, gap,
        sensingContents, gap,
        operatorsContents, gap,
        variablesContents, gap,
        myBlocksContents
    ];

    for (const extensionCategory of categoriesContents) {
        everything.push(gap, extensionCategory);
    }
    return everything;
};

export default makeToolboxContents;
