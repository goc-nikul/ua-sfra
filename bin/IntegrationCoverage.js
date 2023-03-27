/* eslint-disable no-console */

'use strict';

const fs = require('fs');
const path = require('path');
const lineReader = require('line-reader');
const async = require('async');
const chalk = require('chalk');

const glob = require('glob'); // Find files with a specified 'glob' pattern

const endpointRegex = /server\.(?:append|get|post|prepend)\(.*?'(.*?)'/gi;

/**
 * Controllers
 *
 * @param {string} folder The Folder to analyze
 *
 * @returns {array} An array of controller endpoints found
 */
function controllers(folder) {
    const fileGlob = path.join(folder, '**', 'cartridge', 'controllers', '*.js');

    const globOptions = {
        ignore: ['node_modules',
            '**/bm_paypal/cartridge/controllers/**.js',
            '**/int_marketing_cloud/cartridge/controllers/**.js',
            '**/int_paymetric/cartridge/controllers/**.js',
            '**/int_vertex/cartridge/controllers/**.js',
            '**/int_paypal_sfra/cartridge/controllers/**.js',
            '**/int_coremedia/cartridge/controllers/**.js',
            '**/int_coremedia_sfra/cartridge/controllers/**.js'
        ]
    };

    const files = glob.sync(fileGlob, globOptions);
    const rawEndpoints = [];

    files.forEach((file) => {
        const controllerFile = file
            .split('/')
            .pop()
            .replace('.js', '');
        const fileContents = fs.readFileSync(file).toString();
        const cleanFileContents = fileContents.replace(/\r?\n|\r|\n/g, '');

        let matchArray;

        while ((matchArray = endpointRegex.exec(cleanFileContents))) { // eslint-disable-line
            rawEndpoints.push({
                endpoint: `${controllerFile}-${matchArray[1]}`,
                file: file
            });
        }
    });

    const endpoints = rawEndpoints.sort().filter((value, index, self) => {
        return self.indexOf(value) === index;
    });

    return endpoints;
}

const endpoints = controllers(path.join(__dirname, '..', 'cartridges'));
let testedEndpoints = endpoints.map((endpoint) => {
    const returnEndpoint = endpoint;

    returnEndpoint.tested = false;

    return returnEndpoint;
});

const files = glob.sync(
    path.join(__dirname, '..', 'test', 'integration', '**', '*.js'), {
        ignore: '**/it.config.js'
    }
);

async.each(files, (file, callback) => {
    lineReader.eachLine(file, function (line) {
        testedEndpoints = testedEndpoints.map((endpoint) => {
            const returnEndpoint = endpoint;

            if (line.indexOf(endpoint.endpoint) > -1) {
                /**
                 * @todo bug, tested = false in final result
                 */
                returnEndpoint.tested = true;
            }

            return returnEndpoint;
        });
    }, () => {
        callback();
    });
}, () => {
    testedEndpoints.forEach((result) => {
        const file = result.file.substr(result.file.indexOf('cartridges'));

        if (result.tested) {
            console.log(chalk.green(`Endpoint: ${result.endpoint}, in file: ${file} has an integration test!`));
        } else {
            console.log(chalk.red(`Endpoint: ${result.endpoint}, in file: ${file} is missing an integration test!`));
        }
    });
});
