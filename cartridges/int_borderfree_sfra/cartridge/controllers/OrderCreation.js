'use strict';


/**
 * Require API dependencies
 */
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const Site = require('dw/system/Site');
var server = require('server');


function placeOrder() {

    var BasketMgr = require('dw/order/BasketMgr');
    var ShippingMgr = require('dw/order/ShippingMgr');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');


    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var orderInfoLogger = require('dw/system/Logger').getLogger('orderInfo', 'orderInfo');
    var Status = require('dw/system/Status');
    var Order = require('dw/order/Order');



    var currentBasket = BasketMgr.getCurrentBasket();
    var executeType;
    var allProductLineItems;
    
    if (currentBasket && currentBasket.getAllProductLineItems().getLength() > 0) {
    		allProductLineItems = currentBasket.getAllProductLineItems();
    		executeType = 'bfboc';
    		COHelpers.bfOrdersMissingProductDetails(allProductLineItems, executeType);
    }

    var shipment = currentBasket.getDefaultShipment();
    var shippingMethods = ShippingMgr.getAllShippingMethods();
    var shippingMethodsIter = shippingMethods.iterator();
    while (shippingMethodsIter.hasNext()) {
        var method = shippingMethodsIter.next();
        if(method.ID === 'Borderfree'){
            Transaction.wrap(function () {
            shipment.setShippingMethod(method);
            });
        }
    }
    var shippingAddress = shipment.getShippingAddress();
    Transaction.wrap(function () {
        if (shippingAddress == null) { 
            shippingAddress = shipment.createShippingAddress();
        }
        shippingAddress.setFirstName(dw.system.Site.current.getCustomPreferenceValue('bfxShippingFirstName'));
        shippingAddress.setLastName(dw.system.Site.current.getCustomPreferenceValue('bfxShippingLastName'));
        shippingAddress.setAddress1(dw.system.Site.current.getCustomPreferenceValue('bfxShippingAddress1'));
        shippingAddress.setAddress2(dw.system.Site.current.getCustomPreferenceValue('bfxShippingAddress2'));
        shippingAddress.setCity(dw.system.Site.current.getCustomPreferenceValue('bfxShippingCity'));
        shippingAddress.setPostalCode(dw.system.Site.current.getCustomPreferenceValue('bfxShippingPostalCode'));
        shippingAddress.setStateCode(dw.system.Site.current.getCustomPreferenceValue('bfxShippingStateCode'));
        shippingAddress.setCountryCode(dw.system.Site.current.getCustomPreferenceValue('bfxShippingCountryCode'));
        shippingAddress.setPhone(dw.system.Site.current.getCustomPreferenceValue('bfxShippingPhone'));
    });

    var billingAddress = currentBasket.getBillingAddress();
    Transaction.wrap(function () {
        if(billingAddress == null){
            billingAddress = currentBasket.createBillingAddress();
        }
        billingAddress.setFirstName(dw.system.Site.current.getCustomPreferenceValue('bfxBillingFirstName'));
        billingAddress.setLastName(dw.system.Site.current.getCustomPreferenceValue('bfxBillingLastName'));
        billingAddress.setAddress1(dw.system.Site.current.getCustomPreferenceValue('bfxBillingAddress1'));
        billingAddress.setAddress2(dw.system.Site.current.getCustomPreferenceValue('bfxBillingAddress2'));
        billingAddress.setCity(dw.system.Site.current.getCustomPreferenceValue('bfxBillingCity'));
        billingAddress.setPostalCode(dw.system.Site.current.getCustomPreferenceValue('bfxBillingPostalCode'));
        billingAddress.setStateCode(dw.system.Site.current.getCustomPreferenceValue('bfxBillingStateCode'));
        billingAddress.setCountryCode(dw.system.Site.current.getCustomPreferenceValue('bfxBillingCountryCode'));
        billingAddress.setPhone(dw.system.Site.current.getCustomPreferenceValue('bfxBillingPhone'));
    });





        // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

        // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);
    
    //Capture log for intermittent missing product details on BF orders
    if (order.getAllProductLineItems().getLength() > 0) {
    		allProductLineItems = order.getAllProductLineItems();
    		executeType = 'bfaoc';
    		COHelpers.bfOrdersMissingProductDetails(allProductLineItems,executeType);
    }
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    Transaction.wrap(function () {
        order.custom.bfxMerchantOrderRef = session.custom.orderRefVal;
        order.custom.bfxConfirmStatus = "Unconfirmed";
    });

    // log the order details for dataDog.
    // EPMD-8467 removed the code because at this stage the order is with status CREATED
    // if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
        // orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
    // }

    //delete session
    session.custom.orderRefVal = "";

}


server.get('Success', server.middleware.https, function (req, res, next) {
    placeOrder();
});

server.get('Pending', server.middleware.https, function (req, res, next) {
    placeOrder();
});

server.get('Failure', server.middleware.https, function (req, res, next) {
});

module.exports = server.exports();
