'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('Show', function (req, res, next) {
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var isAfterPayEnabled = PreferencesUtil.isCountryEnabled('afterPayEnabled');
    var zippayEnabled = require('*/cartridge/config/preferences').isZipPayEnabled;
    res.setViewData({ isAfterPayEnabled: isAfterPayEnabled, zippayEnabled: zippayEnabled });
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
    next();
});


module.exports = server.exports();
