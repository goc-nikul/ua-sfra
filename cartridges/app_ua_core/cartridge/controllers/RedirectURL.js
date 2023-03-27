'use strict';

var server = require('server');
server.extend(module.superModule);

// we cannot override this since we are not able to find status code from base layer
server.replace('Start', function (req, res, next) {
    var URLRedirectMgr = require('dw/web/URLRedirectMgr');
    var config = require('../config/wellKnown');

    var serveJSONFiles = config.files;

    for (var i = 0; i < serveJSONFiles.length; i++) {
        var file = serveJSONFiles[i];
        if (URLRedirectMgr.getRedirectOrigin() === '/.well-known/' + file) {
            res.cacheExpiration(config['cache-hours']);
            res.setContentType('application/json');
            res.print(JSON.stringify(require('../static/default/.well-known/' + file)));
            return next();
        }
    }

    var redirect = URLRedirectMgr.redirect;
    var location = redirect ? redirect.location : null;
    var redirectStatus = redirect ? redirect.getStatus() : null;

    if (!location) {
        res.setStatusCode(410);
        res.render('error/notFound');
    } else {
        if (redirectStatus) {
            res.setRedirectStatus(redirectStatus);
        }
        res.redirect(location);
    }

    return next();
});


module.exports = server.exports();
