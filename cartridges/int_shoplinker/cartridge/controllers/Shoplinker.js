'use strict';

var server = require('server');
/* Script Modules */
const ProductMgr = require('dw/catalog/ProductMgr');
const Site = require('dw/system/Site');
const ShoplinkerHelper = require('../scripts/util/ShoplinkerHelper');
const customerID = 'shoplinkerCustomerID' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('shoplinkerCustomerID') : false;


server.get('G2', server.middleware.https, function (req, res, next) {
    const productId = req.querystring.vid;
    const product = ProductMgr.getProduct(productId);
    const pvm = product.getVariationModel();
    const colorAttrValue = pvm.getVariationValue(product, pvm.getProductVariationAttribute('color'));
    const sizeAttrValue = pvm.getVariationValue(product, pvm.getProductVariationAttribute('size'));
    const sizeValue = !empty(sizeAttrValue) ? sizeAttrValue.getDisplayValue() : product.custom.size;
    const sizeDisplayValue = require('dw/web/Resource').msg('addtobag.size.' + sizeValue, 'checkout', sizeValue).replace('/', '_');
    const colorDisplayValue = !empty(colorAttrValue) ? colorAttrValue.getDisplayValue() : ShoplinkerHelper.getColorValue(product);
    res.render('createvariant', {
        customerID: customerID,
        productName: colorDisplayValue + '-' + sizeDisplayValue,
        partnerProductID: product.ID
    });
    next();
});

server.get('G3', server.middleware.https, function (req, res, next) {
    const materialItemsIDListString = req.querystring.materialItemsIDList;
    const product = ProductMgr.getProduct(materialItemsIDListString.split(',')[0]);
    const pvm = product.getVariationModel();
    const materialID = product.custom.style + '-' + product.custom.color;
    const variants = ShoplinkerHelper.getVariantsForMaterial(materialID).iterator();
    const productImages = ShoplinkerHelper.getImagesForMaterial(variants);
    const detailDesc = ShoplinkerHelper.getMaterialDescriptionText(pvm.master, productImages);
    const Calendar = require('dw/util/Calendar');
    const makerDt = new Calendar(pvm.master.creationDate);
    makerDt.setTimeZone(require('dw/system/Site').getCurrent().getTimezone());
    let primaryCategory = pvm.getMaster().getPrimaryCategory();
    var categoryPath = [];
    var productNamePrefix = require('dw/web/Resource').msg('createinfo.product.material.prefix', 'shoplinker', '');
    if (primaryCategory && primaryCategory.custom.shoplinkerPath) categoryPath = primaryCategory.custom.shoplinkerPath.split('-');

    res.render('creatematerial', {
        customerID: customerID,
        productName: productNamePrefix + pvm.master.name + materialID,
        partnerProductID: materialID,
        detailDesc: detailDesc,
        attributePartnerProduct_id: materialItemsIDListString,
        makerDt: require('dw/util/StringUtils').formatCalendar(makerDt, 'yyyyMMdd'),
        categoryPath: categoryPath
    });
    next();
});

server.get('G4', server.middleware.https, function (req, res, next) {
    const materialID = req.querystring.mid;
    const variants = ShoplinkerHelper.getVariantsForMaterial(materialID).iterator();
    const productImages = ShoplinkerHelper.getImagesForMaterial(variants);
    const product = ShoplinkerHelper.getProductForMaterial(materialID);
    const System = require('dw/system/System');
    const instanceType = (System.getInstanceType() === System.DEVELOPMENT_SYSTEM) ? 'development' : 'production';
    const detailDesc = ShoplinkerHelper.getMaterialDescriptionText(product, productImages);
    let productGender = '';

    switch (product.custom.gender) {
        case 'Mens':
        case 'Boys':
            productGender = 'male';
            break;
        case 'Womens':
        case 'Girls':
            productGender = 'female';
            break;
        default:
            productGender = 'unisex';
    }

    res.render('updatematerial', {
        customerID: customerID,
        partnerProductID: materialID,
        detailDesc: detailDesc,
        productGender: productGender,
        instanceType: instanceType
    });
    next();
});

server.get('G5', server.middleware.https, function (req, res, next) {
    const materialID = req.querystring.mid;
    const variants = ShoplinkerHelper.getVariantsForMaterial(materialID).iterator();
    const productImages = ShoplinkerHelper.getImagesForMaterial(variants);

    res.render('createimage', {
        customerID: customerID,
        partnerProductID: materialID,
        productImages: productImages
    });
    next();
});

server.get('G6', server.middleware.https, function (req, res, next) {
    const materialID = req.querystring.mid;
    const product = ShoplinkerHelper.getProductForMaterial(materialID);
    const division = product.custom.division;
    const productfamily = product.custom.productfamily;
    const Calendar = require('dw/util/Calendar');
    const creationDate = new Calendar(product.creationDate);
    creationDate.setTimeZone(require('dw/system/Site').getCurrent().getTimezone());
    let lclassID = '';
    let items = {};

    if (division === 'Apparel') {
        lclassID = 'i01';
        items.template = 'components/i01';
        items.color = ShoplinkerHelper.getColorNameForMaterial(materialID);
        items.sizes = ShoplinkerHelper.getSizesForMaterial(materialID);
        items.creationYear = require('dw/util/StringUtils').formatCalendar(creationDate, 'yyyyMM');
    } else if (division === 'Footwear') {
        lclassID = 'i02';
        items.template = 'components/i02';
        items.color = ShoplinkerHelper.getColorNameForMaterial(materialID);
        items.sizes = ShoplinkerHelper.getSizesForMaterial(materialID);
    } else if (division === 'Accessories' && productfamily === 'Bags') {
        lclassID = 'i03';
        items.template = 'components/i03';
        items.color = ShoplinkerHelper.getColorNameForMaterial(materialID);
    } else if (division === 'Accessories') {
        lclassID = 'i04';
        items.template = 'components/i04';
        items.sizes = ShoplinkerHelper.getSizesForMaterial(materialID);
    }

    res.render('createinfo', {
        customerID: customerID,
        partnerProductID: materialID,
        lclassID: lclassID,
        items: items
    });
    next();
});

server.get('G7', server.middleware.https, function (req, res, next) {
    const productId = req.querystring.pid;
    res.render('productinquiry', {
        customerID: customerID,
        partnerProductID: productId
    });
    next();
});

module.exports = server.exports();
