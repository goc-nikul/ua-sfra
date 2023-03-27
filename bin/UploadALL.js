/* eslint-disable no-console */

'use strict';

const cwd = process.cwd();
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const helpers = require('../bin/helpers');
const cartridgesJson = fs.readFileSync('./cartridges.json');
const cartridgePaths = JSON.parse(cartridgesJson).cartridgePaths;

shell.cp(path.join(cwd, 'dw.json'), path.join(cwd, './cartridges/'));

cartridgePaths.forEach(cartridge => {
    shell.exec(helpers.shellCommands('--cartridge', cartridge));
});

shell.rm(path.join(cwd, './cartridges/dw.json'));
