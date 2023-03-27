'use strict';

const shell = require('shelljs');
const path = require('path');
const os = require('os');
const fs = require('fs');
const cwd = process.cwd();
const pwd = __dirname;

/**
 * @returns {string} dwupload part of path
 */
function dwuploadModule() {
    let dwupload = fs.existsSync(path.resolve(cwd, './node_modules/.bin/dwupload')) ?
        path.resolve(cwd, './node_modules/.bin/dwupload') :
        path.resolve(pwd, './node_modules/.bin/dwupload');

    if (os.platform() === 'win32') {
        dwupload += '.cmd';
    }
    return dwupload;
}

module.exports = {
    /**
     * @param {string} brand - expecting name of brand cartridge
     * @returns {array} array of JS source files paths
     */
    createJsPath: (brand) => {
        const packageJson = require(path.join(cwd, './package.json'));
        const packageName = brand || packageJson.packageName || packageJson.name;
        const result = {};
        const jsFiles = shell.ls(path.join(cwd, `./cartridges/${packageName}/cartridge/client/**/js/*.js`));

        jsFiles.forEach(filePath => {
            let location = path.relative(path.join(cwd, `./cartridges/${packageName}/cartridge/client`), filePath);
            location = location.substr(0, location.length - 3);
            result[location] = filePath;
        });
        return result;
    },
    /**
     * @param {string} brand - expecting name of brand cartridge
     * @returns {array} array of SCSS source files paths
     */
    createScssPath: (brand) => {
        const packageJson = require(path.join(cwd, './package.json'));
        const packageName = brand || packageJson.packageName || packageJson.name;
        const result = {};
        const cssFiles = shell.ls(path.join(cwd, `./cartridges/${packageName}/cartridge/client/**/scss/**/*.scss`));

        cssFiles.forEach(filePath => {
            const name = path.basename(filePath, '.scss');
            if (name.indexOf('_') !== 0) {
                let location = path.relative(path.join(cwd, `./cartridges/${packageName}/cartridge/client`), filePath);
                location = location.substr(0, location.length - 5).replace('scss', 'css');
                result[location] = filePath;
            }
        });
        return result;
    },
    /**
     * @param {string} param - expecting line argument (--file || -- cartridge)
     * @param {string} fileOrCartridge - expecting path to file
     * @returns {string} full path for file uploading
     */
    shellCommands: (param, fileOrCartridge) => {
        const dwupload = dwuploadModule();
        if (os.platform() === 'win32') {
            return `cd ./cartridges && ${dwupload} ${param} ${fileOrCartridge} && cd ..`;
        }
        return `cd ./cartridges && node ${dwupload} ${param} ${fileOrCartridge} && cd ..`;
    }
};
