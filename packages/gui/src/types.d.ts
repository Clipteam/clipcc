declare module '!!arraybuffer-loader!.*' {
    declare const value: ArrayBuffer;
    export default value;
}

declare module '*?raw' {
    declare const value: string;
    export default value;
}

declare module '*.svg' {
    declare const value: string;
    export default value;
}

declare module '*.css' {
    declare const value: { [className: string]: string };
    export default value;
}
