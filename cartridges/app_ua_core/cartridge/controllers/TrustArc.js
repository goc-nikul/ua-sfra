'use strict';

var server = require('server');

/* Script Includes */
var trustArc = require('*/cartridge/scripts/utils/libTrustArc');

server.use('RenderScript', function (req, res, next) {
    res.render('common/trustarcscript', {
        trustArcSrc: trustArc.createTrustArcURL()
    });
    next();
});


module.exports = server.exports();
