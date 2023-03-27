'use strict';

var server = require('server');

server.extend(module.superModule);

server.prepend(
    'Show',
    function (req, res, next) {
        var shoprunnerShippingMethodSelection = require('~/cartridge/scripts/ShoprunnerShippingMethodSelection').ShoprunnerShippingMethodSelection;
        shoprunnerShippingMethodSelection();

        return next();
    }
);

module.exports = server.exports();
