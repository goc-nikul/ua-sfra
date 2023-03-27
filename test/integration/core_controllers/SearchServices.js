var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

function countriesListHandler(response) {
    var index = response.body.indexOf('suggestions');

    if (index < 0) {
        try {
            var jsonBody = JSON.parse(response.body);
            assert.equal('SearchServices-GetSuggestions', jsonBody.action, 'Empty Suggestions');
        } catch (e) {
            assert.equal(true, index > 0, 'Suggestions available');
        }
    } else {
        assert.equal(true, index > 0, 'Suggestions available');
    }

    assert.equal(response.statusCode, 200);
}

describe('SearchServices-GetSuggestions', function () {
    this.timeout(5000);

    var cookieJar = request.jar();
    const {
        user,
        pass
    } = config.storefrontAuth;

    var myRequest = {
        url: config.baseUrl + '/SearchServices-GetSuggestions',
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

    it('SearchServices-GetSuggestions. Page should contain suggestions', function () {
        return request(myRequest)
            .then(countriesListHandler);
    });
});
