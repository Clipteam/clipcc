import storage from './storage';
import qs from 'query-string';

const isTokenExpired = token => {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp < (Date.now() / 1000) + 60;
    } catch {
        throw new Error('token Invalid');
    }
};


const fetchToken = token => new Promise((resolve, reject) => {
    // Get new token if the old one has been expired
    if (!isTokenExpired(token)) {
        storage.setAuthorizationToken(token);
        return resolve(token);
    }
    fetch(`${storage.projectHost}auth/getToken`, {
        method: 'post',
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        },
        body: qs.stringify({
            old_token: token
        })
    })
        .then(response => {
            if (response.status !== 200) {
                return reject(new Error(`token fetch fail: ${response.status}`));
            }
            return response.json();
        })
        .then(data => {
            storage.setAuthorizationToken(data.token);
            resolve(data.token);
        })
        .catch(reject);
});

export {
    fetchToken
};
