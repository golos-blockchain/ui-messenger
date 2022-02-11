const koa = require('koa')
const helmet = require('koa-helmet')
const koaRouter = require('koa-router')
const static = require('koa-static')
const cors = require('@koa/cors')
const config = require('config')
const git = require('git-rev-sync')
const path = require('path')
const { convertEntriesToArrays, } = require('./utils/misc')

const env = process.env.NODE_ENV || 'development';

const app = new koa()

const router = new koaRouter()

router.get('/api', async (ctx) => {
    ctx.body = {
        status: 'ok',
        version: git.short(),
        date: new Date(),
    }
})

router.get('/api/get_config', async (ctx) => {
    ctx.body = {
        nodes: config.get('nodes'),
        img_proxy_prefix: config.get('img_proxy_prefix'),
        img_proxy_backup_prefix: config.get('img_proxy_backup_prefix'),
        auth_service: config.get('auth_service'),
        notify_service: config.get('notify_service'),
    }
})

if (env !== 'production') {
    app.use(cors({ credentials: true }))
}

app.use(helmet())
if (env === 'production') {
    const helmetConfig = {
        directives: convertEntriesToArrays(config.get('helmet.directives')),
        reportOnly: false,
    };
    helmetConfig.directives.reportUri = '/api/csp_violation';
    app.use(helmet.contentSecurityPolicy(helmetConfig));
}

app.use(router.routes())
app.use(router.allowedMethods())

if (env === 'production') {
    const cacheOpts = { maxage: 0, gzip: true }
    app.use(static(path.join(__dirname, '../build'), cacheOpts))
}

app.listen(8080, () => console.log('running on port 8080'))
