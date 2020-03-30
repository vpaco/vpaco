module.exports = [
    {
        test: /\.js$/i,
        loader: 'babel-loader',
    },
    {
        test: /\.vue$/i,
        loader: 'vue-loader'
    },
    {
        test: /\.(css)$/i,
        loader: [
            'style-loader',
            'css-loader'
        ],
    },
    {
        test: /\.less$/i,
        loader: [
            'style-loader',
            'css-loader',
            'less-loader',
        ],
    },
]
