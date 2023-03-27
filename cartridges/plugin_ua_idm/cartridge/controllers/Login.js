'use strict';

var server = require('server');
var superModule = module.superModule; // inherit functionality from next Login.js found to the right on the cartridge path
server.extend(superModule); // extend server object with a list of new routes to add to or replace those from superModule

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.replace('OAuthReentry', server.middleware.https, consentTracking.consent, function (req, res, next) {
    try {
        if (!empty(req.querystring)) {
            res.json(req.querystring);
        }
    } catch (e) {
        res.json({
            error: true
        });
    }
    return next();
});

module.exports = server.exports();
