// clipcc-script Library

declare class BaseObject {
    public async broadcast(broadcast: string): Promise<void>;
}

declare class Stage extends BaseObject {
    
}

declare class Sprite extends BaseObject {
    public stage: Stage;

    public x: number;
    public y: number;
    public direction: number;
}

