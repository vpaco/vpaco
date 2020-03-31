const loaders = require('./webpack.loaders.js')
const plugins = require('./webpack.plugins.js')

module.exports = {
    entry: {
        main: './src/index.js'
    },
    resolve: {
        extensions: ['.js', '.vue']
    },

    output: {
        // eslint-disable-next-line no-undef
        path: __dirname + '/../dist/',
        filename: 'vpaco.js',
        library: 'vpaco',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },

    externals: {
        vue: {
            root: 'Vue',
            commonjs: 'vue',
            commonjs2: 'vue',
            amd: 'vue'
        }
    },

    module: {
        loaders: loaders,
    },

    devtool: false,
}
