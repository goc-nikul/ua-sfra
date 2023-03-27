/* eslint-disable block-scoped-var */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable no-underscore-dangle */
'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
server.extend(module.superModule);

server.replace('PlaceOrder', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var orderInfoLogger = require('dw/system/Logger').getLogger('orderInfo', 'orderInfo');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var availabilityHelper = require('*/cartridge/scripts/helpers/availabilityHelpers');
    var CartModel = require('*/cartridge/models/cart');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var HookMgr = require('dw/system/HookMgr');
    var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    var constants = require('*/cartridge/adyenConstants/constants');
    var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

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
    // don't allow placing order with totalGrossPrice equal 0
    if (calculatedPaymentTransactionTotal.error || currentBasket.totalGrossPrice.value === 0) {
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
    var isOxxo = adyenPaymentInstrument && adyenPaymentInstrument.custom.adyenPaymentMethod === 'Oxxo';

    // Creates a new order.
    if (!isPaypalPayment) {
        order = COHelpers.createOrder(currentBasket);
    } else {
        order = COHelpers.createOrder(currentBasket, orderNo);
    }

    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    if ('dob' in paymentForm.contactInfoFields && paymentForm.contactInfoFields.dob.value) {
        var dob = paymentForm.contactInfoFields.dob.value;
        var dobArray = dob.split('/');  // Split date format DD/MM/YYYY
        // Update IDM profile birthday
        if (customer.profile && customer.profile.email) {
            var idmRequestObj = {
                customer: {
                    email: customer.profile.email,
                    birthDay: dobArray[0],
                    birthMonth: dobArray[1],
                    birthYear: dobArray[2],
                    preferences: {}
                },
                login: {}
            };
            var idmHelper = require('plugin_ua_idm/cartridge/scripts/idmHelper.js');
            idmHelper.updateUser(idmRequestObj, customer, true);
        }

        Transaction.wrap(function () {
            order.billingAddress.custom.dob = dob;
            if (customer.profile) {
                customer.profile.custom.dob = dob;
                customer.profile.custom.birthDay = (+dobArray[0]).toString();
                customer.profile.custom.birthMonth = (+dobArray[1]).toString();
                customer.profile.custom.birthYear = dobArray[2];
                var birthday = new Date(dobArray[2], dobArray[1] - 1, dobArray[0]);
                customer.profile.setBirthday(birthday);
            }
        });
    }

    // Set default RFC value if it is not filled by customer
    if (!order.billingAddress.custom.rfc) {
        var rfcDefaultValuesJson = Site.current.getCustomPreferenceValue('rfcDefaultValuesJson') || '{}';
        var rfcDefaultValues = JSON.parse(rfcDefaultValuesJson);
        Transaction.wrap(function () {
            if (!rfcDefaultValuesJson || !rfcDefaultValues || !rfcDefaultValues.RFC_DEFAULT) {
                order.billingAddress.custom.rfc = Resource.msg('forms.rfc.default', 'forms', null);
                order.billingAddress.custom.razonsocial = Resource.msg('forms.razonsocial.default', 'forms', null);
            } else {
                order.billingAddress.custom.rfc = rfcDefaultValues.RFC_DEFAULT;
                order.billingAddress.custom.razonsocial = rfcDefaultValues.RAZONSOCIAL_DEFAULT;
                order.billingAddress.custom.usoCFDI = rfcDefaultValues.USOCFDI_DEFAULT;
                order.billingAddress.custom.regimenFiscal = rfcDefaultValues.REGIMENFISCAL_DEFAULT;
                order.billingAddress.custom.codigoPostal = rfcDefaultValues.CODIGOPOSTAL_DEFAULT;
            }
        });
    }

    // Remove coupon from basket on Utilize voucher memberson API Fail
    if (Object.prototype.hasOwnProperty.call(session.custom, 'membersonOrderFailedError') && !empty(session.custom.membersonOrderFailedError)) {
        var basket = BasketMgr.currentBasket;
        // Remove the coupon and display the error message
        var membersonCoupon = basket.custom['Loyalty-VoucherName'].split('=')[0];
        var couponLineItem = basket.getCouponLineItem(membersonCoupon);
        Transaction.begin();
        basket.removeCouponLineItem(couponLineItem);
        basket.updateTotals();
        Transaction.commit();
        var updatedBasketModel = new CartModel(basket);
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

    if (isPaypalPayment) {
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
    // get device ID  for accertify
    var getTID = req.querystring.getTID;
    // Set customerCountry to the order custom attribute
    Transaction.wrap(function () {
        // eslint-disable-next-line no-undef
        order.custom.customerCountry = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
        order.custom.accertifyInAuthTransactionID = !empty(getTID) ? getTID : '';
    });

    var customerGroups = '';
    var customerGroupObj = order.customer.customerGroups;

    for (var customerGroup in customerGroupObj) { // eslint-disable-line
        customerGroups = empty(customerGroups) ? customerGroups = customerGroupObj[customerGroup].ID : customerGroups + ',' + customerGroupObj[customerGroup].ID;
    }
    Transaction.wrap(function () {
        order.custom.customerGroups = customerGroups;

        order.custom.customerLocale = req.locale.id;
        order.custom.customerCountry = session.custom.currentCountry || req.locale.id.slice(-2).toUpperCase();
    });

    // Set isEmployeeOrder boolean attribute for Employee Orders
    require('*/cartridge/scripts/util/SetOrderStatus').setEmployeeOrder(order);

    // Set the estimated delivery dates
    Transaction.wrap(function () {
        if (HookMgr.hasHook('dw.order.setDeliveryEstimateDate')) {
            HookMgr.callHook('dw.order.setDeliveryEstimateDate', 'setDeliveryEstimateDate', order, false);
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
    var fraudDetectionStatus;
    var pspReference;
    var paymentRequest;
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
            return next();
        }

        if (adyenPaymentInstrument) {
            var _this = this;
            var _handlePaymentResult$;

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

        // Fraud Protection Check
        fraudDetectionStatus = require('*/cartridge/modules/providers').get('FraudScreen', order).validate();
        if (fraudDetectionStatus === 'accept' || isOxxo) {
            // Fraud check approved
            placeOrderResult = COHelpers.placeOrder(order);

            if (placeOrderResult.error) {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                return next();
            }
        } else if (fraudDetectionStatus === 'review' || fraudDetectionStatus === 'SERVER_UNAVAILABLE') {
            if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                Transaction.wrap(function () {
                    order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
                });
            } else {
                COHelpers.sendConfirmationEmail(order, req.locale.id);
            }
            // Fraud check hold
            session.custom.currentOrder = null;
        } else {
            // Fraud check fail
            pspReference = order.paymentTransaction && order.paymentTransaction.custom.Adyen_pspReference;
            if (pspReference) {
                // Cancel Adyen payment with reversal API:
                // - cancel non-captured payment
                // - refund auto-captured payment
                paymentRequest = {
                    merchantAccount: AdyenConfigs.getAdyenMerchantAccount()
                };
                AdyenHelper.executeCall(constants.SERVICE.PAYMENTREVERSAL, paymentRequest, pspReference);
            }

            COHelpers.failOrder(order);

            COHelpers.sendFraudNotificationEmail(order);
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
    } else {
        var paymentData = adyenStateData.paymentData;
        var details = adyenStateData.details; // redirect to payment/details
        var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        var requestObject = {
            details: details,
            paymentData: paymentData
        };

        var result = adyenCheckout.doPaymentsDetailsCall(requestObject);
        var payerID = details.payerID;

        if (result.resultCode === 'Authorised' || result.resultCode === 'Pending' || result.resultCode === 'Received') {
            Transaction.wrap(function () {
                AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
                paymentInstrument.custom.adyenStateData = null;
                paymentInstrument.custom.adyenBasketHash = null;
                paymentInstrument.custom.paypalPayerID = payerID || '';
            });
            // Fraud Protection Check
            fraudDetectionStatus = require('*/cartridge/modules/providers').get('FraudScreen', order).validate();
            if (fraudDetectionStatus === 'accept') {
                placeOrderResult = COHelpers.placeOrder(order);
            } else if (fraudDetectionStatus === 'review' || fraudDetectionStatus === 'SERVER_UNAVAILABLE') {
                if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                    Transaction.wrap(function () {
                        order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
                    });
                } else {
                    COHelpers.sendConfirmationEmail(order, req.locale.id);
                }
                // Fraud check hold
                session.custom.currentOrder = null;
            } else {
                // Fraud check fail
                pspReference = order.paymentTransaction && order.paymentTransaction.custom.Adyen_pspReference;
                if (pspReference) {
                    // Cancel Adyen payment with reversal API:
                    // - cancel non-captured payment
                    // - refund auto-captured payment
                    paymentRequest = {
                        merchantAccount: AdyenConfigs.getAdyenMerchantAccount()
                    };
                    AdyenHelper.executeCall(constants.SERVICE.PAYMENTREVERSAL, paymentRequest, pspReference);
                }
                COHelpers.failOrder(order);

                COHelpers.sendFraudNotificationEmail(order);
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
            return next();
        }
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
            };
            viewData.address.firstName = { value: paymentForm.addressFields.firstName.value };
            viewData.address.lastName = { value: paymentForm.addressFields.lastName.value };
            viewData.address.address1 = { value: paymentForm.addressFields.address1.value };
            viewData.address.address2 = paymentForm.addressFields.address2 ? { value: paymentForm.addressFields.address2.value } : { value: '' };
            viewData.address.city = { value: paymentForm.addressFields.city ? paymentForm.addressFields.city.value : '' };
            viewData.address.postalCode = { value: paymentForm.addressFields.postalCode ? paymentForm.addressFields.postalCode.value : '' };
            viewData.address.countryCode = { value: paymentForm.addressFields.country.value };
            viewData.address.exteriorNumber = { value: paymentForm.addressFields.exteriorNumber.value };
            viewData.address.interiorNumber = { value: paymentForm.addressFields.interiorNumber.value };
            viewData.address.additionalInformation = { value: paymentForm.addressFields.additionalInformation.value };
            viewData.address.colony = { value: paymentForm.addressFields.colony.value };
            viewData.address.dependentLocality = { value: paymentForm.addressFields.dependentLocality.value };
            viewData.address.rfc = {
                razonsocial: { value: paymentForm.addressFields && paymentForm.addressFields.rfc && paymentForm.addressFields.rfc.razonsocial.value },
                rfc: { value: paymentForm.addressFields && paymentForm.addressFields.rfc && paymentForm.addressFields.rfc.rfc.value }
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
                serverErrors: paymentFormResult.serverErrors ? paymentFormResult.serverErrors : [Resource.msg('error.payment.processor.not.supported', 'checkout', null)],
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
            var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');

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
            var rfcSavedToAddress = false;

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
                                additionalInformation: billingData.address.additionalInformation.value,
                                colony: billingData.address.colony.value,
                                dependentLocality: billingData.address.dependentLocality.value,
                                exteriorNumber: billingData.address.exteriorNumber.value,
                                interiorNumber: billingData.address.interiorNumber.value,
                                states: states
                            };
                            if ('city' in billingData.address && !empty(billingData.address.city) && billingData.address.city.value !== undefined) {
                                newAddress.city = billingData.address.city.value;
                            }
                            if ('rfc' in billingData.address && typeof billingData.address.rfc === 'object') { // eslint-disable-next-line no-param-reassign
                                newAddress.rfc = {};
                                if (billingData.address.rfc.razonsocial !== null) {
                                    newAddress.rfc.razonsocial = billingData.address.rfc.razonsocial.value || ''; // eslint-disable-next-line no-param-reassign
                                }
                                if (billingData.address.rfc.rfc !== null) {
                                    newAddress.rfc.rfc = billingData.address.rfc.rfc.value || ''; // eslint-disable-next-line no-param-reassign
                                }
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
                                    addressHelpers.updateAddressFields(address, newAddress);
                                    rfcSavedToAddress = true;
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

            if (!rfcSavedToAddress && req.querystring.rfcAddressID && billingData.address.rfc.rfc.value) {
                addressHelpers.saveRFCtoCustomerAddress(req.querystring.rfcAddressID, billingData.address.rfc.rfc.value, billingData.address.rfc.razonsocial.value);
            }

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

/**
 * CheckoutServices-SubmitPayment : Prepend this method to add zip params after submitting payment information and saving new MX fields updating to basket and user account
 * @name Base/CheckoutServices-SubmitPayment
 * @function
 * @memberof CheckoutServices
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - prepend
 */
server.prepend(
    'SubmitPayment',
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var rfcCheckbox = req.form.rfcCheckbox;

        var viewData = res.getViewData();
        var paymentForm = server.forms.getForm('billing');
        if ('address' in viewData && !empty(viewData.address) && viewData.address !== undefined) {
            if (paymentForm.addressFields && 'exteriorNumber' in paymentForm.addressFields && paymentForm.addressFields.exteriorNumber.value) {
                viewData.address.exteriorNumber = { value: paymentForm.addressFields.exteriorNumber.value };
            }
            if (paymentForm.addressFields && 'interiorNumber' in paymentForm.addressFields) {
                viewData.address.interiorNumber = { value: paymentForm.addressFields.interiorNumber.value ? paymentForm.addressFields.interiorNumber.value : '' };
            }
            if (paymentForm.addressFields && 'additionalInformation' in paymentForm.addressFields) {
                viewData.address.additionalInformation = { value: paymentForm.addressFields.additionalInformation.value ? paymentForm.addressFields.additionalInformation.value : '' };
            }
            if (paymentForm.addressFields && 'colony' in paymentForm.addressFields && paymentForm.addressFields.colony.value) {
                viewData.address.colony = { value: paymentForm.addressFields.colony.value };
            }
            if (paymentForm.addressFields && 'dependentLocality' in paymentForm.addressFields && paymentForm.addressFields.dependentLocality.value) {
                viewData.address.dependentLocality = { value: paymentForm.addressFields.dependentLocality.value };
            }
            if (paymentForm.addressFields && 'rfc' in paymentForm.addressFields && paymentForm.addressFields.rfc && paymentForm.addressFields.rfc.razonsocial.value) {
                viewData.address.razonsocial = { value: paymentForm.addressFields.rfc.razonsocial.value };
            }
            if (paymentForm.addressFields && 'rfc' in paymentForm.addressFields && paymentForm.addressFields.rfc && paymentForm.addressFields.rfc.rfc.value) {
                viewData.address.rfc = { value: paymentForm.addressFields.rfc.rfc.value };
            }
        }
        var billingFormAddressFields = server.forms.getForm('billing').addressFields;
        var customerAddressIdArray = [];
        var reqAddressId = req.querystring.addressID;
        if (!reqAddressId && billingFormAddressFields.saveToAccount && billingFormAddressFields.saveToAccount.checked) {
            var currentCustomer = require('dw/customer/CustomerMgr').getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var currentCustomerAddressBook = currentCustomer.getProfile().getAddressBook();
            var allAddressesList = currentCustomerAddressBook.addresses;
            for (var index = 0; index < allAddressesList.length; index++) {
                customerAddressIdArray.push(allAddressesList[index].ID);
            }
        } else {
            customerAddressIdArray.push(reqAddressId);
        }
        viewData.customerAddressIDArray = customerAddressIdArray;

        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var billingData = res.getViewData();
            var billingAddress = currentBasket.billingAddress;
            var OrderModel = require('*/cartridge/models/order');
            var Locale = require('dw/util/Locale');
            var billingForm = server.forms.getForm('billing');
            Transaction.wrap(function () {
                if (billingAddress) {
                    if (!empty(billingData.address) && 'exteriorNumber' in billingData.address) {
                        billingAddress.custom.exteriorNumber = (!empty(billingData.address) && 'exteriorNumber' in billingData.address && !empty(billingData.address.exteriorNumber.value) && billingData.address.exteriorNumber.value !== undefined) ? billingData.address.exteriorNumber.value : '';
                    }
                    if (!empty(billingData.address) && 'interiorNumber' in billingData.address) {
                        billingAddress.custom.interiorNumber = (!empty(billingData.address) && 'interiorNumber' in billingData.address && !empty(billingData.address.interiorNumber.value) && billingData.address.interiorNumber.value !== undefined) ? billingData.address.interiorNumber.value : '';
                    }
                    if (!empty(billingData.address) && 'additionalInformation' in billingData.address) {
                        billingAddress.custom.additionalInformation = (!empty(billingData.address) && 'additionalInformation' in billingData.address && !empty(billingData.address.additionalInformation.value) && billingData.address.additionalInformation.value !== undefined) ? billingData.address.additionalInformation.value : '';
                    }
                    if (!empty(billingData.address) && 'colony' in billingData.address) {
                        billingAddress.custom.colony = (!empty(billingData.address) && 'colony' in billingData.address && !empty(billingData.address.colony.value) && billingData.address.colony.value !== undefined) ? billingData.address.colony.value : '';
                    }
                    if (!empty(billingData.address) && 'dependentLocality' in billingData.address) {
                        billingAddress.custom.dependentLocality = (!empty(billingData.address) && 'dependentLocality' in billingData.address && !empty(billingData.address.dependentLocality.value) && billingData.address.dependentLocality.value !== undefined) ? billingData.address.dependentLocality.value : '';
                    }

                    // RFC details only for MX site
                    if (!empty(paymentForm.addressFields) && 'rfc' in paymentForm.addressFields && !empty(paymentForm.addressFields.rfc)) {
                        if (rfcCheckbox) {
                            if (!empty(paymentForm.addressFields) && 'rfc' in paymentForm.addressFields && 'rfc' in paymentForm.addressFields.rfc) {
                                billingAddress.custom.rfc = (!empty(paymentForm.addressFields.rfc) && 'rfc' in paymentForm.addressFields.rfc && !empty(paymentForm.addressFields.rfc.rfc.value) && paymentForm.addressFields.rfc.rfc.value !== undefined) ? paymentForm.addressFields.rfc.rfc.value : '';
                            }
                            if (!empty(paymentForm.addressFields) && 'rfc' in paymentForm.addressFields && 'razonsocial' in paymentForm.addressFields.rfc) {
                                billingAddress.custom.razonsocial = (!empty(paymentForm.addressFields.rfc) && 'razonsocial' in paymentForm.addressFields.rfc && !empty(paymentForm.addressFields.rfc.razonsocial.value) && paymentForm.addressFields.rfc.razonsocial.value !== undefined) ? paymentForm.addressFields.rfc.razonsocial.value : '';
                            }
                            if (!empty(paymentForm.addressFields.rfc) && 'rfc' in paymentForm.addressFields && 'usoCFDI' in paymentForm.addressFields.rfc) {
                                billingAddress.custom.usoCFDI = (!empty(paymentForm.addressFields.rfc) && 'usoCFDI' in paymentForm.addressFields.rfc && !empty(paymentForm.addressFields.rfc.usoCFDI.value) && paymentForm.addressFields.rfc.usoCFDI.value !== undefined) ? paymentForm.addressFields.rfc.usoCFDI.value : '';
                            }
                            if (!empty(paymentForm.addressFields.rfc) && 'rfc' in paymentForm.addressFields && 'regimenFiscal' in paymentForm.addressFields.rfc) {
                                billingAddress.custom.regimenFiscal = (!empty(paymentForm.addressFields.rfc) && 'regimenFiscal' in paymentForm.addressFields.rfc && !empty(paymentForm.addressFields.rfc.regimenFiscal.value) && paymentForm.addressFields.rfc.regimenFiscal.value !== undefined) ? paymentForm.addressFields.rfc.regimenFiscal.value : '';
                            }
                            if (!empty(paymentForm.addressFields.rfc) && 'rfc' in paymentForm.addressFields && 'codigoPostal' in paymentForm.addressFields.rfc) {
                                billingAddress.custom.codigoPostal = (!empty(paymentForm.addressFields.rfc) && 'codigoPostal' in paymentForm.addressFields.rfc && !empty(paymentForm.addressFields.rfc.codigoPostal.value) && paymentForm.addressFields.rfc.codigoPostal.value !== undefined) ? paymentForm.addressFields.rfc.codigoPostal.value : '';
                            }
                        } else {
                            billingAddress.custom.rfc = '';
                            billingAddress.custom.razonsocial = '';
                            billingAddress.custom.usoCFDI = '';
                            billingAddress.custom.regimenFiscal = '';
                            billingAddress.custom.codigoPostal = '';
                        }
                    }
                }
            });
            if (req.currentCustomer.profile) {
                if (billingForm.addressFields.saveToAccount && billingForm.addressFields.saveToAccount.checked) {
                    var CustomerMgr = require('dw/customer/CustomerMgr');
                    var addressId = req.querystring.addressID;
                    var customer = CustomerMgr.getCustomerByCustomerNumber(
                        req.currentCustomer.profile.customerNo
                    );
                    var addressBook = customer.getProfile().getAddressBook();
                    if (typeof addressId === undefined || !addressId) {
                        var customerAddressIDArray = billingData.customerAddressIDArray;
                        var allAddressList = addressBook.addresses;
                        for (var i = 0; i < allAddressList.length; i++) {
                            var addressID = allAddressList[i].ID;
                            if (customerAddressIDArray.indexOf(addressID) < 0) {
                                addressId = addressID;
                            }
                        }
                    }
                    Transaction.wrap(function () {
                        var address;
                        if (addressId) {
                            address = addressBook.getAddress(addressId);
                            if (!empty(billingData.address) && 'exteriorNumber' in billingData.address && !empty(billingData.address.exteriorNumber.value)) {
                                address.custom.exteriorNumber = billingData.address.exteriorNumber.value;
                            }
                            if (!empty(billingData.address) && 'interiorNumber' in billingData.address && !empty(billingData.address.interiorNumber.value)) {
                                address.custom.interiorNumber = billingData.address.interiorNumber.value;
                            }
                            if (!empty(billingData.address) && 'additionalInformation' in billingData.address && !empty(billingData.address.additionalInformation.value)) {
                                address.custom.additionalInformation = billingData.address.additionalInformation.value;
                            }
                            if (!empty(billingData.address) && 'colony' in billingData.address && !empty(billingData.address.colony.value)) {
                                address.custom.colony = billingData.address.colony.value;
                            }
                            if (!empty(billingData.address) && 'dependentLocality' in billingData.address && !empty(billingData.address.dependentLocality.value)) {
                                address.custom.dependentLocality = billingData.address.dependentLocality.value;
                            }
                        }
                    });
                }
            }

            var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
            if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                req.session.privacyCache.set('usingMultiShipping', false);
                usingMultiShipping = false;
            }

            var currentLocale = Locale.getLocale(req.locale.id);
            var basketModelObject = new OrderModel(
                currentBasket,
                { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
            );

            res.json({
                order: basketModelObject,
                form: billingForm,
                error: viewData.error
            });
        });

        return next();
    }
);

module.exports = server.exports();
