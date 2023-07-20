import Stage from 'clipcc-script/stage';

class TestStage extends Stage {
    @variable('This_Is_Private_Var')
    var = 0;

    @position(0, 200)
    unnamed() {
        this.x = this.var;
        this.y = 0;
    }

    @position(0, 0)
    whenGreenFlag() {
        this.var = this.y;
    }
}
