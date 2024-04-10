'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * get variation attribute values for early access product
 * @param {string} pid early access product id
 * @returns {Object} object containing early access vars
 */
function getVarAttrsForEAProduct(pid) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var product = ProductMgr.getProduct(pid);
    if (product) {
        var variationModel = product.getVariationModel();
        var variationAttributes = variationModel.productVariationAttributes;
        var earlyAccessSelectedVarAttrs = {};
        for (var i = 0; i < variationAttributes.length; i++) {
            var selectedAttributeValue = product.variationModel.getSelectedValue(variationAttributes[i]);
            earlyAccessSelectedVarAttrs[variationAttributes[i].ID] = selectedAttributeValue.value;
        }
        return earlyAccessSelectedVarAttrs;
    }
    return null;
}

server.prepend('Show', function (req, res, next) {
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var isAfterPayEnabled = PreferencesUtil.isCountryEnabled('afterPayEnabled');
    var zippayEnabled = require('*/cartridge/config/preferences').isZipPayEnabled;
    res.setViewData({ isAfterPayEnabled: isAfterPayEnabled, zippayEnabled: zippayEnabled });

    if (req.querystring.earlyAccessPid) {
        res.setViewData({
            earlyAccessPid: req.querystring.earlyAccessPid,
            earlyAccessSelectedVarAttrs: getVarAttrsForEAProduct(req.querystring.earlyAccessPid)
        });
    }
    next();
});

server.append('Show', function (req, res, next) {
    var viewData = res.getViewData();
    var imgDesktopURL = null;
    if (res.viewData.product) {
        if (res.viewData.product.images && res.viewData.product.images.pdpMainDesktop && res.viewData.product.images.pdpMainDesktop[0]) {
            if (res.viewData.product.images.pdpMainDesktop[0].url) {
                imgDesktopURL = res.viewData.product.images.pdpMainDesktop[0].url;
                if (imgDesktopURL && imgDesktopURL.includes('_DEFAULT_EM?')) {
                    if (viewData.product.video360Material && viewData.product.video360Material[0]) {
                        var imgPosterURL = viewData.product.video360Material[0].poster_url;
                        viewData.product.video360Material[0].poster_url = imgPosterURL.replace('_DEFAULT?', '_DEFAULT_EM?');
                    }
                }
            }
        }
        if (res.viewData.zippayEnabled) {
            res.setViewData({
                templateUtils: require('*/cartridge/scripts/util/template')
            });
        }
        res.setViewData({
            isPersonalizationEnabled: require('*/cartridge/config/preferences').isPersonalizationEnable
        });
        res.setViewData({
            isAtomeContentEnabled: require('*/cartridge/scripts/utils/PreferencesUtil').isCountryEnabled('atomeContentEnabled')
        });

        if (viewData.variantPid) {
            var ProductFactory = require('*/cartridge/scripts/factories/product');
            res.setViewData({
                variantProductModel: ProductFactory.get({ pid: viewData.variantPid })
            });
        }
        if (req.querystring.memberPriceLoginPopup && req.currentCustomer.raw && req.currentCustomer.raw.authenticated) {
            var ContentMgr = require('dw/content/ContentMgr');
            var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
            var registrationSuccessContent = ContentMgr.getContent('member-pricing-login-complete-popup');
            if (!empty(registrationSuccessContent) && registrationSuccessContent.custom.body && registrationSuccessContent.custom.body.markup) {
                var memberPriceProd;
                if (res.viewData.variantProductModel) {
                    memberPriceProd = res.viewData.variantProductModel;
                } else {
                    memberPriceProd = viewData.product;
                }
                var content = registrationSuccessContent.custom.body.markup.replace('{{CustomerName}}', req.currentCustomer.raw.profile.firstName);
                var memberPriceEligible = memberPriceProd.memberPricing.hasMemberPrice && memberPriceProd.memberPricing.memberPromoEligible;
                res.setViewData({
                    memberPriceLoginModalContent: renderTemplateHelper.getRenderedHtml({ content: content, memberPriceEligible: memberPriceEligible }, 'product/memberPricing/loginRegisterSuccessModal')
                });
            }
        }
    } else {
        res.setStatusCode(404);
        res.render('error/notFound');
    }
    next();
});

server.append('ShowQuickView', function (req, res, next) {
    res.setViewData({
        isAtomeContentEnabled: require('*/cartridge/scripts/utils/PreferencesUtil').isCountryEnabled('atomeContentEnabled')
    });
    next();
});

server.append('Variation', function (req, res, next) {
    var viewData = res.getViewData();
    var imgDesktopURL = null;
    if (res.viewData.product.images && res.viewData.product.images.pdpMainDesktop && res.viewData.product.images.pdpMainDesktop[0]) {
        if (res.viewData.product.images.pdpMainDesktop[0].url) {
            imgDesktopURL = res.viewData.product.images.pdpMainDesktop[0].url;
            if (imgDesktopURL && imgDesktopURL.includes('_DEFAULT_EM?')) {
                if (viewData.product.video360Material && viewData.product.video360Material[0]) {
                    var imgPosterURL = viewData.product.video360Material[0].poster_url;
                    viewData.product.video360Material[0].poster_url = imgPosterURL.replace('_DEFAULT?', '_DEFAULT_EM?');
                }
            }
        }
    }
    if (viewData.product.productType === 'master') {
        var ProductMgr = require('dw/catalog/ProductMgr');
        var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
        var ProductFactory = require('*/cartridge/scripts/factories/product');
        var variationModel = productHelper.getConfig(ProductMgr.getProduct(req.querystring.pid), req.querystring).variationModel;
        if (variationModel.selectedVariants && !variationModel.selectedVariants.empty) {
            var variantProduct = variationModel.selectedVariants[0];
            viewData.variantModel = ProductFactory.get({ pid: variantProduct.ID });
        }
    }
    next();
});

server.append('RefreshVariationCache', function (req, res, next) {
    if (!empty(req.querystring.earlyAccessPid)) {
        var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
        var currentCustomer = req.currentCustomer.raw;
        if (mobileAuthProvider.mobileAuthEnabled && currentCustomer.authenticated && empty(currentCustomer.profile.custom.CI)) {
            res.setViewData({
                mobileAuthPending: true
            });
        }
        res.setViewData({
            earlyAccessSelectedVarAttrs: getVarAttrsForEAProduct(req.querystring.earlyAccessPid),
            mobileAuthEnabled: mobileAuthProvider.mobileAuthEnabled
        });
    }
    next();
});

module.exports = server.exports();
