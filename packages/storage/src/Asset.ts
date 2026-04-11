import {md5} from 'js-md5';
import {memoizedToString, _TextEncoder, _TextDecoder} from './memoizedToString';
import type {IAssetType} from './AssetType';
import type {AcceptedDataFormats} from './DataFormat';

// TODO: The comments in this file indicate that the asset id is a string only, but
// the types in BuiltinHelper and the default project builder in scratch-gui
// allow for it to be a number as well.
export type AssetId = string | number;

// Projects are strings, other assets are byte arrays
export type AssetData = string | Uint8Array;

export default class Asset {
    /** The type of this asset (sound, image, etc.) */
    public data?: AssetData;
    public dependencies: Asset[] = [];
    /** The format of the data (WAV, PNG, etc.); required if `data` is present. */
    public dataFormat?: AcceptedDataFormats;
    /**
     * true if setData is being called without generateId
     */
    public clean?: boolean;

    /**
     * Construct an Asset.
     * @param assetType - The type of this asset (sound, image, etc.)
     * @param assetId - The ID of this asset.
     * @param dataFormat - The format of the data (WAV, PNG, etc.); required if `data` is present.
     * @param data - The in-memory data for this asset; optional.
     * @param generateId - Whether to create id from an md5 hash of data
     */
    constructor (
        public assetType: IAssetType,
        public assetId?: AssetId,
        dataFormat?: AcceptedDataFormats,
        data?: AssetData,
        generateId?: boolean
    ) {
        this.setData(data, dataFormat || assetType.runtimeFormat, generateId);
    }

    setData (data: AssetData | undefined, dataFormat: AcceptedDataFormats | undefined, generateId?: boolean) {
        if (data && !dataFormat) {
            throw new Error('Data provided without specifying its format');
        }

        this.dataFormat = dataFormat;

        this.data = data;

        if (generateId && data !== undefined) this.assetId = md5(data);

        // Mark as clean only if set is being called without generateId
        // If a new id is being generated, mark this asset as not clean
        this.clean = !generateId;
    }

    /**
     * Decode this asset's data as text.
     * @returns - This asset's data, decoded as text.
     */
    decodeText (): string {
        const decoder = new _TextDecoder();

        // The data may be string, but it seems like this function is only called if the data is a byte array?
        // This was the behavior of the code when we added TS
        return decoder.decode(this.data as Uint8Array);
    }

    /**
     * Same as `setData` but encodes text first.
     * @param data - the text data to encode and store.
     * @param dataFormat - the format of the data (DataFormat.SVG for example).
     * @param generateId - after setting data, set the id to an md5 of the data?
     */
    encodeTextData (data: string, dataFormat: AcceptedDataFormats, generateId: boolean): void {
        const encoder = new _TextEncoder();
        this.setData(encoder.encode(data), dataFormat, generateId);
    }

    /**
     * Encode this asset's data as a data URI.
     * @param contentType - Optionally override the content type to be included in the data URI.
     * @returns - A data URI representing the asset's data.
     */
    encodeDataURI (contentType = this.assetType.contentType): string {

        // The data may be string, but it seems like this function is only called if the data is a byte array?
        // This was the behavior of the code when we added TS
        return `data:${contentType};base64,${memoizedToString(this.assetId!, this.data as Uint8Array)}`;
    }
}
