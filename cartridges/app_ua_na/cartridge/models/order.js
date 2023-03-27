/* eslint-disable spellcheck/spell-checker */
'use strict';
var base = module.superModule;


/**
 * Order class that represents the current order
 * @param {Date} date - Order creation date
 * @returns {string} date - Date in string format
 *
 */
function getSiteDateTime(date) {
    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var Site = require('dw/system/Site');
    if (date) {
        var currentCalendar = new Calendar(date);
        currentCalendar.setTimeZone(Site.current.getTimezone());
        return StringUtils.formatCalendar(currentCalendar, 'MMMM dd, yyyy, hh:mm aa z').replace('am', 'AM').replace('pm', 'PM');
    }
    return date;
}

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    base.call(this, lineItemContainer, options);
    var billing = this.billing;
    var billingAddress = lineItemContainer ? lineItemContainer.billingAddress : null;
    if (billingAddress) {
        if ('rfc' in billingAddress.custom && !empty(billing) && 'billingAddress' in billing && !empty(billing.billingAddress) && 'address' in billing.billingAddress && !empty(billing.billingAddress.address)) {
            this.billing.billingAddress.address.rfc = billingAddress.custom.rfc;
        }
        if ('razonsocial' in billingAddress.custom && !empty(billing) && 'billingAddress' in billing && !empty(billing.billingAddress) && 'address' in billing.billingAddress && !empty(billing.billingAddress.address)) {
            this.billing.billingAddress.address.razonsocial = billingAddress.custom.razonsocial;
        }
        if ('usoCFDI' in billingAddress.custom && !empty(billing) && 'billingAddress' in billing && !empty(billing.billingAddress) && 'address' in billing.billingAddress && !empty(billing.billingAddress.address)) {
            this.billing.billingAddress.address.usoCFDI = billingAddress.custom.usoCFDI && billingAddress.custom.usoCFDI.value;
        }
        if ('regimenFiscal' in billingAddress.custom && !empty(billing) && 'billingAddress' in billing && !empty(billing.billingAddress) && 'address' in billing.billingAddress && !empty(billing.billingAddress.address)) {
            this.billing.billingAddress.address.regimenFiscal = billingAddress.custom.regimenFiscal && billingAddress.custom.regimenFiscal.value;
        }
        if ('codigoPostal' in billingAddress.custom && !empty(billing) && 'billingAddress' in billing && !empty(billing.billingAddress) && 'address' in billing.billingAddress && !empty(billing.billingAddress.address)) {
            this.billing.billingAddress.address.codigoPostal = billingAddress.custom.codigoPostal;
        }
    }

    if (lineItemContainer) {
        var creationDate = Object.hasOwnProperty.call(lineItemContainer, 'creationDate') ? lineItemContainer.creationDate : null;
        this.formatedCreationDate = getSiteDateTime(creationDate);
    }
}

module.exports = OrderModel;
