import fs from 'fs';
import CodeParser from '../src/code_parser';
import Project from '../src/project';

const code: string = fs.readFileSync(`./test/ccs/${process.argv[2]}.js`, {encoding: 'utf-8'});

const script = (new Project()).getScript('stage');
const parser = new CodeParser(script);
parser.loadFullCode(code);
console.log(script.exportXML());
console.log(script.generateCode());
