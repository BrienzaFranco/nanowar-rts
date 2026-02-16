const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
    plugins: [
        // Copy static files if needed, but we serve from public/ directly usually.
        // If output is public/dist, index.html in public/ needs to ref bundle.js as dist/bundle.js or similar.
        // Let's keep it simple: Serve public/ as static root, bundle goes into public/dist/
    ],
};
