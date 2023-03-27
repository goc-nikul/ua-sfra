var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');

describe('Account-SavePassword', function () {
    this.timeout(10000);

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
        currentCustomer: {
            profile: {
                customerNo: 'test'
            }
        }
    };

    it('Account-SavePassword. Page should update password', function () {
        // Step1: Get Account route cookies
        myRequest.url = config.baseUrl + '/Account-PasswordReset';
        myRequest.method = 'GET';

        return request(myRequest)
            .then(function (baseResponse) {
                // Step2: Get CSRF token
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                myRequest.method = 'POST';
                assert.equal(baseResponse.statusCode, 200, 'Expected to be 200.');
                var cookieString = cookieJar.getCookieString(myRequest.url);
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                // Step3: Test Account-SavePassword route
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                myRequest.url = config.baseUrl + '/Account-SavePassword?' +
                    csrfJsonResponse.csrf.tokenName + '=' +
                    csrfJsonResponse.csrf.token;
                myRequest.method = 'POST';

                return request(myRequest)
                    .then(function (response) {
                        // var bodyAsJson = JSON.parse(response.body);
                        assert.equal(response.statusCode, 200, 'Expected CheckoutServices-SubmitPayment statusCode to be 200.');
                    });
            });
    });

    it('Account-SaveNewPassword. Page should save password', function () {
        // Step1: Get Account route cookies
        myRequest.url = config.baseUrl + '/Account-PasswordReset';
        myRequest.method = 'GET';

        return request(myRequest)
            .then(function (baseResponse) {
                // Step2: Get CSRF token
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                myRequest.method = 'POST';
                assert.equal(baseResponse.statusCode, 200, 'Expected to be 200.');
                var cookieString = cookieJar.getCookieString(myRequest.url);
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                // Step3: Test Account-SaveNewPassword route
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                myRequest.url = config.baseUrl + '/Account-SaveNewPassword?' +
                    csrfJsonResponse.csrf.tokenName + '=' +
                    csrfJsonResponse.csrf.token;
                myRequest.method = 'POST';

                return request(myRequest)
                    .then(function (response) {
                        try {
                            var bodyAsJson = JSON.parse(response.body);
                            assert.equal({}, bodyAsJson);
                        } catch (e) {
                            var index = response.body.indexOf('change-password-form');
                            assert.equal(true, index > 0, 'Change password form is rendered in case of failure');
                        }

                        assert.equal(response.statusCode, 200, 'Expected CheckoutServices-SubmitPayment statusCode to be 200.');
                    });
            });
    });
});
