import Stage from 'clipcc-script/stage';

class TestStage extends Stage {
    @position(200, 0)
    unnamed() {
        this.x = 0;
        this.y = 0;
    }

    @position(0, 0)
    whenGreenFlag() {
        this.x = 10;
        this.y = 10;
    }
}
