'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var atomeApis = require('~/cartridge/scripts/service/atomeApis');

var page = module.superModule;
server.extend(page);

/**
 *  Handle Ajax payment (and billing) form submit
 */
server.prepend('SubmitPayment', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var paymentForm = server.forms.getForm('billing');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

    // removes all previous payment methods before creating new one
    var Transaction = require('dw/system/Transaction');
    var paymentInstruments = currentBasket.getPaymentInstruments();
    var iterator = paymentInstruments.iterator();
    var paymentInstrument = null;
    Transaction.wrap(function () {
        while (iterator.hasNext()) {
            paymentInstrument = iterator.next();
            currentBasket.removePaymentInstrument(paymentInstrument);
        }
    });
    var paymentMethodIdValue = paymentForm.paymentMethod.value;
    if (paymentMethodIdValue !== 'ATOME_PAYMENT') {
        next();
        return;
    }

    var data = res.getViewData();
    if (data && data.csrfError) {
        res.json();
        this.emit('route:Complete', req, res);
        return;
    }

    var HookMgr = require('dw/system/HookMgr');
    var Resource = require('dw/web/Resource');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var URLUtils = require('dw/web/URLUtils');


    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        this.emit('route:Complete', req, res);
        return;
    }

    var billingForm = server.forms.getForm('billing');
    var viewData = {};

    billingForm.paymentMethod.value = paymentMethodIdValue;
    viewData.paymentMethod = {
        value: paymentMethodIdValue,
        htmlName: billingForm.paymentMethod.htmlName
    };

    var billingFormErrors = COHelpers.validateBillingForm(billingForm.addressFields);

    if (Object.keys(billingFormErrors).length) {
        res.json({
            form: billingForm,
            fieldErrors: [billingFormErrors],
            serverErrors: [],
            error: true,
            paymentMethod: viewData.paymentMethod
        });
        this.emit('route:Complete', req, res);
        return;
    }

    viewData.address = {
        firstName: { value: billingForm.addressFields.firstName.value },
        lastName: { value: billingForm.addressFields.lastName.value },
        address1: { value: billingForm.addressFields.address1.value },
        address2: { value: billingForm.addressFields.address2.value },
        city: { value: billingForm.addressFields.city.value },
        postalCode: { value: billingForm.addressFields.postalCode.value },
        countryCode: { value: billingForm.addressFields.country.value }
    };

    if (Object.prototype.hasOwnProperty.call(billingForm.addressFields, 'states')) {
        viewData.address.stateCode = {
            value: billingForm.addressFields.states.stateCode.value
        };
    }

    var email = billingForm.contactInfoFields.email.value;
    viewData.email = {
        value: email
    };

    res.setViewData(viewData);

    var billingAddress = currentBasket.billingAddress;
    Transaction.wrap(function () {
        if (!billingAddress) {
            billingAddress = currentBasket.createBillingAddress();
        }

        billingAddress.setFirstName(billingForm.addressFields.firstName.value);
        billingAddress.setLastName(billingForm.addressFields.lastName.value);
        billingAddress.setAddress1(billingForm.addressFields.address1.value);
        billingAddress.setAddress2(billingForm.addressFields.address2.value);
        billingAddress.setCity(billingForm.addressFields.city.value);
        billingAddress.setPostalCode(billingForm.addressFields.postalCode.value);
        billingAddress.setCountryCode(billingForm.addressFields.country.value);
        if (Object.prototype.hasOwnProperty.call(billingForm.addressFields, 'states')) {
            billingAddress.setStateCode(billingForm.addressFields.states.stateCode.value);
        }
        currentBasket.setCustomerEmail(email);
    });

    Transaction.wrap(function () {
        HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
    });

    var processor = PaymentMgr.getPaymentMethod(paymentMethodIdValue).getPaymentProcessor();
    if (!processor) {
        throw new Error(Resource.msg('error.payment.processor.missing', 'checkout', null));
    }

    var processorResult = null;
    if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
        processorResult = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(), 'Handle', currentBasket);
    } else {
        throw new Error('hooks/payment/processor/atome_payment.js file is missing or "app.payment.processor.atome_payment" hook is wrong setted');
    }

    if (processorResult.error) {
        res.json({
            form: billingForm,
            fieldErrors: [],
            serverErrors: [],
            error: true
        });
        this.emit('route:Complete', req, res);
        return;
    }

    var usingMultiShipping = false; // Current integration support only single shpping
    req.session.privacyCache.set('usingMultiShipping', usingMultiShipping);

    var currentLocale = Locale.getLocale(req.locale.id);
    var basketModel = new OrderModel(currentBasket, { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' });
    var accountModel = new AccountModel(req.currentCustomer);

    res.json({
        renderedPaymentInstruments: COHelpers.getRenderedPaymentInstruments(req, accountModel),
        customer: accountModel,
        order: basketModel,
        form: billingForm,
        error: false
    });
    this.emit('route:Complete', req, res);
});

/**
 *  Handle Ajax for Place order
 */
server.prepend('PlaceOrder', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    if (req.session.privacyCache.get('fraudDetectionStatus')) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        return next();
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        return next();
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        return next();
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-validates existing payment instruments
    var validPayment = COHelpers.validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument'
            },
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        });
        return next();
    }

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // Handles payment authorization
    var atomeConfigs = require('*/cartridge/scripts/service/atomeConfigurations');
    if (atomeConfigs.isAtomeEnabled && currentBasket.getPaymentInstruments('ATOME_PAYMENT').length > 0) {
        var logger = dw.system.Logger.getLogger('AtomeService');
        // Creates a new order.
        var order = COHelpers.createOrder(currentBasket);
        if (!order) {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }
        var paymentAPIResult = atomeApis.createNewPayment(order);
        if (paymentAPIResult.status === 'OK') {
            var paymentAPIResultObj = JSON.parse(paymentAPIResult.object);
            if (paymentAPIResultObj.status === 'PROCESSING' && paymentAPIResultObj.redirectUrl != null) {
                req.session.privacyCache.set('orderID', paymentAPIResultObj.referenceId);
                req.session.privacyCache.set('orderToken', order.getOrderToken());
                res.json({
                    error: false,
                    cartError: false,
                    continueUrl: paymentAPIResultObj.redirectUrl
                });
                this.emit('route:Complete', req, res);
                return true;
            }
        } else if (paymentAPIResult && paymentAPIResult.errorMessage) {
            if ('status' in paymentAPIResult && paymentAPIResult.getStatus().equals('SERVICE_UNAVAILABLE')) {
                logger.error('Error in Create Atome Payment request ( {0} )', 'service unavailable');
                res.json({
                    error: true,
                    errorMessage: Resource.msg('atome.service.unavailable', 'atome', null)
                });
            } else {
                var errorMessageObj = JSON.parse(paymentAPIResult.errorMessage);
                res.json({
                    error: true,
                    errorMessage: errorMessageObj.message
                });
            }

            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
            this.emit('route:Complete', req, res);
            return true;
        }
    }
    return next();
});

module.exports = server.exports();
