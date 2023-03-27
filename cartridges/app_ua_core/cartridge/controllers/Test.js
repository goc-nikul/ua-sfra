'use strict';

var server = require('server');

server.extend(module.superModule);

server.post('CreateOrder', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');

    var createBasket = function (products) {
        var BasketMgr = require('dw/order/BasketMgr');
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var basket = BasketMgr.getCurrentOrNewBasket();
        cartHelper.ensureAllShipmentsHaveMethods(basket);
        products.forEach(function (product) {
            cartHelper.addProductToCart(
                basket,
                product.pid,
                product.quantity,
                [],
                {}
            );
        });
        return basket;
    };

    var addFormData = function (basket, formData) {
        var billingAddress = basket.createBillingAddress();
        billingAddress.setFirstName(formData.firstName);
        billingAddress.setLastName(formData.lastName);
        billingAddress.setAddress1(formData.address1);
        billingAddress.setAddress2(formData.address2);
        billingAddress.setCity(formData.city);
        billingAddress.setPostalCode(formData.postalCode);
        billingAddress.setStateCode(formData.stateCode);
        billingAddress.setCountryCode(formData.countryCode);
        billingAddress.setPhone(formData.phone);
        basket.setCustomerEmail(formData.email);
    };

    var createOrder = function (orderData) {
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        return Transaction.wrap(function () {
            var basket = createBasket(orderData.products);
            addFormData(basket, orderData.form);
            basketCalculationHelpers.calculateTotals(basket);
            return COHelpers.createOrder(basket) || {};
        });
    };

    var order = createOrder(JSON.parse(req.form.dataJSON));
    var orderData = {
        id: order.orderNo,
        token: order.orderToken
    };

    res.json(orderData);
    return next();
});

module.exports = server.exports();
