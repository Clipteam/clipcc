import Stage from 'clipcc-script/stage';

class TestStage extends Stage {
    unnamed() {
        this.x = 0;
        this.y = 0;
    }

    whenGreenFlag() {
        while (1 > 0) {
            this.x = 5;
        }
        while (!(1 > 0)) {
            this.x = 5;
        }

        /*while (!(this.x < 10)) {
            this.x = this.x + 1;
        }*/

        while (true) {
            this.x = 0;
        }
    }
}
