const config = require('config')
const fs = require('fs')

console.log('--- Making default config for react build...')

let cfg = {}
const copyKey = (key) => {
    cfg[key] = config.get('mobile.' + key)
}
copyKey('nodes')
copyKey('images')
copyKey('auth_service')
copyKey('notify_service')
copyKey('blogs_service')
fs.writeFileSync('src/app/default_cfg.js', 'module.exports = ' + JSON.stringify(cfg, null, 4))

console.log('--- Config done. Next stage is running react build.')
