interface RGBObject {
    r: number;
    g: number;
    b: number;
    a?: number;
}

interface HSVObject {
    h: number;
    s: number;
    v: number;
}

class Color {
    static get RGB_BLACK (): RGBObject {
        return { r: 0, g: 0, b: 0 };
    }

    static get RGB_WHITE (): RGBObject {
        return { r: 255, g: 255, b: 255 };
    }

    /**
     * Convert a Scratch decimal color to a hex string, #RRGGBB.
     * @param decimal RGB color as a decimal.
     * @returns RGB color as #RRGGBB hex string.
     */
    static decimalToHex (decimal: number): string {
        if (decimal < 0) {
            decimal += 0xFFFFFF + 1;
        }
        let hex = Number(decimal).toString(16);
        hex = `#${'000000'.substr(0, 6 - hex.length)}${hex}`;
        return hex;
    }

    /**
     * Convert a Scratch decimal color to an RGB color object.
     * @param decimal RGB color as decimal.
     * @returns rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
     */
    static decimalToRgb (decimal: number): RGBObject {
        const a = (decimal >> 24) & 0xFF;
        const r = (decimal >> 16) & 0xFF;
        const g = (decimal >> 8) & 0xFF;
        const b = decimal & 0xFF;
        return { r: r, g: g, b: b, a: a > 0 ? a : 255 };
    }

    /**
     * Convert a hex color (e.g., F00, #03F, #0033FF) to an RGB color object.
     * CC-BY-SA Tim Down:
     * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
     * @param hex Hex representation of the color.
     * @returns null on failure, or rgb: {r: red [0,255], g: green [0,255], b: blue [0,255]}.
     */
    static hexToRgb (hex: string): RGBObject | null {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Convert an RGB color object to a hex color.
     * @param rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
     * @returns Hex representation of the color.
     */
    static rgbToHex (rgb: RGBObject): string {
        return Color.decimalToHex(Color.rgbToDecimal(rgb));
    }

    /**
     * Convert an RGB color object to a Scratch decimal color.
     * @param rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
     * @returns Number representing the color.
     */
    static rgbToDecimal (rgb: RGBObject): number {
        return (rgb.r << 16) + (rgb.g << 8) + rgb.b;
    }

    /**
    * Convert a hex color (e.g., F00, #03F, #0033FF) to a decimal color number.
    * @param hex Hex representation of the color.
    * @returns Number representing the color.
    */
    static hexToDecimal (hex: string): number {
        const rgb = Color.hexToRgb(hex);
        return rgb ? Color.rgbToDecimal(rgb) : 0;
    }

    /**
     * Convert an HSV color to RGB format.
     * @param hsv - {h: hue [0,360), s: saturation [0,1], v: value [0,1]}
     * @returns rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
     */
    static hsvToRgb (hsv: HSVObject): RGBObject {
        let h = hsv.h % 360;
        if (h < 0) h += 360;
        const s = Math.max(0, Math.min(hsv.s, 1));
        const v = Math.max(0, Math.min(hsv.v, 1));

        const i = Math.floor(h / 60);
        const f = (h / 60) - i;
        const p = v * (1 - s);
        const q = v * (1 - (s * f));
        const t = v * (1 - (s * (1 - f)));

        let r: number;
        let g: number;
        let b: number;

        switch (i) {
            default:
            case 0:
                r = v;
                g = t;
                b = p;
                break;
            case 1:
                r = q;
                g = v;
                b = p;
                break;
            case 2:
                r = p;
                g = v;
                b = t;
                break;
            case 3:
                r = p;
                g = q;
                b = v;
                break;
            case 4:
                r = t;
                g = p;
                b = v;
                break;
            case 5:
                r = v;
                g = p;
                b = q;
                break;
        }

        return {
            r: Math.floor(r * 255),
            g: Math.floor(g * 255),
            b: Math.floor(b * 255)
        };
    }

    /**
     * Convert an RGB color to HSV format.
     * @param rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
     * @returns hsv - {h: hue [0,360), s: saturation [0,1], v: value [0,1]}
     */
    static rgbToHsv (rgb: RGBObject): HSVObject {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;
        const x = Math.min(Math.min(r, g), b);
        const v = Math.max(Math.max(r, g), b);

        // For grays, hue will be arbitrarily reported as zero. Otherwise, calculate
        let h = 0;
        let s = 0;
        if (x !== v) {
            const f = (r === x) ? g - b : ((g === x) ? b - r : r - g);
            const i = (r === x) ? 3 : ((g === x) ? 5 : 1);
            h = ((i - (f / (v - x))) * 60) % 360;
            s = (v - x) / v;
        }

        return { h: h, s: s, v: v };
    }

    /**
     * Linear interpolation between rgb0 and rgb1.
     * @param rgb0 - the color corresponding to fraction1 <= 0.
     * @param rgb1 - the color corresponding to fraction1 >= 1.
     * @param fraction1 - the interpolation parameter. If this is 0.5, for example, mix the two colors equally.
     * @returns the interpolated color.
     */
    static mixRgb (rgb0: RGBObject, rgb1: RGBObject, fraction1: number): RGBObject {
        if (fraction1 <= 0) return rgb0;
        if (fraction1 >= 1) return rgb1;
        const fraction0 = 1 - fraction1;
        return {
            r: (fraction0 * rgb0.r) + (fraction1 * rgb1.r),
            g: (fraction0 * rgb0.g) + (fraction1 * rgb1.g),
            b: (fraction0 * rgb0.b) + (fraction1 * rgb1.b)
        };
    }
}

module.exports = Color;
