'use strict';

var base = require('org/utils/components-config');

/** The references object of all modules needed for components initialization */
var references = base.references;

references.productDetail = require('../components/product/ProductDetail').default;
references.afterPayModal = require('../components/common/afterpayModal').default;
references.addressVerification = require('../components/common/AddressVerification').default;
references.formGeneric = require('../components/forms/FormGeneric').default;
references.addressFormGeneric = require('../addressBook/addressFormGeneric').default;
references.cartTile = require('../components/product/CartTile').default;
references.checkoutRegistration = require('../components/checkout/CheckoutRegistration').default;

if ($('div[data-is-personalize]').data('is-personalize')) references.cartTile = require('sf_productpersonalize/components/product/CartTile').default;
if ($('div[data-is-personalize]').data('is-personalize')) references.editBasketProduct = require('sf_productpersonalize/components/common/EditBasketProduct').default;
references.cartTile = require('../components/product/CartTile').default;
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
            productDetail: {},
            detailBonusProductModal: {},
            formGeneric: {},
            afterPayModal: {}
        }
    },
    cart: {
        components: {
            formGeneric: {},
            notifyMe: {},
            editBasketProduct: {},
            cartBonusProductModal: {},
            afterPayModal: {}
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
