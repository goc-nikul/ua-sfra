'use strict';

var server = require('server');
server.extend(module.superModule);

var Transaction = require('dw/system/Transaction');
var HookMgr = require('dw/system/HookMgr');

server.prepend('Checkout', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var availabilityHelper = require('*/cartridge/scripts/helpers/availabilityHelpers');
    var CartModel = require('*/cartridge/models/cart');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');

    var currentBasket = BasketMgr.getCurrentBasket();
    var cartModel = new CartModel(currentBasket);
    var validatedProducts = validationHelpers.validateProductsInventory(currentBasket, 'PlaceOrder');

    // This below code verifies the inventory limit exceeded and realTime inventory check
    if (validatedProducts.availabilityError) {
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
        this.emit('route:Complete', req, res);
        return;
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
        this.emit('route:Complete', req, res);
        return;
    }
    // Validate phone number
    var phoneNumberRequired = COHelpers.isPhoneNumberMandatory();
    var phoneNumber = paymentForm.contactInfoFields.phone.value;
    var updatedPhone = phoneNumber ? phoneNumber.split(' ').join('').replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-') : phoneNumber;
    paymentForm.contactInfoFields.phone.value = updatedPhone;
    var isValidPhoneNumber = COHelpers.validatephoneNumber(updatedPhone, null);
    if (!isValidPhoneNumber) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.message.areaCode', 'forms', null),
            zipErrorCode: 'Invalid Phone'
        });
        this.emit('route:Complete', req, res);
        return;
    }
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
                this.emit('route:Complete', req, res);
                return;
            }
        } else {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.message.required', 'forms', null)
            });
            this.emit('route:Complete', req, res);
            return;
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
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    if (inputFieldsValidation.error && ((Object.keys(inputFieldsValidation.shippingAddressErrors).length > 0) || Object.keys(inputFieldsValidation.giftMessageErrors).length > 0)) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: inputFieldsValidation.genericErrorMessage
        });
        this.emit('route:Complete', req, res);
        return;
    } else if (inputFieldsValidation.error && Object.keys(inputFieldsValidation.billingAddressErrors).length > 0) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument'
            },
            errorMessage: inputFieldsValidation.genericErrorMessage
        });
        this.emit('route:Complete', req, res);
        return;
    } else if (inputFieldsValidation.error && Object.keys(inputFieldsValidation.contactInfoErrors).length > 0) {
        res.json({
            error: true,
            errorMessage: inputFieldsValidation.genericErrorMessage
        });
        this.emit('route:Complete', req, res);
        return;
    }
    next();
});

server.append('Checkout', function (req, res, next) {
    if (res.viewData.error || !req.session.privacyCache.get('ZipOrderId') || !require('dw/order/OrderMgr').getOrder(req.session.privacyCache.get('ZipOrderId'))) {
        // Since error info already handled in link cartidges, just ending a route here.
        return next();
    }
    var order = require('dw/order/OrderMgr').getOrder(req.session.privacyCache.get('ZipOrderId'));
    // Email signup - Checkouts
    var emailSignUp = req.querystring.emailSignUp;
    var email = order.customerEmail;
    if (emailSignUp === 'true' && !empty(email)) {
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

    Transaction.wrap(function () {
        order.custom.customerGroups = customerGroups;
        order.custom.customerLocale = req.locale.id;
        order.custom.customerCountry = session.custom.currentCountry || req.locale.id.slice(-2).toUpperCase();
    });

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
                    var paymentForm = server.forms.getForm('billing');
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

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);
    // delete vertex hasing session
    req.session.privacyCache.set('taxRequestHash', null);
    return next();
});

module.exports = server.exports();
