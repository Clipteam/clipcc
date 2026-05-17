import atob from 'atob';
import btoa from 'btoa';

class Base64Util {

    /**
     * Convert a base64 encoded string to a Uint8Array.
     * @param base64 - a base64 encoded string.
     * @returns - a decoded Uint8Array.
     */
    static base64ToUint8Array (base64: string): Uint8Array {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const array = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            array[i] = binaryString.charCodeAt(i);
        }
        return array;
    }

    /**
     * Convert a Uint8Array to a base64 encoded string.
     * @param array - the array to convert.
     * @returns - the base64 encoded string.
     */
    static uint8ArrayToBase64 (array: number[]): string {
        const base64 = btoa(String.fromCharCode.apply(null, array));
        return base64;
    }

    /**
     * Convert an array buffer to a base64 encoded string.
     * @param buffer - an array buffer to convert.
     * @returns - the base64 encoded string.
     */
    static arrayBufferToBase64 (buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

}

export default Base64Util;
