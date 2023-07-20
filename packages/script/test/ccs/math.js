import Stage from 'clipcc-script/stage';

class TestStage extends Stage {
    unnamed() {
        this.x = 0;
        this.y = 0;
    }

    whenGreenFlag() {
        this.x = 1; // This is an comment
        /*
         * This is block comment
         */
        this.x = 7 + 1 * 2;
    }
}
