import golos from 'golos-lib-js'

import defaultCfg from 'app/app/default_cfg'
import { callApi } from 'app/utils/ServerApiClient'

const cacheMaxAge = 300*1000 // milliseconds

const initConfig = async () => {
    if (process.env.MOBILE_APP) {
        await loadMobileConfig()
    } else if (process.env.DESKTOP_APP) {
        await loadDesktopConfig()
    } else {
        if (!await loadConfigCache()) {
            await loadConfigFromServer()
        }
    }
}

const loadMobileConfig = async () => {
    console.log('Loading app config...')
    let cfg = localStorage.getItem('app_settings')
    if (cfg) {
        try {
            cfg = JSON.parse(cfg)
            // Add here migrations
            if (cfg.notify_service && !cfg.notify_service.host_ws) {
                delete cfg.notify_service
            }
            cfg = { ...defaultCfg, ...cfg }
        } catch (err) {
            console.error('Cannot parse app_settings', err)
            cfg = defaultCfg
        }
    } else {
        cfg = defaultCfg
    }
    if (!cfg.current_node) {
        cfg.current_node = cfg.nodes[0].address
    }
    if (cfg.images.use_img_proxy === undefined) {
        cfg.images.use_img_proxy = true
    }
    cfg.app_version = defaultCfg.app_version
    window.$GLS_Config = cfg
    await initGolos()
}

const loadDesktopConfig = async () => {
    console.log('Loading app config...')
    const appConfig = window.appSettings.load()
    let cfg = {...appConfig}
    cfg.current_node = cfg.ws_connection_client
    cfg.blogs_service = {
        host: 'app://' + cfg.site_domain
    }
    cfg.site_domain = new URL(cfg.messenger_service.host).host
    window.$GLS_Config = cfg
    await initGolos()
}

const loadConfigCache = async () => {
    if (typeof(localStorage) === 'undefined') {
        console.error('localStorage is not supported by browser. So caching of server config will not work and it can affect performance')
        return false
    }
    let serverConfig = localStorage.getItem('server_config')
    if (serverConfig) {
        try {
            serverConfig = JSON.parse(serverConfig)
        } catch (error) {
            console.error('Cannot parse server_config! It can affect performance', serverConfig)
            return false
        }
        const now = Date.now()
        if (now - serverConfig.time < cacheMaxAge && serverConfig.config.wallet_service) {
            window.$GLS_Config = serverConfig.config
            window.$GLS_Config.current_node = window.$GLS_Config.nodes[0].address
            await initGolos()
            return true
        }
    }
    console.log('Config cache outdated - loading it from server')
    return false
}

const loadConfigFromServer = async () => {
    let res = await callApi('/api/get_config')
    res = await res.json()
    window.$GLS_Config = res
    window.$GLS_Config.current_node = window.$GLS_Config.nodes[0].address
    let serverConfig = {
        config: res,
        time: Date.now()
    }
    serverConfig = JSON.stringify(serverConfig)
    localStorage.setItem('server_config', serverConfig)
    await initGolos()
}

const initGolos = async () => {
    const node = $GLS_Config.current_node
    golos.config.set('websocket', node)
    if ($GLS_Config.nodes) {
        const nodeObj = $GLS_Config.nodes.filter(item => item.address === node)
        if (nodeObj[0] && nodeObj[0].chain_id) {
            golos.config.set('chain_id', nodeObj[0].chain_id)
        }
    } else if ($GLS_Config.chain_id) { // Desktop app
        golos.config.set('chain_id', $GLS_Config.chain_id)
    }
    if (process.env.MOBILE_APP) {
        golos.config.set('node_timeout', 5000)
    }
    await golos.importNativeLib()
}

export default initConfig
