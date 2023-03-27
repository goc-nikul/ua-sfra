/* eslint-disable no-console */

require('@babel/polyfill');

var processInclude = require('base/util');
var pageData = require('./utils/pageData');
var globalEvents = require('./utils/globalEvents');
var globalBrowserCheck = require('./utils/globalBrowserCheck');
var branch = require('branch-sdk');

$(document).ready(function () {
    const branchKey = $('.branch-journeys-top').data('branchkey');
    branch.init(branchKey);
    pageData.init();
    globalEvents.init();
    globalBrowserCheck.init();

    processInclude(require('./components/menu'));
    processInclude(require('base/components/cookie'));
    processInclude(require('base/components/consentTracking'));
    processInclude(require('base/components/footer'));
    processInclude(require('base/components/collapsibleItem'));
    processInclude(require('./components/search'));
    processInclude(require('./utils/componentsMgr'));
    processInclude(require('./components/common/borderfreeWelcome'));
    processInclude(require('./components/common/clientSideValidation'));
    processInclude(require('./product/wishlistHeart'));
    processInclude(require('./components/common/emailSubscriptionPopUp'));
    processInclude(require('./components/common/TrustArc'));
    processInclude(require('./orderDetails/orderDetails'));
    processInclude(require('./components/cart/borderfree'));
    processInclude(require('./login/login'));
    processInclude(require('./login/register'));
    processInclude(require('./components/common/toolTip'));
    if ($('.b-cart-content.cart').length > 0) {
        processInclude(require('./product/pdpInstoreInventory'));
    }
});

require('./components/spinner');
