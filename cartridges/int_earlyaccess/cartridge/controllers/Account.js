'use strict';

var server = require('server');
server.extend(module.superModule);

server.get('CheckEarlyAccess', function (req, res, next) {
    var HookMgr = require('dw/system/HookMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var earlyAccess;
    var result = {
        success: false
    };
    if (HookMgr.hasHook('app.earlyAccess.isEarlyAccessCustomer')) {
        earlyAccess = HookMgr.callHook(
            'app.earlyAccess.isEarlyAccessCustomer',
            'isEarlyAccessCustomer',
            ProductMgr.getProduct(req.querystring.pid)
        );
        result.success = !('earlyAccessConfigs' in earlyAccess);
        result.earlyAccess = result.success ? earlyAccess : '';
    }

    res.json(result);

    return next();
});

server.get('HeaderAjax', function (req, res, next) {
    var Site = require('dw/system/Site');
    var sitePreferences = require('*/cartridge/config/preferences');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var customerGroups = customer.getCustomerGroups().toArray();
    var customerGroupIds = [];
    customerGroups.forEach(function (customerGroup) {
        customerGroupIds.push(customerGroup.ID);
    });
    var mobileAuthEnabled = false;

    var name = req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null;

    var showOnlyLastNameAsNameField = sitePreferences.isShowOnlyLastNameAsNameFieldEnabled;
    var currentSite = Site.getCurrent().getID();
    if (currentSite === 'KR') {
        var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
        mobileAuthEnabled = mobileAuthProvider.mobileAuthEnabled;
        if (showOnlyLastNameAsNameField && !empty(req.currentCustomer.profile)) {
            if (!empty(req.currentCustomer.profile.lastName)) {
                name = req.currentCustomer.profile.lastName;
            } else {
                var Resource = require('dw/web/Resource');
                name = Resource.msg('header.account.myaccount', 'account', '');
            }
        }
    }

    var context = {
        CurrentCustomer: customer,
        customerGroupIDs: JSON.stringify(customerGroupIds),
        name: name,
        mobileAuthEnabled: mobileAuthEnabled
    };

    var mobileHeader = renderTemplateHelper.getRenderedHtml(context, 'account/mobileHeader');
    var desktopHeader = renderTemplateHelper.getRenderedHtml(context, 'account/header');

    res.json({
        mobileHeader: mobileHeader,
        desktopHeader: desktopHeader
    });
    next();
});

module.exports = server.exports();
