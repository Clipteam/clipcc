const UserData = require('../../src/io/userData');

test('spec', () => {
    const userData = new UserData();

    expect(typeof userData).toBe('object');
    expect(typeof userData.postData).toBe('function');
    expect(typeof userData.getUsername).toBe('function');
});

test('getUsername returns empty string initially', () => {
    const userData = new UserData();

    expect(userData.getUsername()).toBe('');
});

test('postData sets the username', () => {
    const userData = new UserData();
    userData.postData({username: 'TEST'});
    expect(userData.getUsername()).toBe('TEST');
});
