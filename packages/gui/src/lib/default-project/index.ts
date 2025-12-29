import projectData from './project-data';
import {TranslatorFunction} from '../../gui-config';

import popWav from '!!arraybuffer-loader!./83a9787d4cb6f3b7632b4ddfebf74367.wav';
// import meowWav from '!arraybuffer-loader!./83c36d806dc92327b9e7049a565c6bff.wav';
import backdrop from './cd21514d0531fdffb22204e0ec5ed84a.svg?raw';
// import costume1 from './bcf454acf82e4504149f7ffe07081dbc.svg?raw';
// import costume2 from './0fb9be3e8397c983338cb71dc84d0b25.svg?raw';

const defaultProject = (translator?: TranslatorFunction) => {
    let _TextEncoder: typeof TextEncoder;
    if (typeof TextEncoder === 'undefined') {
        // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
        _TextEncoder = require('fastestsmallesttextencoderdecoder').TextEncoder;
    } else {
        _TextEncoder = TextEncoder;
    }
    const encoder = new _TextEncoder();

    const projectJson = projectData(translator);
    return [{
        id: 0,
        assetType: 'Project',
        dataFormat: 'JSON',
        data: JSON.stringify(projectJson)
    }, {
        id: '83a9787d4cb6f3b7632b4ddfebf74367',
        assetType: 'Sound',
        dataFormat: 'WAV',
        data: new Uint8Array(popWav)
    }, {
        id: 'cd21514d0531fdffb22204e0ec5ed84a',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(backdrop)
    }];
};

export default defaultProject;
