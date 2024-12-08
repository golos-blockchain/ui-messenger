import { fetchEx } from 'golos-lib-js/lib/utils'

export function getHost() {
    const { location, } = window;
    if (process.env.NODE_ENV === 'development') {
        return location.protocol + '//'+ location.hostname + ':8088';
    }
    return location.origin;
}

export async function callApi(apiName, data) {
    let request = {
        method: data ? 'post' : 'get',
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-type': data ? 'application/json' : undefined,
        },
        body: data ? JSON.stringify(data) : undefined,
    };
    let res = await fetchEx(getHost() + apiName, request);
    return res;
}
