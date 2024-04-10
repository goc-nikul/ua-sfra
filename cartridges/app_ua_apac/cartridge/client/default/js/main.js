/* eslint-disable no-console */
'use strict';

require('core-js');
require('@babel/runtime/regenerator');

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
    processInclude(require('falcon/components/common/welcomeMatModal'));
    processInclude(require('./components/common/clientSideValidation'));
    processInclude(require('org/product/wishlistHeart'));
    processInclude(require('org/components/common/emailSubscriptionPopUp'));
    processInclude(require('org/components/common/TrustArc'));
    processInclude(require('org/orderDetails/orderDetails'));
    processInclude(require('./mobileAuth/mobileAuth'));
    processInclude(require('./login/login'));
    processInclude(require('./login/register'));
    processInclude(require('./consent/consentPopup'));
    processInclude(require('./product/base'));
});

require('org/components/spinner');
