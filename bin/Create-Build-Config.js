/**
 * Create Build Config
 * This script will create the necessary config.json for the Build Suite
 *
 * This script requires the following Environment Variables to be set:
 *  - ENV : Name of the Environment to build from (cosmetic)
 *  - HOST : Host name of the SFCC Instance to build to
 *  - USER : Username of the Business Manager User to be used by the build
 *  - PASS : Password of the Business Manager user to be used by the build
 *  - GIT_BRANCH : The Branch that should be built (this is a Jenkins Environment Variable)
 *  - BUILD_ID : The Jenkins Build ID (to be used with the code version)
 *
 * @todo Replace pretty-log with console.log(chalk.color())
 * @todo Replace prompt + optimist with command-line-args
 */

const fs = require('fs'); // File System Operations
const path = require('path'); // Path Operations
const log = require('pretty-log'); // Pretty Logging
const prompt = require('prompt'); // Interactive Command Line Prompt
const optimist = require('optimist'); // Handle the parameters passed to this script

/**
 * The Schema to be used for the command line prompt
 *
 * Properties:
 * - brand (should be one of the brands in the package.json or all)
 * - env (should be dev or prod)
 * - debug (should debug messages be shown?)
 */
const schema = {
    properties: {
        ENV: {
            pattern: new RegExp('Staging|Development|QASandbox'),
            message: 'Environment Parameter: must be one of the following (Staging | QASandbox)',
            required: true,
            default: 'Staging'
        },
        HOST: {
            message: 'Host: Hostname of the instance to build to',
            required: true
        },
        USER: {
            message: 'USER: Business Manager User to deploy as',
            required: true
        },
        PASS: {
            message: 'PASS: Password to the Business Manager User Account',
            required: true
        },
        VERSION: {
            message: 'VERSION: Code Version',
            required: true
        },
        GIT_BRANCH: {
            message: 'GIT_BRANCH: Branch to build from (should come from Jenkins)',
            required: true
        },
        BUILD_ID: {
            message: 'BUILD_ID : Build ID to append to the code version',
            required: true
        },
        TWO_FACTOR: {
            pattern: new RegExp('yes|no'),
            message: 'Environment Parameter: must be one of the following (yes | no)',
            required: true,
            default: 'yes'
        },
        TWO_FACTOR_HOST: {
            message: 'TWO_FACTOR_HOST: Hostname to be used with Two Factor Authentication'
        },
        TWO_FACTOR_PASS: {
            message: 'TWO_FACTOR_PASS: Password to be used with Two Factor Authentication'
        }
    }
};

/**
 * Application Root Directory
 */
const rootDir = `${__dirname}/..`;

/**
 * Directory that contains the Build Suite configurations
 */
const buildConfigDir = `${rootDir}/build/build`;

/**
 * The config.json template we will populate with real values
 */
const configTemplateFile = `${buildConfigDir}/config-template.json`;

/**
 * The Destination config.json location
 */
const configFile = `${buildConfigDir}/config.json`;

/**
 * The DWUpload Config for the application, this is used for the cartridges
 */
const dwUploadSample = `${rootDir}/dw.sample.json`;

/**
 * Read in the Template Config file and parse the JSON
 */
const templateJSON = JSON.parse(fs.readFileSync(configTemplateFile));

/**
 * Read in the DW Upload Config File and parse the JSON
 */
const dwUploadJSON = JSON.parse(fs.readFileSync(dwUploadSample));

/**
 * Create Config
 * Generate a Build Suite config with the provided parameters
 * @param {Object} params Parameters to replace in the config file
 */
function createConfig(params) {
    /**
     * Populate the list of cartridges to build from the DW Upload Config
     */
    templateJSON.dependencies[0].cartridges = dwUploadJSON.cartridge.map((cartridge) => {
        return path.join('..', cartridge);
    });

    /**
     * Specify the branch to build, replacing the origin/ prefix with nothing
     */
    templateJSON.dependencies[0].repository.branch = params.GIT_BRANCH.replace('origin/', '');

    /**
     * Set the Build Number
     */
    templateJSON.settings.project.version = params.VERSION;
    templateJSON.settings.project.build = params.BUILD_ID;

    /**
     * Create the Environment setting that should be built to
     */
    const environmentParameter = {
        server: params.HOST,
        username: params.USER,
        password: params.PASS
    };

    if (params.TWO_FACTOR === 'yes' && params.TWO_FACTOR_HOST && params.TWO_FACTOR_PASS) {
        environmentParameter.two_factor = {
            enabled: 'true',
            cert: '../certs/build.p12',
            password: params.TWO_FACTOR_PASS,
            url: params.TWO_FACTOR_HOST
        };
    } else {
        delete environmentParameter.two_factor;
    }

    templateJSON.environments[params.ENV] = environmentParameter;

    /**
     * Write the config out
     */
    fs.writeFileSync(configFile, JSON.stringify(templateJSON, null, 2));
}

prompt.override = optimist.argv;

prompt.start();

// Retrieve the results of the prompt and execute the compilation of the JS files
prompt.get(schema, function (err, results) {
    log.success('Creating Config file...');
    createConfig(results);
    log.success('Config file generation complete!');
});
