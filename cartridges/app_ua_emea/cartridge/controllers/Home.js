'use strict';

var server = require('server');
var geoLocationRedirect = require('*/cartridge/scripts/middleware/geoLocationRedirect');
server.extend(module.superModule);

server.append('Show', geoLocationRedirect.redirect);

module.exports = server.exports();
