var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var products = [];

function productSlidesResponseHandler(response) {
    var countOfProductSlides = 0;
    var index = 0;
    while (~index) {
        index = response.body.indexOf('swiper-slide', index);
        if (~index) {
            index += 1;
            countOfProductSlides += 1;
        }
    }

    assert.equal(response.statusCode, 200);
    assert.equal(products.length, countOfProductSlides);
}

describe('Product-GetProductsSlides', function () {
    // disable timeout limit
    this.timeout(0);

    var cookieJar = request.jar();
    const {
        user,
        pass
    } = config.storefrontAuth;

    var myRequest = {
        url: config.baseUrl + '/Product-GetProductsSlides?pids=',
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

    it('should return empty html', function () {
        return request(myRequest)
            .then(productSlidesResponseHandler);
    });

    products = ['886450928978', '886450929067', '888376015091'];
    myRequest.url += products;

    it('should return html and amount of slides should be equal amount of provided product identifiers ', function () {
        return request(myRequest)
            .then(productSlidesResponseHandler);
    });
});
