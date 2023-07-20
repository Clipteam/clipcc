class Variable {
    public type: string;
    public id: string;
    public isLocal: boolean;
    public isCloud: boolean;
    public name: string;
    public identifier: string;

    public loadFromXML(xml: any) {
        this.type = xml['@_type'];
        this.id = xml['@_id'];
        this.isLocal = (xml['@_isLocal'] === 'true');
        this.isCloud = (xml['@_isCloud'] === 'true');
        this.name = xml['#text'];
    }

    public exportXML(): any {
        return {
            '@_type': this.type,
            '@_id': this.id,
            '@_isLocal': this.isLocal,
            '@_isCloud': this.isCloud,
            '#text': this.name
        };
    }

    public generateCode(): string {
        return [
            `@variable('${this.name}')`,
            `${this.identifier} = ''`
        ].join('\n');
    }
}

export default Variable;
