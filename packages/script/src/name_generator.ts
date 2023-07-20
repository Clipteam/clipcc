class NameGenerator {
    private usedName = new Set<string>();
    private cntName = new Map<string, number>();

    public clear(): void {
        this.usedName.clear();
        this.cntName.clear();
    }

    public checkName(name: string): string {
        if (this.usedName.has(name)) {
            const suffix = this.cntName.get(name) + 1;
            this.cntName.set(name, suffix + 1);
            name = name + suffix.toString();
        }
        this.usedName.add(name);
        return name;
    }

    public checkIdentifier(identifier: string): string {
        // space in identifier
        identifier.replace(' ', '_');

        // begin with a number
        const begChar = identifier.charCodeAt(0);
        if (begChar >= 48 && begChar <= 57) {
            identifier = '_' + identifier;
        }

        // begin with # (which means private property in ES2022)
        identifier.replace('#', '_');

        return this.checkName(identifier);
    }
}

export default NameGenerator;
