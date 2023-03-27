'use strict';

var server = require('server');
var personalizationHelper = require('*/cartridge/scripts/product/personalizationHelper');

server.get('Show', server.middleware.https, function (req, res, next) {
    res.render('product/personalization');
    next();
});

server.get('EditPage', server.middleware.https, function (req, res, next) {
    var originalLocale = req.locale.id;
    if (req.querystring.localeID) req.setLocale(req.querystring.localeID);
    var dataPersonalization = req.querystring.productID ? personalizationHelper.getCustomObjectFromStyleID(req.querystring.productID) : {};
    // if (req.querystring.productID && dataPersonalization) personalizationHelper.importChanges(dataPersonalization);
    res.render('product/personalizationeditpage', {
        dataPersonalization: dataPersonalization,
        pageTitle: personalizationHelper.getPageTitle(dataPersonalization),
        personalizationStyles: personalizationHelper.getPersonalizationStyles(),
        error: false,
        localeID: req.querystring.localeID || 'default',
        productID: req.querystring.productID,
        allowedlocales: personalizationHelper.allowedlocales()
    });
    req.setLocale(originalLocale);
    next();
});

server.post('UpdatePersonalization', server.middleware.https, function (req, res, next) {
    res.setViewData({
        localeID: req.form.localeID || 'default'
    });
    if (!req.form.productID) {
        res.render('product/personalizationeditpage', {
            pageTitle: personalizationHelper.getPageTitle({}),
            error: require('dw/web/Resource').msg('productpersonalization.erroruniqueID', 'personalization', null),
            dataPersonalization: {}
        });
        return next();
    }
    var originalLocale = req.locale.id;
    if (req.form.localeID) req.setLocale(req.form.localeID);
    if (req.form.productID) {
        res.setViewData({
            productID: require('dw/system/Site').current.ID + '_' + req.form.productID
        });
    }
    res.render('product/personalizationeditpage', {
        personalizationStyles: personalizationHelper.getPersonalizationStyles(),
        pageTitle: personalizationHelper.getPageTitle({}),
        dataPersonalization: req.form,
        allowedlocales: personalizationHelper.allowedlocales()
    });
    personalizationHelper.importChanges(req.form);
    req.setLocale(originalLocale);
    return next();
});

server.post('GetProducts', function (req, res, next) {
    res.render('product/components/personalizationtable', {
        personalizationData: personalizationHelper.getPersonalizationData(req.form.ID)
    });
    next();
});

server.get('RemovePersonalization', server.middleware.https, function (req, res, next) {
    personalizationHelper.removePersonalization(req.querystring.productID);
    res.render('product/personalization');
    next();
});

module.exports = server.exports();
