'use strict';

var constants = require('./constants');
var selectors = constants.selectors;

/**
 * @private Populate the Shipping Address Summary View
 * @param {string} parentSelector - the top level DOM selector for a unique summary address
 * @param {Object} address - the address data
 */
function populateAddressSummary(parentSelector, address) {
    $.each(address, function (attr) {
        var val = address[attr];
        $('.' + attr, parentSelector).text(val || '');
    });
}

/**
  * @public assignListeners
  * Assigns listener on document.ajaxSuccess
*/
function assignListeners() {
    $(document).ajaxSuccess(function (event, xhr, settings) {
    // Stop if this is not an ajax call for the shipment submitting or payment submitting
        if (settings.url.indexOf('CheckoutShippingServices-SubmitShipping') === -1) {
            if (settings.url.indexOf('CheckoutServices-SubmitPayment') === -1) {
                return;
            }
        }

        var data = xhr.responseJSON;

        // Stop if the shipping method is not Paazl
        if (!(data && data.paazlStatus && data.paazlStatus.active && data.paazlShippingMethod)) {
            return;
        }

        // Stop if the pickupLocation and/or it's address is not available
        if (!(data.paazlShippingMethod.pickupLocation && data.paazlShippingMethod.pickupLocation.address)) {
            return;
        }

        // Populare the address summary on the billing page with the pickuplocation address.
        var pickupAddress = data.paazlShippingMethod.pickupLocation.address;
        populateAddressSummary(selectors.address.summary, pickupAddress);
    });
}

module.exports = {
    assignListeners: assignListeners
};
