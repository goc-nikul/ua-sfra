'use strict';

var server = require('server');
var site = require('dw/system/Site');

server.use('RenderScript', function (req, res, next) {
    res.render('common/mpulsescript', {
        mPulseAPI: site.getCurrent().getCustomPreferenceValue('mPulseAPI')
    });
    next();
});


module.exports = server.exports();
