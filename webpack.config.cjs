const path = require('path');

module.exports = {
    entry: './src/client/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public/dist'),
        clean: true,
    },
    mode: 'development',
    devtool: 'source-map',
    resolve: {
        alias: {
            '@core': path.resolve(__dirname, 'src/client/core/'),
            '@systems': path.resolve(__dirname, 'src/client/systems/'),
            '@modes': path.resolve(__dirname, 'src/client/modes/'),
            '@utils': path.resolve(__dirname, 'src/client/utils/'),
            '@shared': path.resolve(__dirname, 'src/shared/'),
        },
    },
};
