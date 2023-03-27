'use strict';

var server = require('server');

server.get('Show', function (req, res, next) {
    res.render('/slots/content/newsletterSubscription');
    next();
});

module.exports = server.exports();
