const webpack = require('webpack')
const TerserPlugin = require("terser-webpack-plugin");
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = [
    new VueLoaderPlugin(),
    new TerserPlugin({
        // 和productionSourceMap一样
        // sourceMap: false,
        terserOptions: {
            compress: {
                // 移除所有console相关的代码，比如console.log,console.error
                drop_console: true,
                // 关闭自动断点功能，vue代码里插入debugger指令后，执行到对应位置会自动断线，此选项是移除debugger指令
                drop_debugger: true,
                // pure_funcs数组是用来配置移除指定的指令，比如console.log  alert等等
                // 移除console.log，需要配合.eslintrc.js文件里的如下设置，不然打包会出警告
                // rules: {
                //   'no-console':  'off',
                // }
                pure_funcs: ["console.log", "console.error"],
            },
        },
    }),
    new webpack.LoaderOptionsPlugin({
        minimize: true
    }),
]
