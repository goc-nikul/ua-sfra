'use strict';

var server = require('server');
server.extend(module.superModule);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * CheckoutServices-PlaceOrder : append method to store the date of birth to order
 * @name Base/CheckoutServices-PlaceOrder
 * @param {serverfunction} - append
 */

server.append('PlaceOrder', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var contactInfoFields = server.forms.getForm('billing').contactInfoFields;
    var orderID = res.getViewData().orderID;
    var order = OrderMgr.getOrder(orderID);
    if (orderID && 'dob' in contactInfoFields && contactInfoFields.dob.value) {
        Transaction.wrap(function () {
            order.custom.dateOfBirth = contactInfoFields.dob.value;
        });
    }
    next();
});

/**
 * CheckoutServices-SubmitPayment : prepend this method to achive the MX field to save in customer account
 * by get all the existing addressID from user account and comparing in append method
 * @name Base/CheckoutServices-SubmitPayment
 * @function
 * @memberof CheckoutServices
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - prepend
 */
server.prepend(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var billingForm = server.forms.getForm('billing');
        var customerAddressIDArray = [];
        var addressId = req.querystring.addressID;
        if (!addressId && billingForm.addressFields.saveToAccount && billingForm.addressFields.saveToAccount.checked) {
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var addressBook = customer.getProfile().getAddressBook();
            var allAddressList = addressBook.addresses;
            for (var i = 0; i < allAddressList.length; i++) {
                var addressID = allAddressList[i].ID;
                customerAddressIDArray.push(addressID);
            }
        } else {
            customerAddressIDArray.push(addressId);
        }
        res.setViewData({ customerAddressIDArray: customerAddressIDArray });
        next();
    });

module.exports = server.exports();
