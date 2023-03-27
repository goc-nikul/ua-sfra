/* eslint-disable no-console */

require('@babel/polyfill');

var processInclude = require('base/util');
var pageData = require('org/utils/pageData');
var globalEvents = require('org/utils/globalEvents');
var globalBrowserCheck = require('org/utils/globalBrowserCheck');

$(document).ready(function () {
    pageData.init();
    globalEvents.init();
    globalBrowserCheck.init();

    processInclude(require('org/components/menu'));
    processInclude(require('base/components/cookie'));
    processInclude(require('base/components/consentTracking'));
    processInclude(require('base/components/footer'));
    processInclude(require('base/components/collapsibleItem'));
    processInclude(require('org/components/search'));
    processInclude(require('./utils/componentsMgr'));
    processInclude(require('org/components/common/borderfreeWelcome'));
    processInclude(require('org/components/common/clientSideValidation'));
    processInclude(require('org/product/wishlistHeart'));
    processInclude(require('org/components/common/emailSubscriptionPopUp'));
    processInclude(require('org/components/common/TrustArc'));
    processInclude(require('org/orderDetails/orderDetails'));
    processInclude(require('org/components/cart/borderfree'));
    processInclude(require('org/login/login'));
    processInclude(require('org/login/register'));
    if ($('.b-cart-content.cart').length > 0) {
        processInclude(require('org/product/pdpInstoreInventory'));
    }
});

require('org/components/spinner');
