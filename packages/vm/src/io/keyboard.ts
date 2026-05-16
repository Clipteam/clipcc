import Cast from '../util/cast';
import type Runtime from '../engine/runtime';

/**
 * Names used internally for keys used in scratch, also known as "scratch keys".
 */
const KEY_NAME = {
    SPACE: 'space',
    LEFT: 'left arrow',
    UP: 'up arrow',
    RIGHT: 'right arrow',
    DOWN: 'down arrow',
    ENTER: 'enter'
} as const;

/**
 * An array of the names of scratch keys.
 */
const KEY_NAME_LIST: string[] = Object.keys(KEY_NAME).map(name => KEY_NAME[name as keyof typeof KEY_NAME]);

class Keyboard {
    /**
     * List of currently pressed scratch keys.
     * A scratch key is:
     * A key you can press on a keyboard, excluding modifier keys.
     * An uppercase string of length one;
     *     except for special key names for arrow keys and space (e.g. 'left arrow').
     * Can be a non-english unicode letter like: æ ø ש נ 手 廿.
     */
    _keysPressed: string[] = [];

    constructor (
        /**
         * Reference to the owning Runtime.
         * Can be used, for example, to activate hats.
         */
        public runtime: Runtime
    ) {}

    /**
     * Convert from a keyboard event key name to a Scratch key name.
     * @param  keyString the input key string.
     * @returns the corresponding Scratch key, or an empty string.
     */
    _keyStringToScratchKey (keyString: string): string {
        keyString = Cast.toString(keyString);
        // Convert space and arrow keys to their Scratch key names.
        switch (keyString) {
        case ' ': return KEY_NAME.SPACE;
        case 'ArrowLeft':
        case 'Left': return KEY_NAME.LEFT;
        case 'ArrowUp':
        case 'Up': return KEY_NAME.UP;
        case 'Right':
        case 'ArrowRight': return KEY_NAME.RIGHT;
        case 'Down':
        case 'ArrowDown': return KEY_NAME.DOWN;
        case 'Enter': return KEY_NAME.ENTER;
        }
        // Ignore modifier keys
        if (keyString.length > 1) {
            return '';
        }
        return keyString.toUpperCase();
    }

    /**
     * Convert from a block argument to a Scratch key name.
     * @param keyArg the input arg.
     * @returns the corresponding Scratch key.
     */
    _keyArgToScratchKey (keyArg: string | number): string {
        // If a number was dropped in, try to convert from ASCII to Scratch key.
        if (typeof keyArg === 'number') {
            // Check for the ASCII range containing numbers, some punctuation,
            // and uppercase letters.
            if (keyArg >= 48 && keyArg <= 90) {
                return String.fromCharCode(keyArg);
            }
            switch (keyArg) {
            case 32: return KEY_NAME.SPACE;
            case 37: return KEY_NAME.LEFT;
            case 38: return KEY_NAME.UP;
            case 39: return KEY_NAME.RIGHT;
            case 40: return KEY_NAME.DOWN;
            }
        }

        keyArg = Cast.toString(keyArg);

        // If the arg matches a special key name, return it.
        if (KEY_NAME_LIST.includes(keyArg)) {
            return keyArg;
        }

        // Use only the first character.
        if (keyArg.length > 1) {
            keyArg = keyArg[0];
        }

        // Check for the space character.
        if (keyArg === ' ') {
            return KEY_NAME.SPACE;
        }

        return keyArg.toUpperCase();
    }

    /**
     * Keyboard DOM event handler.
     * @param data Data from DOM event.
     * @param data.key The key from the DOM event.
     * @param data.isDown Whether the key is being pressed or released.
     */
    postData (data: { key: string; isDown: boolean }) {
        if (!data.key) return;
        const scratchKey = this._keyStringToScratchKey(data.key);
        if (scratchKey === '') return;
        const index = this._keysPressed.indexOf(scratchKey);
        if (data.isDown) {
            this.runtime.emit('KEY_PRESSED', scratchKey);
            // If not already present, add to the list.
            if (index < 0) {
                this._keysPressed.push(scratchKey);
            }
        } else if (index > -1) {
            // If already present, remove from the list.
            this._keysPressed.splice(index, 1);
        }
    }

    /**
     * Get key down state for a specified key.
     * @param  keyArg key argument.
     * @returns Is the specified key down?
     */
    getKeyIsDown (keyArg: string | number): boolean {
        if (keyArg === 'any') {
            return this._keysPressed.length > 0;
        }
        const scratchKey = this._keyArgToScratchKey(keyArg);
        return this._keysPressed.indexOf(scratchKey) > -1;
    }
}

export default Keyboard;
