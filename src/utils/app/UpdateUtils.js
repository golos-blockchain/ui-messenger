import tt from 'counterpart'
import { fetchEx } from 'golos-lib-js/lib/utils'

function updaterHost() {
    return $GLS_Config.app_updater.host
}

async function httpGet(url, timeout = fetchEx.COMMON_TIMEOUT, responseType = 'text') {
    if (process.env.MOBILE_APP) {
        return await new Promise((resolve, reject) => {
            try {
                cordova.plugin.http.sendRequest(url, {
                    responseType,
                    timeout: Math.ceil(timeout / 1000)
                }, (resp) => {
                    resolve(resp.data)
                }, (resp) => {
                    reject(resp.error)
                })
            } catch (err) {
                reject(err)
            }
        })
    } else {
        let res = await fetchEx(url, {
            timeout
        })
        if (responseType === 'arraybuffer') {
            res = await res.arrayBuffer()
        } else {
            res = await res.text()
        }
        return res
    }
}

export async function checkUpdates(timeout = 2000) {
    try {
        let path
        const isDesktop = process.env.DESKTOP_APP
        if (isDesktop) {
            path = 'desktop/' + ($GLS_Config.platform === 'linux' ? 'linux' : 'windows')
        } else {
            path = 'messenger/android'
        }
        const url = new URL(
            '/api/' + path, updaterHost()
        )
        url.searchParams.append('latest', '1')
        url.searchParams.append('after', $GLS_Config.app_version)
        let res = await httpGet(url, timeout)
        res = JSON.parse(res)
        if (res.status === 'ok' && res.data) {
            const versions = Object.entries(res.data)
            if (versions[0]) {
                const [ v, obj ] = versions[0]
                if (obj.exe) {
                    return {
                        version: v,
                        exe: obj.exe,
                        exeLink: new URL(obj.exe_url, updaterHost()).toString(),
                        txt: obj.txt,
                        txtLink: new URL(obj.txt_url, updaterHost()).toString(),
                        title: tt('app_update.notify_VERSION', { VERSION: v }),
                    }
                } else {
                    console.error(versions[0])
                }
            }
        } else {
            console.error(res)
        }
    } catch (err) {
        console.error('checkUpdates', err)
    }
    return {}
}

export async function getChangelog(txtLink) {
    try {
        let res = await httpGet(txtLink, 1000, 'arraybuffer')
        const decoder = new TextDecoder('windows-1251')
        res = decoder.decode(res)
        return res
    } catch (err) {
        console.error('getChangelog', err)
        return ''
    }
}
