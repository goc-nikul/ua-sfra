/* eslint-disable block-scoped-var */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable no-underscore-dangle */
'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
server.extend(module.superModule);

server.replace('PlaceOrder', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var orderInfoLogger = require('dw/system/Logger').getLogger('orderInfo', 'orderInfo');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var availabilityHelper = require('*/cartridge/scripts/helpers/availabilityHelpers');
    var CartModel = require('*/cartridge/models/cart');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var HookMgr = require('dw/system/HookMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var cartModel = new CartModel(currentBasket);
    var validatedProducts = validationHelpers.validateProductsInventory(currentBasket, 'PlaceOrder');
    var currentLocale = Locale.getLocale(req.locale.id);
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');

    // This below code verifies the inventory limit exceeded and realTime inventory check
    if (validatedProducts.availabilityError) {
        var inValidItems = availabilityHelper.getInvalidItems(cartModel, validatedProducts);
        // remove or update quantity of the unavailable items from the Basket
        availabilityHelper.updateItemsAvailability(currentBasket, validatedProducts);
        // Calculate the basket
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );
        var productQuantityTotal = basketModel.productQuantityTotal ? basketModel.productQuantityTotal : 0;
        inValidItems.productQuantityTotal = productQuantityTotal;
        var renderedTemplate = availabilityHelper.getAvailabilityRenderTemplate(inValidItems);

        res.json({
            order: basketModel,
            availabilityError: true,
            isEmptyBasket: productQuantityTotal === 0,
            renderedTemplate: renderedTemplate
        });
        return next();
    }

    /* Contact Info Field validation and save in basket
    * Read the Billing Form, Set the Email address and Phone in the basket before creating the Order
    * The contact information moved to Step-3 and this info will be saved once user clicks on Place Order Button.
    */
    var paymentForm = server.forms.getForm('billing');
    var contactInfoFormErrors = COHelpers.validateFields(paymentForm.contactInfoFields);
    var billingAddress = currentBasket.billingAddress;
    var formFieldErrors = [];

    if (Object.keys(contactInfoFormErrors).length) {
        formFieldErrors.push(contactInfoFormErrors);
    }
    if (formFieldErrors.length) {
        // respond with form data and errors
        res.json({
            form: paymentForm,
            fieldErrors: formFieldErrors,
            serverErrors: [],
            error: true
        });
        return next();
    }

    var phoneNumberRequired = COHelpers.isPhoneNumberMandatory();
    var phoneNumber = paymentForm.contactInfoFields.phone.value;
    var updatedPhone = phoneNumber ? phoneNumber.split(' ').join('').replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-') : phoneNumber;
    paymentForm.contactInfoFields.phone.value = updatedPhone;
    if (phoneNumberRequired) {
        if (phoneNumber) {
            var regexp = '^[0-9]{10}$';
            var regExpression = new RegExp(regexp);
            var isvalid = regExpression.test(updatedPhone);
            if (!isvalid) {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.message.phonenumber.invalid', 'forms', null)
                });
                return next();
            }
        } else {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.message.required', 'forms', null)
            });
            return next();
        }
    }
    var viewD = res.getViewData();
    if (!empty(viewD.isValidAreaCode) && !viewD.isValidAreaCode) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.message.areaCode', 'forms', null)
        });
        return next();
    }

    if (!empty(viewD.isValidPhoneNumber) && !viewD.isValidPhoneNumber) {
        res.json({
            error: true,
            phoneErrorMessage: Resource.msg('error.message.areaCode', 'forms', null)
        });
        return next();
    }

    if (billingAddress) {
        Transaction.wrap(function () {
            billingAddress.setPhone(paymentForm.contactInfoFields.phone.value);
            currentBasket.setCustomerEmail(paymentForm.contactInfoFields.email.value);
        });
    }
    // Update billing state code from ApplePay & PayPal if data is inappropriate
    COHelpers.updateStateCode(currentBasket);

    // Update CA postal code if data is inappropriate
    COHelpers.updatePostalCode(currentBasket);

    // auto-correct phone number if invalid
    COHelpers.autoCorrectPhonenumber(currentBasket);

    // Server side validation for shipping, billing, giftMessage and contact info
    var inputFieldsValidation = COHelpers.validateInputFields(currentBasket);
    // valiate HAL address
    var halHelpers = require('*/cartridge/scripts/helpers/halHelper');
    if (!halHelpers.isValidAddress(currentBasket)) {
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

    // Skipping validation for Paazl Pick Up Location Shipping option
    var Site = require('dw/system/Site');
    var isPaazlEnabled = Site.current.getCustomPreferenceValue('paazlEnabled');
    var paazlPickUpPoint = false;
    if (isPaazlEnabled) {
        var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
        var paazlDeliveryInfo = paazlHelper.getSavedPaazlShippingOption(currentBasket);
        if (paazlDeliveryInfo && paazlDeliveryInfo.deliveryType === 'PICKUP_LOCATION') paazlPickUpPoint = true;
    }
    if (inputFieldsValidation.error && ((Object.keys(inputFieldsValidation.shippingAddressErrors).length > 0 && !paazlPickUpPoint) || Object.keys(inputFieldsValidation.giftMessageErrors).length > 0)) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: inputFieldsValidation.genericErrorMessage
        });
        return next();
    } else if (inputFieldsValidation.error && Object.keys(inputFieldsValidation.billingAddressErrors).length > 0) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument'
            },
            errorMessage: inputFieldsValidation.genericErrorMessage
        });
        return next();
    } else if (inputFieldsValidation.error && Object.keys(inputFieldsValidation.contactInfoErrors).length > 0) {
        res.json({
            error: true,
            errorMessage: inputFieldsValidation.genericErrorMessage
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
    var validPayment = (currentBasket.getPaymentInstruments().length > 0)
        ? hooksHelper('app.payment.custom.' + currentBasket.getPaymentInstruments()[0].paymentMethod.toLowerCase(), 'validatePayment', [req, currentBasket], function () {
            return COHelpers.validatePayment(req, currentBasket);
        })
        : { error: true };
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

    var adyenPaymentInstrument = currentBasket.getPaymentInstruments('AdyenComponent') && currentBasket.getPaymentInstruments('AdyenComponent').length > 0
        ? currentBasket.getPaymentInstruments('AdyenComponent')[0]
        : null; // Handles payment authorization
    var isPaypalPayment = false;
    var orderNo;
    var adyenStateData;
    var order;
    if (adyenPaymentInstrument && adyenPaymentInstrument.custom.adyenStateData && adyenPaymentInstrument.custom.adyenPaymentMethod === 'PayPal') {
        isPaypalPayment = true;
        adyenStateData = JSON.parse(adyenPaymentInstrument.custom.adyenStateData);
        orderNo = adyenStateData.orderNo;
    }

    // Creates a new order.
    if (!isPaypalPayment) {
        order = COHelpers.createOrder(currentBasket);
    } else {
        order = COHelpers.createOrder(currentBasket, orderNo);
    }

    // Remove coupon from basket on Utilize voucher memberson API Fail
    if (Object.prototype.hasOwnProperty.call(session.custom, 'membersonOrderFailedError') && !empty(session.custom.membersonOrderFailedError)) {
        // Helper files includes
        var membersonHelpers = require('*/cartridge/scripts/helpers/membersonHelpers');
        // Remove the coupon and display the error message
        var couponsIterator = currentBasket.getCouponLineItems().iterator();
        Transaction.begin();
        // Remove all memberson coupon lineitems
        membersonHelpers.removemembersonVouchers(couponsIterator, currentBasket);
        currentBasket.updateTotals();
        basketCalculationHelpers.calculateTotals(currentBasket);
        Transaction.commit();
        var updatedBasketModel = new CartModel(currentBasket);
        res.json({
            error: true,
            membersonRemoveCoupon: true,
            updatedTotals: updatedBasketModel.totals,
            errorMessage: session.custom.membersonOrderFailedError
        });
        delete session.custom.membersonOrderFailedError;
        return next();
    }


    var paymentInstrument = order.getPaymentInstruments('AdyenComponent') && order.getPaymentInstruments('AdyenComponent').length > 0
        ? order.getPaymentInstruments('AdyenComponent')[0]
        : null; // Handles payment authorization
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    } else if (isPaypalPayment) {
        var RiskDataHelper = require('*/cartridge/scripts/util/riskDataHelper');
        var StringUtils = require('dw/util/StringUtils');
        var adyenBasketHash = StringUtils.encodeBase64(JSON.stringify(RiskDataHelper.createHashContentFields(order)));

        if (paymentInstrument.custom && 'adyenBasketHash' in paymentInstrument.custom && adyenBasketHash !== paymentInstrument.custom.adyenBasketHash) {
            Transaction.wrap(function () {
                order.addNote('Order Failed Reason', 'Basket data mismatch when compared with Adyen preAuth request, happened while placing Paypal Order.');
                COHelpers.failOrder(order);
            });
            var basketData = new OrderModel(
                currentBasket,
                { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
            );
            res.json({
                error: true,
                errorStage: {
                    stage: 'payment',
                    step: 'paymentInstrument',
                    reason: 'orderValueChanged'
                },
                order: basketData,
                customer: customer,
                errorMessage: Resource.msg('error.payment.ordervalue.changed', 'checkout', null)
            });
            return next();
        }
    }

    // Email signup - Checkout
    var emailSignUp = req.querystring.emailSignUp;
    var email = order.customerEmail;
    if (emailSignUp === 'true' && !empty(email)) {
        var com = require('dw/object/CustomObjectMgr');
        const customObjectName = 'NewsLetterSignUp';
        var keyId = email;
        var objectDefinition = com.getCustomObject(customObjectName, keyId);
        if ((empty(objectDefinition))) {
            require('dw/system/Transaction').wrap(function () {
                var NewsLetterSignUpCustObj = com.createCustomObject(customObjectName, keyId);       // eslint-disable-next-line no-undef
                NewsLetterSignUpCustObj.custom.country = request.getLocale();
            });
        }
    }

    // SKU Mapping Logic
    var itemsMapping = [];
    var plis = order.allProductLineItems.iterator();

    while (plis.hasNext()) {
        var pli = plis.next();
        if (!empty(pli) && !empty(pli.custom) && !empty(pli.price)) {
            var itemMapping = [
                pli.productID,
                pli.custom.sku,
                pli.productName,
                pli.price.value + ' ' + pli.price.currencyCode,
                pli.quantityValue
            ].join('|');
            itemsMapping.push(itemMapping);
        }
    }
    Transaction.wrap(function () {
        order.custom.itemsMapping = itemsMapping.join('\n');
    });

    // Set customerCountry to the order custom attribute
    Transaction.wrap(function () {
        // eslint-disable-next-line no-undef
        order.custom.customerCountry = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
    });

    var customerGroups = '';
    var customerGroupObj = order.customer.customerGroups;

    for (var customerGroup in customerGroupObj) { // eslint-disable-line
        customerGroups = empty(customerGroups) ? customerGroups = customerGroupObj[customerGroup].ID : customerGroups + ',' + customerGroupObj[customerGroup].ID;
    }
    var isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
    Transaction.wrap(function () {
        if (isMAOEnabled) {
            const MaoConstants = require('*/cartridge/scripts/MaoConstants');
            var salesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.emeaSapSalesDocumentTypeFMS;
            if (!Object.prototype.hasOwnProperty.call(order.custom, 'orderReasonFMS')) {
                order.custom.orderReasonFMS = MaoConstants.Extended.orderReasonFMS;
            }
            order.custom.sapSalesDocumentTypeFMS = salesDocumentTypeFMS;
        }
        order.custom.customerGroups = customerGroups;

        order.custom.customerLocale = req.locale.id;
        order.custom.customerCountry = session.custom.currentCountry || req.locale.id.slice(-2).toUpperCase();
    });

    // Set isEmployeeOrder boolean attribute for Employee Orders
    require('*/cartridge/scripts/util/SetOrderStatus').setEmployeeOrder(order);

    if (Site.current.getCustomPreferenceValue('returnsConfiguration')) {
        require('*/cartridge/scripts/helpers/holidaySeasonHelper').setHolidaySeason(order);
    }
    // Set the estimated delivery dates
    Transaction.wrap(function () {
        if (HookMgr.hasHook('dw.order.setDeliveryEstimateDate')) {
            HookMgr.callHook('dw.order.setDeliveryEstimateDate', 'setDeliveryEstimateDate', order);
        }
    });

    // Set the gift flag for each product line item of the shipment: PHX-2514
    Transaction.wrap(function () {
        if (order && order.shipments) {
            var shippmets = order.shipments;
            for (var i = 0; i < shippmets.length; i++) {
                var shipment = shippmets[i];
                if (shipment && shipment.gift) {
                    var productLineItems = shipment.getProductLineItems();
                    for (var j = 0; j < productLineItems.length; j++) {
                        var productLineItem = productLineItems[j];
                        productLineItem.gift = shipment.gift;
                        if (shipment.giftMessage) {
                            productLineItem.giftMessage = shipment.giftMessage;
                        }
                    }
                }
            }
        }
    });
    // set phone no. at shipment level shipping address: PHX-3281
    Transaction.wrap(function () {
        if (order && order.shipments) {
            var shipments = order.shipments;
            for (var i = 0; i < shipments.length; i++) {
                var currentShipment = shipments[i];
                if (currentShipment && currentShipment.shippingAddress && !(currentShipment.custom && currentShipment.custom.fromStoreId)) {
                    currentShipment.shippingAddress.setPhone(paymentForm.contactInfoFields.phone.value);
                }
            }
        }
    });

    var viewData = res.getViewData();
    viewData.orderID = order.orderNo;
    res.setViewData(viewData);

    // Set MAO Order Type
    require('*/cartridge/scripts/util/SetOrderStatus').setOrderType(order);

    // Set the customerName if not set already
    require('*/cartridge/scripts/util/SetOrderStatus').setCustomerName(order);

    // Set the CSR customer agent Email ID
    require('*/cartridge/scripts/util/SetOrderStatus').setCSREmailAddress(order, req.currentCustomer.raw);

    var PaymentMgr = require('dw/order/PaymentMgr');
    var paymentInstruments = currentBasket.getPaymentInstruments();
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstruments[0].paymentMethod);
    if (paymentMethod.ID === 'ATOME_PAYMENT') {
        return next();
    }
    // Handles payment authorization
    var handlePaymentResult;
    var placeOrderResult;
    session.custom.currentOrder = order.orderNo;
    if (!isPaypalPayment) {
        handlePaymentResult = (currentBasket.getPaymentInstruments().length > 0)
            ? hooksHelper('app.payment.custom.' + currentBasket.getPaymentInstruments()[0].paymentMethod.toLowerCase(), 'handlePayments', [order, res], function () {
                return require('*/cartridge/scripts/checkout/adyenHelpers').handlePayments(order, order.orderNo);
            })
            : { error: true };
        if (handlePaymentResult.error) {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
            });
            COHelpers.failOrder(order);
            // log the order details for dataDog.
            if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, true, Resource.msg('error.payment.msg', 'checkout', null)));
            }
            return next();
        }

        if (adyenPaymentInstrument) {
            var _this = this;
            var _handlePaymentResult$;
            var constants = require('*/cartridge/adyenConstants/constants');

            // eslint-disable-next-line no-shadow
            var cbEmitter = function cbEmitter(route) {
                return _this.emit(route, req, res);
            };
            // eslint-disable-next-line no-cond-assign, no-void
            if (handlePaymentResult.action && ((_handlePaymentResult$ = handlePaymentResult.action) === null || _handlePaymentResult$ === void 0 ? void 0 : _handlePaymentResult$.type) !== constants.ACTIONTYPES.VOUCHER) {
                var processPayment = require('*/cartridge/controllers/middlewares/checkout_services/adyenCheckoutServices').processPayment;
                return processPayment(order, handlePaymentResult, req, res, cbEmitter);
            }
        }

        if (handlePaymentResult.twoC2pRedirect) {
            res.json({
                error: false,
                continueUrl: handlePaymentResult.twoC2pRedirect
            });
            return next();
        }

        if (handlePaymentResult.tossPaymentsRedirectUrl) {
            res.json({
                error: false,
                continueUrl: handlePaymentResult.tossPaymentsRedirectUrl
            });
            return next();
        }

        placeOrderResult = COHelpers.placeOrder(order);
    } else {
        var paymentData = adyenStateData.paymentData;
        var details = adyenStateData.details; // redirect to payment/details
        var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
        var requestObject = {
            details: details,
            paymentData: paymentData
        };

        var result = adyenCheckout.doPaymentsDetailsCall(requestObject);

        if (result.resultCode === 'Authorised' || result.resultCode === 'Pending' || result.resultCode === 'Received') {
            placeOrderResult = COHelpers.placeOrder(order);

            Transaction.wrap(function () {
                AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
                paymentInstrument.custom.adyenStateData = null;
                paymentInstrument.custom.adyenBasketHash = null;
            });
        } else {
            Transaction.wrap(function () {
                paymentInstrument.custom.adyenPaymentData = null;
                paymentInstrument.custom.adyenBasketHash = null;
            });
            res.json({
                error: true,
                errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
            });
            COHelpers.failOrder(order);
            // log the order details for dataDog.
            if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, true, Resource.msg('error.payment.msg', 'checkout', null)));
            }
            return next();
        }
    }

    if (placeOrderResult.error) {
        // log the order details for dataDog.
        if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
            orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
        }
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // log the order details for dataDog.
    if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
        orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
    }

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);
    // delete vertex hasing session
    req.session.privacyCache.set('taxRequestHash', null);

    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        order_checkout_optin: req.querystring.emailSignUp,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });

    return next();
});

/**
 *  Handle Ajax payment (and billing) form submit
 */
server.replace(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var URLUtils = require('dw/web/URLUtils');
        // eslint-disable-next-line
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

        var PaymentManager = require('dw/order/PaymentMgr');
        var HookManager = require('dw/system/HookMgr');
        var Resource = require('dw/web/Resource');
        var viewData = {};
        var paymentForm = server.forms.getForm('billing');

        // verify billing form data
        var billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);
        var contactInfoFormErrors = COHelpers.validateFields(paymentForm.contactInfoFields);

        var formFieldErrors = [];
        if (Object.keys(billingFormErrors).length) {
            formFieldErrors.push(billingFormErrors);
        } else {
            viewData.address = {
                firstName: { value: paymentForm.addressFields.firstName.value },
                lastName: { value: paymentForm.addressFields.lastName.value },
                address1: { value: paymentForm.addressFields.address1.value },
                address2: { value: paymentForm.addressFields.address2.value },
                city: { value: paymentForm.addressFields.city ? paymentForm.addressFields.city.value : '' },
                postalCode: { value: paymentForm.addressFields.postalCode ? paymentForm.addressFields.postalCode.value : '' },
                countryCode: { value: paymentForm.addressFields.country.value }
            };

            if (Object.prototype.hasOwnProperty.call(paymentForm.addressFields, 'states')) {
                viewData.address.stateCode = { value: paymentForm.addressFields.states.stateCode.value || '' };
            }
        }

        if (Object.keys(contactInfoFormErrors).length) {
            formFieldErrors.push(contactInfoFormErrors);
        } else {
            viewData.email = {
                value: paymentForm.contactInfoFields.email.value
            };

            viewData.phone = { value: paymentForm.contactInfoFields.phone.value };
            if (!paymentForm.contactInfoFields.phone.value && customer.profile && customer.profile.phoneHome) {
                viewData.phone = { value: customer.profile.phoneHome };
            }
        }

        var paymentMethodIdValue = paymentForm.paymentMethod.value;
        if (!PaymentManager.getPaymentMethod(paymentMethodIdValue).paymentProcessor) {
            throw new Error(Resource.msg(
                'error.payment.processor.missing',
                'checkout',
                null
            ));
        }

        var paymentProcessor = PaymentManager.getPaymentMethod(paymentMethodIdValue).getPaymentProcessor();

        var paymentFormResult;
        if (HookManager.hasHook('app.payment.form.processor.' + paymentProcessor.ID.toLowerCase())) {
            paymentFormResult = HookManager.callHook('app.payment.form.processor.' + paymentProcessor.ID.toLowerCase(),
                'processForm',
                req,
                paymentForm,
                viewData
            );
        } else {
            paymentFormResult = HookManager.callHook('app.payment.form.processor.default_form_processor', 'processForm');
        }

        if (paymentFormResult.error && paymentFormResult.fieldErrors) {
            formFieldErrors.push(paymentFormResult.fieldErrors);
        }

        if (formFieldErrors.length || paymentFormResult.serverErrors) {
            // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: formFieldErrors,
                serverErrors: paymentFormResult.serverErrors ? paymentFormResult.serverErrors : [],
                error: true
            });
            // eslint-disable-next-line consistent-return
            return next();
        }

        var Site = require('dw/system/Site');
        var isPaazlEnabled = Site.current.getCustomPreferenceValue('paazlEnabled');
        if (isPaazlEnabled) {
            var Transaction = require('dw/system/Transaction');
            var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
            var paazlStatus = paazlHelper.getPaazlStatus(currentBasket.defaultShipment);
            paymentFormResult.viewData.paazlStatus = paazlStatus;
            if (paazlStatus.active) {
                // If Paazl is active, retrieve the selected shipping option from Paazl
                var paazlShippingMethod = {};
                Transaction.wrap(function () {
                    paazlShippingMethod = paazlHelper.getSavedPaazlShippingOption(currentBasket);
                });
                paymentFormResult.viewData.paazlShippingMethod = paazlShippingMethod;
            }
        }

        res.setViewData(paymentFormResult.viewData);

        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            // eslint-disable-next-line no-shadow
            var BasketMgr = require('dw/order/BasketMgr');
            var HookMgr = require('dw/system/HookMgr');
            var PaymentMgr = require('dw/order/PaymentMgr'); // eslint-disable-next-line no-shadow
            var Transaction = require('dw/system/Transaction');
            var AccountModel = require('*/cartridge/models/account');
            var OrderModel = require('*/cartridge/models/order');
            // eslint-disable-next-line no-shadow
            var URLUtils = require('dw/web/URLUtils');
            var Locale = require('dw/util/Locale');
            var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
            var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

            // eslint-disable-next-line no-shadow
            var currentBasket = BasketMgr.getCurrentBasket();
            var billingData = res.getViewData();

            if (!currentBasket) {
                delete billingData.paymentInformation;

                res.json({
                    error: true,
                    cartError: true,
                    fieldErrors: [],
                    serverErrors: [],
                    redirectUrl: URLUtils.url('Cart-Show').toString()
                });
                return;
            }

            var billingAddress = currentBasket.billingAddress;
            var billingForm = server.forms.getForm('billing');
            var paymentMethodID = billingData.paymentMethod.value;
            // eslint-disable-next-line no-shadow
            var result;

            billingForm.creditCardFields.cardNumber.htmlValue = '';
            billingForm.creditCardFields.securityCode.htmlValue = '';

            Transaction.wrap(function () {
                if (!billingAddress) {
                    billingAddress = currentBasket.createBillingAddress();
                } else {
                    billingAddress.setFirstName(billingData.address.firstName.value);
                    billingAddress.setLastName(billingData.address.lastName.value);
                    billingAddress.setAddress1(billingData.address.address1.value);
                    billingAddress.setAddress2(billingData.address.address2.value);
                    billingAddress.setCity(billingData.address.city ? billingData.address.city.value : '');
                    billingAddress.setPostalCode(billingData.address.postalCode.value);
                    if (Object.prototype.hasOwnProperty.call(billingData.address, 'stateCode')) {
                        billingAddress.setStateCode(billingData.address.stateCode.value || '');
                    }
                    billingAddress.setCountryCode(billingData.address.countryCode.value);
                    if (req.currentCustomer.profile) {
                        if (billingForm.addressFields.saveToAccount && billingForm.addressFields.saveToAccount.checked) {
                            var CustomerMgr = require('dw/customer/CustomerMgr');
                            var addressId = req.querystring.addressID;
                            var states = {};
                            if ('stateCode' in billingData.address && !empty(billingData.address.stateCode.value) && billingData.address.stateCode.value !== undefined) {
                                states = {
                                    stateCode: billingData.address.stateCode.value || ''
                                };
                            }
                            var newAddress = {
                                firstName: billingData.address.firstName.value,
                                lastName: billingData.address.lastName.value,
                                address1: billingData.address.address1.value,
                                address2: billingData.address.address2.value,
                                postalCode: billingData.address.postalCode.value,
                                country: billingData.address.countryCode.value,
                                states: states
                            };
                            if ('city' in billingData.address && !empty(billingData.address.city) && billingData.address.city.value !== undefined) {
                                newAddress.city = billingData.address.city.value;
                            }
                            var customer = CustomerMgr.getCustomerByCustomerNumber(
                                req.currentCustomer.profile.customerNo
                            );
                            var addressBook = customer.getProfile().getAddressBook();
                            Transaction.wrap(function () {
                                var address;
                                if (addressId) {
                                    address = addressBook.getAddress(addressId);
                                } else {
                                    var randomID = Math.random().toString(36).substr(2);
                                    if (addressBook.getAddress(randomID)) {
                                        randomID = Math.random().toString(36).substr(2);
                                    }
                                    address = addressBook.createAddress(randomID);
                                }
                                if (address) {
                                    // Save form's address
                                    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
                                    addressHelpers.updateAddressFields(address, newAddress);
                                    // Send account edited email
                                    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                                    accountHelpers.sendAccountEditedEmail(customer.profile);
                                }
                            });
                        }
                    }
                }

                if (billingData.storedPaymentUUID) {
                    billingAddress.setPhone(req.currentCustomer.profile.phone);
                    currentBasket.setCustomerEmail(req.currentCustomer.profile.email);
                } else {
                    billingAddress.setPhone(billingData.phone.value);
                    currentBasket.setCustomerEmail(billingData.email.value);
                }
            });

            // Server side validation for billing info
            var inputFieldsValidation = COHelpers.validateInputFields(currentBasket);
            if (inputFieldsValidation.error && Object.keys(inputFieldsValidation.billingAddressErrors).length > 0) {
                var errorMessage = inputFieldsValidation.genericErrorMessage;
                if (inputFieldsValidation.billingAddressErrors && inputFieldsValidation.billingAddressErrors.postalCode) {
                    errorMessage = Resource.msg('checkout.postalcode.error', 'checkout', null);
                }
                res.json({
                    form: billingForm,
                    fieldErrors: [],
                    serverErrors: [errorMessage],
                    error: true
                });
                return;
            }

            // if there is no selected payment option and balance is greater than zero
            if (!paymentMethodID && currentBasket.totalGrossPrice.value > 0) {
                var noPaymentMethod = {};

                noPaymentMethod[billingData.paymentMethod.htmlName] =
                    Resource.msg('error.no.selected.payment.method', 'payment', null);

                delete billingData.paymentInformation;

                res.json({
                    form: billingForm,
                    fieldErrors: [noPaymentMethod],
                    serverErrors: [],
                    error: true
                });
                return;
            }

            // check to make sure there is a payment processor
            if (!PaymentMgr.getPaymentMethod(paymentMethodID).paymentProcessor) {
                throw new Error(Resource.msg(
                    'error.payment.processor.missing',
                    'checkout',
                    null
                ));
            }

            var processor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();

            if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
                result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
                    'Handle',
                    currentBasket,
                    billingData.paymentInformation,
                    paymentMethodID,
                    req
                );
            } else {
                result = HookMgr.callHook('app.payment.processor.default', 'Handle');
            }

            // need to invalidate credit card fields
            if (result.error) {
                delete billingData.paymentInformation;

                res.json({
                    form: billingForm,
                    fieldErrors: result.fieldErrors ? result.fieldErrors : [],
                    serverErrors: result.serverErrors ? result.serverErrors : [Resource.msg('error.technical', 'checkout', null)],
                    error: true
                });
                return;
            }

            if (HookMgr.hasHook('app.payment.form.processor.' + processor.ID.toLowerCase())) {
                HookMgr.callHook('app.payment.form.processor.' + processor.ID.toLowerCase(),
                    'savePaymentInformation',
                    req,
                    currentBasket,
                    billingData
                );
            } else {
                HookMgr.callHook('app.payment.form.processor.default', 'savePaymentInformation');
            }

            // Calculate the basket
            Transaction.wrap(function () {
                basketCalculationHelpers.calculateTotals(currentBasket);
            });

            // Re-calculate the payments.
            var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(
                currentBasket
            );

            if (calculatedPaymentTransaction.error) {
                res.json({
                    form: paymentForm,
                    fieldErrors: [],
                    serverErrors: [Resource.msg('error.technical', 'checkout', null)],
                    error: true
                });
                return;
            }

            var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
            if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                req.session.privacyCache.set('usingMultiShipping', false);
                usingMultiShipping = false;
            }

            hooksHelper('app.customer.subscription', 'subscribeTo', [paymentForm.subscribe.checked, paymentForm.contactInfoFields.email.htmlValue], function () { });

            var currentLocale = Locale.getLocale(req.locale.id);

            var basketModelObject = new OrderModel(
                currentBasket,
                { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
            );

            var accountModel = new AccountModel(req.currentCustomer);
            var countryCode = request.locale && request.locale != 'default' ? request.locale.split('_')[1] : 'US'; // eslint-disable-line
            if (!empty(accountModel)) {
                accountModel.countryCode = countryCode;
            }
            var renderedStoredPaymentInstrument = COHelpers.getRenderedPaymentInstruments(
                req,
                accountModel
            );

            delete billingData.paymentInformation;

            res.json({
                renderedPaymentInstruments: renderedStoredPaymentInstrument,
                customer: accountModel,
                order: basketModelObject,
                form: billingForm,
                error: false
            });
        });

        // eslint-disable-next-line consistent-return
        return next();
    }
);

module.exports = server.exports();
