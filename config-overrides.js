const path = require('path')
const webpack = require('webpack')

module.exports = function override(config, env) {
    let resolve = config.resolve
    resolve.alias = {
        ...resolve.alias,
        process: 'process/browser',
        stream: 'stream-browserify',

        app: path.join(__dirname, 'src'),
    }

    config.module.rules[1].oneOf.unshift({
        test: /\.svg/,
        type: 'asset/source'
    })

    config.plugins.push(
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
    )

    config.plugins.push(
        new webpack.DefinePlugin({
            'process.env.IS_APP': JSON.stringify(!!process.env.IS_APP),
            'process.env.DESKTOP_APP': JSON.stringify(!!process.env.DESKTOP_APP),
            'process.env.MOBILE_APP': JSON.stringify(!!process.env.MOBILE_APP),
        }),
    )

    return config
}
