'use strict';

/* API includes */
var URLUtils = require('dw/web/URLUtils');
var constants = require('../scripts/constants');

/* Script includes */
var API = require('../scripts/lib/libVertexApi');

function deleteTransaction(transactionId, source) {
    return API.DeleteTransaction(transactionId, source);
}

function CalculateTax(requestType, cart) {
    var Helper = require('./helper/Helper');
    var calculationResult;
    // GC is non-taxable, set taxes for GC for correct billing page work
    Helper.prepareCart(cart);

    /* SFRA check */
    if (constants.SFRA) {
        if (API.isEnabled && session.custom.VertexAddressSuggestionsError != 'error') {
            calculationResult = API.CalculateTax(requestType, cart);

            // For US addresses we check for error
            // but if other countries we skip this condition
            if (!API.isVATEnabled && calculationResult && !calculationResult.result && calculationResult.message == 'Invalid address') {
                session.custom.VertexAddressSuggestionsError = 'error';
                //response.redirect(URLUtils.https('Checkout-Begin'));
                return false;
            }
        }
    } else {
        if ((session.forms.singleshipping.fulfilled.value || (session.forms.multishipping.addressSelection.fulfilled.value && session.forms.multishipping.shippingOptions.fulfilled.value)) && API.isEnabled && session.custom.VertexAddressSuggestionsError != 'error') {
            calculationResult = API.CalculateTax(requestType, cart);

            // For US addresses we check for error
            // but if other countries we skip this condition
            if (!API.isVATEnabled && calculationResult && !calculationResult.result && calculationResult.message == 'Invalid address') {
                session.custom.VertexAddressSuggestionsError = 'error';
                response.redirect(URLUtils.https('COShipping-Start'));
                return false;
            }
        }
    }

    return calculationResult;
}

function LookupTaxAreas(form, cart, multiship) {

    var multishipingSFRA = multiship ? multiship : false;
    // for multishipping in sfra we should not check if address was selected
    // TODO Some flag for each address that will be entered "AS IS" because now for entered AS IS address it makes suggestions
    if (session.custom.VertexAddressSelected == true && !multishipingSFRA) {
        return true;
    }

    var fields;
    if (form.object) {
        if (form.object.shippingAddress) {
            fields = form.object ? form.object.shippingAddress.addressFields : form.shippingAddress.addressFields;
        }
    } else if (form) {
        fields = form.shippingAddress.addressFields;
    }

    var country = fields.country.selectedOption.value || fields.country.selectedOption;
    if (!(country == 'us' || country == 'US')) {
        API.log(constants.INFO_LOG, 'Vertex Lookup Tax Service does not cover "{0}" location', country);
        return true;
    }

    var lookupResult = API.LookupTaxArea(fields, cart);

    if (!lookupResult.result) {
        if (lookupResult.addresses.length) {
            session.custom.VertexAddressSuggestions = JSON.stringify(lookupResult.addresses.reverse()); // User-entered address on the top
            delete session.custom.VertexAddressSuggestionsError;
        } else {
            // We check here if there are no any address suggestions after first trial to pass shipping step and
            // no any changes on form then we let pass to billing step
            // https://vertexsmb.atlassian.net/browse/DEM-13 and https://vertexsmb.atlassian.net/browse/CSFCC-1
            session.custom.VertexAddressSuggestionsError = 'error';
            if (session.custom.VertexAddressSuggestionsError) {
                var isFormDataChanged = isFormChanged(form);
                if (isFormDataChanged) {
                    return true;
                }
            }
        }

        if (!constants.SFRA) {
            response.redirect(URLUtils.https('COShipping-Start'));
        } else {
            //response.redirect(URLUtils.https('Checkout-Begin'));
        }
        return false;
    }
    session.custom.VertexAddressSelected = true;
    delete session.custom.VertexAddressSuggestions;
    delete session.custom.VertexAddressSuggestionsError;
    return true;
}

function isEnabled() {
    return API.isEnabled;
}

function isHashEnabled() {
    return API.isHashEnabled;
}

function isFormChanged(form) {
    var checkFields = ['firstName', 'lastName', 'address1', 'address2', 'city', 'postalCode', 'country', 'phone'];
    /* Check for non-SFRA */
    if (form.object) {
        form = form.object;
        checkFields = ['firstName', 'lastName', 'address1', 'address2', 'city', 'postal', 'country', 'phone'];
    }
    if (!session.custom.singleshipping) {
        session.custom.singleshipping = {};
        session.custom.singleshipping.firstName = form.shippingAddress.addressFields.firstName.htmlValue;
        session.custom.singleshipping.lastName = form.shippingAddress.addressFields.lastName.htmlValue;
        session.custom.singleshipping.address1 = form.shippingAddress.addressFields.address1.htmlValue;
        session.custom.singleshipping.address2 = form.shippingAddress.addressFields.address2.htmlValue;
        session.custom.singleshipping.city = form.shippingAddress.addressFields.city.htmlValue;
        if (form.shippingAddress.addressFields.postal) {
            session.custom.singleshipping.postal = form.shippingAddress.addressFields.postal.htmlValue;
        } else if (form.shippingAddress.addressFields.postalCode) {
            session.custom.singleshipping.postalCode = form.shippingAddress.addressFields.postalCode.htmlValue;
        }

        session.custom.singleshipping.country = form.shippingAddress.addressFields.country.htmlValue;
        session.custom.singleshipping.phone = form.shippingAddress.addressFields.phone.htmlValue;

        return false;
    }
    var result = checkFields.every(function(value, ind) {
        return session.custom.singleshipping[value] == form.shippingAddress.addressFields[value].htmlValue;
    });

    if (!result) {
        checkFields.forEach(function(value) {
            session.custom.singleshipping[value] = form.shippingAddress.addressFields[value].htmlValue;
        });
    } else {
        delete session.custom.singleshipping;
        delete session.custom.VertexAddressSuggestions;
    }
    return result;
}

exports.CalculateTax = CalculateTax;
exports.LookupTaxAreas = LookupTaxAreas;
exports.isEnabled = isEnabled;
exports.isHashEnabled = isHashEnabled;
exports.DeleteTransaction = deleteTransaction;