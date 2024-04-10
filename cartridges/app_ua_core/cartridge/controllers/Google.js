'use strict';

var server = require('server');

server.get('BeforeHeader', server.middleware.include, function (req, res, next) {
    const gaHelpers = require('*/cartridge/scripts/analytics/gaHelpers');

    if (gaHelpers.isEnabled) {
        let dataLayer = 'datalayer' in req.querystring && req.querystring.datalayer ? JSON.parse(req.querystring.datalayer) : {};

        dataLayer.send_to = gaHelpers.gaId; // Send it to one account only.
        dataLayer.web_platform = 'sfcc';

        res.render('common/ga', {
            action: req.querystring.action,
            datalayer: dataLayer
        });
    }
    next();
});

module.exports = server.exports();
