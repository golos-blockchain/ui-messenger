const config = require('config')
const fs = require('fs')
const app_version = require('./package.json').version

console.log('--- Making default config for react build...')

let cfg = {}
const copyKey = (key) => {
    cfg[key] = config.get('mobile.' + key)
}
cfg.app_version = app_version
copyKey('nodes')
copyKey('images')
copyKey('auth_service')
copyKey('notify_service')
copyKey('blogs_service')
copyKey('wallet_service')
copyKey('app_updater')
fs.writeFileSync('src/app/default_cfg.js', 'module.exports = ' + JSON.stringify(cfg, null, 4))

console.log('--- Config done. Next stage is running react build.')
