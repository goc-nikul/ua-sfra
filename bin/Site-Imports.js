/* eslint no-console: 0 */

'use strict';

const commandLineArgs = require('command-line-args');
const fs = require('fs'); // Interact with the file system
const archiver = require('archiver'); // Used to create the ZIP archive
const chalk = require('chalk');
const path = require('path');

const SITE_DEMO = 'site_demo';
const SITE_TEMPLATE = 'site_template';

/**
 * Retrieve the command line parameters
 */
const optionDefinitions = [
    {
        name: 'type',
        type: String,
        defaultOption: true,
        defaultValue: 'all'
    }
];

const options = commandLineArgs(optionDefinitions);

const bytesToSize = function (bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

const zipFolder = function (folder) {
    // Create a file to stream archive data to.
    const output = fs.createWriteStream(`./${folder}.zip`);
    const archive = archiver('zip', {
        zlib: {
            level: 9
        } // compression level
    });

    output.on('close', () => {
        console.info(`Archived ${folder} folder (${bytesToSize(archive.pointer())} total bytes)`);
    });

    archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
            console.warn(err);
        } else {
            console.error(`Error occurred while archiving ${folder} folder`, err);
        }
    });

    archive.on('error', (err) => {
        console.error(`Error occurred while archiving ${folder} folder`, err);
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Append files from a sub-directory, putting its contents at the root of archive
    archive.directory(path.join('./sites', folder), folder);

    // Finalize the archive
    archive.finalize();
};

console.log('\x1b[30m\x1b[41m$WARNING: Site Demo should NEVER be imported on the Staging / Production instances!\x1b[0m');

console.log(chalk.yellow('Removing site-demo.zip'));

if (fs.existsSync(`./${SITE_DEMO}.zip`)) {
    fs.unlinkSync(`./${SITE_DEMO}.zip`);
}

console.log(chalk.yellow(`Removing ${SITE_TEMPLATE}.zip`));

if (fs.existsSync(`./${SITE_TEMPLATE}.zip`)) {
    fs.unlinkSync(`./${SITE_TEMPLATE}.zip`);
}

switch (options.type) {
    case 'all':
        zipFolder(SITE_DEMO);
        zipFolder(SITE_TEMPLATE);
        break;
    case 'template':
        zipFolder(SITE_TEMPLATE);
        break;
    case 'demo':
        zipFolder(SITE_DEMO);
        break;
    default:
        console.error(chalk.red('Invalid option for import parameter'));
}

console.log('\x1b[30m\x1b[41m$WARNING: Site Demo and Site RefArch should NEVER be imported on the Staging / Production instances!\x1b[0m');
