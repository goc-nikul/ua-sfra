'use strict'
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
// var cookie = require('../../mocks/')

global.empty = (data) => {
    return !data;
};

var cookieHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/cookieHelpers.js', {
    'dw/web/Cookie': require('../../mocks/dw/dw_web_Cookie')
});
describe('cookieHelpers.js file test cases', function () {
    describe('create method test cases', function () {
        it('Test case for checking result is not Null', () => {
            var name = 'cookieName';
            var value = 'cookieValue';
            var duration = 100000;
            global.response = { addHttpCookie: () => true };
            var result = cookieHelpers.create(name, value, duration);
            assert.isNotNull(result, 'Is NUll');
        });
    });
    describe('read method test cases', function () {
        it('Test case for name and cookie name are same', () => {
            var cookies = {};
            cookies.__proto__.getCookieCount = () => {
                return 1
            };
            cookies.__proto__ = [{
                name: 'test',
                value: 'testvalue'
            }];

            global.request = {
                getHttpCookies: () => {
                    return cookies
                }
            };
            var result = cookieHelpers.read('test');
            assert.isNotNull(result, 'Is NUll');
            assert.equal('testvalue',result,"result is not equal");
        });
        it('Test case for name and cookie name are not same', () => {
            var cookies = {};
            cookies.__proto__.getCookieCount = () => {
                return 1
            };
            cookies.__proto__ = [{
                name: 'test',
                value: 'testvalue'
            }];

            global.request = {
                getHttpCookies: () => {
                    return cookies
                }
            };
            var result = cookieHelpers.read('notTest');
            assert.isNotNull(result, 'Is NUll');
            assert.notEqual('testvalue',result,"result is equal");
        });
        describe('deleteCookie method test cases', function () {
            it('Test case for checking result is not Null', () => {
                var name = 'cookieName';
                global.response = { addHttpCookie: () => true };
                var result = cookieHelpers.deleteCookie(name);
                assert.isNotNull(result, 'Is NUll');
            });
        });
    });
});
