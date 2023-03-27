'use strict';

var BasketMgr = require('dw/order/BasketMgr');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.extend(module.superModule);

/**
 * Handle Ajax shipping form submit
 */
server.replace(
    'SubmitShipping',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    csrfProtection.generateToken,
    function (req, res, next) {
        var Locale = require('dw/util/Locale');
        var Transaction = require('dw/system/Transaction');
        var collections = require('*/cartridge/scripts/util/collections');

        var OrderModel = require('*/cartridge/models/order');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var currentBasket = BasketMgr.getCurrentBasket();

        // DO NOT remove this as it creates issues with fraud
        if (currentBasket && 'paypalAlreadyHandledPayerID' in currentBasket.custom && currentBasket.custom.paypalAlreadyHandledPayerID) {
            let paymentInstruments = currentBasket.paymentInstruments;
            for (let paymentInstrument = 0; paymentInstrument < paymentInstruments.length; paymentInstrument++) {
                if (paymentInstruments[paymentInstrument] && paymentInstruments[paymentInstrument].paymentMethod === 'PayPal') {
                    Transaction.wrap(function () { // eslint-disable-line no-loop-func
                        delete currentBasket.custom.paypalAlreadyHandledPayerID;
                        currentBasket.removePaymentInstrument(paymentInstruments[paymentInstrument]);
                    });
                    break;
                }
            }
            currentBasket = BasketMgr.getCurrentBasket();
        }

        var formData = req.form;
        var shiptoCollectionPoint = formData && formData.shiptoCollectionPoint === 'true' ? true : false; // eslint-disable-line

        var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
        var shipment;

        if (shipmentUUID) {
            shipment = ShippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
        } else {
            shipment = currentBasket.defaultShipment;
        }

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

        var form = server.forms.getForm('shipping');
        var result = {};

        // verify shipping form data
        var shippingFormErrors = COHelpers.validateShippingForm(form.shippingAddress.addressFields);

        // Do not validate shipping form if customer opted for shiptoCollectionPoint
        if (shiptoCollectionPoint) {
            var billingForms = server.forms.getForm('billing');
            var billingAddress = currentBasket.billingAddress;
            let viewData = res.getViewData();
            delete viewData.fieldErrors;
            viewData.error = false;
            viewData.shipmentUUID = req.form.shipmentUUID;
            viewData.shippingMethod = shipment.shippingMethodID;
            viewData.shiptoCollectionPoint = true;
            res.setViewData(viewData);
            COHelpers.setEmptyValueBillingForm(billingAddress, billingForms);
        } else if (currentBasket && currentBasket.custom) { // eslint-disable-line
            Transaction.wrap(function () {
                currentBasket.custom.isCommercialPickup = false;
            });
        }

        if (Object.keys(shippingFormErrors).length > 0 && (!Site.current.getCustomPreferenceValue('isBOPISEnabled') || !shipment.shippingMethod.custom.storePickupEnabled) && !shiptoCollectionPoint) {
            req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'invalid');

            res.json({
                form: form,
                fieldErrors: [shippingFormErrors],
                serverErrors: [],
                error: true
            });
        } else {
            req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'valid');

            result.address = {
                firstName: form.shippingAddress.addressFields.firstName.value,
                lastName: form.shippingAddress.addressFields.lastName.value,
                address1: form.shippingAddress.addressFields.address1.value,
                address2: form.shippingAddress.addressFields.address2 ? form.shippingAddress.addressFields.address2.value : '',
                city: form.shippingAddress.addressFields.city ? form.shippingAddress.addressFields.city.value : '',
                postalCode: form.shippingAddress.addressFields.postalCode ? form.shippingAddress.addressFields.postalCode.value : '',
                countryCode: form.shippingAddress.addressFields.country.value,
                phone: form.shippingAddress.addressFields.phone.value
            };
            if (Object.prototype.hasOwnProperty
                .call(form.shippingAddress.addressFields, 'states')) {
                result.address.stateCode =
                    form.shippingAddress.addressFields.states.stateCode.value;
            }

            result.shippingBillingSame =
                form.shippingAddress.shippingAddressUseAsBillingAddress.value;

            result.shippingMethod = form.shippingAddress.shippingMethodID.value
                ? form.shippingAddress.shippingMethodID.value.toString()
                : null;

            result.isGift = form.shippingAddress.isGift.checked;

            result.giftMessage = result.isGift ? form.shippingAddress.giftMessage.value : null;

            result.gitItems = req.form.selected_gift_items ? req.form.selected_gift_items : null;
            var userSession = req.session.raw;
            if (COHelpers.isKlarnaPaymentEnabled() || !empty(userSession.privacy.KlarnaPaymentsSessionID)) {
                var KlarnaSessionManager = require('*/cartridge/scripts/common/klarnaSessionManager');

                var klarnaSessionManager = new KlarnaSessionManager();
                klarnaSessionManager.createOrUpdateSession();
            }

            res.setViewData(result);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var AccountModel = require('*/cartridge/models/account');
                var shippingData = res.getViewData();
                var StoreMgr = require('dw/catalog/StoreMgr');
                var storeId = shippingData.storeId;
                var store = StoreMgr.getStore(storeId);
                var viewDataShipmentUUID = shippingData.shipmentUUID;
                var viewDataShipment = viewDataShipmentUUID ? ShippingHelper.getShipmentByUUID(currentBasket, viewDataShipmentUUID) : currentBasket.defaultShipment;
                var basketHasOnlyBOPISProducts = false;
                if (Site.current.getCustomPreferenceValue('isBOPISEnabled') && storeId) {
                    delete shippingData.fieldErrors;
                    shippingData.error = false;
                    ShippingHelper.markShipmentForPickup(viewDataShipment, storeId);
                    Transaction.wrap(function () {
                        var storeAddress = {
                            address: {
                                firstName: !empty(form.primaryContact.personFirstName) ? form.primaryContact.personFirstName.value : store.name,
                                lastName: !empty(form.primaryContact.personLastName) ? form.primaryContact.personLastName.value : '',
                                address1: store.address1,
                                address2: store.address2,
                                city: store.city,
                                stateCode: store.stateCode,
                                postalCode: store.postalCode,
                                countryCode: store.countryCode.value,
                                phone: store.phone
                            },
                            shippingMethod: shippingData.shippingMethod
                        };
                        if (currentBasket.shipments.length < 2 && currentBasket.shipments[0].shippingMethod.custom.storePickupEnabled) {
                            var instorePickupStoreHelper = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
                            collections.forEach(currentBasket.shipments[0].productLineItems, function (productLi) {
                                if (productLi && productLi.product.custom.availableForInStorePickup) {
                                    instorePickupStoreHelper.setStoreInProductLineItem(storeId, productLi);
                                }
                                COHelpers.saveInstorePickUpContacts(productLi, '', '');
                                var pickUpNotification = {};
                                var primaryContact = COHelpers.saveInstorePickUpContacts(productLi, form.primaryContact, 'primary');
                                pickUpNotification.primaryContact = primaryContact;

                                if (form.secondaryContact.someOneMayPickup.checked) {
                                    var secondaryContact = COHelpers.saveInstorePickUpContacts(productLi, form.secondaryContact, 'secondary');
                                    pickUpNotification.secondaryContact = secondaryContact;
                                }
                            });
                        }
                        COHelpers.copyShippingAddressToShipment(storeAddress, viewDataShipment);

                        COHelpers.setGift(viewDataShipment, false, null);
                    });
                    var instorePickupStoreHelper = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
                    basketHasOnlyBOPISProducts = instorePickupStoreHelper.basketHasOnlyBOPISProducts(currentBasket.shipments);
                } else {
                    if (shippingData.shiptoCollectionPoint) {
                        delete shippingData.fieldErrors;
                    } else {
                        COHelpers.copyShippingAddressToShipment(
                                shippingData,
                                currentBasket.defaultShipment
                        );
                    }

                    var giftResult = COHelpers.setGift(
                        currentBasket.defaultShipment,
                        shippingData.isGift,
                        shippingData.giftMessage,
                        shippingData.gitItems
                    );

                    if (giftResult.error) {
                        res.json({
                            error: giftResult.error,
                            fieldErrors: [],
                            serverErrors: [giftResult.errorMessage]
                        });
                        return;
                    }
                    var isHALbasket = COHelpers.isHALShippingEnabled() && currentBasket && currentBasket.custom && currentBasket.custom.isCommercialPickup ? currentBasket.custom.isCommercialPickup : false;
                    var billingForm = server.forms.getForm('billing');
                    if (!isHALbasket) {
                        if (!currentBasket.billingAddress || form.shippingAddress.shippingAddressUseAsBillingAddress.value || billingForm.shippingAddressUseAsBillingAddress.value) {
                            var isInternationalBillingAddress = 'isInternationalBillingAddressEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isInternationalBillingAddressEnabled');
                            if (req.currentCustomer.addressBook &&
                                req.currentCustomer.addressBook.preferredAddress &&
                                !(billingForm.shippingAddressUseAsBillingAddress.value) &&
                                (isInternationalBillingAddress || req.currentCustomer.addressBook.preferredAddress.countryCode === Locale.getLocale(req.locale.id).country)) {
                                // Copy over preferredAddress (use addressUUID for matching)
                                COHelpers.copyBillingAddressToBasket(
                                    req.currentCustomer.addressBook.preferredAddress, currentBasket);
                            } else {
                                // Copy over first shipping address (use shipmentUUID for matching)
                                var copyBillingAddress = currentBasket.defaultShipment.shippingAddress;
                                var checkShipment = currentBasket.defaultShipment;
                                if (currentBasket.defaultShipment.shippingMethodID === 'eGift_Card' || (Site.current.getCustomPreferenceValue('isBOPISEnabled') && currentBasket.defaultShipment.shippingMethod.custom.storePickupEnabled)) {
                                    collections.forEach(currentBasket.shipments, function (shipment) { // eslint-disable-line no-shadow
                                        if (shipment.shippingMethodID !== 'eGift_Card' && (!shipment.shippingMethod.custom.storePickupEnabled) && (shipment.shippingAddress && shipment.shippingAddress.address1)) {
                                            checkShipment = shipment;
                                            copyBillingAddress = shipment.shippingAddress;
                                            return;
                                        }
                                    });
                                }
                                if (copyBillingAddress && !checkShipment.shippingMethod.custom.storePickupEnabled) {
                                    COHelpers.copyBillingAddressToBasket(copyBillingAddress, currentBasket);
                                }
                            }
                        }
                    }
                }
                // Server side validation for shipping and giftMessage info
                var inputFieldsValidation = COHelpers.validateInputFields(currentBasket);
                if (inputFieldsValidation.error && (Object.keys(inputFieldsValidation.shippingAddressErrors).length > 0 || Object.keys(inputFieldsValidation.giftMessageErrors).length > 0) && !shippingData.shiptoCollectionPoint) {
                    res.setStatusCode(500);
                    res.json({
                        error: true,
                        errorMessage: inputFieldsValidation.genericErrorMessage
                    });
                } else {
                    var giftCardShipment = currentBasket.getShipment('EGiftCardShipment');
                    if (giftCardShipment) {
                        COHelpers.copyShippingAddressToShipment(
                            shippingData,
                            giftCardShipment
                        );
                    }

                    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
                    if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                        req.session.privacyCache.set('usingMultiShipping', false);
                        usingMultiShipping = false;
                    }
                    var vipPoints;
                    var vipRenderedTemplate;
                    if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience')) {
                        const vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
                        vipPoints = vipDataHelpers.getVipPoints(currentBasket);
                        if (vipPoints) {
                            vipRenderedTemplate = (vipPoints && vipDataHelpers.getVipRenderingTemplate(vipPoints)) || null;
                        }
                    }
                    const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
                    giftcardHelper.updatePaymentTransaction(currentBasket);
                    var gcResults = null;
                    var renderedTemplate = null;
                    var basketHasGiftCard = giftcardHelper.basketHasGiftCardItems(currentBasket).giftCards;
                    if (!basketHasGiftCard && (empty(vipRenderedTemplate) || (vipPoints && vipPoints.partialPointsApplied))) {
                        var giftCardFormData = giftcardHelper.giftCardFormData(res.viewData.csrf);
                        renderedTemplate = giftCardFormData.templateContent;
                        gcResults = giftCardFormData.gcResults;
                    }

                    COHelpers.recalculateBasket(currentBasket);
                    var currentLocale = Locale.getLocale(req.locale.id);
                    var basketModelObject = new OrderModel(
                        currentBasket,
                        {
                            usingMultiShipping: usingMultiShipping,
                            // eslint-disable-next-line spellcheck/spell-checker
                            shippable: true,
                            countryCode: currentLocale.country,
                            containerView: 'basket'
                        }
                    );
                    var countryCode = request.locale && request.locale != 'default' ? request.locale.split('_')[1] : 'US'; // eslint-disable-line
                    var customerModel = new AccountModel(req.currentCustomer);
                    if (!empty(customerModel)) {
                        customerModel.countryCode = countryCode;
                    }
                    res.json({
                        customer: customerModel,
                        order: basketModelObject,
                        renderedTemplate: renderedTemplate,
                        vipRenderedTemplate: vipRenderedTemplate,
                        gcResults: gcResults,
                        basketHasGiftCard: basketHasGiftCard,
                        basketHasOnlyBOPISProducts: basketHasOnlyBOPISProducts,
                        form: shippingData.shiptoCollectionPoint ? '' : server.forms.getForm('shipping'),
                        shipToCollectionAddress: shippingData.shiptoCollectionPoint
                    });
                }
            });
        }

        return next();
    }
);

server.append('UpdateShippingMethodsList', function (req, res, next) {
    // Refresh Vertex error markers
    delete session.custom.VertexAddressSuggestionsError;
    next();
});

server.prepend(
    'UpdateShippingMethodsList',
    server.middleware.https,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var basket = BasketMgr.getCurrentBasket();
        if (!basket) {
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
        var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
        var shipment;
        if (shipmentUUID) {
            shipment = ShippingHelper.getShipmentByUUID(basket, shipmentUUID);
        } else {
            shipment = basket.defaultShipment;
        }
        if (!shipment) {
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
        var isShipToCollection = req.form.isShipToCollectionEnabled;
        if (basket && basket.custom && !empty(isShipToCollection)) {
            Transaction.wrap(function () {
                basket.custom.isCommercialPickup = isShipToCollection === 'true' ? true : false; // eslint-disable-line
            });
        }
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var isHALbasket = COHelpers.isHALShippingEnabled() && basket && basket.custom && basket.custom.isCommercialPickup ? basket.custom.isCommercialPickup : false;
        // Server side xss validation for shipping on change of shipping method
        if (basket && !isHALbasket) {
            var address = ShippingHelper.getAddressFromRequest(req);
            var fieldsValidation = COHelpers.validateInputFieldsForShippingMethod(address);
            if (fieldsValidation.error && (Object.keys(fieldsValidation.shippingAddressErrors).length > 0)) {
                res.setStatusCode(500);
                res.json({
                    error: true,
                    errorMessage: fieldsValidation.genericErrorMessage
                });
                this.emit('route:Complete', req, res);
                return;
            }
        }
        var currentCustomer = req.currentCustomer.raw;
        var isVIP = Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !empty(currentCustomer.profile) && 'vipAccountId' in currentCustomer.profile.custom && !empty(currentCustomer.profile.custom.vipAccountId);
        if (basket) {
            var shippingAddress = basket.getDefaultShipment().getShippingAddress();
            if (shippingAddress) {
                Transaction.wrap(function () {
                    if (typeof req.form.isOfficeAddress !== undefined && req.form.isOfficeAddress === 'true') {
                        shippingAddress.custom.isOfficeAddress = true;
                        shippingAddress.custom.sapCarrierCode = req.form.sapCarrierCode;
                    } else {
                        shippingAddress.custom.isOfficeAddress = false;
                        shippingAddress.custom.sapCarrierCode = '';
                    }
                });
            }
        }

        res.setViewData({
            isVIP: isVIP
        });

        next();
    }
);
server.prepend('SelectShippingMethod', function (req, res, next) {
    var currentBasket = BasketMgr.getCurrentBasket();
    var isShipToCollection = req.form.isShipToCollectionEnabled;
    if (currentBasket && currentBasket.custom && !empty(isShipToCollection)) {
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
           currentBasket.custom.isCommercialPickup = isShipToCollection === 'true' ? true : false; // eslint-disable-line
        });
    }
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var isHALbasket = COHelpers.isHALShippingEnabled() && currentBasket && currentBasket.custom && currentBasket.custom.isCommercialPickup ? currentBasket.custom.isCommercialPickup : false;
    // Server side xss validation for shipping on change of shipping method
    if (currentBasket && !isHALbasket) {
        var address = ShippingHelper.getAddressFromRequest(req);
        var fieldsValidation = COHelpers.validateInputFieldsForShippingMethod(address);
        if (fieldsValidation.error && (Object.keys(fieldsValidation.shippingAddressErrors).length > 0)) {
            res.setStatusCode(500);
            res.json({
                error: true,
                errorMessage: fieldsValidation.genericErrorMessage
            });
            this.emit('route:Complete', req, res);
            return;
        }
    }
    next();
});

server.get('GetCollectionPoints', function (req, res, next) {
    var result = {};
    try {
        // get ship to collection point stores
        var maxDistanceMiles = req.querystring.radius;
        var postalCode = req.querystring.postalCode;

        if ('collectionPointRadiusOptions' in Site.current.preferences.custom && !empty(Site.current.getCustomPreferenceValue('collectionPointRadiusOptions'))) {
            result.radiusOptions = JSON.parse(Site.current.getCustomPreferenceValue('collectionPointRadiusOptions'));
        }

        var halHelpers = require('*/cartridge/scripts/helpers/halHelper.js');
        if (postalCode && maxDistanceMiles) {
            var halPickupResults = halHelpers.getPickupLocationsByPostalCode(postalCode, parseInt(maxDistanceMiles)); // eslint-disable-line
            if (halPickupResults && halPickupResults.pickupLocations) {
                var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
                var convertedStoreHours = COHelpers.convertStoreWorkingHours(halPickupResults.pickupLocations);
                if (convertedStoreHours) {
                    halPickupResults.pickupLocations = convertedStoreHours;
                }
                result.collectionPoints = halPickupResults;
            }
        }

        var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
        var storesResultsHtml = renderTemplateHelper.getRenderedHtml(result, 'checkout/collectionPointLocator/collectionPointLocator');
        result.storesResultsHtml = storesResultsHtml;
        res.json(result);
    } catch (e) {
        res.json(result);
    }
    next();
});

server.post('SelectCollectionPoint', function (req, res, next) {
    var result = {};
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    try {
        var currentBasket = BasketMgr.getCurrentBasket();
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var httpParameterMap = request.httpParameterMap; // eslint-disable-line
        var selectedAddress = httpParameterMap && httpParameterMap.selectedCollectionPoint ? httpParameterMap.selectedCollectionPoint.stringValue : '';
        selectedAddress = selectedAddress ? JSON.parse(selectedAddress) : null;
        var storeAddress = {};
        if (currentBasket) {
            if (selectedAddress) {
                var countryCode = request.locale && request.locale != 'default' ? request.locale.split('_')[1] : 'US'; // eslint-disable-line
                var currentCustomer = req.currentCustomer.raw;
                var customerFirstName = Site.current.getCustomPreferenceValue('shippingFirstName') || 'Collection';
                var customerLastName = Site.current.getCustomPreferenceValue('shippingLastName') || 'Point';
                if (currentCustomer && currentCustomer.profile) {
                    customerFirstName = currentCustomer.profile.firstName || customerFirstName;
                    customerLastName = currentCustomer.profile.lastName || customerLastName;
                }
                var city = selectedAddress && selectedAddress[0] && selectedAddress[0].address && selectedAddress[0].address.city ? (selectedAddress[0].address.city).replace(/,(\s+)?$/, '') : '';
                storeAddress.address = {
                    firstName: customerFirstName,
                    lastName: customerLastName,
                    address1: selectedAddress && selectedAddress[0] && selectedAddress[0].address ? selectedAddress[0].address.address1 : '',
                    address2: selectedAddress && selectedAddress[0] && selectedAddress[0].address ? selectedAddress[0].address.address2 : '',
                    city: city,
                    postalCode: selectedAddress && selectedAddress[0] && selectedAddress[0].address ? selectedAddress[0].address.zipCode : '',
                    stateCode: selectedAddress && selectedAddress[0] && selectedAddress[0].address ? selectedAddress[0].address.stateCode : '',
                    countryCode: countryCode || 'US',
                    phone: ''
                };
                var shipments = currentBasket.shipments;
                var shipment;
                if (shipments.length > 1) {
                    for (var i = 0; i < shipments.length; i++) {
                        var currentShipment = shipments[i];
                        if (currentShipment.shippingMethodID !== 'eGift_Card' && !currentShipment.shippingMethod.custom.storePickupEnabled) {
                            shipment = currentShipment;
                            break;
                        }
                    }
                } else {
                    shipment = currentBasket.defaultShipment;
                }
                if (shipment) {
                    COHelpers.copyShippingAddressToShipment(storeAddress, shipment, 'selectCollectionPoint');
                    // Update HAL Location Type and HAL Location ID
                    var shippingAddress = shipment.getShippingAddress();
                    var HALAddress = (selectedAddress && selectedAddress[0] && selectedAddress[0].address) ? selectedAddress[0].address : '';
                    Transaction.wrap(function () {
                        shippingAddress.custom.HALLocationType = (HALAddress && HALAddress.HALLocationType) ? HALAddress.HALLocationType : '';
                        shippingAddress.custom.HALLocationID = (HALAddress && HALAddress.HALLocationID) ? HALAddress.HALLocationID : '';
                    });
                    result.address = storeAddress.address;
                }
                if (currentBasket && currentBasket.custom) {
                    Transaction.wrap(function () {
                        currentBasket.custom.isCommercialPickup = true;
                    });
                    result.isCommercialPickup = true;
                }
                res.json({
                    success: true,
                    result: result
                });
            } else {
                res.json({
                    success: false,
                    errorMessage: Resource.msg('error.message.selection', 'checkout', null)
                });
            }
        } else {
            res.json({
                success: false,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
        }
    } catch (e) {
        res.json({
            success: false,
            errorMessage: Resource.msg('error.message.selection', 'checkout', null)
        });
    }
    next();
});

module.exports = server.exports();
