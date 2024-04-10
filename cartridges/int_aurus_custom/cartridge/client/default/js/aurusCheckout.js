var formHelpers = require('org/checkout/formErrors');
var scrollAnimate = require('org/components/scrollAnimate');
var isAurusEnabled = $('.payment-information').attr('data-isaurusenabled') === 'true';
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) { // eslint-disable-line
        position = position || 0; // eslint-disable-line
        return this.indexOf(searchString, position) === position;
    };
}

/* global payLoad:true */

/**
* Ajax call to get Aurus Alt payments consumer object
* @param {string} sessionID Session ID
* @param {boolean} orderNoNeeded orderNoNeeded

*/
function getAltPaymentsConsumerObject(sessionID, orderNoNeeded) {
    var email = $('input[name="dwfrm_billing_contactInfoFields_email"]').val();
    var phone = $('input[name="dwfrm_billing_contactInfoFields_phone"]').val();
    var url = $('.payment-information').attr('data-get-consumerobj-url');
    $.ajax({
        url: url,
        type: 'GET',
        data: {
            sessionID: sessionID,
            email: email,
            phone: phone,
            orderNoNeeded: orderNoNeeded
        },
        success: function (data) {
            if (!data.error) {
                /* needed by Aurus */
                var payLoad = data.consumerObject;
                /* eslint-disable no-undef */
                if (window.Aurus) {
                    window.Aurus.aurusInit(payLoad, $);
                }
                var paymentMethodID = $('.payment-information').attr('data-payment-method-id');
                var currentStage = $('.data-checkout-stage').attr('data-checkout-stage');
                if (paymentMethodID === 'AURUS_OXXO' && currentStage === 'placeOrder') {
                     /* eslint-disable no-undef */
                       /* eslint-disable no-underscore-dangle*/
                    Aurus._setWalletID = 23;
                    Aurus._oxxoPayCheckoutData = Aurus.getCustInfoForOxxo(payLoad);
                    var a = Aurus.getHostRequestJSON(Aurus.buildOxxoSessionTokenRequestJson());
                    Aurus.getSessionTokenPrimary(a, Aurus.oxxoSessionTokenResponseHandler);
                } else if (paymentMethodID === 'AURUS_SAFETYPAY' && currentStage === 'placeOrder') {
                    /* eslint-disable no-undef */
                    /* eslint-disable no-underscore-dangle*/
                    Aurus._setWalletID = '24';
                    Aurus._setInvoiceNumber = payLoad.order.invoiceNumber;
                      /* eslint-disable-line no-unused-expressions*/
                    if (payLoad.order.purchaseCountry === 'MX') {
                        payLoad.order.purchaseCountry = 'MEX';
                    }
                    Aurus._safetyPayCheckoutData = Aurus.getCustInfoForSafetyPay(payLoad);
                    var b = Aurus.getHostRequestJSON(Aurus.buildSafetyPaySessionTokenRequestJson());
                    Aurus.getSessionTokenPrimary(b, Aurus.safetyPaySessionTokenResponseHandler);
                }
                /* eslint-disable no-undef */
            } else {
                window.console.log('Error retrieving Aurus Pay iFrame url and session');
            }
        }
    });
}

/**
* Ajax call to get Aurus Alt payments Session
* @param {string} scope to fetch only session ID
* @returns {string} payLoad
* @param {boolean} orderNoNeeded orderNoNeeded
*/
function getAurusAltPaymentSession(scope, orderNoNeeded) {
    var url = $('.b-payment-tab_content').attr('data-get-session-url');
    return $.ajax({
        url: url,
        type: 'GET',
        data: {
            paypal: 'true'
        },
        success: function (data) {
            if (!data.error) {
                /* eslint-disable no-unused-vars */
                /* needed by Aurus */
                var sessionID = data.session;
                if (scope === 'sessionOnly') {
                    $('input[name="dwfrm_klarna_AuruspayKlarnaSessionID"]').val(sessionID);
                    $('#auruspayoxxoSessionID').val(sessionID);
                    $('#aurusSafetyPaySessionID').val(sessionID);
                } else {
                    getAltPaymentsConsumerObject(sessionID, orderNoNeeded);
                }
                /* eslint-enable no-unused-vars */
            } else {
                // return data error, don't log it
                window.console.log('Error retrieving Aurus Pay iFrame url and session');
            }
        }
    });
}


/**
* Ajax call to get Aurus PayPal Session
* @returns {string} payLoad
*/
function getAurusPayPalSession() {
    return $.ajax({
        url: 'AurusPay-GetPayPalSession',
        type: 'GET',
        data: {
            paypal: 'true'
        },
        success: function (data) {
            if (!data.error) {
                /* eslint-disable no-unused-vars */
                /* needed by Aurus */
                var payLoad = JSON.parse(data.session);
                /* eslint-enable no-unused-vars */
            } else {
                // return data error, don't log it
                window.console.log('Error retrieving Aurus Pay iFrame url and session');
            }
        }
    });
}

/**
* Ajax call to get Aurus GooglePay Session
* @returns {string} payLoad
*/
function getAurusGooglePaySession() {
    return $.ajax({
        url: 'AurusPay-GetGooglePaySession',
        type: 'GET',
        data: {
            googlepay: 'true'
        },
        success: function (data) {
            if (!data.error) {
                /* eslint-disable no-unused-vars */
                /* needed by Aurus */
                var payLoad = JSON.parse(data.session);
                /* eslint-enable no-unused-vars */
            } else {
                window.console.log('Error retrieving Aurus Pay iFrame url and session');
            }
        }
    });
}
/**
* Ajax call to get Aurus GooglePay Session Token
*/
function getGooglePaySessionToken() {
    $.ajax({
        url: 'AurusPay-GetGooglePaySessionToken',
        type: 'get',
        success: function (data) {
            if (!data.error) {
                payLoad = JSON.parse(data.session);
            } else {
                window.console.log('Error retrieving Aurus Pay iFrame url and session');
            }
        }
    });
}
/**
* Ajax call to get Aurus Get Biller Token
*/
function getBillerToken() {
    $.ajax({
        url: $('.payment-options .nav-item.paypal-tab').attr('data-get-session-url'),
        type: 'get',
        success: function (data) {
            if (!data.error) {
                // Aurus Biller Token Response
                var res = JSON.parse(data.session);
                var billerToken = res.GetBillerTokenResponse.WalletObject.token_id;
                var buttonLabel = 'checkout';
                var isProd = false;

                var paypalClient = $('#paypalBtn').attr('data-paypalNo');
                /* global paypal */
                // 'paypal' is defined in the paypal javascript
                paypal.Button.render({
                    env: isProd ? 'production' : 'sandbox',
                    client: {
                        sandbox: paypalClient,
                        production: paypalClient
                    },
                    style: {
                        label: buttonLabel,
                        size: 'responsive',
                        color: 'silver',
                        shape: 'rect',
                        tagline: false
                    },
                    commit: true,
                    funding: {
                        allowed: [],
                        disallowed: [paypal.FUNDING.CREDIT]
                    },
                    payment: function () {
                        return billerToken;
                    },
                    onAuthorize: function (actions) {
                        return actions.redirect();
                    },
                    onCancel: function (actions) {
                        return actions.redirect();
                    },
                    onError: function (err) {
                        window.console.log(err);
                    }
                }, '#paypal-button-container');
                /* eslint-enable */
            } else {
                window.console.log('Error retrieving Aurus Pay PayPal token');
            }
        }
    });
}

/**
* Ajax call to get iframe url and attach to existing element
* @param {string} storedPaymentId uuid and internal id for payment instrument
*/
function getAurusSession(storedPaymentId) {
    var ccId = '';
    if (storedPaymentId !== undefined) {
        ccId = storedPaymentId.length > 0 ? storedPaymentId : '';
    }
    $.ajax({
        url: $('.payment-information').attr('data-getSession-url'),
        type: 'get',
        data: {
            ccId: ccId
        },
        success: function (data) {
            if (data.session) {
                var payLoad = JSON.parse(data.session);
                if (payLoad) {
                    $('#frame_carddetails').attr('src', payLoad.SessionResponse.IFrameUrl);
                } else {
                    // Service down, no payLoad. Replace with content if desired
                    $('#frame_carddetails').remove();
                }
            } else {
                console.log('Unable to create a new Aurus session');
            }
        }
    });
}

/**
* Merchant needs to get this URL by doing substring of Aurus Iframe Url received in Session API.
* URL example: var aurusURL = 'https://uat48.auruspay.com';
* @returns {string} Aurus iframe Origin
*/
function getIframeUrl() {
    var aurusURL;
    if ($('#frame_carddetails').length) {
        var aurusLongURL = $('#frame_carddetails').attr('src');
        aurusURL = 'https://' + aurusLongURL.split('/')[2];
    }
    return aurusURL;
}

/**
* This function initiates Ajax call within the Aurus iframe to retrieve the one time token (OTT)
* This method needs to be called onSubmit button click present on Merchant's page.
*/
function getCardToken() {
    var aurusURL = getIframeUrl();
    var frame = document.getElementById('frame_carddetails');
    frame.contentWindow.postMessage('aurus-token', aurusURL);
}

/**
* This function initiates Ajax call within the Aurus iframe to retrieve the one time token (OTT)
* This method needs to be called onSubmit button click present on Merchant's page.
* @param {JSON} JSONdata the response data from the OTT request within the iFrame
*/
function responseHandler(JSONdata) {
    try {
        var $msg = $('#token-error');
        // Handle the Error Response here
        if (Number(JSONdata.response_code) > 0) {
            $msg.text('ERROR: ' + JSONdata.response_code + ' - ' + JSONdata.response_text);
            $('#buttonSubmit').prop('disabled', false);
        } else { // Handle the success response here like below:
            $msg.text('SUCCESS');

            $('#cardType').val(JSONdata.card_type);
            var maskedCardNum = 'dwfrm_billing_creditCardFields_cardNumber=' + JSONdata.masked_card_num + '&';
            var expiryDate = 'dwfrm_billing_creditCardFields_expirationDate=' + JSONdata.card_expiry_date + '&';
            var expiryMonth = 'dwfrm_billing_creditCardFields_expirationMonth=' + JSONdata.card_expiry_date.slice(0, 2) + '&';
            var expiryYear = 'dwfrm_billing_creditCardFields_expirationYear=' + JSONdata.card_expiry_date.slice(2, 4) + '&';
            var resCode = 'dwfrm_billing_creditCardFields_responseCode=' + JSONdata.response_code + '&';
            var resText = 'dwfrm_billing_creditCardFields_responseText=' + JSONdata.response_text + '&';
            var ott = 'dwfrm_billing_creditCardFields_ott=' + JSONdata.one_time_token;

            formHelpers.clearPreviousErrors('.payment-form');

            var shippingFormData = $('.single-shipping .shipping-form').serialize();

            $('body').trigger('checkout:serializeShipping', {
                form: $('.single-shipping .shipping-form'),
                data: shippingFormData,
                callback: function (data) {
                    shippingFormData = data;
                }
            });

            var billingAddressForm = $('#dwfrm_billing .billing-address-block :input').serialize();

            $('body').trigger('checkout:serializeBilling', {
                form: $('#dwfrm_billing .billing-address-block'),
                data: billingAddressForm,
                callback: function (data) {
                    if (data) {
                        billingAddressForm = data;
                    }
                }
            });

            var activeTabId = $('.tab-pane.active').attr('id');

            var paymentInfoSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields :input';
            var paymentInfoForm = $(paymentInfoSelector).serialize();
            paymentInfoForm = paymentInfoForm + '&' + maskedCardNum + expiryDate + expiryMonth + expiryYear + resCode + resText + ott;
            var sameAsShipping = $('.make-ship-as-bill :input');
            var sameAsShippingForm = $(sameAsShipping).serialize();

            var paymentForm = billingAddressForm + '&' + sameAsShippingForm + '&' + paymentInfoForm;

            // disable the next:Place Order button here
            $('body').trigger('checkout:disableButton', '.next-step-button button');
            var defer = $.Deferred();// eslint-disable-line

            var $formBilling = $('form[name=dwfrm_billing]');
            var fiscalInvoice = $('#taxBillingInfo').is(':checked');
            var $rfcWrapper = $('#rfc-cfdi-details');
            $('.rfc-details, .cfdi-details, #rfc-cfdi-details').addClass('hide');
            if (fiscalInvoice) {
                $('#rfc-cfdi-details, .rfc-details').removeClass('hide');
                $rfcWrapper.find('.rfc-value').text($('input[name$=_rfc]').val());
                $rfcWrapper.find('.razonsocial-value').text($('input[name$=_razonsocial]').val());
                $('#rfc-cfdi-details, .cfdi-details').removeClass('hide');
                $rfcWrapper.find('.usoCFDI-value').text($('select[name$=_usoCFDI] option:selected').text());
                $rfcWrapper.find('.regimenFiscal-value').text($('select[name$=_regimenFiscal] option:selected').text());
                $rfcWrapper.find('.codigoPostal-value').text($('input[name$=_codigoPostal]').val());
            }
            var billingUrl = $('#dwfrm_billing').attr('action');
            var addressID = $formBilling.attr('data-addr-id');
            if ($formBilling.attr('data-address-mode') === 'details') {
                billingUrl = billingUrl + '?addressID=' + addressID;
            }
            if ($formBilling.attr('data-address-mode') !== 'details') {
                billingUrl += '?fiscalInvoice=' + fiscalInvoice;
            } else {
                billingUrl += '&fiscalInvoice=' + fiscalInvoice;
            }
            if (!$formBilling.find('input.is-invalid').length && !$formBilling.find('select.is-invalid').length) {
                // Ajax call to server side
                $.ajax({
                    url: billingUrl,
                    method: 'POST',
                    data: paymentForm,
                    success: function (data) {
                        // enable the next:Place Order button here
                        $('body').trigger('checkout:enableButton', '.next-step-button button');
                        getAurusSession('newCard');
                        // look for field validation errors
                        if (data.error) {
                            if (data.fieldErrors.length) {
                                data.fieldErrors.forEach(function (error) {
                                    if (Object.keys(error).length) {
                                        formHelpers.loadFormErrors('.payment-form', error);
                                    }
                                });
                            }

                            if (data.serverErrors.length) {
                                data.serverErrors.forEach(function (error) {
                                    $('.error-message').show();
                                    $('.error-message-text').text(error);
                                    scrollAnimate($('.error-message'));
                                });
                            }

                            if (data.cartError) {
                                window.location.href = data.redirectUrl;
                            }

                            defer.reject();
                        } else {
                            //
                            // Populate the Address Summary
                            //
                            $('body').trigger('checkout:updateCheckoutView', {
                                order: data.order,
                                customer: data.customer
                            });

                            if (data.renderedPaymentInstruments) {
                                $('.stored-payments').empty().html(
                                    data.renderedPaymentInstruments
                                );
                            }
                            if (data.order && data.order.billing && data.order.billing.payment && data.order.billing.payment.selectedPaymentInstruments.length > 0) {
                                var paymentMethod = data.order.billing.payment.selectedPaymentInstruments[0].paymentMethod;
                                $('.payment-paypal').removeAttr('id').attr('id', paymentMethod);
                            }
                            $('select.billingCountry').removeAttr('name').attr('name', 'dwfrm_billing_addressFields_country');
                            if (data.customer.registeredUser &&
                                data.customer.customerPaymentInstruments.length
                            ) {
                                $('.cancel-new-payment').removeClass('checkout-hidden');
                            }

                            if ($('.js-employee-terms-conditions').length > 0) {
                                setTimeout(function () {
                                    if ($('.js-employee-terms-conditions').is(':checked')) {
                                        $('.place-order').removeAttr('disabled');
                                    } else {
                                        $('.place-order').attr('disabled', 'disabled');
                                    }
                                }, 300);
                            }

                            if ($('.js-vip-click').length > 0) {
                                setTimeout(function () {
                                    if ($('.js-vip-click').is(':checked')) {
                                        $('.place-order').removeAttr('disabled');
                                        $('.klarna-place-order').removeAttr('disabled');
                                    } else {
                                        $('.place-order').attr('disabled', 'disabled');
                                        $('.klarna-place-order').attr('disabled', 'disabled');
                                    }
                                }, 300);
                            }

                            var isShipToCollectionEnabled = $('#ship-to-collectionPoint').is(':checked'); // eslint-disable-line
                            if (isShipToCollectionEnabled) {
                                $('.contact-info-block').find('.js-contact_collectionPoint').removeClass('hide');
                                var getStateCode = $('#dwfrm_billing').find('select[name$="_states_stateCode"]').val();
                                $('body').find('#getStateCode').val(getStateCode);
                            } else if (data.order.hasBopisItems) {
                                $('.contact-info-block').find('.js-contact_collectionPoint').removeClass('hide');
                                $('.contact-info-block').find('.js-orderinfo-update').addClass('hide');
                            } else {
                                $('.contact-info-block').find('.js-contact_collectionPoint').addClass('hide');
                            }
                            if ((isAurusEnabled) && data.paymentMethod.value === 'AURUS_CREDIT_CARD') {
                                $('.next-step-button .place-order').addClass('g-button_tertiary');
                                $('.next-step-button .place-order').removeClass('g-button_primary--black');
                                $('.next-step-button .place-order').text($('.place-order').attr('data-placeorder'));
                            }

                            setTimeout(function () {
                                scrollAnimate($('.js-contact-info'));
                            }, 300);

                            if ($('.b-checkout_nextStep .submit-payment').is(':visible')) {
                                $('body').trigger('checkout:goToStage', { stage: 'placeOrder' });
                                defer.resolve(data);
                            } else {
                                defer.reject();
                            }
                        }
                    },
                    error: function (err) {
                        // enable the next:Place Order button here
                        $('body').trigger('checkout:enableButton', '.next-step-button button');
                        var error = err.responseJSON.message;
                        if (error) {
                            $('.error-message').show();
                            $('.error-message-text').text(error);
                            scrollAnimate($('.error-message'));
                        }
                        if (err.responseJSON && err.responseJSON.redirectUrl) {
                            window.location.href = err.responseJSON.redirectUrl;
                        }
                    }
                });
            }
        }
    } catch (error) {
        window.console.log('ERROR: ' + error);
    }
}

// This will get triggered when Aurus will post the OTT response on Merchant's page
window.addEventListener('message', function (event) {
    var aurusURL = getIframeUrl();
    var data = event.data;
    var splt;
    var json;

    if (event.origin !== aurusURL) {
        return;
    } else if (data.startsWith('enablePlaceOrder')) {
        splt = data.split('=');
        json = JSON.parse(splt[1]);
    } else if (data.startsWith('response')) {
        splt = data.split('=');
        json = JSON.parse(splt[1]);
        responseHandler(json);
    } else if (data) {
        if ($('.next-step-button button.submit-payment').attr('data-clicked') === 'true') {
            $('.next-step-button button').attr('data-clicked', 'false');
            scrollAnimate($('#frame_carddetails'));
        }
        // console.log('data: ' + data);
    }
});

/**
* Ajax call to get Aurus Alt payments consumer object For Express PayPal
* @param {string} sessionID Session ID
* @param {boolean} orderNoNeeded orderNoNeeded
*/
function getAltPaymentsConsumerObjectForExpressPayPal(sessionID, orderNoNeeded) {
    var email = $('input[name="dwfrm_billing_contactInfoFields_email"]').val();
    var phone = $('input[name="dwfrm_billing_contactInfoFields_phone"]').val();
    var url = $('.paypal-container').attr('data-get-consumerobj-url');
    $.ajax({
        url: url,
        type: 'GET',
        data: {
            sessionID: sessionID,
            email: email,
            phone: phone,
            orderNoNeeded: orderNoNeeded
        },
        success: function (data) {
            if (!data.error) {
                /* needed by Aurus */
                var payLoad = data.consumerObject;
                /* eslint-disable no-undef */
                if (window.Aurus) {
                    window.Aurus.aurusInit(payLoad, $);
                }
                var paymentMethodID = $('.payment-information').attr('data-payment-method-id');
                var currentStage = $('.data-checkout-stage').attr('data-checkout-stage');
                if (paymentMethodID === 'AURUS_OXXO' && currentStage === 'placeOrder') {
                     /* eslint-disable no-undef */
                       /* eslint-disable no-underscore-dangle*/
                    Aurus._setWalletID = 23;
                    Aurus._oxxoPayCheckoutData = Aurus.getCustInfoForOxxo(payLoad);
                    var a = Aurus.getHostRequestJSON(Aurus.buildOxxoSessionTokenRequestJson());
                    Aurus.getSessionTokenPrimary(a, Aurus.oxxoSessionTokenResponseHandler);
                }
                /* eslint-disable no-undef */
            } else {
                window.console.log('Error retrieving Aurus Pay iFrame url and session');
            }
        }
    });
}
/**
* Ajax call to get Aurus Alt payments Session For Express PayPal
* @param {string} scope to fetch only session ID
* @returns {string} payLoad
* @param {boolean} orderNoNeeded orderNoNeeded
*/
function getAurusAltPaymentSessionForExpressPayPal(scope, orderNoNeeded) {
    var url = $('.paypal-container').attr('data-get-session-url');
    return $.ajax({
        url: url,
        type: 'GET',
        data: {
            paypal: 'true'
        },
        success: function (data) {
            if (!data.error) {
                /* eslint-disable no-unused-vars */
                /* needed by Aurus */
                var sessionID = data.session;
                if (scope === 'sessionOnly') {
                    $('input[name="dwfrm_klarna_AuruspayKlarnaSessionID"]').val(sessionID);
                    $('#auruspayoxxoSessionID').val(sessionID);
                } else {
                    getAltPaymentsConsumerObjectForExpressPayPal(sessionID, orderNoNeeded);
                }
                /* eslint-enable no-unused-vars */
            } else {
                // return data error, don't log it
                window.console.log('Error retrieving Aurus Pay iFrame url and session');
            }
        }
    });
}

module.exports = {
    methods: {
        getCardToken: getCardToken,
        getAurusSession: getAurusSession,
        getAurusAltPaymentSession: getAurusAltPaymentSession,
        getAurusPayPalSession: getAurusPayPalSession,
        getAurusGooglePaySession: getAurusGooglePaySession,
        getBillerToken: getBillerToken,
        getGooglePaySessionToken: getGooglePaySessionToken,
        getAltPaymentsConsumerObject: getAltPaymentsConsumerObject,
        getAurusAltPaymentSessionForExpressPayPal: getAurusAltPaymentSessionForExpressPayPal,
        getAltPaymentsConsumerObjectForExpressPayPal: getAltPaymentsConsumerObjectForExpressPayPal
    }
};
