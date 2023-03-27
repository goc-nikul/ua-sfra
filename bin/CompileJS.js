/* eslint-disable no-console */

'use strict';

const webpack = require('webpack');
const webpackFullConfig = require('../webpack.config');
const options = require('../bin/options');

/**
 * Find the JS Webpack configuration in the root
 * Webpack config file
 */
const webpackConfig = webpackFullConfig.filter((config) => {
    return config.name === 'js';
}).pop();

/**
 * If the --watch flag was passed, instruct Webpack to watch for changes
 */
if (options.watch) {
    webpackConfig.watch = true;
}

console.log('Compiling JS...');

/**
 * Compile the assets using Webpack
 */
webpack(webpackConfig, (err, stats) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stats.toString({
        chunks: false,
        colors: true
    }));
});
