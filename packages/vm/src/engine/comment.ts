/**
 * @fileoverview
 * Object representing a Scratch Comment (block or workspace).
 */

import uid from '../util/uid';
import xmlEscape from '../util/xml-escape';
import type * as ClipCCBlocks from 'clipcc-block';

class Comment {
    /**
     * Id of the comment.
     */
    id: string;
    blockId: string | null = null;
    /**
     * The width of the comment when it is full size.
     */
    width: number;
    /**
     * The height of the comment when it is full size.
     */
    height: number;
    /**
     * Whether the comment is minimized.
     */
    minimized: boolean;

    /**
     * @param id Id of the comment.
     * @param text Text content of the comment.
     * @param x X position of the comment on the workspace.
     * @param y Y position of the comment on the workspace.
     * @param width The width of the comment when it is full size.
     * @param height The height of the comment when it is full size.
     * @param minimized Whether the comment is minimized.
     * @class
     */
    constructor (
        id: string,
        public text: string,
        public x: number,
        public y: number,
        width: number,
        height: number,
        minimized: boolean) {
        this.id = id || uid();
        this.width = Math.max(Number(width), Comment.MIN_WIDTH);
        this.height = Math.max(Number(height), Comment.MIN_HEIGHT);
        this.minimized = minimized || false;
    }

    toXML (): string {
        return `<comment id="${this.id}" x="${this.x}" y="${
            this.y}" w="${this.width}" h="${this.height}" pinned="${
            this.blockId !== null}" collapsed="${this.minimized}">${xmlEscape(this.text)}</comment>`;
    }

    toState (): ClipCCBlocks.serialization.workspaceComments.State {
        return {
            id: this.id,
            text: this.text,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            collapsed: this.minimized
        };
    }

    // TODO choose min and defaults for width and height
    static get MIN_WIDTH (): number {
        return 20;
    }

    static get MIN_HEIGHT (): number {
        return 20;
    }

    static get DEFAULT_WIDTH (): number {
        return 100;
    }

    static get DEFAULT_HEIGHT (): number {
        return 100;
    }

}

export default Comment;
