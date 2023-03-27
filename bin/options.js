'use strict';

const commandLineArgs = require('command-line-args');

/**
 * Specify what command line options are available and then
 * retrieve them
 */
const optionDefinitions = [
    {
        name: 'site',
        type: String,
        defaultOption: true,
        defaultValue: 'ua'
    },
    {
        name: 'watch',
        type: Boolean
    },
    {
        name: 'dev',
        type: Boolean
    }
];

module.exports = commandLineArgs(optionDefinitions);
