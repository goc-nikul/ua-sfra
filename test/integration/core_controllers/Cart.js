'use strict';

var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

describe('Cart-AddCoupon', function () {
    var cookieJar = request.jar();
    const {
        user,
        pass
    } = config.storefrontAuth;

    var myRequest = {
        url: config.baseUrl + '/Cart-AddCoupon?couponCode=test',
        method: 'GET',
        rejectUnauthorized: false,
        auth: {
            user,
            pass
        },
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };
    it('Cart-AddCoupon. Should get status code 200', function () {
        return request(myRequest)
            .then(function (addCoupon) {
                assert.equal(addCoupon.statusCode, 200, 'StatusCode to be 200.');
            });
    });
});

