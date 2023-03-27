'use strict';
var clientSideValidationEMEA = require('site/components/common/clientSideValidation');

/* global PaazlCheckout */

var constants = require('./constants');
var attributes = constants.attributes;
var selectors = constants.selectors;
var events = constants.events;

var observer;
var paazlID = $(selectors.paazlID).data(attributes.paazlID);
var $zipCodeInput = $('input#pickUpPointPostalcode');

/**
 * @private widgetUpdatedCallback
 * @description
 *
 * Callback method which is called right after the PaazlWidget
 * has been updated.
 */
function widgetUpdatedCallback() {
	updateWidgetView();
	initSelectShippingMethod();
    $.spinner().stop();
    observer.disconnect();
}

/**
  * @public updatePaazlWidget
  * @param {string} methodName - The name of the PaazlWidget method
  * @param {event} e - The event
  *
  * On country or postal code change, send the values to the PaazlWidget
  * which in turn will update the delivery and pickup methods
*/
function updatePaazlWidget(methodName, e) {
    var $el = $(e.target);
    $('#tab-panel-pickup').remove();
    if ($el.hasClass('find-pickup-point')) {
        $el = $el.closest('.pick-up-point-content').find('#pickUpPointPostalcode');
    }

    // Stop if the jQuery element does not exist
    if (!$el[0]) {
        return;
    }

    var fieldValue = $el.val();
    
    if (methodName === 'updateConfig' && $el.hasClass('shipping-address-option')) {
        fieldValue = {
            'consigneeCountryCode': $el.data('country-code'),
            'consigneePostalCode': $el.data('postal-code')
        }
    }

    if ($('#pickUpPointPostalcode').is(':visible')) {
        clientSideValidationEMEA.validateZipCode('#pickUpPointPostalcode');
    }

    // Stop if there is no value
    if (!fieldValue || fieldValue.length === 0 || $('#pickUpPointPostalcode').hasClass('is-invalid')) {
        return;
    } else {
        $.spinner().start();
        observer = new MutationObserver(widgetUpdatedCallback);
        observer.observe(document.getElementById('paazl-checkout'), {
            attributes: true,
            childList: true,
            subtree: true
        });

        // Call the method with the value
        PaazlCheckout[methodName](fieldValue);
    }
}

/**
 * @public onUpdateShippingMethods
 *
 * @param {Event} evt - an Ajax Success Event
 * @param {JSON} resp - a JSON object
 */
function onUpdateShippingMethods(evt, resp) {
    if ('paazlWidgetInit' in window && undefined !== (window.paazlWidgetInit) && window.paazlWidgetInit !== null) {
        // SFRA
        if (resp && resp.shipping && resp.shipping.selectedShippingMethod && resp.shipping.selectedShippingMethod.ID === paazlID) {
            var paazlCheckoutOption = selectors.paazlCheckoutOptionPrefix + paazlID;
            var $wrapper = $(paazlCheckoutOption).parent();

            if ($wrapper.find(selectors.paazlWrapper).length === 0) {
                var $nextEl = $wrapper.next();
                if ($nextEl.hasClass(selectors.endlines)) {
                    $nextEl.remove();
                }
                $wrapper.after('<div id="' + selectors.paazlWrapper.substr(1) + '">');
                PaazlCheckout.init(paazlWidgetInit);
            }

            $(selectors.address.country).trigger(events.change);
            $(selectors.address.postalCode).trigger(events.change);
            return;
        }

        // SG
        var paazlWrapper = $(selectors.paazlWrapper);
        if (resp && resp.shipping && resp.shipping.shippingMethodID && resp.shipping.shippingMethodID === paazlID) {
            paazlWrapper.removeClass(selectors.hide);

            if (paazlWrapper.children().length === 0) {
                PaazlCheckout.init(paazlWidgetInit);
            }

            $(selectors.address.country).trigger(events.change);
            $(selectors.address.postalCode).trigger(events.change);
        } else {
            paazlWrapper.addClass(selectors.hide);
        }
    }
}

function updateWidgetView() {
	if ($('.pick-up-point-option.active').length) {
        // Post response of Find a Pick Up Point Button click
        var counter = 0;
        var $tabpickup = $('#tab-panel-pickup');
        var showPickUpPointResult = setInterval(function() {
            counter += 1;
            if ($('.point__label').length > 0) {
                $('#paazl-checkout').removeClass('hide');
                $('.pazzl-no-response').addClass('hide');
                $zipCodeInput.removeClass('is-invalid');
                $zipCodeInput.parents('.form-group').removeClass('error-field');
                $zipCodeInput.parents('.form-group').find('.invalid-feedback').hide();
                $('button#tab-button-pickup')[0].click();
                $('.next-step-button button').removeAttr('data-clicked');
                clearInterval(showPickUpPointResult);
            } else {
                $('.pazzl-no-response').addClass('hide');
                $('#paazl-checkout').addClass('hide');
                if (counter > 8) {
                    if (!$('#pickUpPointPostalcode').hasClass('is-invalid')) {
                    	$('.pazzl-no-response').removeClass('hide');
                    }
                    clearInterval(showPickUpPointResult);
                }
            }
        }, 500);
    }
}

function selectShippingMethod() {
    $('li.options__item, li.pickup-select__item').on('click', function (e) {
        updateSummary();
        e.stopImmediatePropagation();
    });
}

function updateSummary() {
    var paazlShippingOption = window.localStorage['paazl-previous-option'];
    var counter = 0;
    var updateSummaryInterval = setInterval(function () {
        counter += 1;
        if (paazlShippingOption !== window.localStorage['paazl-previous-option']) {
        	var url = $('#paazl-checkout').data('select-shipping-method-url');
        	$('#paazl-checkout').closest('.shipping-method-block').spinner().start();
        	$.ajax({
                url: url,
                type: 'post',
                data: $('form[name$="_shipping"]').serialize(),
                dataType: 'json'
            })
            .done(function (data) {
                if (data.error) {
                    window.location.href = data.redirectUrl;
                } else {
                    $('body').trigger('checkout:updateCheckoutView',
                        {
                            order: data.order,
                            customer: data.customer,
                            options: { keepOpen: true }
                        }
                    );
                }
                $('#paazl-checkout').closest('.shipping-method-block').spinner().stop();
            })
            .fail(function () {
                $('#paazl-checkout').closest('.shipping-method-block').spinner().stop();
            });
            clearInterval(updateSummaryInterval);
        } else {
            if (counter > 20) {
                clearInterval(updateSummaryInterval);
            }
        }
    }, 200);
}

function initSelectShippingMethod() {
    var counter = 0;
    var showPickUpPointResult = setInterval(function () {
        counter += 1;
        if ($('#tab-panel-delivery ul.options__listing').is(':visible') || $('#tab-panel-pickup ul.pickup-select__listing').is(':visible')) {
            selectShippingMethod();
            updateSummary();
            clearInterval(showPickUpPointResult);
        } else {
            if (counter > 40) {
                selectShippingMethod();
                clearInterval(showPickUpPointResult);
            }
        }
    }, 250);
}

/**
  * @public assignListeners
  * @param {string} scope - The form selector
  * Assigns listeners for the PaazlWidget
*/
function assignListeners(scope) {
    scope.on(events.change, selectors.address.country, updatePaazlWidget.bind(null, 'setConsigneeCountryCode'));
    scope.on(events.change, selectors.address.postalCode, updatePaazlWidget.bind(null, 'setConsigneePostalCode'));
    scope.on(events.click, selectors.paazlPickUpPointButton, updatePaazlWidget.bind(null, 'setConsigneePostalCode'));
    scope.on(events.click, selectors.shippingAddressTile, updatePaazlWidget.bind(null, 'updateConfig'));
    // $(selectors.body).on(events.updateShippingMethods, onUpdateShippingMethods);
    $(document).on(events.click, selectors.paazlButtons, function preventSubmit(e) {
        e.preventDefault();
    });
    initSelectShippingMethod();
}

module.exports = {
    assignListeners: assignListeners
};
