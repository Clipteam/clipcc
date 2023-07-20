class CustomSprite extends Sprite {
    @position(0, 0)
    @event('whenGreenFlag')
    async whenGreenFlag() {
        await this.broadcast('message1');
        this.broadcast('message1');
    }
    @position(0, 0)
    @broadcast('message1')
    whenBroadcast() {
        this.x += 1;
    }
}
