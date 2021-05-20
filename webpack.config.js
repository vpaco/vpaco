const path = require('path');
const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');


module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        // eslint-disable-next-line no-undef
        path: __dirname + '/dist',
        publicPath: './', // 部署后的资源地址
        filename: 'vpaco.js',
        library: 'vpaco',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    experiments: {
        topLevelAwait: true, // 试验性质顶级作用域允许await
    },
    plugins: [
        new CleanWebpackPlugin(),
        new VueLoaderPlugin(),
    ],

    module: {
        rules: [
            {
                test: /\.(js)$/,
                loader: 'babel-loader',
                // eslint-disable-next-line no-undef
                include: [path.resolve(__dirname, 'src')],
                exclude: [/node_modules/],
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /.(less|css)$/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',

                        options: {
                            sourceMap: true,
                        },
                    },
                    {
                        loader: 'less-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                test: /\.(txt|png|jpg|ttf|woff)/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 4 * 1024 // 4kb  指定大小
                    }
                }
            }
        ],
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.vue'],
    },

    externals: [
        {
            vue: {
                root: 'Vue',
                commonjs: 'vue',
                commonjs2: 'vue',
            },
        },
    ],

    devtool: false
};
