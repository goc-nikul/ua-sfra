var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

function countriesListHandler(response) {
    var index = response.body.indexOf('filter-header');

    assert.equal(response.statusCode, 200);
    assert.equal(true, index > 0);
}
function redirectNoTilePagination(response) {    
    assert.equal(response.statusCode, 301);
}

describe('Search-Refinebar', function () {
    this.timeout(5000);

    var cookieJar = request.jar();
    const {
        user,
        pass
    } = config.storefrontAuth;

    var myRequest = {
        url: config.baseUrl + '/Search-Refinebar',
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

    it('Search-Refinebar. Page should contain refinebar', function () {
        return request(myRequest)
            .then(countriesListHandler);
    });
});

describe('Search-Show', function () {
    this.timeout(5000);

    var cookieJar = request.jar();
    const {
        user,
        pass
    } = config.storefrontAuth;

    var myRequest = {
        url: config.baseUrl + 'Search-Show?cgid=men&start=99999999&sz=12',
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

    it('Search-Show. paginated Page with no tiles should redirect to base category page', function () {
        return request(myRequest)
            .then(redirectNoTilePagination);
    });

});