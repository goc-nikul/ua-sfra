'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;

describe('app_ua_emea/cartridge/scripts/helpers/contentHelpers.js', () => {
    var contentHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/helpers/contentHelpers.js', {
        'app_ua_core/cartridge/scripts/helpers/contentHelpers': {},
        'dw/content/ContentMgr': {
            getContent(param) {
                if (param === 'guest-returns-image') {
                    return '';
                }
                return { body: param };
            }
        },
        '*/cartridge/models/content': function (param) { this.body = param; }
    });

    it('Testing method: provideExchangeAndReturnsContent', () => {
        var result = contentHelpers.provideExchangeAndReturnsContent();
        assert.isDefined(result);
        assert.isNotNull(result);
        assert.isDefined(result.guestReturnsText);
        assert.isDefined(result.guestReturnsTextName);
        assert.isDefined(result.guestReturnsTextBelow);
        assert.isDefined(result.guestReturnsImage);
        assert.equal(result.guestReturnsImage, '');
        assert.isDefined(result.OrderTrackContent);
    });
});

