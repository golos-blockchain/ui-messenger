const request_base = {
    method: 'post',
    credentials: 'include',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
    }
};

const authAvailable = () => {
    return process.env.BROWSER && typeof($GLS_Config) !== 'undefined'
        && $STM_Config.auth_service && $GLS_Config.auth_service.host;
};

export const authUrl = (pathname) => {
    return new URL(pathname, $GLS_Config.auth_service.host).toString();
};

export const authRegisterUrl = () => {
    let pathname = '/register';
    if (authAvailable() && $GLS_Config.auth_service.custom_client) {
        pathname = '/' + $GLS_Config.auth_service.custom_client + pathname;
    }
    return authUrl(pathname);
};

function setSession(request) {
    request.headers['X-Auth-Session'] = localStorage.getItem('X-Auth-Session');
}

function saveSession(response) {
    let session = null;
    for (const header of response.headers.entries()) { // Firefox Android not supports response.headers.get()
        if (header[0].toLowerCase() === 'x-auth-session') {
            session = header[1];
            break;
        }
    }
    if (!session) return;
    localStorage.setItem('X-Auth-Session', session);
}

export function authApiLogin(account, signatures) {
    if (!authAvailable()) return;
    let request = Object.assign({}, request_base, {
        body: JSON.stringify({account, signatures}),
    });
    setSession(request);
    return fetch(authUrl(`/api/login_account`), request).then(r => {
        saveSession(r);
        return r.json();
    });
}

export function authApiLogout() {
    if (!authAvailable()) return;
    let request = Object.assign({}, request_base, {
        method: 'get',
    });
    setSession(request);
    fetch(authUrl(`/api/logout_account`), request).then(r => {
        saveSession(r);
    });
}

