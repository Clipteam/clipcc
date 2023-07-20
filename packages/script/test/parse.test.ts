import fs from 'fs';
import Project from '../src/project';

const xml: string = fs.readFileSync(`./test/xml/${process.argv[2]}.xml`, {encoding: 'utf-8'});

const script = (new Project()).getScript('stage');
script.loadFromXML(xml);
console.log(script.generateCode());

console.log(script.exportXML());
