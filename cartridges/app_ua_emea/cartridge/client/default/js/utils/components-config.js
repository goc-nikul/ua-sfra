'use strict';

var base = require('org/utils/components-config');

/** The references object of all modules needed for components initialization */
var references = base.references;

references.productDetail = require('../components/product/ProductDetailEMEA').default;
references.formGeneric = require('../components/forms/FormGeneric').default;
references.addressFormGeneric = require('../addressBook/addressFormGeneric').default;
references.productQuickView = require('../components/product/ProductQuickView').default;
references.editShareBasketProduct = require('../components/common/EditShareBasketProduct').default;

// eslint-disable-next-line
/**
 * The components initialization configuration object
 *
 * @example New "Page" configuration
 *  var configuration = {
 *      //...
 *      newpage : {
 *          enabled : true,
 *          options : {},
 *          components : {
 *              pagination : {
 *                  enabled : false,
 *                  options : {}
 *              }
 *          }
 *      }
 *  }
 */
var configuration = {
    global: {
        components: {
            customSelect: {},
            stickyElement: {},
            carousel: {},
            backToTop: {},
            quickView: {},
            formGeneric: {},
            notifyMe: {},
            productQuickView: {},
            loadProducts: {},
            cartTile: {},
            headerMobileMenu: {},
            headerMenuAccessibility: {},
            searchMobile: {},
            localeSelector: {},
            signUp: {},
            emailNewsletterSubs: {},
            searchRefinement: {},
            sortMobile: {},
            productTile: {},
            miniCart: {},
            addressVerification: {},
            showMore: {},
            removeProductModal: {},
            sizeChart: {},
            termsAndConditionsModal: {}
        }
    },
    product: {
        components: {
            notifyMe: {},
            productDetail: {},
            detailBonusProductModal: {},
            formGeneric: {}
        }
    },
    cart: {
        components: {
            notifyMe: {},
            editBasketProduct: {},
            cartBonusProductModal: {}
        }
    },
    shareBasket: {
        components: {
            editShareBasketProduct: {}
        }
    },
    'order.confirmation': {
        components: {
            checkoutRegistration: {},
            print: {}
        }
    },
    checkout: {
        components: {
            formGeneric: {}
        }
    },
    addressBook: {
        components: {
            addressFormGeneric: {}
        }
    },
    orderTrack: {
        components: {
            formGeneric: {}
        }
    },
    paymentInstruments: {
        components: {
            paymentFormGeneric: {}
        }
    },
    orderDetails: {
        components: {
            orderDetails: {}
        }
    }
};

module.exports = {
    configuration: configuration,
    references: references
};
