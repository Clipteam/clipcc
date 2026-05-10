class UserData {
    _username = '';

    /**
     * Handler for updating the username
     * @param data Data posted to this ioDevice.
     * @param data.username The username to set for this user data device.
     */
    postData (data: {username: string}): void {
        this._username = data.username;
    }

    /**
     * Getter for username. Initially empty string, until set via postData.
     * @returns The current username
     */
    getUsername (): string {
        return this._username;
    }
}

export default UserData;
