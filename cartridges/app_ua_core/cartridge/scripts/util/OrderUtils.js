/* eslint-disable no-underscore-dangle */
'use strict';

const Encoding = require('dw/crypto/Encoding');
const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const Cipher = require('dw/crypto/Cipher');
const Bytes = require('dw/util/Bytes');
// eslint-disable-next-line spellcheck/spell-checker
const URLUtilsHelper = require('int_customfeeds/cartridge/scripts/util/URLUtilsHelper.ds');


var OrderUtils = (function () {
    /**
     *  Return the Order hash
     * @param {string} orderUUID - orderUUID
     * @param {Date} orderCreationDate - orderCreationDate
     * @return {string} orderHash
     */
    function _encodeHash(orderUUID, orderCreationDate) {
        var orderHash = null;
        var strHash = orderUUID + '|' + orderCreationDate.toUTCString();
        var secretKey = Resource.msg('convertapi.key', 'config', null);
        var salt = Resource.msg('convertapi.salt', 'config', null);
        var algorithm = Resource.msg('convertapi.encryptalgorithm', 'config', null);
        var encodedKey = Encoding.toBase64(new Bytes(secretKey, 'UTF8'));
        var encodedSalt = Encoding.toBase64(new Bytes(salt, 'UTF8'));
        var cipher = new Cipher();

        orderHash = cipher.encrypt(strHash, encodedKey, algorithm, encodedSalt, 1);

        return orderHash;
    }

    var getPDFDistanceSalesAgreementURL = function (orderUUID, orderCreationDate) {
        var orderHash = _encodeHash(orderUUID, orderCreationDate);
        var urlForPDF = URLUtils.http('Order-DistanceSalesAgreement', 'orderHash', orderHash);
        // eslint-disable-next-line no-undef
        urlForPDF = URLUtilsHelper.prepareURLForLocale(urlForPDF.toString(), request.locale);

        return urlForPDF;
    };

    var getPDFPreDisclosureFormURL = function (orderUUID, orderCreationDate) {
        var orderHash = _encodeHash(orderUUID, orderCreationDate);
        var urlForPDF = URLUtils.http('Order-PreDisclosureForm', 'orderHash', orderHash);
        // eslint-disable-next-line no-undef
        urlForPDF = URLUtilsHelper.prepareURLForLocale(urlForPDF.toString(), request.locale);

        return urlForPDF;
    };
    var getLineItemImage = function (product) {
        var productItem = {};
        var productUPC = product ? product.upc : '';
        var imagesDecorator = require('*/cartridge/models/product/decorators/images');
        var ProductMgr = require('dw/catalog/ProductMgr');
        var lineItemProduct = ProductMgr.getProduct(productUPC);
        var imageUrl = '';
        var altText;
        if (lineItemProduct) {
            imagesDecorator(productItem, lineItemProduct, { types: ['cartFullDesktop'], quantity: 'single' });
            imageUrl = productItem.images && productItem.images.cartFullDesktop && productItem.images.cartFullDesktop.length > 0 && productItem.images.cartFullDesktop[0].url ? productItem.images.cartFullDesktop[0].url : null;
            altText = productItem.images && productItem.images.cartFullDesktop && productItem.images.cartFullDesktop.length > 0 && productItem.images.cartFullDesktop[0].noImgAlt ? productItem.images.cartFullDesktop[0].noImgAlt : altText;
        } else {
            imageUrl = product.assets && product.assets.images && product.assets.images.length > 0 ? product.assets.images[0].url : null;
        }

        return { imageUrl: imageUrl, altText: altText };
    };


    return {
        getPDFDistanceSalesAgreementURL: getPDFDistanceSalesAgreementURL,
        getPDFPreDisclosureFormURL: getPDFPreDisclosureFormURL,
        getLineItemImage: getLineItemImage
    };
}());

module.exports = OrderUtils;

