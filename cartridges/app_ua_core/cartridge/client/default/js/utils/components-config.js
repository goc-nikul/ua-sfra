'use strict';

/** The references object of all modules needed for components initialization */
var references = {
    /** Components */
    stickyElement: require('../components/common/StickyElement').default,
    carousel: require('../components/common/Carousel').default,
    backToTop: require('../components/common/BackToTop').default,
    quickView: require('../components/product/QuickView').default,
    notifyMe: require('org/components/product/NotifyMe').default,
    productDetail: require('../components/product/ProductDetail').default,
    productQuickView: require('../components/product/ProductQuickView').default,
    loadProducts: require('../components/common/LoadProducts').default,
    cartTile: require('../components/product/CartTile').default,
    removeProductModal: require('../components/common/RemoveProductModal').default,
    editBasketProduct: require('../components/common/EditBasketProduct').default,
    detailBonusProductModal: require('../components/common/DetailBonusProductModal').default,
    cartBonusProductModal: require('../components/common/CartBonusProductModal').default,
    headerMobileMenu: require('../components/header/HeaderMobileMenu').default,
    headerMenuAccessibility: require('../components/header/HeaderMenuAccessibility').default,
    sizeChart: require('../components/product/SizeChart').default,
    searchMobile: require('../components/header/SearchMobile').default,
    localeSelector: require('../components/header/LocaleSelector').default,
    addressVerification: require('../components/common/AddressVerification').default,
    signUp: require('../components/footer/SignUp').default,
    emailNewsletterSubs: require('../components/footer/EmailNewsletterSubs').default,
    searchRefinement: require('../components/search/SearchRefinement').default,
    sortMobile: require('../components/search/SortMobile').default,
    productTile: require('../components/search/ProductTile').default,
    miniCart: require('../components/cart/MiniCart').default,
    customSelect: require('../components/forms/CustomSelect').default,
    formGeneric: require('../components/forms/FormGeneric').default,
    showMore: require('../components/common/ShowMore').default,
    checkoutRegistration: require('../components/checkout/CheckoutRegistration').default,
    print: require('../components/checkout/Print').default,
    addressFormGeneric: require('../addressBook/addressFormGeneric').default,
    giftCard: require('../components/common/giftCard').default,
    giftCardFormGeneric: require('../checkout/giftCardFormGeneric').default,
    paymentFormGeneric: require('../paymentInstruments/paymentFormGeneric').default,
    termsAndConditionsModal: require('../components/common/dialogPopUp').default,
    orderDetails: require('../orderDetails/orderDetails').default,
    idme: require('../components/checkout/IDME').default
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
            formGeneric: {},
            notifyMe: {},
            editBasketProduct: {},
            cartBonusProductModal: {},
            idme: {}
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
            giftCardFormGeneric: {},
            formGeneric: {},
            idme: {}
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
    giftCard: {
        components: {
            giftCard: {}
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
