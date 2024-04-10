'use script';

var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');

/**
 * Set Order custom attribute isEmployeeOrder
 * @param {dw.order.Order} Order - The order object to be placed
 */
function setEmployeeOrder(Order) {
    try {
        var CustomerUtils = require('*/cartridge/scripts/util/CustomerUtils');
        var customerUtils = new CustomerUtils();

        var order = Order;

        if (order === null) {
            Logger.info('order is empty');
            return;
        }
        var customer = order.customer;

        if (customerUtils.isEmployeeDiscount(customer, order.custom.customerCountry) || customerUtils.isEmployeeFreeShipping(customer, order.custom.customerCountry)) {
            Transaction.wrap(function () {
                order.custom.isEmployeeOrder = true;
            });
        }
    } catch (e) {
        Logger.error('Exception while executing script' + e.message);
    }

    return;
}

/* eslint-disable spellcheck/spell-checker */
/**
 * Set Order Type
 * @param {dw.order.Order} order - The order object to be placed
 */
function setOrderType(order) {
    try {
        if (order === null) {
            Logger.info('order is empty');
            return;
        }
        // Do not overwrite maoOrderType if it is already set
        if (order.custom.maoOrderType.value) {
            return;
        }

        // Fix needed to apply correct MAO Order Type based on actual shipping method selected by customer.
        var shippingMethodID =
        order &&
        order.getDefaultShipment() &&
        order.getDefaultShipment().getShippingMethod()
            ? order.getDefaultShipment().getShippingMethod().ID
            : null;

        var orderType = 'web';
        if ('sr_token' in order.custom && order.custom.sr_token && (shippingMethodID === 'shoprunner' || shippingMethodID === 'shoprunner_HAL')) {
            orderType = 'SHRU';
        }
        if (customer.isMemberOfCustomerGroup('CSR')) {
            orderType = 'TELE';
        }

        Transaction.wrap(function () {
            var orderObject = order;
            orderObject.custom.maoOrderType = orderType;
        });

        Logger.info('Order type {0} set successfully for Order No. {1} ', orderType, order.orderNo);
    } catch (e) {
        Logger.error('Exception while executing setOrderType' + e.message);
    }

    return;
}

/**
 * Set Customer Name for the order
 * @param {dw.order.Order} order - The order object to be placed
 */
function setCustomerName(order) {
    try {
        if (empty(order.customerName.trim())) {
            var shippingAddress = order.getDefaultShipment().getShippingAddress();
            var billingAddress = order.getBillingAddress();
            var customerName = billingAddress.fullName ? billingAddress.fullName : shippingAddress.fullName;
            Transaction.wrap(function () {
                order.setCustomerName(customerName);
            });
        }
    } catch (e) {
        Logger.error('Exception while executing setCustomerName' + e.message);
    }
}

/**
 * Set CSR email for the order
 * @param {dw.order.Order} order - The order object to be placed
 * @param {dw.customer.Customer} customer - The customer
 */
function setCSREmailAddress(order, customer) {
    try {
        if (order && customer && customer.isMemberOfCustomerGroup('CSR')) {
            var csrEmail = customer.profile && customer.profile.email ? customer.profile.email : '';
            if (csrEmail) {
                Transaction.wrap(function () {
                    order.custom.csrEmailAddress = csrEmail; // eslint-disable-line
                });
            }
        }
    } catch (e) {
        Logger.error('Exception while executing setCSREmailAddress' + e.message);
    }
}

module.exports = {
    setEmployeeOrder: setEmployeeOrder,
    setOrderType: setOrderType,
    setCustomerName: setCustomerName,
    setCSREmailAddress: setCSREmailAddress
};
