function loadArray(obj: any): any[] {
    if (obj === undefined || obj === null) return [];
    return Array.isArray(obj) ? obj : [obj];
}

const soup = '!#%()*+,-./:;=?@[]^_`{|}~' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateBlockID(): string {
    const length = 20;
    const soupLength = soup.length;
    const id = [];
    for (let i = 0; i < length; i++) {
        id[i] = soup.charAt(Math.random() * soupLength);
    }
    return id.join('');
}

function parseStringToLiteral(str: string): string {
    return '\'' + str.replace('\\', '\\\\').replace('\'', '\\\'') + '\'';
}

export {
    loadArray,
    generateBlockID,
    parseStringToLiteral
};
