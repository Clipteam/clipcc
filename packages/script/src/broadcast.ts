class Broadcast {
    public type: string;
    public id: string;
    public name: string;

    public loadFromXML(xml: any) {
        this.type = xml['@_type'];
        this.id = xml['@_id'];
        this.name = xml['#text'];
    }

    public exportXML(): any {
        return {
            '@_type': this.type,
            '@_id': this.id,
            '@_isLocal': false,
            '@_isCloud': false,
            '#text': this.name
        };
    }
}

export default Broadcast;
