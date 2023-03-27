/* eslint-disable no-console */

'use strict';

const webpack = require('webpack');
const webpackFullConfig = require('../webpack.config');
const helpers = require('../bin/helpers');
const shell = require('shelljs');
const path = require('path');
const chokidar = require('chokidar');
const cwd = process.cwd();

/**
 * Execute files uploading via webdav connection
 * @param {array} files - expecting array of string with files names
 */
function uploadFiles(files) {
    shell.cp('dw.json', './cartridges/'); // copy dw.json file into cartridges directory temporarily

    files.forEach(file => {
        const relativePath = path.relative(path.join(cwd, './cartridges/'), file);
        shell.exec(helpers.shellCommands('--file', relativePath));
    });

    shell.rm('./cartridges/dw.json'); // remove dw.json file from cartridges directory
}

/**
 * Execute files deleting via webdav connection
 * @param {array} files - expecting array of string with files names
 */
function deleteFiles(files) {
    shell.cp('dw.json', './cartridges/'); // copy dw.json file into cartridges directory temporarily

    files.forEach(file => {
        const relativePath = path.relative(path.join(cwd, './cartridges/'), file);
        shell.exec(helpers.shellCommands('delete --file', relativePath));
    });

    shell.rm('./cartridges/dw.json'); // remove dw.json file from cartridges directory
}

// Compile {brand} core sources and watch
webpackFullConfig.watch = true;

const compiler = webpack(webpackFullConfig);

compiler.watch({
    aggregateTimeout: 300,
    poll: undefined
}, (err, stats) => {
    if (err) {
        console.log(err);
    }

    console.log(stats.toString({
        all: false,
        modules: true,
        maxModules: 0,
        errors: true,
        warnings: true,
        moduleTrace: true,
        errorDetails: true,
        chunks: false,
        colors: true
    }));
});


// Start watch all other files
const watcher = chokidar.watch(path.join(cwd, 'cartridges'), {
    ignored: [
        '**/cartridge/js/**',
        '**/cartridge/client/**',
        '**/*.scss'
    ],
    persistent: true,
    ignoreInitial: true,
    followSymlinks: false,
    awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
    }
});

watcher.on('change', filename => {
    console.log(`Detected change in file: ${filename}`);
    uploadFiles([filename]);
});

watcher.on('add', filename => {
    console.log(`Detected added file: ${filename}`);
    uploadFiles([filename]);
});

watcher.on('unlink', filename => {
    console.log(`Detected deleted file: ${filename}`);
    deleteFiles([filename]);
});
