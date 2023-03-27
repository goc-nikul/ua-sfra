const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
// var ArrayList = require('../../../cartridges/storefront-reference-architecture/test/mocks/dw.util.Collection');
var ArrayList = require('../../..//test/mocks/scripts/util/dw.util.Collection');
// Extended SFRA searchHelpers
/* eslint-disable */

describe('app_ua_core/cartridge/scripts/helpers/contentHelpers.js', function() {
    let contentHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/contentHelpers.js', {
        'dw/content/ContentMgr': {
            getContent: function () {
                return{}
            }
        },
        'dw/system/Site':{
            getCurrent: function () {
              return {
                getID: function () {
                    return {
                        toUpperCase: function () {
                            return 'MX';
                        }
                    }
                }
              }
            }
        },
        '*/cartridge/models/content': function () { return {}; },
        'dw/web/URLUtils': {
            url: function () {
                return {};
            }
        },
        'dw/util/ArrayList': ArrayList,
        '*/cartridge/scripts/util/collections': proxyquire('../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
            'dw/util/ArrayList': ArrayList
        })
    });

    it('Testing method provideExchangeAndReturnsContent --> Site = MX', function() {
        let result = contentHelpers.provideExchangeAndReturnsContent();
    });

    it('Testing method provideExchangeAndReturnsContent', function() {

        contentHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/contentHelpers.js', {
            'dw/content/ContentMgr': {
                getContent: function () {
                    return{}
                }
            },
            'dw/system/Site':{
                getCurrent: function () {
                  return {
                    getID: function () {
                        return {
                            toUpperCase: function () {
                                return 'US';
                            }
                        }
                    }
                  }
                }
            },
            '*/cartridge/models/content': function () { return {}; },
            'dw/web/URLUtils': {},
            'dw/util/ArrayList': ArrayList,
            '*/cartridge/scripts/util/collections':require('../../mocks/scripts/util/collections')
        });
        let result = contentHelpers.provideExchangeAndReturnsContent();
    });

    it('Testing method getOnlineSubCategoriesRefactor', function() {
        ArrayList = require('../../..//test/mocks/scripts/util/dw.util.Collection');
        var category = {
            hasOnlineSubCategories: function () {
                return {};
            },
            getOnlineSubCategories: function () {
                return new ArrayList([{
                    custom: {
                        showInMenu: 'showInMenu'
                    }
                }]);
            }
        }
        let result = contentHelpers.getOnlineSubCategoriesRefactor(category);
        assert.equal(result.length, 0);
    })

    it('Testing method getCategoryUrl', function() {
        var category = {
            custom: {
                alternativeUrl: 'alternativeUrl'
            }
        }
        let result = contentHelpers.getCategoryUrl(category);
        assert.equal(result, 'alternativeUrl');
    })
});
