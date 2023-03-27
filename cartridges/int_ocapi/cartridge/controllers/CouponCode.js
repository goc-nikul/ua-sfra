'use strict';

var server = require('server');
var CouponAuthCheck = require('*/cartridge/scripts/services/CouponAuthCheckService');

server.post('CouponSearch', function (req, res, next) {
    var form = req.form;
    var token = req.httpHeaders.get('x-ocapi-auth');

    var couponId;

    if (!empty(form) && 'code' in form) {
        var getCouponId = require('*/cartridge/scripts/CouponCodeLookup').getCouponId;
        couponId = getCouponId(form.code);
    }

    var isAuthorized = CouponAuthCheck.call({ token: token, couponId: couponId });

    if (isAuthorized && couponId) {
        res.json({
            couponId: couponId
        });
    } else if (!isAuthorized) {
        res.setStatusCode(401);
        res.json({});
    } else if (!couponId) {
        res.setStatusCode(404);
        res.json({});
    } else {
        res.setStatusCode(500);
        res.json({});
    }

    next();
});

module.exports = server.exports();
