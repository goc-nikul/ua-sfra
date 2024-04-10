var sinon = require('sinon');
const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var customizeCategoryData = require('../../../../../mocks/constructor/transformers/customizeCategoryData');

describe('getCategoryData', function() {
    it('should transform category data correctly', function() {
        const category = {
            UUID: 'categoryUUID',
            ID: 'men',
            displayName: 'Mens',
            parent: {
                UUID: 'parentUUID',
                ID: 'root',
                displayName: 'Storefront',
                custom: {
                    hideFromBreadCrumbs: false
                }
            },
            custom: {
                hideFromBreadCrumbs: false
            }
        };

        const transformedCategory = customizeCategoryData.getCategoryData(category);

        expect(transformedCategory).to.deep.equal({
            uuid: 'categoryUUID',
            id: 'men',
            displayName: 'Mens',
            parent: {
                displayName: 'Storefront',
                uuid: 'parentUUID',
                id: 'root'
            },
            data: {
                categoryUrl: '/en-us/c/men/',
                categoryDisplayName: 'Mens',
                categoryParentId: 'root',
                categoryParentName: 'Storefront',
                categoryAltUrl: '/en-us/c/men/',
                parents: [
                    {
                        altUrl: null,
                        hideFromBreadCrumbs: false,
                        id: 'men',
                        name: 'Mens',
                        url: '/en-us/c/men/'
                    }
                ],
                priceMap: [
                    {
                      displayName: '$0 - $25',
                      valueFrom: 0,
                      valueTo: 25
                    }
                ]
            }
        });
    });
});
