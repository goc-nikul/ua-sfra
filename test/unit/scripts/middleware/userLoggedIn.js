'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
var sinon = require('sinon');

var reqObject = {
    currentCustomer: {
        raw: {}
    },
    session: {
        privacyCache: {
            set: function () {
                return 'something';
            }
        }
    },
    querystring: {}
};

var resObject = {
    setStatusCode: () => {
        return true;
    },
    setRedirectStatus: () => {
        return true;
    },
    setViewData: () => {},
    redirect: () => {}
};

var next = function () {

};

describe('app_ua_core/cartridge/scripts/middleware/userLoggedIn.js', () => {
    var userLoggedIn = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/middleware/userLoggedIn.js', {
        'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils')
    });
    var setSpy = sinon.spy(reqObject.session.privacyCache, 'set');
    var redirectSpy = sinon.spy(resObject, 'redirect');
    var setViewDataSpy = sinon.spy(resObject, 'setViewData');

    beforeEach(() => {
        setSpy.reset();
        redirectSpy.reset();
        setViewDataSpy.reset();
    });

    var result;

    it('Testing method: validateLoggedIn', () => {
        result = userLoggedIn.validateLoggedIn(reqObject, resObject, next);
        assert.isUndefined(result);
        assert.isTrue(redirectSpy.called);
        assert.isFalse(setSpy.called);

        reqObject.querystring.rurl = 2;
        reqObject.querystring.args = {
            id: '12wefc'
        };
        result = userLoggedIn.validateLoggedIn(reqObject, resObject, next);
        assert.isTrue(redirectSpy.called);
        assert.isTrue(setSpy.called);

        redirectSpy.reset();
        setSpy.reset();
        reqObject.currentCustomer.profile = {};

        result = userLoggedIn.validateLoggedIn(reqObject, resObject, next);
        assert.isFalse(redirectSpy.called);
        assert.isFalse(setSpy.called);
    });

    it('Testing Method: validateLoggedInAjax', () => {
        result = userLoggedIn.validateLoggedInAjax(reqObject, resObject, next);
        assert.isUndefined(result);
        assert.isTrue(setViewDataSpy.called);
        assert.isFalse(setSpy.called);

        reqObject.currentCustomer.profile = null;
        result = userLoggedIn.validateLoggedInAjax(reqObject, resObject, next);
        assert.isTrue(setViewDataSpy.called);
        assert.isTrue(setSpy.called);

        setSpy.reset();
        setViewDataSpy.reset();
        reqObject.querystring.args = null;
        reqObject.querystring.rurl = null;

        result = userLoggedIn.validateLoggedInAjax(reqObject, resObject, next);
        assert.isTrue(setViewDataSpy.called);
        assert.isFalse(setSpy.called);
    });
});
