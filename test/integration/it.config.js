'use strict';

var testConfig = require('../config');
var getConfig = require('@tridnguyen/config');

var opts = Object.assign({}, getConfig({
    baseUrl: testConfig.baseUrl,
    suite: '*',
    reporter: 'spec',
    timeout: 60000,
    locale: 'x_default',
    storefrontAuth: testConfig.storefrontAuth
}, './config.json'));

module.exports = opts;
