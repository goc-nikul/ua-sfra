'use strict';

/* global PaazlCheckout */

var selectors = require('./constants').selectors;
var addressCompletion = require('./address_completion');
var addressSummary = require('./address_summary');
var widget = require('./widget');

/**
  * Global init
*/
function init() {
    // For each form, create a unique class and instantiate the address completion for that form
    // This is necessary since we can have multiple (shipping) forms with the same name, class, id, etc.
    $(selectors.forms.shipping).each(function (i) {
        $(this).addClass(selectors.forms.shippingFormPrefix.substr(1) + i);
        addressCompletion.assign(selectors.forms.shippingFormPrefix + i);
    });

    $(selectors.forms.billing).each(function (i) {
        $(this).addClass(selectors.forms.billingFormPrefix.substr(1) + i);
        addressCompletion.assign(selectors.forms.billingFormPrefix + i);
    });

    // Check if the global PaazlCheckout object exists
    if (PaazlCheckout) {
    // Assign listeners for the PaazlWidget based on the form that it's in
        var $paazlWidgetForm = $(selectors.forms.paazlWidgetForm);

        if ($paazlWidgetForm[0]) {
            widget.assignListeners($paazlWidgetForm);
        }
    }

    // Assigns listener on document.ajaxSuccess for the shipping address summary
    var $addressSummary = $(selectors.address.summary);
    if ($addressSummary[0]) {
        addressSummary.assignListeners();
    }
}

init();
