import Definition from './definition';
import Script from './script';
import blockPrototypes from './block_definition';
import { codeRules } from './code_definition';
import NameGenerator from './name_generator';

class Project {
    private scripts: Map<string, Script>;
    private definition: Definition;
    private nameUtil: NameGenerator;

    constructor() {
        this.nameUtil = new NameGenerator();
        this.nameUtil.checkName('stage');

        this.definition = new Definition();
        this.definition.blocks = blockPrototypes;
        this.definition.codeRule = codeRules;

        this.scripts = new Map<string, Script>();
        this.scripts.set('stage', new Script(this.definition));
    }

    public getScript(name: string): Script {
        if (!this.scripts.has(name)) {
            this.scripts.set(name, new Script(this.definition));
        }
        return this.scripts.get(name);
    }
}

export default Project;
