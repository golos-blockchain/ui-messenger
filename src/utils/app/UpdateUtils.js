import semver from 'semver'
import tt from 'counterpart'
import { fetchEx } from 'golos-lib-js/lib/utils'

const folder = '/msg-android'

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
    } else { // only for testing purposes, in future can be used wider
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
        const url = new URL(
            folder,
            $GLS_Config.app_updater.host
        ).toString()
        let res = await httpGet(url, timeout)
        const doc = document.createElement('html')
        doc.innerHTML = res
        let files = []
        let links = doc.getElementsByTagName('a')
        let maxItem
        if (links) {
            for (let i = 0; i < links.length && i < 50; ++i) {
                const link = links[i]
                const href = link.getAttribute('href')
                if (!href.startsWith('glsmsg')) continue
                const [ productName, _rest ] = href.split('-')
                if (!_rest) continue
                const verParts = _rest.split('.')
                const ext = verParts.pop()
                let curVer = verParts.join('.')
                if (verParts.length === 2) {
                    curVer += '.0'
                }
                if (semver.gte($GLS_Config.app_version, curVer)) {
                    continue
                }
                if (!maxItem || semver.gt(curVer, maxItem.version)) {
                    maxItem = { version: curVer, txt: '' }
                    maxItem[ext === 'txt' ? 'txt' : 'exe'] = href
                } else if (semver.eq(curVer, maxItem.version)) {
                    maxItem[ext === 'txt' ? 'txt' : 'exe'] = href
                }
            }
        }
        if (maxItem && maxItem.exe) {
            return {
                version: maxItem.version,
                exe: maxItem.exe,
                exeLink: downloadLink(maxItem.exe),
                txt: maxItem.txt,
                title: tt('app_update.notify_VERSION', { VERSION: maxItem.version }),
            }
        }
    } catch (err) {
        console.error('checkUpdates', err)
    }
    return {}
}

function joinSlash(l, r) {
    if (!r.startsWith('/') && !l.endsWith('/')) {
        r = '/' + r
    }
    return l + r
}

function downloadLink(exeHref) {
    let url = exeHref
    url = joinSlash(folder, url)
    url = new URL(url, $GLS_Config.app_updater.host).toString()
    return url
}

export async function getChangelog(updateRes) {
    try {
        let url = updateRes.txt
        url = joinSlash(folder, url)
        url = new URL(url, $GLS_Config.app_updater.host).toString()
        let res = await httpGet(url, 1000, 'arraybuffer')
        const decoder = new TextDecoder('windows-1251')
        res = decoder.decode(res)
        return res
    } catch (err) {
        console.error('getChangelog', err)
        return ''
    }
}
