'use strict';

/** The references object of all modules needed for components initialization */
var references = {
    /** Components */
    stickyElement: require('org/components/common/StickyElement').default,
    carousel: require('org/components/common/Carousel').default,
    backToTop: require('org/components/common/BackToTop').default,
    quickView: require('org/components/product/QuickView').default,
    productDetail: require('../components/product/ProductDetailEMEA').default,
    productQuickView: require('org/components/product/ProductQuickView').default,
    loadProducts: require('org/components/common/LoadProducts').default,
    cartTile: require('org/components/product/CartTile').default,
    removeProductModal: require('org/components/common/RemoveProductModal').default,
    editBasketProduct: require('org/components/common/EditBasketProduct').default,
    detailBonusProductModal: require('org/components/common/DetailBonusProductModal').default,
    cartBonusProductModal: require('org/components/common/CartBonusProductModal').default,
    headerMobileMenu: require('org/components/header/HeaderMobileMenu').default,
    headerMenuAccessibility: require('org/components/header/HeaderMenuAccessibility').default,
    sizeChart: require('org/components/product/SizeChart').default,
    searchMobile: require('org/components/header/SearchMobile').default,
    localeSelector: require('org/components/header/LocaleSelector').default,
    addressVerification: require('org/components/common/AddressVerification').default,
    signUp: require('org/components/footer/SignUp').default,
    emailNewsletterSubs: require('org/components/footer/EmailNewsletterSubs').default,
    searchRefinement: require('org/components/search/SearchRefinement').default,
    sortMobile: require('org/components/search/SortMobile').default,
    productTile: require('org/components/search/ProductTile').default,
    miniCart: require('org/components/cart/MiniCart').default,
    customSelect: require('org/components/forms/CustomSelect').default,
    formGeneric: require('../components/forms/FormGeneric').default,
    showMore: require('org/components/common/ShowMore').default,
    checkoutRegistration: require('org/components/checkout/CheckoutRegistration').default,
    print: require('org/components/checkout/Print').default,
    addressFormGeneric: require('../addressBook/addressFormGeneric').default,
    paymentFormGeneric: require('org/paymentInstruments/paymentFormGeneric').default,
    termsAndConditionsModal: require('org/components/common/dialogPopUp').default,
    orderDetails: require('org/orderDetails/orderDetails').default
};

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
            productDetail: {},
            detailBonusProductModal: {},
            formGeneric: {}
        }
    },
    cart: {
        components: {
            editBasketProduct: {},
            cartBonusProductModal: {}
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
