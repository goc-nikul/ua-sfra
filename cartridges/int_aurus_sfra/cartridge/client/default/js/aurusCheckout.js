var formHelpers = require('base/checkout/formErrors');
var scrollAnimate = require('base/components/scrollAnimate');

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) { // eslint-disable-line
        position = position || 0; // eslint-disable-line
        return this.indexOf(searchString, position) === position;
    };
}

/* global payLoad:true */

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
        url: 'AurusPay-GetBillerToken',
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
        url: 'AurusPay-GetSession',
        type: 'get',
        data: {
            ccId: ccId
        },
        success: function (data) {
            if (!data.error) {
                var payLoad = JSON.parse(data.session);
                if (payLoad) {
                    $('#frame_carddetails').attr('src', payLoad.SessionResponse.IFrameUrl);
                } else {
                    // Service down, no payLoad. Replace with content if desired
                    $('#frame_carddetails').remove();
                }
            } else {
                window.console.log('Error retrieving Aurus Pay iFrame url and session');
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

            var contactInfoForm = $('#dwfrm_billing .contact-info-block :input').serialize();

            $('body').trigger('checkout:serializeBilling', {
                form: $('#dwfrm_billing .contact-info-block'),
                data: contactInfoForm,
                callback: function (data) {
                    if (data) {
                        contactInfoForm = data;
                    }
                }
            });

            var activeTabId = $('.tab-pane.active').attr('id');

            var paymentInfoSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields :input';
            var paymentInfoForm = $(paymentInfoSelector).serialize();
            paymentInfoForm = paymentInfoForm + '&' + maskedCardNum + expiryDate + resCode + resText + ott;

            var paymentForm = shippingFormData + '&' + billingAddressForm + '&' + contactInfoForm + '&' + paymentInfoForm;

            // disable the next:Place Order button here
            $('body').trigger('checkout:disableButton', '.next-step-button button');
            var defer = $.Deferred();// eslint-disable-line
            // Ajax call to server side
            $.ajax({
                url: $('#dwfrm_billing').attr('action'),
                method: 'POST',
                data: paymentForm,
                success: function (data) {
                    // enable the next:Place Order button here
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
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
                        $('body').trigger('checkout:updateCheckoutView',
                            { order: data.order, customer: data.customer });

                        if (data.renderedPaymentInstruments) {
                            $('.stored-payments').empty().html(
                                data.renderedPaymentInstruments
                            );
                        }

                        if (data.customer.registeredUser
                            && data.customer.customerPaymentInstruments.length
                        ) {
                            $('.cancel-new-payment').removeClass('checkout-hidden');
                        }
                        scrollAnimate();
                        defer.resolve(data);
                    }
                },
                error: function (err) {
                    // enable the next:Place Order button here
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                    if (err.responseJSON && err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                }
            });
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
    } else if (data.startsWith('response')) {
        splt = data.split('=');
        json = JSON.parse(splt[1]);
        responseHandler(json);
    } else if (data.startsWith('enablePlaceOrder')) {
        splt = data.split('=');
        json = JSON.parse(splt[1]);
    } else if (data) {
        // console.log('data: ' + data);
    }
});


module.exports = {
    methods: {
        getCardToken: getCardToken,
        getAurusSession: getAurusSession,
        getAurusPayPalSession: getAurusPayPalSession,
        getAurusGooglePaySession: getAurusGooglePaySession,
        getBillerToken: getBillerToken,
        getGooglePaySessionToken: getGooglePaySessionToken
    }
};
