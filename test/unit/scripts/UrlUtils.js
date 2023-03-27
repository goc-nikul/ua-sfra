'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/scripts/utils/UrlUtils test', () => {
    var UrlUtils = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/utils/UrlUtils', {
        'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
        'dw/web/URLAction': require('../../mocks/dw/dw_web_URLAction'),
        'dw/web/URLParameter': require('../../mocks/dw/dw_web_URLParameter'),
        'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils')
    });

    it('Testing method: getWebsiteURL', () => {
        var siteID = 'TestID';
        var locale = 'en_US';

        var result = UrlUtils.getWebsiteURL(siteID, locale);
        assert.equal(result, 'test/Home-Show', 'Should return relative URL');
    });

    it('Testing method: getCurrent', () => {
        var pdict = {
            'CurrentSession': {
                'clickStream': {
                    'last': {
                        'pipelineName': 'Home-Show'
                    }
                }
            },
            'CurrentHttpParameterMap': {
                'getParameterNames': () => {
                    return ['paramName', 'lang'];
                },
                'get': (key) => {
                    return {
                        'getValue': () => {
                            return 'paramValue';
                        }
                    }
                }
            }
        };
        assert.equal(UrlUtils.getCurrent(pdict), 'test/Home-Show', 'Should return relative URL');
    });
});
