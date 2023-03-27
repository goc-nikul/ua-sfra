'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const pathToBase = '../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base';

describe('app_ua_core/cartridge/models/categories', function() {
    let Category = require('../../mocks/dw/dw_catalog_Category');
    let Collection = require('../../mocks/dw/dw_util_Collection');

    let BaseAttributeValue = proxyquire(pathToBase + '/cartridge/models/search/attributeRefinementValue/base', {
        'dw/web/Resource': require('../../mocks/dw/dw_web_Resource')
    });

    let BaseCategory = proxyquire(pathToBase + '/cartridge/models/search/attributeRefinementValue/category', {
        '*/cartridge/models/search/attributeRefinementValue/base': BaseAttributeValue
    });

    let CategoryAttributeValue = proxyquire('../../../cartridges/app_ua_core/cartridge/models/search/attributeRefinementValue/category', {
        'app_storefront_base/cartridge/models/search/attributeRefinementValue/category': BaseCategory,
        'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils')
    });

    let refinementDefinition = {};
    let booleanAttributeValue = {};
    let productSearch = {
        isRefinedByAttributeValue: function() {
            return true;
        },
        urlRefineCategory: function() {
            return {
                relative: function() {
                    return {
                        toString: function() {
                            return 'category url';
                        }
                    };
                }
            };
        },
        urlRelaxAttributeValue: function () {
            return {
                relative: function () {
                    return {
                        toString: function () { return 'relax url'; }
                    };
                }
            };
        }
    };

    let refinementValue = {
        ID: 'product 1',
        presentationID: 'prez',
        value: 'some value',
        displayName: 'some display value',
        hitCount: 10,
        custom: {
            hidefromLeftNavigationRefinement: false
        }
    };

    it('Testing method: CategoryRefinementValueWrapper', function() {
        booleanAttributeValue = new CategoryAttributeValue(productSearch, refinementDefinition, refinementValue, true);
        let hidefromLeftNavigationRefinement = booleanAttributeValue && booleanAttributeValue.hidefromLeftNavigationRefinement ? booleanAttributeValue.hidefromLeftNavigationRefinement : false;
        assert.equal(true, hidefromLeftNavigationRefinement === refinementValue.custom.hidefromLeftNavigationRefinement);

        refinementValue.custom.hidefromLeftNavigationRefinement = true
        booleanAttributeValue = new CategoryAttributeValue(productSearch, refinementDefinition, refinementValue, true);
        hidefromLeftNavigationRefinement = booleanAttributeValue && booleanAttributeValue.hidefromLeftNavigationRefinement ? booleanAttributeValue.hidefromLeftNavigationRefinement : true;
        hidefromLeftNavigationRefinement = hidefromLeftNavigationRefinement === 'true' ? true : false;
        assert.equal(true, hidefromLeftNavigationRefinement === refinementValue.custom.hidefromLeftNavigationRefinement);
    });
});
