/* eslint-disable no-console */

'use strict';

const cwd = process.cwd();
const fs = require('fs');
const path = require('path');
const helpers = require('../bin/helpers');
const cartridgesJson = fs.readFileSync('./cartridges.json');
const cartridgePaths = JSON.parse(cartridgesJson).cartridgePaths;
const webpackFullConfig = require('../webpack.config');
const webpack = require('webpack');

cartridgePaths.forEach(cartridge => {
    const jsConfig = webpackFullConfig.find(item => item.name === 'js');

    jsConfig.entry = helpers.createJsPath(cartridge);
    jsConfig.output.path = path.join(cwd, `./cartridges/${cartridge}/cartridge/static/`);
    // If JS source files exist compile it using Webpack
    if (Object.keys(jsConfig.entry).length > 0) {
        webpack(jsConfig, (err, stats) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stats.toString({
                all: false,
                errors: true,
                colors: true
            }));
        });
        console.log('\x1b[32m');
        console.log('JS source files is successfully compiled for cartridge: ' + cartridge);
        console.log('\x1b[37m');
    }
});
