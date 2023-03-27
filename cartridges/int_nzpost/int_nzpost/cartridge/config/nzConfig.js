'use strict';

var Site = require('dw/system/Site');
var preferences = Site.current.preferences.custom;

module.exports = {
    clientId: 'nzpostClientID' in preferences ? preferences.nzpostClientID : '',
    clientSecret: 'nzpostSecretKey' in preferences ? preferences.nzpostSecretKey : '',
    nzpostConfigurations: 'nzpostConfigurations' in preferences ? preferences.nzpostConfigurations : ''
};
