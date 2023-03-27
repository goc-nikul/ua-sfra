'use strict';

var page = module.superModule;
var server = require('server');

server.extend(page);

server.append('Confirm', function (req, res, next) {
    var currencyCode = res.getViewData() && res.getViewData().order ? res.getViewData().order.currencyCode: '';
    res.setViewData({
        paypal: {
            summaryEmail: null,
            currency: currencyCode
        }
    });
    next();
});

server.append('Details', function (req, res, next) {
    var currencyCode = res.getViewData() && res.getViewData().getOrder() ? res.getViewData().getOrder().getCurrencyCode() : '';
    res.setViewData({
        paypal: {
            summaryEmail: null,
            currency: currencyCode
        }
    });
    next();
});

module.exports = server.exports();
