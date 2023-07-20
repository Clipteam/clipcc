import Stage from 'clipcc-script/stage';

class TestStage extends Stage {
    unnamed() {
        this.x = 0;
        this.y = 0;
    }

    whenGreenFlag() {
        if (0 == 0) {
            this.x = 1;
        }

        if (1 == 0) {
            this.x = 1;
        }
        else {
            this.y = 1;
        }
    }
}
