'use strict';

const {
    assert
} = require('chai');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_ocapi/cartridge/hooks/shop/content/content_hook_scripts.js', () => {
    it('should list page meta tags', function () {
        let siteMock = {
            current: function () {
                return {
                    getMetaTags: function () {
                        return [{
                            ID: 'test',
                            name: 'test',
                            property: false,
                            title: true,
                            content: true
                        }];
                    }
                };
            },
        };
        let Site = function () {
            return siteMock;
        };
        let content = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/content/content_hook_scripts.js', {
            'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
            'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': Site
        });
        var contentDoc = {
            id: "home-main"
        }
        assert.doesNotThrow(() => content.modifyGETResponse(null, contentDoc));
    });
});