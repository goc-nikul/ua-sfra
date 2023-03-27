'use strict';

var server = require('server');
var site = require('dw/system/Site');

server.extend(module.superModule);

server.append('RenderScript', function (req, res, next) {
    var viewData = res.getViewData();
    var mPulseAPIJSON = site.getCurrent().getCustomPreferenceValue('mPulseAPI');

    if (!empty(mPulseAPIJSON) && req.host) {
        viewData.mPulseAPI = JSON.parse(mPulseAPIJSON)[req.host];
    }
    next();
});


module.exports = server.exports();
