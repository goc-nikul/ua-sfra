var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

function countriesListHandler(response) {
    var index = response.body.indexOf('countries_list');

    assert.equal(response.statusCode, 200);
    assert.equal(true, index > 0);
}

describe('Page-CountriesList', function () {
    // disable timeout limit
    this.timeout(0);

    var cookieJar = request.jar();
    const {
        user,
        pass
    } = config.storefrontAuth;

    var myRequest = {
        url: config.baseUrl + '/Page-CountriesList',
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

    it('Page-CountriesList. Page should contain list of the allowed countries', function () {
        return request(myRequest)
            .then(countriesListHandler);
    });
});
