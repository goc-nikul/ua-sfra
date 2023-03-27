'use strict';

var server = require('server');
server.extend(module.superModule);

const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');

server.append('List', function (req, res, next) {
    loyaltyHelper.appendLoyaltyUrl(res);

    next();
});

module.exports = server.exports();
