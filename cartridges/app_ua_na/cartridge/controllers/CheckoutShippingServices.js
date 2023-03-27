'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('SubmitShipping', function (req, res, next) {
    var form = server.forms.getForm('shipping');
    var result = res.getViewData();
    if (!empty(result.address) && typeof result.address !== undefined) {
        if (form.shippingAddress.addressFields && 'exteriorNumber' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.exteriorNumber.value) {
            result.address.exteriorNumber = form.shippingAddress.addressFields && 'exteriorNumber' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.exteriorNumber.value ? form.shippingAddress.addressFields.exteriorNumber.value : '';
        }
        if (form.shippingAddress.addressFields && 'interiorNumber' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.interiorNumber) {
            result.address.interiorNumber = form.shippingAddress.addressFields && 'interiorNumber' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.interiorNumber.value ? form.shippingAddress.addressFields.interiorNumber.value : '';
        }
        if (form.shippingAddress.addressFields && 'additionalInformation' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.additionalInformation) {
            result.address.additionalInformation = form.shippingAddress.addressFields && 'additionalInformation' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.additionalInformation.value ? form.shippingAddress.addressFields.additionalInformation.value : '';
        }
        if (form.shippingAddress.addressFields && 'colony' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.colony.value) {
            result.address.colony = form.shippingAddress.addressFields && 'colony' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.colony.value ? form.shippingAddress.addressFields.colony.value : '';
        }
        if (form.shippingAddress.addressFields && 'dependentLocality' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.dependentLocality.value) {
            result.address.dependentLocality = form.shippingAddress.addressFields && 'dependentLocality' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.dependentLocality.value ? form.shippingAddress.addressFields.dependentLocality.value : '';
        }
    }
    next();
});

server.append('UpdateShippingMethodsList', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var basket = BasketMgr.getCurrentBasket();
    if (basket) {
        var shippingAddress = basket.getDefaultShipment().getShippingAddress();
        if (shippingAddress) {
            Transaction.wrap(function () {
                if ('exteriorNumber' in req.form && !empty(req.form.exteriorNumber)) {
                    shippingAddress.custom.exteriorNumber = req.form.exteriorNumber;
                }
                if ('interiorNumber' in req.form) {
                    shippingAddress.custom.interiorNumber = req.form.interiorNumber ? req.form.interiorNumber : '';
                }
                if ('additionalInformation' in req.form) {
                    shippingAddress.custom.additionalInformation = req.form.additionalInformation ? req.form.additionalInformation : '';
                }
                if ('colony' in req.form && !empty(req.form.colony)) {
                    shippingAddress.custom.colony = req.form.colony;
                }
                if ('dependentLocality' in req.form && !empty(req.form.dependentLocality)) {
                    shippingAddress.custom.dependentLocality = req.form.dependentLocality;
                }
            });
        }
    }
    next();
});

module.exports = server.exports();
