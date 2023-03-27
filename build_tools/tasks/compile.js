
'use strict';

const path = require('path');
const chalk = require('chalk');
const WebpackConfigurator = require('../lib/compile/webpack.config');

module.exports = (env, argv) => {
    const packageFile = require(path.join(process.cwd(), './package.json'));
    const options = (argv.mode === 'development') ? packageFile.buildEnvironment.development :
                                                    packageFile.buildEnvironment.production;
    const siteToBuild = argv.region;

    console.log(chalk.white(`Initializing compiler in ${chalk.yellow(argv.mode)} mode\n`));

    // Global object to share state across compiler instances (multi-site compilations)
    process.webpack = {
        activeScssCompilers: 0,
        activeJsCompilers: 0
    };

    if(siteToBuild) {
        // only return an array of configuration objects for the specified site to the webpack compiler
        let selectedSite = packageFile.sites.filter(e => e.region == siteToBuild);
        return [].concat(...selectedSite.map(site =>
            new WebpackConfigurator(site, options).create()
        ));
    } else {
        // return an array of configuration objects per site to the webpack compiler
        return [].concat(...packageFile.sites.map(site =>
            new WebpackConfigurator(site, options).create()));
    }
};
