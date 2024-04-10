'use strict';
/* eslint-disable block-scoped-var  */

const server = require('server');

const Site = require('dw/system/Site');
const Encoding = require('dw/crypto/Encoding');
const StringUtils = require('dw/util/StringUtils');
const cache = require('*/cartridge/scripts/middleware/cache');

/**
 * Returns header json string
 * @returns {string} returns stringified header
 */
function getHeader() {
    return JSON.stringify({ alg: 'HS256', typ: 'JWT' });
}
/**
 * Encode to base64 format
 * @param {string} data input data
 * @returns {string} converts to base64
 */
function base64UrlEncode(data) {
    return StringUtils.encodeBase64(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/m, '');// eslint-disable-line
}

/**
 * Generate JWT token
 * @param {string} payload JWT paylaod
 * @param {string} header JWT header
 * @returns {string} returns JWT token
 */
function getEncryptWithHeader(payload, header) {
    const Mac = require('dw/crypto/Mac');
    var mac = new Mac(Mac.HMAC_SHA_256);
    var encryptionKey = Site.getCurrent().getCustomPreferenceValue('secretKeyQrCode');
    var encodedPayload = base64UrlEncode(header) + '.' + base64UrlEncode(payload);
    var sigature = Encoding.toBase64(mac.digest(encodedPayload, encryptionKey)).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/m, '');// eslint-disable-line
    return encodedPayload + '.' + sigature;
}

/**
 * Encrypt payload
 * @param {Object} payload encrypt payload
 * @returns {string} encrypted payload
 */
function encrypt(payload) {
    return getEncryptWithHeader(payload, getHeader());
}

/**
 * Validates signature
 * @param {string} data signature
 * @returns {boolean} validates whether signature is valid or not
 */
function isValidSignature(data) {
    var fields = data.split('.');
    return data === getEncryptWithHeader(StringUtils.decodeBase64(fields[1]), StringUtils.decodeBase64(fields[0]));
}

/**
 * Decrypt JWT token
 * @param {Object} data incomming data
 * @returns {string} decrypt JWT token
 */
function decrypt(data) {
    if (!data || data.split('.').length !== 3 || !isValidSignature(data)) return null;
    return StringUtils.decodeBase64(data.split('.')[1]);
}

server.get('SharedBaskets', function (req, res, next) {
    var viewData = res.getViewData();
    viewData.pageContext = {
        ns: 'shareBasket'
    };
    const BasketMgr = require('dw/order/BasketMgr');
    const URLUtils = require('dw/web/URLUtils');
    const Bytes = require('dw/util/Bytes');
    const currentBasket = BasketMgr.getCurrentBasket();
    const products = currentBasket.allProductLineItems;

    var productList = [];

    for (let i = 0; i < products.length; i++) {
        productList.push({ id: products[i].productID, quantity: products[i].quantityValue });
    }

    var jsonString = JSON.stringify(productList);

    if (jsonString != null) {
        const token = Encoding.toBase64(new Bytes(encrypt(jsonString)));
        const sharedBasketURL = (URLUtils.https('QRcode-LandingPage', 'token', token)).toString();
        res.json({ sharedBasketURL: sharedBasketURL });
    }
    next();
    return;
});

server.get('UpdateLandingPage', function (req, res, next) {
    var viewData = res.getViewData();
    viewData.pageContext = {
        ns: 'shareBasket'
    };
    const URLUtils = require('dw/web/URLUtils');
    const Bytes = require('dw/util/Bytes');
    const products = JSON.parse(req.querystring.products);

    var productList = [];

    for (let i = 0; i < products.length; i++) {
        productList.push({ id: products[i].id, quantity: products[i].quantity });
    }

    const jsonString = JSON.stringify(productList);
    const token = Encoding.toBase64(new Bytes(encrypt(jsonString)));
    const sharedBasketURL = (URLUtils.https('QRcode-LandingPage', 'token', token)).toString();

    res.redirect(sharedBasketURL);
    next();
});

server.get('LandingPage', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var viewData = res.getViewData();
    viewData.pageContext = {
        ns: 'shareBasket'
    };

    const Locale = require('dw/util/Locale');
    const URLUtils = require('dw/web/URLUtils');
    const ProductFactory = require('*/cartridge/scripts/factories/product');
    const PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    const encodedToken = Encoding.fromBase64(req.querystring.token).toString();
    const decodedToken = decrypt(encodedToken);
    const products = JSON.parse(decodedToken);

    var countries = PreferencesUtil.getJsonValue('countriesJSON');
    var currentLocale = Locale.getLocale(req.locale.id);
    var currCountry = currentLocale.country;
    var currLanguage = currentLocale.displayLanguage;
    var allowedLocales = [];
    var productsList = [];
    var productCollection = [];
    var languages = [];
    var countryandLanguage = [];
    var localeId;
    var countryItem;
    var continueUrl = URLUtils.url('QRcode-UpdateLocale');

    products.forEach(p => {
        var params = { pid: p.id };
        var product = ProductFactory.get(params);
        if (product) {
            product.quantity = p.quantity;
            product.variationAttributes.some(attr => {
                if (attr.id === 'size') {
                    return attr.values.some(size => {
                        if (size.selected === true) {
                            product.sizeToDisplay = size.displayValue;
                            return true;
                        }
                        return false;
                    });
                }
                return false;
            });
            productsList.push(product);
        }
    });

    for (var j = 0; j < 5; j++) {
        productCollection.push(productsList[j]);
    }

    if (currCountry.toLowerCase() !== 'gb') {
        countries.forEach(countryObj => {
            if (countryObj.countryCode.toLowerCase() !== 'gb') {
                countryObj.locales.forEach(locale => {
                    localeId = locale.split('_')[0] + '_' + countryObj.countryCode;
                    var localeInfo = Locale.getLocale(localeId);

                    if (currCountry === countryObj.countryCode) {
                        allowedLocales.push({
                            displayName: localeInfo.displayLanguage[0].toUpperCase() + localeInfo.displayLanguage.substring(1),
                            id: localeInfo.language
                        });
                    }

                    languages.push(localeInfo.displayLanguage[0].toUpperCase() + localeInfo.displayLanguage.substring(1));
                });

                countryItem = {
                    countryCode: countryObj.countryCode,
                    locales: countryObj.locales,
                    displayLanguages: languages,
                    url: continueUrl.host(countryObj.hostname).toString()
                };
                countryandLanguage.push(countryItem);

                languages = [];
            }
        });
    }

    res.render('cart/sharedBasketLandingPage', {
        items: productsList,
        countries: countryandLanguage,
        currCountry: currCountry,
        languages: allowedLocales,
        currLanguage: currLanguage,
        productCollection: productCollection
    });

    next();
});

server.get('UpdateLocale', function (req, res, next) {
    const Bytes = require('dw/util/Bytes');
    const Locale = require('dw/util/Locale');
    const PriceHelper = require('app_ua_core/cartridge/scripts/util/PriceHelper');
    const PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');

    const token = Encoding.toBase64(new Bytes(encrypt(req.querystring.products)));
    const newlocale = req.querystring.lang.toLowerCase() + '_' + req.querystring.country;

    req.setLocale(newlocale);

    const countries = PreferencesUtil.getJsonValue('countriesJSON');
    const currentLocale = Locale.getLocale(req.locale.id);

    PriceHelper.setSitesApplicablePriceBooks(currentLocale.country, countries);

    res.redirect(require('dw/web/URLUtils').url('QRcode-LandingPage', 'token', token));
    next();
});


server.get('ReloadEditModal', function (req, res, next) {
    const ProductMgr = require('dw/catalog/ProductMgr');
    const productId = req.querystring.pid;
    const productColor = req.querystring.color;
    const productSize = req.querystring.size;
    const product = ProductMgr.getProduct(productId);
    const variants = product.getVariants();

    var i = 0;

    while (i++ < variants.length - 1) {
        if (variants[i].custom.color === productColor.toString() && variants[i].custom.size === productSize.toString()) break;
    }

    res.redirect(require('dw/web/URLUtils').url('QRcode-EditModal', 'pid', variants[i].ID));
    next();
});

server.get('EditModal', function (req, res, next) {
    const ProductFactory = require('*/cartridge/scripts/factories/product');
    const renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    const template = 'cart/sharedBasketEditProduct.isml';
    const params = { pid: req.querystring.pid };
    const quantity = req.querystring.quantity;
    const item = ProductFactory.get(params);
    const context = { product: item, quantity: quantity };

    var renderedTemplate = renderTemplateHelper.getRenderedHtml(context, template);

    res.json({ renderedTemplate: renderedTemplate, product: item, quantity: quantity });
    next();
});

server.get('AddToCart', function (req, res, next) {
    const BasketMgr = require('dw/order/BasketMgr');
    const URLUtils = require('dw/web/URLUtils');
    const Transaction = require('dw/system/Transaction');
    const cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    const currentBasket = BasketMgr.getCurrentOrNewBasket();
    var itemsToAdd = req.querystring.items;

    itemsToAdd = JSON.parse(itemsToAdd);

    itemsToAdd.forEach(item => {
        Transaction.wrap(function () {
            cartHelper.addProductToCart(currentBasket, item.id, parseInt(item.quantity, 10), [], [], null, req);
        });
    });

    res.redirect(URLUtils.url('Cart-Show'));

    next();
});
module.exports = server.exports();
