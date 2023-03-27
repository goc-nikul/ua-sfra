/* eslint spellcheck/spell-checker: 0 */

/**
* Decision logic for data layer page type and page name.
* @param {Object} logicArgs controller built logic data.
* @returns {string} the page type.
*/
function pageTypeNameLogic(logicArgs) {
    let pageType;
    let pageName;
    let siteSection;
    let styleCode;
    const action = logicArgs.action;
    const categoryId = logicArgs.categoryId;
    const pageContextType = logicArgs.pageContextType;
    const searchTerm = logicArgs.searchTerm;
    const sfraProductModel = logicArgs.productData && logicArgs.productData.sfraModel || {};
    const cartData = logicArgs.cartData;
    const hasCartItems = cartData && cartData.hasCartItems;
    const wishlistCount = logicArgs.wishlistCount;
    const pdictAnalyticsPageType = logicArgs.pdictAnalyticsPageType;

    switch (true) {
        case Boolean(action === 'Home-Show' || action === 'Default-Start' || action === 'RedirectURL-Start' && pdictAnalyticsPageType !== 'error'): 
            pageName = 'home';
            pageType = 'content';
            siteSection = 'Home';
            break;
        case Boolean(action === 'Search-Show' && pageContextType === 'cat-landing'):
            pageName = undefined; // defined on client-side
            pageType = 'category-landing';
            siteSection = 'Department';
            break;
        case Boolean(action === 'Search-Show' && categoryId):
            pageName = undefined; // defined on client-side
            pageType = 'product-listing';
            siteSection = 'Product Refinement';
            break;
        case Boolean(action === 'Search-Show' && (searchTerm || searchTerm === '')):
            pageName = 'search';
            pageType = 'search';
            siteSection = 'Search';
            break;
        case Boolean(action === 'Product-Show'):
            styleCode = sfraProductModel && sfraProductModel.custom && sfraProductModel.custom.style;
            pageName = require('*/cartridge/scripts/dataLogic/products/helpers.js').productIsClearance(sfraProductModel)
              ? 'product-detail|pcid' + styleCode
              : 'product-detail|pid' + styleCode;
            pageType = 'product-detail';
            siteSection = 'Product Detail';
            break;
        case Boolean(action === 'Cart-Show' && hasCartItems):
            pageType = pageName = 'cart';
            siteSection = 'Checkout';
            break;
        case Boolean(action === 'Cart-Show' && !hasCartItems):
            pageName = 'empty-cart';
            pageType = 'cart';
            siteSection = 'Checkout';
            break;
        case Boolean(action === 'Checkout-Begin'):
            pageType = pageName = 'checkout';
            siteSection = 'Checkout';
            break;
        case Boolean(['Order-Confirm', 'COPlaceOrder-Submit'].indexOf(action) > -1):
            pageType = pageName = 'order-receipt';
            siteSection = 'Checkout';
            break;
        case Boolean(action === 'Account-Show'):
            pageType = 'account';
            pageName = 'my-account';
            siteSection = 'My Account';
            break;
        case Boolean(action === 'Account-EditProfile'):
            pageType = 'account';
            pageName = 'my-account|edit-profile';
            siteSection = 'My Account';
            break;
        case Boolean(action === 'Order-History'):
            pageType = 'account';
            pageName = 'my-account|order-history';
            siteSection = 'My Account';
            break;
        case Boolean(action === 'Order-Details'):
            pageType = 'my-account';
            pageName = 'my-account|order-details';
            siteSection = 'My Account';
            break;
        case Boolean(action === 'Order-TrackReturns'):
            pageType = 'my-account';
            pageName = 'my-account|order-history';
            siteSection = 'My Account';
            break;
        case Boolean(action === 'Order-ReturnGuestItems'):
            pageType = 'my-account';
            pageName = 'my-account|order-history';
            siteSection = 'My Account';
            break;
        case Boolean(action === 'Order-Track'):
            pageType = 'my-account';
            pageName = 'my-account|order-history';
            siteSection = 'My Account';
            break;
        case Boolean(action === 'Order-ExchangeGuestItems'):
            pageType = 'my-account';
            pageName = 'my-account|order-history';
            siteSection = 'My Account';
            break;
        case Boolean(action === 'CSRF-Fail'):
            pageType = 'my-account';
            pageName = 'my-account|CSRF-error';
            siteSection = 'My Account';
            break;
        case Boolean(action === 'Address-List'):
            pageType = 'account';
            pageName = 'my-account|saved-addresses';
            siteSection = 'My Account';
            break;
        case Boolean(action === 'PaymentInstruments-List'):
            pageType = 'account';
            pageName = 'my-account|saved-payments';
            siteSection = 'My Account';
            break;
        case Boolean(action === 'Wishlist-Show'):
            pageType = 'account';
            pageName = wishlistCount ? 'my-account|favorites' : 'my-account|favorites-empty';
            siteSection = 'My Account';
            break;
        case Boolean(pdictAnalyticsPageType === 'error'):
            pageName = '404 Error';
            pageType = '404';
            siteSection = 'Other';
            break;
        case Boolean(action === 'Order-ExchangeItems'):
            pageName = 'my-account|exchanges|item-select';
            pageType = 'my-account';
            siteSection = 'My Account';
            break;
        case Boolean(action === 'Order-ReturnItems'):
            pageName = 'my-account|returns|item-select';
            pageType = 'my-account';
            siteSection = 'My Account';
            break;
        default:
            pageType = 'content';
            pageName = undefined; // defined on client-side
            siteSection = 'Other';
    }

    return {
        pageType: pageType,
        pageName: pageName,
        siteSection: siteSection
    };
}

/**
* Decision logic for data layer page categories.
* @param {string} pageName pageData pageName example: mens|shoes
* @returns {Array} array of piped pageName.
*/
function pageCategories(pageName) {
    return pageName === undefined
      ? []
      : pageName.split('|');
}

module.exports = function pageLogic(logicArgs) {
    const pageTypeName = pageTypeNameLogic(logicArgs);
    return {
        page_categories: pageCategories(pageTypeName.pageName),
        page_type: pageTypeName.pageType,
        page_name: pageTypeName.pageName,
        site_section: pageTypeName.siteSection
    };
};
