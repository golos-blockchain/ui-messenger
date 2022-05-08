const fs = require('fs')
const fse = require('fs-extra')
const cheerio = require('cheerio')
const CordovaConfig = require('cordova-config')
const config = require('config')

function dirExists(path) {
    try {
        return fs.statSync(path).isDirectory();
    } catch (e) {
        return false
    }
}

const distPath = 'cordova'
const configFile = distPath + '/config.xml'
const indexHtml = distPath + '/www/index.html'

console.log('--- Copying files to "' + distPath + '" folder...')

if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath)
}
fs.copyFileSync('config.xml', configFile)
fs.copyFileSync('package.json', distPath + '/package.json') // for "cordova prepare"
fs.copyFileSync('yarn.lock', distPath + '/yarn.lock')

console.log('--- Adding hostname to "' + configFile + '" file...')

let cc = new CordovaConfig(configFile)
cc.setPreference('hostname', config.get('mobile.site_domain'))
cc.writeSync()

console.log('--- Moving react "build" folder to "' + distPath + '/www"')

if (dirExists('build')) {
    fs.rmSync(distPath + '/www', { recursive: true, force: true });
    fs.renameSync('build', distPath + '/www')
}

console.log('--- Copying "res" folder to "' + distPath + '/res"')

fse.copySync('res', distPath + '/res')

console.log('--- Including cordova.js script into "' + indexHtml + '" file...')

let idx = fs.readFileSync(indexHtml, 'utf8')
idx = cheerio.load(idx)
if (idx('script[src="cordova.js"]').length === 0) {
    idx('<script src="cordova.js"></script>').insertBefore('script')
    idx('<script>var FileReader0 = FileReader</script>').insertBefore('script')
    console.log('Included.')
} else {
    console.log('Already exists.')
}
fs.writeFileSync(indexHtml, idx.html())

console.log('--- Copied. Installing Cordova plugins and platforms ("cordova prepare"), and building+running android')
