'use strict'; /* eslint-disable prefer-const */

const TYPE_WISH_LIST = require('dw/customer/ProductList').TYPE_WISH_LIST;
var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    let URLUtils = require('dw/web/URLUtils');
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    var ProductMgr = require('dw/catalog/ProductMgr');
    let viewData = res.getViewData();

    // The req parameter has a property called querystring. In this use case the querystring could
    // have the following:
    // pid - the Product ID
    // ratings - boolean to determine if the reviews should be shown in the tile.
    // swatches - boolean to determine if the swatches should be shown in the tile.
    //
    // pview - string to determine if the product factory returns a model for
    //         a tile or a pdp/quickview display
    // source - string to determine what type of product tile should be rendered
    let productTileParams = {};
    Object.keys(req.querystring).forEach(function (key) {
        productTileParams[key] = req.querystring[key];
    });

    if (viewData.product && viewData.product.promotions) {
        viewData.CallOutMessagepromotions = productHelpers.getCallOutMessagePromotions(viewData.product.promotions, viewData.product);
    }
    var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
    var defaultSelectedColor = (viewData.product.swatches && viewData.product.swatches.values && viewData.product.swatches.values.length > 0) ? viewData.product.swatches.values[0].id : '';
    if (viewData.product.images && viewData.product.images.selectedColor && !empty(viewData.product.images.selectedColor.color)) {
        defaultSelectedColor = viewData.product.images.selectedColor.color;
    }

    if (productTileParams.showImageSlider === 'true') {
        viewData.showImageSlider = true;
    }
    viewData.isProductTile = true;
    var viewPreference = 'viewPreference' in req.querystring ? req.querystring.viewPreference : '';
    var isQuickATCenabled = 'isQuickATCenabled' in dw.system.Site.current.preferences.custom && dw.system.Site.current.getCustomPreferenceValue('isQuickATCenabled');
    viewData.display.quickView = true;
    viewData.display.quickAdd = req.querystring.quickAdd === 'true';
    var product = ProductMgr.getProduct(viewData.product.id);
    var productExperienceType;
    var masterProductID = product && product.ID ? product.ID : '';
    var singleVariationID = '';
    if (product && product.isMaster()) {
        viewData.urls.product = URLUtils.url('Product-Show', 'pid', viewData.product.id, 'dwvar_' + viewData.product.id + '_color', defaultSelectedColor, 'start', req.querystring.moreViewUrl, 'breadCrumbLast', req.querystring.breadCrumbLast, 'viewPreference', viewPreference).relative().toString();
        if (req.querystring.shopThisLookoutfit) {
            viewData.urls.product = URLUtils.url('Product-Show', 'pid', viewData.product.id, 'dwvar_' + viewData.product.id + '_color', defaultSelectedColor, 'start', req.querystring.moreViewUrl, 'breadCrumbLast', req.querystring.breadCrumbLast, 'viewPreference', viewPreference, 'recommendedLook', true).relative().toString();
        }
        viewData.urls.quickView = URLUtils.url('Product-ShowQuickView', 'pid', viewData.product.id, 'source', productTileParams.source || '', 'quickAdd', isQuickATCenabled, 'dwvar_' + viewData.product.id + '_color', defaultSelectedColor).relative().toString();
        viewData.product.variationAttributes = product.variationModel.productVariationAttributes;
        productExperienceType = product.custom && product.custom.experienceType ? product.custom.experienceType.value : '';

        if (product.variants.length === 1) {
            singleVariationID = product.variants[0].ID;
        }
    } else if (product) {
        var MasterProductDetails = product.masterProduct;
        masterProductID = MasterProductDetails.ID;
        viewData.urls.product = URLUtils.url('Product-Show', 'pid', masterProductID, 'dwvar_' + masterProductID + '_color', defaultSelectedColor, 'start', req.querystring.moreViewUrl, 'breadCrumbLast', req.querystring.breadCrumbLast, 'viewPreference', viewPreference).relative().toString();
        if (req.querystring.shopThisLookoutfit) {
            viewData.urls.product = URLUtils.url('Product-Show', 'pid', masterProductID, 'dwvar_' + masterProductID + '_color', defaultSelectedColor, 'start', req.querystring.moreViewUrl, 'breadCrumbLast', req.querystring.breadCrumbLast, 'viewPreference', viewPreference, 'recommendedLook', true).relative().toString();
        }
        viewData.urls.quickView = URLUtils.url('Product-ShowQuickView', 'pid', masterProductID, 'source', productTileParams.source || '', 'quickAdd', isQuickATCenabled, 'dwvar_' + masterProductID + '_color', defaultSelectedColor).relative().toString();
        productExperienceType = MasterProductDetails.custom && MasterProductDetails.custom.experienceType ? MasterProductDetails.custom.experienceType.value : '';

        if (MasterProductDetails.variants.length === 1) {
            singleVariationID = MasterProductDetails.variants[0].ID;
        }
    }
    var ExperienceType = false;
    if (!empty(req.querystring.outlet)) {
        if (req.querystring.outlet === 'outlet') {
            ExperienceType = true;
        }
    } else if (!empty(productExperienceType)) {
        if (productExperienceType === 'outlet' || productExperienceType === 'outletMerchOverride' || productExperienceType === 'allMerchOverride') {
            ExperienceType = true;
        }
    }

    if (masterProductID && singleVariationID) {
        viewData.quantity = 1;
        viewData.singleVariationID = singleVariationID;
        viewData.masterProductID = masterProductID;
    }
    viewData.isShopThisLookModel = 'shopThisLookoutfit' in req.querystring ? req.querystring.shopThisLookoutfit : false;
    var list = productListHelper.getListNew(req.currentCustomer.raw, { type: TYPE_WISH_LIST });
    var config = {
        qty: 1,
        req: req,
        type: TYPE_WISH_LIST
    };
    var isItemExistsInWishList;
    if (req.querystring.showWishlistStatus && req.querystring.showWishlistStatus === 'false') {
        isItemExistsInWishList = false;
    } else {
        isItemExistsInWishList = (list && !list.items.empty) ? productListHelper.itemExists(list, productTileParams.pid, config) : false;
    }

    viewData.isShopThisLookModel = 'shopThisLookoutfit' in req.querystring ? req.querystring.shopThisLookoutfit : false;
    viewData.isItemExistsInWishList = isItemExistsInWishList;
    viewData.mid = masterProductID;
    viewData.experienceType = ExperienceType;
    viewData.orderable = product && product.availabilityModel && product.availabilityModel.orderable;
    res.setViewData(viewData);
    next();
});
/* eslint-enable prefer-const */
module.exports = server.exports();
