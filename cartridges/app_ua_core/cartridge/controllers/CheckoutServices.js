/* eslint-disable block-scoped-var */
/* eslint-disable spellcheck/spell-checker */
'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var collections = require('*/cartridge/scripts/util/collections');
var Constants = require('*/cartridge/scripts/constants/constants.js');
var errorLogger = require('dw/system/Logger').getLogger('OrderFail', 'OrderFail');
var LogHelper = require('*/cartridge/scripts/util/loggerHelper');
server.extend(module.superModule);

server.replace('PlaceOrder', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');
    var orderInfoLogger = require('dw/system/Logger').getLogger('orderInfo', 'orderInfo');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var availabilityHelper = require('*/cartridge/scripts/helpers/availabilityHelpers');
    var CartModel = require('*/cartridge/models/cart');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    const giftCardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    const giftcardsHooks = require('*/cartridge/scripts/giftcard/hooks/giftcardsHooks');
    const vipHooks = require('*/cartridge/scripts/vip/hooks/vipHooks');
    const vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
    const instorePickupStoreHelper = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
    var HookMgr = require('dw/system/HookMgr');
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();

    var currentBasket = BasketMgr.getCurrentBasket();
    var cartModel = new CartModel(currentBasket);
    var validatedProducts = validationHelpers.validateProductsInventory(currentBasket, 'PlaceOrder');
    var basketHasGCPaymentInstrument = false;
    var basketHasGiftCardItems = giftCardHelper.basketHasGiftCardItems(currentBasket);
    var basketHasOnlyEGiftCards = basketHasGiftCardItems.onlyEGiftCards;
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var bopisEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled');
    var hasBOPISshipment = cartHelper.basketHasBOPISShipmet(currentBasket);
    if ((hasBOPISshipment && !bopisEnabled)) {
        errorLogger.error('hasBOPISshipment && !bopisEnabled {0} ', LogHelper.getLoggingObject());
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    } else if (bopisEnabled && hasBOPISshipment) { // This below code validates inventory limit exceeded and realTime inventory check for BOPIS products.
        var validatedBOPISProducts = validationHelpers.validateBOPISProductsInventory(currentBasket, 'BOPIS');
        if (validatedBOPISProducts && validatedBOPISProducts.availabilityError) {
            errorLogger.error('validatedBOPISProducts.availabilityError {0} ', LogHelper.getLoggingObject());
            // below function moves invalid bopis items to shipToAddress.
            var invalidBOPISItems = COHelpers.handleInvalidBopisItems(cartModel, currentBasket, validatedBOPISProducts);
            // Calculate the basket
            Transaction.wrap(function () {
                basketCalculationHelpers.calculateTotals(currentBasket);
            });

            var currentlocale = Locale.getLocale(req.locale.id);
            var multiShipping = req.session.privacyCache.get('usingMultiShipping');
            var basketmodel = new OrderModel(
                currentBasket,
                { usingMultiShipping: multiShipping, countryCode: currentlocale.country, containerView: 'basket' }
            );
            var bopisProductQuantityTotal = basketmodel.productQuantityTotal ? basketmodel.productQuantityTotal : 0;
            invalidBOPISItems.productQuantityTotal = bopisProductQuantityTotal;
            invalidBOPISItems.isBOPIS = true;
            var renderTemplate = availabilityHelper.getAvailabilityRenderTemplate(invalidBOPISItems);

            res.json({
                order: basketmodel,
                availabilityError: true,
                isEmptyBasket: bopisProductQuantityTotal === 0,
                renderedTemplate: renderTemplate
            });
            return next();
        }
    }

    // This below code verifies the inventory limit exceeded and realTime inventory check
    if (validatedProducts.availabilityError) {
        errorLogger.error('validatedProducts.availabilityError {0} ', LogHelper.getLoggingObject());
        var inValidItems = availabilityHelper.getInvalidItems(cartModel, validatedProducts);
        // remove or update quantity of the unavailable items from the Basket
        availabilityHelper.updateItemsAvailability(currentBasket, validatedProducts);
        // Calculate the basket
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var currentLocale = Locale.getLocale(req.locale.id);
        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
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
    var billingAddress = currentBasket ? currentBasket.billingAddress : null;
    var formFieldErrors = [];

    if (Object.keys(contactInfoFormErrors).length) {
        formFieldErrors.push(contactInfoFormErrors);
    }
    if (formFieldErrors.length) {
        errorLogger.error('formFieldErrors {0} : {1}', JSON.stringify(formFieldErrors), LogHelper.getLoggingObject());
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
                errorLogger.error('phoneNumber !isvalid {0}', LogHelper.getLoggingObject());
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.message.phonenumber.invalid', 'forms', null)
                });
                return next();
            }
        } else {
            errorLogger.error('!phoneNumber {0}', LogHelper.getLoggingObject());
            res.json({
                error: true,
                errorMessage: Resource.msg('error.message.required', 'forms', null)
            });
            return next();
        }
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
        errorLogger.error('!halHelpers.isValidAddress {0}', LogHelper.getLoggingObject());
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
    if (inputFieldsValidation.error && (Object.keys(inputFieldsValidation.shippingAddressErrors).length > 0 || Object.keys(inputFieldsValidation.giftMessageErrors).length > 0)) {
        errorLogger.error('!inputFieldsValidation.shippingAddressErrors {0}', LogHelper.getLoggingObject());
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
        errorLogger.error('!inputFieldsValidation.billingAddressErrors {0}', LogHelper.getLoggingObject());
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
        errorLogger.error('!inputFieldsValidation.contactInfoErrors {0}', LogHelper.getLoggingObject());
        res.json({
            error: true,
            errorMessage: inputFieldsValidation.genericErrorMessage
        });
        return next();
    }

    if (COHelpers.isKlarnaPaymentEnabled() && !isAurusEnabled) {
        if (currentBasket.paymentInstruments && currentBasket.paymentInstruments.length && currentBasket.paymentInstruments[0].paymentMethod === 'KLARNA_PAYMENTS') {
            var klarnaForm = server.forms.getForm('klarna');
            var KlarnaPaymentsCategoriesModel = require('*/cartridge/scripts/payments/model/categories');
            var userSession = req.session.raw;
            var paymentCategoryID = klarnaForm.paymentCategory.value;
            var klarnaPaymentMethods = JSON.parse(userSession.privacy.KlarnaPaymentMethods);
            var kpCategories = new KlarnaPaymentsCategoriesModel(klarnaPaymentMethods);
            var selectedPaymentCategory = kpCategories.findCategoryById(paymentCategoryID);
            var paymentCategoryName = selectedPaymentCategory ? selectedPaymentCategory.name : '';
            var KLARNA_PAYMENT_METHOD = require('*/cartridge/scripts/util/klarnaPaymentsConstants').PAYMENT_METHOD;
            var klarnaPaymentInstrument = collections.find(currentBasket.getPaymentInstruments(), function (item) {
                return item.paymentMethod === KLARNA_PAYMENT_METHOD;
            });
            Transaction.wrap(function () {
                klarnaPaymentInstrument.custom.klarnaPaymentCategoryID = paymentCategoryID;
                klarnaPaymentInstrument.custom.klarnaPaymentCategoryName = paymentCategoryName;
            });
        } else {
            // Cancel any previous klarna authorizations
            var processor = require('*/cartridge/scripts/payments/processor');
            processor.cancelAuthorization();
        }
    }

    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('~/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
        errorLogger.error('validationOrderStatus.error {0}', LogHelper.getLoggingObject());
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        return next();
    }

    // Check to make sure there is a shipping address
    if (!basketHasOnlyEGiftCards && currentBasket.defaultShipment.shippingAddress === null) {
        errorLogger.error('basketHasOnlyEGiftCards && currentBasket.defaultShipment.shippingAddress {0}', LogHelper.getLoggingObject());
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
        errorLogger.error('!currentBasket.billingAddress {0}', LogHelper.getLoggingObject());
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
        errorLogger.error('!validPayment {0}', LogHelper.getLoggingObject());
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
        errorLogger.error('calculatedPaymentTransactionTotal.error {0}', LogHelper.getLoggingObject());
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // Validates Payment Instruments
    var isPaymentAmountMatches = COHelpers.isPaymentAmountMatches(currentBasket);
    if (!isPaymentAmountMatches) {
        errorLogger.error('!isPaymentAmountMatches {0}', LogHelper.getLoggingObject());
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument'
            },
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    var basketHasBopisShipment = collections.find(currentBasket.shipments, function (item) { // eslint-disable-line
        return item.custom.fromStoreId;
    });
    // ShipToCollection code to update shipping first and lastName.
    var FirstName = paymentForm.contactInfoFields.firstName.value;
    var LastName = paymentForm.contactInfoFields.lastName.value;
    if (currentBasket.custom.isCommercialPickup && COHelpers.isHALShippingEnabled() && !empty(FirstName) && !empty(LastName)) {
        Transaction.wrap(function () {
            currentBasket.defaultShipment.shippingAddress.setFirstName(FirstName);
            currentBasket.defaultShipment.shippingAddress.setLastName(LastName);
        });
    }
    if (bopisEnabled && basketHasBopisShipment && !empty(FirstName) && !empty(LastName)) {
        Transaction.wrap(function () {
            collections.forEach(currentBasket.shipments, function (shipment) {
                if (shipment.custom && 'fromStoreId' in shipment.custom && shipment.custom.fromStoreId) {
                    shipment.shippingAddress.setFirstName(FirstName);
                    shipment.shippingAddress.setLastName(LastName);
                    shipment.shippingAddress.setPhone(paymentForm.contactInfoFields.phone.value);
                    collections.forEach(shipment.productLineItems, function (PLI) { // eslint-disable-line
                        PLI.custom.fromStoreId = shipment.custom.fromStoreId; // eslint-disable-line
                        instorePickupStoreHelper.setStoreInProductLineItem(shipment.custom.fromStoreId, PLI);
                    });
                }
            });
        });
    }
    // Remove HAL location type and HAL location ID for non HAL orders.
    if (!currentBasket.custom.isCommercialPickup) {
        Transaction.wrap(function () {
            currentBasket.defaultShipment.shippingAddress.custom.HALLocationType = '';
            currentBasket.defaultShipment.shippingAddress.custom.HALLocationID = '';
        });
    }
    // Creates a new order.
    if (!empty(session.custom.orderNumber) && currentBasket.getPaymentInstruments(Constants.AURUS_OXXO).length > 0) {
        var order = COHelpers.createOrder(currentBasket, session.custom.orderNumber);
    } else {
        order = COHelpers.createOrder(currentBasket);
        session.custom.orderNumber = order.orderNo;
    }
    if (!order) {
        errorLogger.error('!order {0}', LogHelper.getLoggingObject());
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // Set Purchase site value
    COHelpers.setOrderPurchaseSite(order);

    // Email signup - Checkout
    var email = order.customerEmail;
    if (Site.getCurrent().getCustomPreferenceValue('isMarketingAutoOptInEnabled') && !empty(email)) {
        var com = require('dw/object/CustomObjectMgr');
        const customObjectName = 'NewsLetterSignUp';
        var keyId = email;
        var objectDefinition = com.getCustomObject(customObjectName, keyId);
        if ((empty(objectDefinition))) {
            require('dw/system/Transaction').wrap(function () {
                com.createCustomObject(customObjectName, keyId);
            });
        }
    }
    // get device ID  for accertify
    var getTID = req.querystring.getTID;
    // Set customerCountry to the order custom attribute
    Transaction.wrap(function () {
        // eslint-disable-next-line no-undef
        order.custom.customerCountry = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
        order.custom.accertifyInAuthTransactionID = !empty(getTID) ? getTID : '';
    });
    // SKU Mapping Logic
    var itemsMapping = [];
    var plis = order.allProductLineItems.iterator();
    while (plis.hasNext()) {
        var pli = plis.next();
        var itemMapping = [
            pli.productID,
            pli.custom.sku,
            pli.productName,
            pli.price.value + ' ' + pli.price.currencyCode,
            pli.quantityValue
        ].join('|');
        itemsMapping.push(itemMapping);
    }
    Transaction.wrap(function () {
        order.custom.itemsMapping = itemsMapping.join('\n');
    });
    // klarna modifications 22.5
    if (order && !empty(order.custom.kpClientToken)) {
        Transaction.wrap(function () {
            order.custom.kpClientToken = null;
        });
    }

    if (order && order.getPaymentInstruments('KLARNA_PAYMENTS') && order.getPaymentInstruments('KLARNA_PAYMENTS').length > 0) {
        delete session.privacy.aurusSessionID;
        delete session.privacy.aurusSessionExpirationTime;
    }
    var dwOrderPaymentInstrument = require('dw/order/PaymentInstrument');
    var orderPaymentInstruments = order.getPaymentInstruments();
    var paymentMethods = '';
    var selectedPIUUID = null;
    if (!empty(orderPaymentInstruments)) {
        collections.forEach(orderPaymentInstruments, function (paymentInstrument) {
            if (paymentInstrument.getPaymentMethod() === 'Paymetric' || paymentInstrument.getPaymentMethod() === 'CREDIT_CARD' || paymentInstrument.getPaymentMethod() === 'AURUS_CREDIT_CARD') {
                selectedPIUUID = paymentInstrument.creditCardNumberLastDigits;
            }
            paymentMethods += empty(paymentMethods) ? paymentInstrument.getPaymentMethod() : '&' + paymentInstrument.getPaymentMethod();
        });
    }

    // Set the order payment method to the order custom attribute
    if (!empty(paymentMethods)) {
        Transaction.wrap(function () {
            order.custom.paymentMethodID = paymentMethods;
        });
    }

    var customerGroups = '';
    var customerGroupObj = order.customer.customerGroups;

    for (var customerGroup in customerGroupObj) { // eslint-disable-line
        customerGroups = empty(customerGroups) ? customerGroups = customerGroupObj[customerGroup].ID : customerGroups + ',' + customerGroupObj[customerGroup].ID;
    }

    Transaction.wrap(function () {
        const MaoConstants = require('*/cartridge/scripts/MaoConstants');
        var applePayPaymentInstruments = order.getPaymentInstruments('DW_APPLE_PAY');
        var salesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.defaultSapSalesDocumentTypeFMS;
        var vipPaymentInstruments = order.getPaymentInstruments('VIP_POINTS');
        if (vipPaymentInstruments.length > 0) {
            salesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.vipSapSalesDocumentTypeFMS;
        } else if (applePayPaymentInstruments.length > 0) {
            salesDocumentTypeFMS = MaoConstants.Extended.sapSalesDocumentTypeFMS.applepaySapSalesDocumentTypeFMS;
        }

        if (!Object.prototype.hasOwnProperty.call(order.custom, 'orderReasonFMS')) {
            order.custom.orderReasonFMS = MaoConstants.Extended.orderReasonFMS;
        }

        order.custom.sapSalesDocumentTypeFMS = salesDocumentTypeFMS;
        order.custom.customerGroups = customerGroups;
    });
    // Set isEmployeeOrder boolean attribute for Employee Orders
    require('*/cartridge/scripts/util/SetOrderStatus').setEmployeeOrder(order);

    if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && vipDataHelpers.isVIPCustomerOrder(req.currentCustomer)) {
        Transaction.wrap(function () {
            order.custom.isVipOrder = true;
        });
    }

    // Set bopis order attributes.
    if (bopisEnabled) {
        var basketHasOnlyBopis = (order && order.shipments) ? instorePickupStoreHelper.basketHasOnlyBOPISProducts(order.shipments) : false;
        var basketHasMixedOrders = (order && order.shipments && order.shipments.length > 1 && instorePickupStoreHelper.basketHasInStorePickUpShipment && !basketHasOnlyBopis) ? true : false; // eslint-disable-line
        Transaction.wrap(function () {
            order.custom.isBOPISOrder = basketHasOnlyBopis;
            order.custom.isMixedBOPISOrder = basketHasMixedOrders;
        });
    }

    // Set Holiday Season order level attribute to identify holiday and non holiday return period
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

    // Save Shoprunner Token in Order Level for Each Order if Exist
    if (Site.getCurrent().getCustomPreferenceValue('sr_enabled')) {
        var ShopRunner = require('*/cartridge/scripts/ShopRunner');
        ShopRunner.PlaceOrderAppend(res); // eslint-disable-line

        let orderContainsPreorder = cartHelper.hasPreOrderItems(currentBasket);
        res.setViewData({
            orderContainsPreorder: orderContainsPreorder
        });
    }
    // Set MAO Order Type
    require('*/cartridge/scripts/util/SetOrderStatus').setOrderType(order);

    // Set the customerName if not set already
    require('*/cartridge/scripts/util/SetOrderStatus').setCustomerName(order);

    // Set the CSR customer agent Email ID
    require('*/cartridge/scripts/util/SetOrderStatus').setCSREmailAddress(order, req.currentCustomer.raw);
    if (paymentForm.paymentMethod.value === Constants.AURUS_SAFETYPAY || order.custom.paymentMethodID === Constants.AURUS_SAFETYPAY) {
        if (order) {
            var safetyPayCheckoutSessionModel = require('*/cartridge/scripts/util/checkoutSessionHelper');
            safetyPayCheckoutSessionModel.saveSafetypayOrder(order);
        }
        // log the order details for dataDog.
        if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
            orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
        }
        res.json({
            error: false,
            Safety_pay: true
        });
        return next();
    }

    // Handles payment authorization
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
    var paymentErrorMessage = null;
    var paymentErrorCode = null;
    if (!handlePaymentResult.error) {
        // Payment status ok
        if (order.getCustom().onHold) {
            // Payment on hold
            session.custom.currentOrder = null;
            if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                Transaction.wrap(function () {
                    order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
                });
            } else {
                COHelpers.sendConfirmationEmail(order, req.locale.id);
            }
        } else {
            // Fail order if Klarna status is PENDING
            var handlePendingKlarnaOrderResult = COHelpers.handlePendingKlarnaOrder(order);
            if (handlePendingKlarnaOrderResult && handlePendingKlarnaOrderResult.error) {
                // log the order details for dataDog.
                if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                    paymentErrorMessage = 'Klarna status is pending';
                    orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, true, paymentErrorMessage));
                }
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                return next();
            }

            // Payment approved
            // Fraud Protection Check
            var fraudDetectionStatus = require('*/cartridge/modules/providers').get('FraudScreen', order).validate();
            if (fraudDetectionStatus === 'accept') {
                // Initializing eGift order level status attribute
                var eGiftCardLineItems = giftCardHelper.getEGiftCardLineItems(order);
                if (eGiftCardLineItems.length > 0) {
                    Transaction.wrap(function () {
                        order.custom.eGiftCardStatus = 'READY_FOR_PROCESSING';
                    });
                }
                // Fraud check approved
                var placeOrderResult = COHelpers.placeOrder(order);

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

                if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                    Transaction.wrap(function () {
                        order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
                    });
                } else {
                    COHelpers.sendConfirmationEmail(order, req.locale.id);
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
                basketHasGCPaymentInstrument = order ? giftCardHelper.basketHasGCPaymentInstrument(order) : false;
                if (basketHasGCPaymentInstrument) {
                    giftcardsHooks.reverseGiftCardsAmount(order);
                    Transaction.wrap(function () {
                        order.trackOrderChange('Reverse Gift Card Amount');
                    });
                }
                // Aurus Legacy Check
                if (!empty(Site.current.getCustomPreferenceValue('enableAurusPay')) && !Site.current.getCustomPreferenceValue('enableAurusPay')) {
                    // Make a call to XiPay to do void authorization if secondary authorization site preference is enabled for PayPal
                    // "isEnabled" site preference and valid payment instrument check is already there in "doVoidAuthorization" method. So no need to put additional checks here.
                    var paymetricXiPayHelper = require('int_paymetric/cartridge/scripts/util/paymetricXiPayHelper');
                    paymetricXiPayHelper.doVoidAuthorization(order, 'PayPal');
                    var orderHasEGC = giftCardHelper.basketHasGiftCardItems(order).eGiftCards;
                    if (orderHasEGC) {
                        paymetricXiPayHelper.doVoidAuthorization(order, 'Paymetric');
                    }
                }
                Transaction.wrap(function () {
                    order.trackOrderChange('Order Failed Reason: Fraud Detected by Accertify');
                });
                COHelpers.failOrder(order);

                currentBasket = BasketMgr.getCurrentBasket();
                if (currentBasket && vipDataHelpers.isVIPOrder(currentBasket)) {
                    vipHooks.reverseVipPoints(currentBasket);
                    Transaction.wrap(function () {
                        order.trackOrderChange('Reverse Vip points');
                    });
                }
                COHelpers.sendFraudNotificationEmail(order);
                // log the order details for dataDog.
                if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                    orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
                }
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                /* res.json({
                    error: true,
                    cartError: true,
                    redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus).toString(),
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });*/

                return next();
            }
        }

        // Update order status to ready for export
        require('*/cartridge/modules/providers').get('OrderStatus', order).handleReadyForExport();
    } else {
        // Reverse Auth If any error in Payment
        basketHasGCPaymentInstrument = order ? giftCardHelper.basketHasGCPaymentInstrument(order) : false;
        errorLogger.error('basketHasGCPaymentInstrument {0}', basketHasGCPaymentInstrument);
        if (basketHasGCPaymentInstrument) {
            giftcardsHooks.reverseGiftCardsAmount(order);
            Transaction.wrap(function () {
                order.trackOrderChange('Reverse Gift Card Amount');
            });
        }

        COHelpers.failOrder(order);

        currentBasket = BasketMgr.getCurrentBasket();
        if (currentBasket && vipDataHelpers.isVIPOrder(currentBasket)) {
            vipHooks.reverseVipPoints(currentBasket);
            Transaction.wrap(function () {
                order.trackOrderChange('Reverse Vip points');
            });
        }
        // log the order details for dataDog.
        if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
            paymentErrorMessage = handlePaymentResult.errorMessage ? handlePaymentResult.errorMessage : Resource.msg('error.handlePayment.msg', 'checkout', null);
            paymentErrorCode = handlePaymentResult.errorCode ? handlePaymentResult.errorCode : null;
            orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, true, paymentErrorMessage, paymentErrorCode));
        }
        res.json({
            error: true,
            errorMessage: handlePaymentResult.errorMessage ? handlePaymentResult.errorMessage : Resource.msg('error.handlePayment.msg', 'checkout', null)
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

    // TODO: Exposing a direct route to an Order, without at least encoding the orderID
    //  is a serious PII violation.  It enables looking up every customers orders, one at a
    //  time.
    if (customer.registered) {
        var wallet = customer.getProfile().getWallet();
        var paymentMethod = isAurusEnabled ? 'AURUS_CREDIT_CARD' : dwOrderPaymentInstrument.METHOD_CREDIT_CARD;
        var paymentInstruments = wallet.getPaymentInstruments(paymentMethod);
        if (selectedPIUUID) {
            Transaction.wrap(function () {
                for (var i = 0; i < paymentInstruments.length; i++) {
                    if (paymentInstruments[i].creditCardNumberLastDigits === selectedPIUUID && paymentInstruments.length === 1 && !paymentInstruments[i].custom.defaultPaymentCard) {
                        paymentInstruments[i].custom.defaultPaymentCard = true;
                    } else if (paymentInstruments[i].custom && !('defaultPaymentCard' in paymentInstruments[i].custom)) {
                        paymentInstruments[i].custom.defaultPaymentCard = false;
                    }
                }
            });
        }
    }

    delete session.custom.orderNumber;
    // Delete cached giftcard related values
    delete session.privacy.giftCards;
    delete session.privacy.giftCardsResponse;

    var emailSignUp = req.querystring.emailSignUp;
    if (Site.getCurrent().getCustomPreferenceValue('isMarketingAutoOptInEnabled')) {
        emailSignUp = true;
    }
    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        order_checkout_optin: emailSignUp,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });

    return next();
});

server.append('PlaceOrder', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var viewData = res.getViewData();
    var paymentForm = server.forms.getForm('billing');
    var smsUpdates = paymentForm.contactInfoFields.orderNotificationSmsOptIn
        ? paymentForm.contactInfoFields.orderNotificationSmsOptIn.value
        : '';
    if (!empty(smsUpdates)) {
        Transaction.wrap(function () {
            if (viewData.orderID) {
                var order = OrderMgr.getOrder(viewData.orderID);
                if (order) {
                    order.custom.isOptedInToNotifications = smsUpdates;
                }
            }
        });
    }

    next();
});

/**
 *  Handle Ajax payment (and billing) form submit
 */
server.replace(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var payPalHelper = require('*/cartridge/scripts/checkout/paypalHelpers');
        const giftCardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
        const vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
        const instorePickupStoreHelper = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
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
            this.emit('route:Complete', req, res);
            return;
        }

        var basketHasGiftCardItems = giftCardHelper.basketHasGiftCardItems(currentBasket);
        var basketHasOnlyEGiftCards = basketHasGiftCardItems.onlyEGiftCards;
        var basketHasOnlyBOPISProducts = instorePickupStoreHelper.basketHasOnlyBOPISProducts(currentBasket.shipments);
        var isCommercialPickup = currentBasket.custom.isCommercialPickup && COHelpers.isHALShippingEnabled();

        var result;
        // eslint-disable-next-line no-undef
        var hasPaypalToken = request.httpParameterMap.hasPaypalToken.booleanValue;
        if (hasPaypalToken) {
            result = payPalHelper.getPaypalResponse(req, res);
            if (result) {
                res.json(result);
                this.emit('route:Complete', req, res);
                return;
            }
        }

        // eslint-disable-next-line no-undef
        var isPaypal = request.httpParameterMap.isPaypal.booleanValue;
        if (isPaypal) {
            result = payPalHelper.hanldePaypalCallback(req, res);
            if (result) {
                res.json(result);
                this.emit('route:Complete', req, res);
                return;
            }
        }
        var isOrderTotalRedeemed = giftCardHelper.isOrderTotalRedeemed(currentBasket);
        if (isOrderTotalRedeemed) {
            if (currentBasket.getPaymentInstruments(giftCardHelper.gcPaymentMethodId).size() > 0) {
                var gcResult = giftCardHelper.handleGiftCardPayment(req, res);
                if (gcResult) {
                    res.json(gcResult);
                    // To Do - Handle mixed payments GC+CC
                    giftCardHelper.removeNonGcPaymentInstruments(currentBasket);
                    this.emit('route:Complete', req, res);
                    return;
                }
            }
        } else if (currentBasket.getPaymentInstruments(giftCardHelper.gcPaymentMethodId).size() > 0) {
            giftCardHelper.removeNonGcPaymentInstruments(currentBasket);
        }

        var isOrderTotalRedeemedByVip = vipDataHelpers.isOrderTotalRedeemedByVipPoints(currentBasket);
        if (isOrderTotalRedeemedByVip) {
            if (currentBasket.getPaymentInstruments(vipDataHelpers.VIPPaymentMethodId).size() > 0) {
                var vipResult = vipDataHelpers.handleVipPaymentMethod(req, res);
                if (vipResult) {
                    res.json(vipResult);
                    vipDataHelpers.removeNonVipPaymentInstruments(currentBasket);
                    this.emit('route:Complete', req, res);
                    return;
                }
            }
        }

        var PaymentManager = require('dw/order/PaymentMgr');
        var HookManager = require('dw/system/HookMgr');
        var Resource = require('dw/web/Resource');
        var Transaction = require('dw/system/Transaction');
        var StringUtils = require('dw/util/StringUtils');
        var Money = require('dw/value/Money');
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
                address2: { value: paymentForm.addressFields.address2 ? paymentForm.addressFields.address2.value : '' },
                city: { value: paymentForm.addressFields.city.value },
                postalCode: { value: paymentForm.addressFields.postalCode.value },
                countryCode: { value: paymentForm.addressFields.country.value }
            };

            if (Object.prototype.hasOwnProperty.call(paymentForm.addressFields, 'states')) {
                viewData.address.stateCode = { value: paymentForm.addressFields.states.stateCode.value };
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
        if (!PaymentManager.getPaymentMethod(paymentMethodIdValue) || !PaymentManager.getPaymentMethod(paymentMethodIdValue).paymentProcessor) {
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
            errorLogger.error('formFieldErrors paymentFormResult.error {0} : {1}', JSON.stringify(formFieldErrors), LogHelper.getLoggingObject());
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
        if (viewData.paymentMethod.value === 'KLARNA_PAYMENTS') {
            Transaction.wrap(function () {
                currentBasket.removeAllPaymentInstruments();
            });
            var userSession = req.session.raw;
            if (COHelpers.isKlarnaPaymentEnabled() || !empty(userSession.privacy.KlarnaPaymentsSessionID)) {
                var KlarnaSessionManager = require('*/cartridge/scripts/common/klarnaSessionManager');

                var klarnaSessionManager = new KlarnaSessionManager();
                klarnaSessionManager.createOrUpdateSession();
            }
        }

        res.setViewData(paymentFormResult.viewData);

        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            // eslint-disable-next-line no-shadow
            var BasketMgr = require('dw/order/BasketMgr');
            var HookMgr = require('dw/system/HookMgr');
            var PaymentMgr = require('dw/order/PaymentMgr');
            var PaymentInstrument = require('dw/order/PaymentInstrument');
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
                }
                if (billingForm.shippingAddressUseAsBillingAddress.value && !basketHasOnlyEGiftCards && !basketHasOnlyBOPISProducts && !empty(currentBasket.defaultShipment.shippingAddress) && !isCommercialPickup) {
                    COHelpers.copyBillingAddressToBasket(
                        currentBasket.defaultShipment.shippingAddress, currentBasket);
                } else {
                    billingAddress.setFirstName(billingData.address.firstName.value);
                    billingAddress.setLastName(billingData.address.lastName.value);
                    billingAddress.setAddress1(billingData.address.address1.value);
                    billingAddress.setAddress2(billingData.address.address2.value);
                    billingAddress.setCity(billingData.address.city.value);
                    billingAddress.setPostalCode(billingData.address.postalCode.value);
                    if (Object.prototype.hasOwnProperty.call(billingData.address, 'stateCode')) {
                        billingAddress.setStateCode(billingData.address.stateCode.value);
                    }
                    billingAddress.setCountryCode(billingData.address.countryCode.value);
                    if (req.currentCustomer.profile) {
                        if (billingForm.addressFields.saveToAccount && billingForm.addressFields.saveToAccount.checked) {
                            var CustomerMgr = require('dw/customer/CustomerMgr');
                            var addressId = req.querystring.addressID;
                            var newAddress = {
                                firstName: billingData.address.firstName.value,
                                lastName: billingData.address.lastName.value,
                                address1: billingData.address.address1.value,
                                address2: billingData.address.address2.value,
                                city: billingData.address.city.value,
                                postalCode: billingData.address.postalCode.value,
                                country: billingData.address.countryCode.value,
                                states: {
                                    stateCode: billingData.address.stateCode.value
                                }
                            };
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
                if (basketHasOnlyEGiftCards) {
                    COHelpers.copyBillingAddressToShippingAddress(billingAddress, currentBasket);
                }
            });

            // Server side validation for billing info
            var inputFieldsValidation = COHelpers.validateInputFields(currentBasket);
            if (inputFieldsValidation.error && Object.keys(inputFieldsValidation.billingAddressErrors).length > 0) {
                errorLogger.error('inputFieldsValidation.error {0} : {1}', JSON.stringify(inputFieldsValidation), LogHelper.getLoggingObject());
                res.json({
                    form: billingForm,
                    fieldErrors: [],
                    serverErrors: [inputFieldsValidation.genericErrorMessage],
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

            if (!(empty(billingData.error) && !billingData.error && billingData.paymentMethod.value === 'KLARNA_PAYMENTS') && billingData.paymentMethod.value !== Constants.AURUS_OXXO && billingData.paymentMethod.value !== Constants.AURUS_SAFETYPAY) {
                // Validate payment instrument
                var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
                var paymentCard = PaymentMgr.getPaymentCard(billingData.paymentInformation.cardType.value);

                var applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
                    req.currentCustomer.raw,
                    req.geolocation.countryCode,
                    null
                );

                if (!applicablePaymentCards.contains(paymentCard)) {
                    // Invalid Payment Instrument
                    var invalidPaymentMethod = Resource.msg('error.payment.not.valid', 'checkout', null);
                    delete billingData.paymentInformation;
                    res.json({
                        form: billingForm,
                        fieldErrors: [],
                        serverErrors: [invalidPaymentMethod],
                        error: true
                    });
                    return;
                }
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
            // Checking for save as default card
            var isDefaultCard = !empty(billingForm.creditCardFields) && !empty(billingForm.creditCardFields.defaultCard) ? billingForm.creditCardFields.defaultCard.checked : false;
            if (billingData && billingData.paymentInformation) {
                billingData.paymentInformation.defaultCard = isDefaultCard;
            }
            if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
                result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
                    'Handle',
                    currentBasket,
                    billingData.paymentInformation
                );
            } else {
                result = HookMgr.callHook('app.payment.processor.default', 'Handle');
            }
            // need to invalidate credit card fields
            if (result.error) {
                errorLogger.error('Handle error {0} : {1}', JSON.stringify(result), LogHelper.getLoggingObject());
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

            if ((empty(billingData.error) && !billingData.error && billingData.paymentMethod.value === 'KLARNA_PAYMENTS')) {
                var KlarnaHelper = require('*/cartridge/scripts/util/klarnaHelper');
                var splitAmount = KlarnaHelper.getSplitPaymentAmount(basketModelObject.billing.payment.selectedPaymentInstruments[0].amount);
                var installmentAmount = dw.util.StringUtils.formatMoney(new dw.value.Money(splitAmount, currentBasket.getCurrencyCode()));
                Transaction.wrap(function () {
                    basketModelObject.billing.payment.selectedPaymentInstruments[0].amountFormatted = StringUtils.formatMoney(new Money(basketModelObject.billing.payment.selectedPaymentInstruments[0].amount, currentBasket.getCurrencyCode()));
                    basketModelObject.billing.payment.selectedPaymentInstruments[0].name = KlarnaHelper.getKlarnaPaymentMethodName();
                    basketModelObject.billing.payment.selectedPaymentInstruments[0].klarnaSplitMsg = Resource.msgf('klarna.confirmation.split.amount', 'checkout', null, installmentAmount);
                });
            }

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
 *  Handle Ajax Validate Billing form submit
 */
server.post(
    'ValidateBilling',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var paymentForm = server.forms.getForm('billing');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        // verify billing form data
        var billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);
        var formFieldErrors = [];
        var serverErrors = [];
        if (Object.keys(billingFormErrors).length) {
            formFieldErrors.push(billingFormErrors);
        }
        if (formFieldErrors.length) {
            // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: formFieldErrors,
                serverErrors: serverErrors,
                error: true
            });
        } else {
            res.json({
                form: paymentForm,
                fieldErrors: [],
                serverErrors: [],
                error: false
            });
        }
        // eslint-disable-next-line consistent-return
        return next();
    });

server.replace('Get', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var basket = BasketMgr.getCurrentBasket();
    if (!basket) {
        res.json({
            redirectUrl: URLUtils.url('Cart-Show').toString(),
            error: true
        });

        return next();
    }
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var instorePickupStoreHelper = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
    var Site = require('dw/system/Site');
    var isBOPISEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled');
    var basketHasOnlyBOPISProducts = instorePickupStoreHelper.basketHasOnlyBOPISProducts(basket.shipments);
    var isCommercialPickup = basket.custom.isCommercialPickup && COHelpers.isHALShippingEnabled();

    var shipmentMerged = instorePickupStoreHelper.mergeShipmentsInBasket(basket);
    COHelpers.ensureNoEmptyShipments(req);

    if (usingMultiShipping === true && basket.shipments.length < 2) {
        req.session.privacyCache.set('usingMultiShipping', false);
        usingMultiShipping = false;
    }

    if (!basket.billingAddress) {
        var countryCode = Locale.getLocale(req.locale.id).country;
        var isInternationalBillingAddress = 'isInternationalBillingAddressEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isInternationalBillingAddressEnabled');
        if (req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress &&
            (isInternationalBillingAddress || req.currentCustomer.addressBook.preferredAddress.countryCode === countryCode)) {
            // Copy over preferredAddress (use addressUUID for matching)
            COHelpers.copyBillingAddressToBasket(
                req.currentCustomer.addressBook.preferredAddress, basket);
        } else {
            // Copy over first shipping address (use shipmentUUID for matching)
            var copyBillingAddress = basket.defaultShipment.shippingAddress;
            var checkShipment = basket.defaultShipment;
            if (basket.defaultShipment.shippingMethodID === 'eGift_Card' || (isBOPISEnabled && basket.defaultShipment.shippingMethod.custom.storePickupEnabled) || isCommercialPickup) {
                collections.forEach(basket.shipments, function (shipment) { // eslint-disable-line no-shadow
                    if (shipment.shippingMethodID !== 'eGift_Card' && (!shipment.shippingMethod.custom.storePickupEnabled) && (shipment.shippingAddress && shipment.shippingAddress.address1) && !isCommercialPickup) {
                        checkShipment = shipment;
                        copyBillingAddress = shipment.shippingAddress;
                        return;
                    }
                });
            }
            if (copyBillingAddress && !checkShipment.shippingMethod.custom.storePickupEnabled) {
                COHelpers.copyBillingAddressToBasket(copyBillingAddress, basket);
            }
        }
    }

    var userSession = req.session.raw;
    if (COHelpers.isKlarnaPaymentEnabled() || !empty(userSession.privacy.KlarnaPaymentsSessionID)) {
        var KlarnaSessionManager = require('*/cartridge/scripts/common/klarnaSessionManager');

        var klarnaSessionManager = new KlarnaSessionManager();
        klarnaSessionManager.createOrUpdateSession();
    }

    var currentLocale = Locale.getLocale(req.locale.id);
    var allValid = COHelpers.ensureValidShipments(basket);
    var basketModel = new OrderModel(
        basket,
        { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
    );

    res.json({
        order: basketModel,
        customer: new AccountModel(req.currentCustomer),
        basketHasOnlyBOPISProducts: basketHasOnlyBOPISProducts,
        shipmentMerged: shipmentMerged,
        error: !allValid,
        message: allValid ? '' : Resource.msg('error.message.shipping.addresses', 'checkout', null)
    });
    return next();
});
module.exports = server.exports();
