module.exports = [
    {
        test: /\.js$/i,
        use: 'babel-loader',
    },
    {
        test: /\.vue$/i,
        use: 'vue-loader',
    },
    {
        test: /\.(css)$/i,
        use: [
            'style-loader',
            'css-loader'
        ],
    },
    {
        test: /\.less$/i,
        use: [
            'style-loader',
            'css-loader',
            'less-loader',
        ],
    },
]
