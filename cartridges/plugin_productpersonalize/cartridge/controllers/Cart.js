'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('AddProduct', function (req, res, next) {
    var isPersonalizationEnabled = require('*/cartridge/config/peronslizePreferences').isPersonalizationEnable;
    if (isPersonalizationEnabled && !res.viewData.error && res.viewData.pliUUID) {
        var productPersonlizationHelpers = require('*/cartridge/scripts/helpers/productPersonlizationHelpers');
        productPersonlizationHelpers.updateProductLineItem(res.viewData.pliUUID, req.form.pid, req.form);
        var cartModel = productPersonlizationHelpers.ensureProductQuantities(req.form.pid);
        if (cartModel) {
            res.setViewData({
                cart: cartModel
            });
        }
    }
    next();
});

server.append('cartAddedConfirmationModal', function (req, res, next) {
    res.setViewData(req.querystring);
    next();
});

server.append('Show', function (req, res, next) {
    res.setViewData({
        isPersonalizationEnabled: require('*/cartridge/config/peronslizePreferences').isPersonalizationEnable
    });
    next();
});

server.append('GetProduct', function (req, res, next) {
    var pliUUID = res.viewData.uuid;
    var pli = require('*/cartridge/scripts/util/collections').find(require('dw/order/BasketMgr').currentBasket.allProductLineItems, item => item.UUID === pliUUID);
    require('*/cartridge/models/productLineItem/decorators/index').productPersonalization(res.viewData, pli);
    res.setViewData({
        isPersonalizationEnabled: require('*/cartridge/config/peronslizePreferences').isPersonalizationEnable
    });
    next();
});

server.append('EditProductLineItem', function (req, res, next) {
    var isPersonalizationEnabled = require('*/cartridge/config/peronslizePreferences').isPersonalizationEnable;
    if (isPersonalizationEnabled && !res.viewData.error && req.form.uuid) {
        var productPersonlizationHelpers = require('*/cartridge/scripts/helpers/productPersonlizationHelpers');
        productPersonlizationHelpers.updateProductLineItem(req.form.uuid, req.form.pid, req.form);
        var cartModel = productPersonlizationHelpers.ensureProductQuantities(req.form.pid);
        if (cartModel) {
            res.setViewData({
                cartModel: cartModel
            });
        }
    }
    next();
});


module.exports = server.exports();
