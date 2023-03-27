var paymentsClient = null;
/* eslint-disable no-undef */
/* needed by GooglePay */
window.getGoogleIsReadyToPayRequest = function () {
    return Object.assign(
    {},

    baseRequest,
        {
            allowedPaymentMethods: [baseCardPaymentMethod]
        });
};

window.getGooglePaymentDataRequest = function () {
    /* eslint-disable no-undef */
    var paymentDataRequest = Object.assign({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = ['CARD', 'TOKENIZED_CARD'];
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    paymentDataRequest.merchantInfo = {
        // merchantId: '01234567890123456789',
        merchantName: 'Example Merchant'
    };
    emailRequired = true;
    return paymentDataRequest;
};

window.getGooglePaymentsClient = function () {
    if (paymentsClient === null) {
        paymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });
    }
    return paymentsClient;
};

window.onGooglePayLoaded = function () {
    /* eslint-disable no-shadow */
    /* needed by GooglePay */
    var paymentsClient = getGooglePaymentsClient();
    /* eslint-enable no-shadow */
    paymentsClient.isReadyToPay(getGoogleIsReadyToPayRequest())
    .then(function (response) {
        if (response.result) {
            addGooglePayButton();
        }
    })
    .catch(function () {
        // show error in developer console for debugging
        // console.error(err);
    });
};

window.addGooglePayButton = function () {
    /* eslint-disable no-shadow */
    var paymentsClient = getGooglePaymentsClient();
    /* eslint-enable no-shadow */
    var button = paymentsClient.createButton({ onClick: onGooglePaymentButtonClicked });
    document.getElementById('container').appendChild(button);
};

window.getGoogleTransactionInfo = function () {
    return {
        countryCode: 'US',
        currencyCode: 'USD',
        totalPriceStatus: 'FINAL',
        // set to cart total
        totalPrice: orderTotal
    };
};

window.prefetchGooglePaymentData = function () {
    var paymentDataRequest = getGooglePaymentDataRequest();
    // transactionInfo must be set but does not affect cache
    paymentDataRequest.transactionInfo = {
        totalPriceStatus: 'NOT_CURRENTLY_KNOWN',
        currencyCode: currencyCode
    };
    /* eslint-disable no-shadow */
    var paymentsClient = getGooglePaymentsClient();
    paymentsClient.prefetchPaymentData(paymentDataRequest);
    /* eslint-enable no-shadow */
};

/**
* Show Google Pay payment sheet when Google Pay payment button is clicked
*/
window.onGooglePaymentButtonClicked = function () {
    var paymentDataRequest = getGooglePaymentDataRequest();
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo();
    /* eslint-disable no-shadow */
    var paymentsClient = getGooglePaymentsClient();
    paymentsClient.loadPaymentData(paymentDataRequest)
    .then(function (paymentData) {
        // handle the response
        processPayment(paymentData);
    })
    .catch(function () {
        // show error in developer console for debugging
        // console.error(err);
    });
    /* eslint-enable no-shadow */
};

window.processPayment = function (paymentData) {
    // show returned data in developer console for debugging
    paymentToken = paymentData.paymentMethodData.tokenizationData.token;
    billingInfo = paymentData.paymentMethodData.info;
    billingAddress = paymentData.paymentMethodData.info.billingAddress;
    /* eslint-disable no-unused-vars */
    /* needed by GooglePay */
    var contactInfo = $('#dwfrm_billing .contact-info-block :input').serialize();
    var contactEmail = $('#dwfrm_billing .contact-info-block #email').val();
    /* eslint-enable no-unused-vars */
    return $.ajax({
        url: 'AurusPay-ReturnFromGooglePay',
        type: 'GET',
        data: {
            emailAddress: contactEmail,
            paymentData: paymentData
        },
        // data: paymentData,
        success: function (data) {
            if (!data.error) {
                document.location = 'Checkout-Begin?stage=placeOrder';
            } else {
                window.console.log('Error retrieving data');
            }
        }
    });
};
/* eslint-enable no-undef */
