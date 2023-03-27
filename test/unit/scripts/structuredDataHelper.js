'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
global.empty = (data) => {
    return !data;
};

var testUrl = {
    toString: () => {
        return 'testurl'
    }
};

class URL {
    constructor(url) {
        this.url = url;
    }
    abs() {
        return this.url;
    }
}
var product = {
    productType: 'test product',
    custom:{
        masterID: 1111,
        sku: 2222,
        whatsItDo:{
            toString: ()=> true
        }
    },
    price: {
        type: 'range',
        list: {
            currency : 'USD',
            decimalPrice : 1
        },
        sales: {
            currency : 'USD',
            decimalPrice: 1
        }
    },
    images : {
        pdpMainDesktop: [{
            image:{
                absURL : 'test URL'
            }
        }]
    },
    available : 10,
    availability :{
        messages : ['test']
    }
};


var structureddataHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/structuredDataHelper.js', {
    'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
    'dw/web/URL': URL,
    '*/cartridge/scripts/util/collections': require('../../mocks/scripts/util/collections.js'),
    'dw/web/Resource' : {
        msg : () =>{
            return 'test'
        }
    },
    product : product
});
describe('structureddataHelper.js file test cases', function () {
    describe('getBreadCrumbsSchema method test cases', function () {
        it('Test case for breadCrumbs is given', () => {
            var breadCrumbs = [{
                url: {
                    abs:()=>{
                        return {
                            toString: ()=>{
                                return {}
                            }
                        }
                    }
                }
            }]
            var result = structureddataHelper.getBreadCrumbsSchema(breadCrumbs);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case for breadcrumbs are given and url is instance of URL', () => {
            var breadCrumbs = [{
                url: new URL(testUrl)
            }]
            var result = structureddataHelper.getBreadCrumbsSchema(breadCrumbs);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case for breadCrumbs are not given', () => {
            var breadCrumbs = null;
            var result = structureddataHelper.getBreadCrumbsSchema(breadCrumbs);
            assert.isDefined(result, 'Is not defined');
        });
    });
    describe('getListingPageSchema method test cases', function () {
        it('Test case for productIds is given', () => {
            var productIds = {
                productID : '123'
            };
            var result = structureddataHelper.getListingPageSchema(productIds);
            assert.isDefined(result, 'Is not defined');
        });
    });
    describe('getHomePageSchema method test cases', function () {
        it('Test case to cover getHomePageSchema', () => {
            var result = structureddataHelper.getHomePageSchema();
            assert.isDefined(result, 'Is not defined');
        });
    });
    describe('getProductSchema method test cases', function () {
        it('Test case for when product is given', () => {
            var result = structureddataHelper.getProductSchema(product);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case for whatsItDo is null and available is null ', () => {
            product.custom.whatsItDo = null ;
            product.price.type = 'test' ;
            product.productType = 'master' ;
            product.images = {};
            product.available = null;
            var result = structureddataHelper.getProductSchema(product);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case for price is null', () => {
            product.price.sales = null ;
            product.price = null ;
            var result = structureddataHelper.getProductSchema(product);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case for price.type is not range and availibilty messages is different', () => {
            product.price = {};
            product.price.type = 'not range';
            product.price.list = {} ;
            product.available = 10;
            product.availability.messages = ['abc'];
            var result = structureddataHelper.getProductSchema(product);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case for product price list is null', () => {
            product.price = {};
            product.price.type = 'not range';
            product.price.list = null ;
            var result = structureddataHelper.getProductSchema(product);
            assert.isDefined(result, 'Is not defined');
        });
    });
});