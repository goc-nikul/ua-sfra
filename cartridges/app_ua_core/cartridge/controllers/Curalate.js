'use strict';

var server = require('server');

/* API Includes */
var Site = require('dw/system/Site');

/* Script Includes */
var curalate = require('*/cartridge/scripts/utils/libCuralate');

/*
 * Prepares data and renders Fanreel template
 */

server.use('LandingPage', function (req, res, next) {
    if (Site.getCurrent().getCustomPreferenceValue('curalateEnable')) {
        res.render('curalate/landingpage');
    } else {
        res.redirect(require('dw/web/URLUtils').https('Home-Show'));
    }
    return next();
});

server.use('FanreelRender', function (req, res, next) {
    if (!Site.getCurrent().getCustomPreferenceValue('curalateEnable')) {
        return;
    }
    var locale = curalate.prepareLocale(dw.system.Site.getCurrent().defaultLocale);
    var filter = '';
    var localeString = '';
    if (Site.getCurrent().getCustomPreferenceValue('curalateEnableLocale')) {
        localeString = locale;
    }
    switch (req.querystring.container_id) {
        case 'custom-homepage-refresh':
            break;
        case 'gallery':
            break;
        case 'custom-product':
            filter = "productId:'" + req.querystring.product_id + "'";
            break;
        case 'custom-category':
            var CatalogMgr = require('dw/catalog/CatalogMgr');
            var categoryID = req.querystring.category_id;
            var category = CatalogMgr.getCategory(categoryID);
            var parentString = '';
            if (!category.parent.root) {
                parentString = category.parent.displayName + ' > ';
            }
            filter = "category:'" + parentString + category.displayName + "'";
            break;
        default:
            break;
    }
    res.render('curalate/fanreel', {
        container: req.querystring.container_id,
        filter: filter,
        locale: localeString
    });
    next();
});

server.use('RenderScript', function (req, res, next) {
    if (!Site.getCurrent().getCustomPreferenceValue('curalateEnable')) {
        return;
    }
    res.render('curalate/curalatescript');
    next();
});

module.exports = server.exports();
