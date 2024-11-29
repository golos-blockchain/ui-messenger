const koa = require('koa')
const compress = require('koa-compress')
const helmet = require('koa-helmet')
const koaRouter = require('koa-router')
const static = require('koa-static')
const cors = require('@koa/cors')
const coBody = require('co-body')
const config = require('config')
const git = require('git-rev-sync')
const fs = require('fs')
const path = require('path')
const { convertEntriesToArrays, } = require('./utils/misc')

const env = process.env.NODE_ENV || 'development';

const app = new koa()

app.use(compress({
  filter (content_type) {
    return true
  },
  threshold: 2048,
  gzip: {
    flush: require('zlib').constants.Z_SYNC_FLUSH
  },
  deflate: {
    flush: require('zlib').constants.Z_SYNC_FLUSH,
  },
  br: false // disable brotli
}))

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
        images: config.get('images'),
        auth_service: config.get('auth_service'),
        notify_service: config.get('notify_service'),
        blogs_service: config.get('blogs_service'),
        wallet_service: config.get('wallet_service'),
    }
})

router.post('/api/csp_violation', async (ctx) => {
    const params = await coBody.json(ctx)
    console.log('-- /api/csp_violation -->', ctx.request.headers['user-agent'], params)
    ctx.body = ''
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

if (env === 'production') {
    const buildPath = path.join(__dirname, '../build')
    app.use(async (ctx, next) => {
        const parts = ctx.path.split('/')
        // /
        // /@user
        // /group
        if (parts.length === 2 && parts[1] !== 'api') {
            const filePath = path.join(buildPath, parts[1])
            if (!fs.existsSync(filePath)) {
                ctx.url = '/'
            }
        }
        await next()
    })
    const cacheOpts = { maxage: 0, gzip: true }
    app.use(static(buildPath, cacheOpts))
}

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(8080, () => console.log('running on port 8080'))
