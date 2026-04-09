/**
 * Enumeration of the supported data formats.
 */
export const DataFormat = {
    JPG: 'jpg',
    JSON: 'json',
    MP3: 'mp3',
    PNG: 'png',
    SB2: 'sb2',
    SB3: 'sb3',
    SVG: 'svg',
    WAV: 'wav'
} as const;

export type IDataFormat = typeof DataFormat[keyof typeof DataFormat];
