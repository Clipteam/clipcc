import {defineMessages} from 'react-intl';
import sharedMessages from '../shared-messages';
import type {Translator} from '../storage';

let messages = defineMessages({
    backdrop: {
        id: 'gui.defaultProject.backdrop',
        defaultMessage: 'Backdrop',
        description: 'Name for the default backdrop'
    }
});

messages = {...messages, ...sharedMessages};

// use the default message if a translation function is not passed
const defaultTranslator: Translator = msgObj => msgObj.defaultMessage ?? msgObj.id;

/**
 * @typedef {import('../storage').Translator} Translator
 */

/**
 * Generate a localized version of the default project
 * @param translateFunction a function to use for translating the default names
 * @returns the project data json for the default project
 */
const projectData = (translateFunction?: Translator) => {
    const translator = translateFunction || defaultTranslator;
    return ({
        targets: [
            {
                isStage: true,
                name: 'Stage',
                variables: {},
                lists: {},
                broadcasts: {},
                blocks: {},
                currentCostume: 0,
                costumes: [
                    {
                        assetId: 'cd21514d0531fdffb22204e0ec5ed84a',
                        name: translator(messages.backdrop, {index: 1}),
                        md5ext: 'cd21514d0531fdffb22204e0ec5ed84a.svg',
                        dataFormat: 'svg',
                        rotationCenterX: 240,
                        rotationCenterY: 180
                    }
                ],
                sounds: [],
                volume: 100
            }
        ],
        meta: {
            semver: '3.0.0',
            vm: '0.1.0',
            agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36', // eslint-disable-line max-len
            editor: 'clipcc'
        }
    });
};


export default projectData;
