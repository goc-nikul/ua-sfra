var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

function myRequestHandler(response) {
    assert.equal(response.statusCode, 200);
}

describe('Page-CountriesList', function () {
    this.timeout(3000);

    var cookieJar = request.jar();
    const {
        user,
        pass
    } = config.storefrontAuth;

    var myRequest = {
        url: config.baseUrl + '/Accertify-Notify',
        method: 'POST',
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

    it('Accertify-Notify. Page should respond', function () {
        return request(myRequest)
            .then(myRequestHandler);
    });
});
