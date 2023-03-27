var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

describe('Checkout-Begin', function () {
    this.timeout(15000);

    var cookieJar = request.jar();
    const {
        user,
        pass
    } = config.storefrontAuth;

    var myRequest = {
        url: '',
        method: '',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        auth: {
            user,
            pass
        },
        form: {
            pid: '1219736',
            quantity: 1
        }
    };

    it('Checkout-Begin', function () {
        // Step1: Add product to the cart
        myRequest.url = config.baseUrl + '/Cart-AddProduct';
        myRequest.method = 'POST';

        return request(myRequest)
            .then(function (basketResponse) {
                // Step2: Process Checkout
                assert.equal(basketResponse.statusCode, 200, 'StatusCode to be 200.');
                myRequest.url = config.baseUrl + 'Checkout-Begin';
                myRequest.method = 'GET';

                return request(myRequest)
                    .then(function (checkoutResponse) {
                        assert.equal(checkoutResponse.statusCode, 200, 'StatusCode to be 200.');
                    });
            });
    });
});
