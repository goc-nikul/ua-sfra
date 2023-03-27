'use strict';

var BasketMgr = require('dw/order/BasketMgr');

var CartModel = require('*/cartridge/models/cart');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
var collections = require('*/cartridge/scripts/util/collections');
var Transaction = require('dw/system/Transaction');
var CustomerMgr = require('dw/customer/CustomerMgr');

var server = require('server');
var isBOPISEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled');
var instorePickupStoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.extend(module.superModule);

server.prepend(
    'Begin',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) { // eslint-disable-line
        var Locale = require('dw/util/Locale');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        var availabilityHelper = require('*/cartridge/scripts/helpers/availabilityHelpers');
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var viewData = res.getViewData();
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var basketModel = new CartModel(currentBasket);
        var currentLocale = Locale.getLocale(req.locale.id);
        var countryCode = currentLocale.country;
        var isInternationalBillingAddress = 'isInternationalBillingAddressEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isInternationalBillingAddressEnabled');
        var hasBOPISshipment = cartHelper.basketHasBOPISShipmet(currentBasket);

        if (!currentBasket || (hasBOPISshipment && !isBOPISEnabled)) {
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }

        if (currentBasket) {
            var fullyRemovedItems = '';
            var partiallyRemovedItems = '';

            if (isBOPISEnabled && hasBOPISshipment) {
                cartHelper.ensureShippingAddressforStore(currentBasket);
            }

            if (currentBasket.getCouponLineItems().length > 0) {
                cartHelper.removeIneligibleCouponsFromBasket(currentBasket);
            }

            // Ensure the selected shipping method is applicable for the current shipment
            if (!empty(basketModel) && !empty(basketModel.shipments) && basketModel.shipments.length > 0 && !empty(basketModel.shipments[0].selectedShippingMethod)) {
                var shipment = basketModel.shipments[0];
                var isApplicableShippingMethod = false;
                for (var i = 0; i < shipment.shippingMethods.length; i++) {
                    var shippingMethod = shipment.shippingMethods[i];
                    if (shippingMethod.ID === shipment.selectedShippingMethod) {
                        isApplicableShippingMethod = true;
                        break;
                    }
                }

                // If the selected shipping method is not applicable then select one of the applicable
                if (!isApplicableShippingMethod && !empty(currentBasket.defaultShipment)) {
                    Transaction.wrap(function () {
                        ShippingHelper.selectShippingMethod(currentBasket.defaultShipment);
                    });

                    basketModel = new CartModel(currentBasket);
                }
            }

            var validatedProducts = validationHelpers.validateProductsInventory(currentBasket, 'StartCheckout');
            if (validatedProducts && validatedProducts.availabilityError) {
                var inValidItems = availabilityHelper.getInvalidItems(basketModel, validatedProducts);
                fullyRemovedItems = inValidItems.fullyRemovedItems ? inValidItems.fullyRemovedItems : '';
                partiallyRemovedItems = inValidItems.partiallyRemovedItems ? inValidItems.partiallyRemovedItems : '';
                // remove or update quantity of the unavailable items from the Basket
                availabilityHelper.updateItemsAvailability(currentBasket, validatedProducts);
            }
            viewData.fullyRemovedItems = fullyRemovedItems;
            viewData.partiallyRemovedItems = partiallyRemovedItems;
            // This below code validates inventory limit and real time inventory for BOPIS products.
            var validatedBOPISProducts = validationHelpers.validateBOPISProductsInventory(currentBasket, 'BOPIS');
            if (validatedBOPISProducts && validatedBOPISProducts.availabilityError) {
                res.redirect(URLUtils.url('Cart-Show'));
                return next();
            }

            // Below line of code will split the single shipment into multiple shipment if the basket has the e-gift card item.
            Transaction.wrap(function () {
                giftcardHelper.updateGiftCardShipments(currentBasket);
                giftcardHelper.removeEmptyShipments(currentBasket);
            });

            var currentStage = req.querystring.stage ? req.querystring.stage : 'shipping'; // eslint-disable-line
        }

        if (!req.currentCustomer.raw.isMemberOfCustomerGroup('CSR') && req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress) {
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
            COHelpers.setDefaultBillingAddress(customer);
        }
        // Fetch gc Badge
        res.setViewData({
            gcBadge: giftcardHelper.getGCShipmentBadge(currentBasket)
        });

        // set Preferred address or Locale address to Basket
        var currentCustomer = req.currentCustomer.raw;
        COHelpers.copyCustomerAddressToBasket(currentBasket, currentCustomer);

        /* This code sets the country list for International billing and also
         * prepare the json and pass to the view for setting up state dynamically from FE
         * on country select.
         * Read the country list from the Site Pref. and prepare the billing address
         * country options dynamically. To achieve this you need to read the form from session rather than
         * server.forms.getForm() method.
         * Reading the form from server.forms.getForm() filters the empty options of the country
         * and does not allow to set the options dynamically from Site Pref.
         */
        var billingAddressform = session.forms.billing;
        var addressHelper = require('~/cartridge/scripts/helpers/addressHelpers');
        if (!empty(countryCode) && countryCode === 'CA' && !isInternationalBillingAddress) {
            addressHelper.setCountryOptionsCA(billingAddressform.addressFields);
        } else if (isInternationalBillingAddress) {
            addressHelper.setCountryOptions(billingAddressform.addressFields);
        } else if (!empty(countryCode) && countryCode === 'MX' && !isInternationalBillingAddress) {
            addressHelper.setCountryOptionsMX(billingAddressform.addressFields);
        }
        var countryRegion = addressHelper.getCountriesAndRegions(billingAddressform.addressFields);
        viewData.countryRegion = JSON.stringify(countryRegion);

        // eslint-disable-next-line spellcheck/spell-checker
        var oauthProviderId = Site.current.getCustomPreferenceValue('uaidmOauthProviderId');
        var idmUrl = oauthProviderId ? URLUtils.https('Login-OAuthLogin', 'oauthProvider', oauthProviderId, 'oauthLoginTargetEndPoint', '1', 'checkout', true) : '';
        viewData.idmUrl = idmUrl;
        res.setViewData(viewData);

        next();
    });

server.append('Begin', function (req, res, next) {
    var viewData = res.getViewData();
    var currentStage = viewData.currentStage;
    var productLineItemExist = true;
    var OrderModel = require('*/cartridge/models/order');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var ContentMgr = require('dw/content/ContentMgr');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var Locale = require('dw/util/Locale');
    var Logger = require('dw/system/Logger');
    var currentLocale = Locale.getLocale(req.locale.id);

    viewData.pageContext = {
        ns: 'checkout'
    };

    const addressVerificationProvider = require('~/cartridge/modules/providers').get('AddressVerification');
    var isEnabled = addressVerificationProvider.enabledInBM();
    var qasAddressSuggestion = Site.current.getCustomPreferenceValue('qasAddressSuggestion');
    var qasUseCustomerCurrentLocation = Site.current.getCustomPreferenceValue('QAS_EnableCustomerCurrentLocation');
    var qasToken = Site.current.getCustomPreferenceValue('QASToken');
    var currentCountry = currentLocale.country;
    viewData.AddressVerificationEnabled = isEnabled;
    viewData.qasAddressSuggestion = qasAddressSuggestion;
    viewData.qasToken = qasToken;
    viewData.currentCountry = currentCountry;
    viewData.canonicalUrl = URLUtils.abs('Checkout-Begin');
    viewData.qasUseCustomerCurrentLocation = qasUseCustomerCurrentLocation || false;

    // check whether legendsoft is enable or not
    viewData.isLegendSoftEnable = Site.current.getCustomPreferenceValue('enableLegendSoft') || false;

    var applicableShippingMethods = viewData.order.shipping[0].applicableShippingMethods;
    var selectedShippingMethod = viewData.order && viewData.order.shipping[0] && viewData.order.shipping[0].selectedShippingMethod && viewData.order.shipping[0].selectedShippingMethod.ID;
    if (applicableShippingMethods && selectedShippingMethod) {
        var isSelectedShippingMethodInApplicableShippingMethods = false;
        for (var i = 0; i < applicableShippingMethods.length; i++) { // eslint-disable-line
            var applicableShippingMethodList = applicableShippingMethods[i].ID; // eslint-disable-line
            if (selectedShippingMethod === applicableShippingMethodList) {
                isSelectedShippingMethodInApplicableShippingMethods = true;
                break;
            }
        }

        if (!isSelectedShippingMethodInApplicableShippingMethods) {
            for (var i = 0; i < applicableShippingMethods.length; i++) { // eslint-disable-line
                var applicableShippingMethod = applicableShippingMethods[i]; // eslint-disable-line
                if (applicableShippingMethod.ID !== 'shoprunner' && applicableShippingMethod.ID !== 'shoprunner_HAL') {
                    viewData.order.shipping[0].selectedShippingMethod = applicableShippingMethod;
                    break;
                }
            }
        }
    }

    var currentBasket = BasketMgr.getCurrentBasket();
    var basketModel = new CartModel(currentBasket);

    if (basketModel && basketModel.valid && basketModel.valid.error) {
        res.redirect(URLUtils.url('Cart-Show'));
    }
    // checks whether current basket has shipping,billing addresses and payment instrument are there or not and redirects accordingly
    if (currentBasket && currentStage && (currentStage === 'payment' || currentStage === 'placeOrder')) {
        var isShipBillPayExist = COHelpers.isShipBillPayExistInBasket(currentBasket, currentStage);
        if (!isShipBillPayExist) {
            res.redirect(URLUtils.url('Checkout-Begin'));
        }
        try {
            var paypalHelper = require('*/cartridge/scripts/paypal/paypalHelper');
            var paypalPaymentInstrument = paypalHelper.getPaypalPaymentInstrument(currentBasket);
            if (!empty(paypalPaymentInstrument)) {
                // recalculate the basket and Update paypal transaction amount
                COHelpers.recalculateBasket(currentBasket);
                var nonGiftCertificateAmount = COHelpers.calculateNonGiftCertificateAmount(currentBasket);
                Transaction.wrap(function () {
                    paypalPaymentInstrument.getPaymentTransaction().setAmount(nonGiftCertificateAmount);
                });
                var formatMoney = require('dw/util/StringUtils').formatMoney;
                viewData.order.billing.payment.selectedPaymentInstruments[0].amount = nonGiftCertificateAmount.value;
                viewData.order.billing.payment.selectedPaymentInstruments[0].formattedAmount = formatMoney(nonGiftCertificateAmount);
            }
        } catch (e) {
            Logger.error('Error while updating PayPal paymentInstrument amount :: {0}', e.message);
        }
    }
    // Add Selected Payment ID to the pdict
    var selectedPaymentInstruments = viewData.order.billing.payment.selectedPaymentInstruments;
    var selectedPaymentMethod = selectedPaymentInstruments && selectedPaymentInstruments[0] && selectedPaymentInstruments[0].paymentMethod;
    var shippingAddress = viewData.order.shipping && viewData.order.shipping[0] && viewData.order.shipping[0].shippingAddress ? viewData.order.shipping[0].shippingAddress : '';
    var isPaypalAddressExceeded = {
        address1: false,
        address2: false
    };
    if (!empty(shippingAddress) && currentStage === 'shipping' && selectedPaymentMethod && selectedPaymentMethod === 'PayPal') {
        if (shippingAddress.address1 && shippingAddress.address1.length > 35) {
            isPaypalAddressExceeded.address1 = true;
        }
        if (shippingAddress.address2 && shippingAddress.address2.length > 35) {
            isPaypalAddressExceeded.address2 = true;
        }
    }
    /*
     * We are setting the selectedPaymentMethod to Paymetric if there are no Payment method available in the form
     * as well as we are not having any selected Payment Instruments, as Paymetric should be default selected.
     * Rather than looping through the Payment methods and searching for Paymetric Payment method id, we are directly setting the id as Paymetric.
     */
    // Aurus Legacy Check
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    if (!selectedPaymentMethod || currentCountry === 'CA') {
        var paymentMethod = isAurusEnabled ? 'AURUS_CREDIT_CARD' : 'Paymetric';
        selectedPaymentMethod = (viewData.forms.billingForm && viewData.forms.billingForm.paymentMethod.value) || paymentMethod;
    }
    var currentCustomer = req.currentCustomer.raw;
    var isVIP = Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !empty(currentCustomer.profile) && 'vipAccountId' in currentCustomer.profile.custom && !empty(currentCustomer.profile.custom.vipAccountId);
    var vipPoints;
    if (isVIP) {
        const vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
        vipPoints = vipDataHelpers.getVipPoints(currentBasket);
    }
    // Select payment Method aurus credit card if vip points are applied.
    if (isAurusEnabled && isVIP && vipPoints && selectedPaymentMethod === 'VIP_POINTS') {
        selectedPaymentMethod = 'AURUS_CREDIT_CARD';
    }

    var isEmployee = !empty(currentCustomer.profile) && 'isEmployee' in currentCustomer.profile.custom && currentCustomer.profile.custom.isEmployee;
    var basketHasOnlyBOPISProducts = instorePickupStoreHelpers.basketHasOnlyBOPISProducts(currentBasket.shipments);
    if (isBOPISEnabled) {
        cartHelper.ensureShippingAddressforStore(currentBasket);
        cartHelper.ensureBOPISShipment(currentBasket);
        COHelpers.recalculateBasket(currentBasket);
        var storePickUpShipment = collections.find(currentBasket.shipments, function (item) { // eslint-disable-line
            if (item.custom.fromStoreId) {
                return item;
            }
        });
        if (storePickUpShipment) {
            viewData.basketHasStorePickUpShipment = true;
            var selectedStore = storeHelpers.findStoreById(storePickUpShipment.custom.fromStoreId);
            selectedStore.productInStoreInventory = true;
            var storeModel = { stores: [selectedStore] };
            storeModel = storeHelpers.getProductAvailabilityOnStoreHours(storeModel);
            viewData.selectedStore = storeModel && storeModel.stores ? storeModel.stores[0] : '';
            var basketHasBopisOnly = currentBasket.shipments.length === 1;
            var ensureValid;
            var useMultiShipping;
            if (basketHasBopisOnly && currentStage !== 'placeOrder') {
                currentStage = 'payment';
                productLineItemExist = false;
                ensureValid = COHelpers.ensureValidShipments(currentBasket);
                useMultiShipping = currentBasket.shipments.length > 1;
                var ordermodel = new OrderModel(
                        currentBasket, {
                            customer: currentCustomer,
                            usingMultiShipping: useMultiShipping,
                            // eslint-disable-next-line spellcheck/spell-checker
                            shippable: ensureValid,
                            countryCode: currentCountry,
                            containerView: 'basket'
                        }
                    );
                viewData.order = ordermodel;
                viewData.basketHasBopisOnly = basketHasBopisOnly;
            }
        } else {
            viewData.basketHasStorePickUpShipment = false;
            viewData.basketHasBopisOnly = false;
        }
    }

    // updating shipping method price based on promotional shipping discount
    try {
        ShippingHelper.setShippingMethodPromotionalPrice(viewData.order);
    } catch (e) {
        Logger.error('Checkout.js - exception while settingShippingpromotionalPrice :: {0}', e.message);
    }

    var IsbasketHasOnlyEGiftCard = false;
    var basketHasGiftCardItems = giftcardHelper.basketHasGiftCardItems(currentBasket);
    if (basketHasGiftCardItems && basketHasGiftCardItems.onlyEGiftCards) {
        currentStage = 'payment';
        productLineItemExist = false;
        IsbasketHasOnlyEGiftCard = true;
        // Below line of code will split the single shipment into multiple shipment if the basket has the e-gift card item.
        Transaction.wrap(function () {
            giftcardHelper.updateGiftCardShipments(currentBasket);
        });

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        // Loop through all shipments and make sure all are valid
        var allValid = COHelpers.ensureValidShipments(currentBasket);

        var orderModel = new OrderModel(
            currentBasket, {
                customer: currentCustomer,
                usingMultiShipping: usingMultiShipping,
                // eslint-disable-next-line spellcheck/spell-checker
                shippable: allValid,
                countryCode: currentCountry,
                containerView: 'basket'
            }
        );
        viewData.order = orderModel;
    }

    req.session.privacyCache.set('usingMultiShipping', viewData.order.usingMultiShipping);
    var displayMultiShipCheckbox = viewData.order.displayMultiShipCheckbox;
    // Setting up shippingAddressUseAsBillingAddress value based on Billing matching addressID
    var shippingAddressExist = currentBasket.defaultShipment.shippingAddress && currentBasket.defaultShipment.shippingAddress.address1;
    var isHALbasket = shippingAddressExist && COHelpers.isHALShippingEnabled() && currentBasket && currentBasket.custom && currentBasket.custom.isCommercialPickup ? currentBasket.custom.isCommercialPickup : false;
    var billingForm = viewData.forms.billingForm; // server.forms.getForm('billing');
    if (billingForm &&
        viewData.order &&
        viewData.order.billing &&
        viewData.order.shipping &&
        (viewData.order.billing.matchingAddressId === viewData.order.shipping[0].matchingAddressId ||
            viewData.order.billing.matchingAddressId === viewData.order.shipping[0].UUID) && !isHALbasket) {
        billingForm.shippingAddressUseAsBillingAddress.value = true;
    } else {
        billingForm.shippingAddressUseAsBillingAddress.value = false;
    }

    viewData.forms.billingForm = billingForm;
    if (COHelpers.isKlarnaPaymentEnabled()) {
        viewData.klarnaForm = server.forms.getForm('klarna');
    }

    var giftCardFormData = giftcardHelper.giftCardFormData(viewData.csrf);
    var eligiblePaymentMethods = COHelpers.getEligiblePaymentMethods(currentBasket, giftCardFormData, vipPoints, currentCustomer);
    var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
    var containsLocaleAddress = false;
    if (currentCustomer && currentCustomer.addressBook && currentCustomer.addressBook.addresses.length > 0) {
        containsLocaleAddress = COHelpers.containsAtleastOneLocaleAddress(currentCountry, currentCustomer.addressBook.addresses);
    }
    var shopRunnerEnabled = Site.getCurrent().getCustomPreferenceValue('sr_enabled');
    // eslint-disable-next-line
    var shopRunnerSignedIn = null;
    var orderContainsPreorder = cartHelper.hasPreOrderItems(currentBasket);
    if (shopRunnerEnabled) {
        let shopRunnerToken = session.custom.srtoken;
        // eslint-disable-next-line
        shopRunnerSignedIn = shopRunnerToken ? true : false;

        res.setViewData({
            orderContainsPreorder: orderContainsPreorder
        });
    }
    // adding required code for express paypal button on checkout page.
    var PaymentMgr = require('dw/order/PaymentMgr');
    var paypalPayment = PaymentMgr.getPaymentMethod('PayPal');
    if (paypalPayment && paypalPayment.active && !isVIP) {
        var paypalHelpers = require('int_paypal_sfra/cartridge/scripts/paypal/paypalHelper');
        var prefs = paypalHelpers.getPrefs();
        var customerBillingAgreement = paypalHelpers.getCustomerBillingAgreement(currentBasket.getCurrencyCode());
        var isAddressExistForBillingAgreementCheckout = !!customerBillingAgreement.getDefaultShippingAddress();
        // In this case no need shipping address
        if (currentBasket.getDefaultShipment().productLineItems.length <= 0) {
            isAddressExistForBillingAgreementCheckout = true;
        }
        var buttonConfig;
        if (customerBillingAgreement.hasAnyBillingAgreement && prefs.PP_BillingAgreementState !== 'DoNotCreate') {
            buttonConfig = prefs.PP_Cart_Button_Config;
            buttonConfig.env = prefs.environmentType;
            buttonConfig.billingAgreementFlow = {
                startBillingAgreementCheckoutUrl: URLUtils.https('Paypal-StartBillingAgreementCheckout').toString(),
                isShippingAddressExist: isAddressExistForBillingAgreementCheckout
            };
        } else {
            buttonConfig = prefs.PP_Cart_Button_Config;
            buttonConfig.env = prefs.environmentType;
            buttonConfig.createPaymentUrl = URLUtils.https('Paypal-StartCheckoutFromCart', 'isAjax', 'true').toString();
        }
        var expressPaypal = {
            prefs: prefs,
            buttonConfig: buttonConfig,
            addressForm: server.forms.getForm('address'),
            paypalCalculatedCost: currentBasket.totalGrossPrice,
            canonicalUrl: URLUtils.abs('Cart-Show')
        };
        viewData.expressPaypal = expressPaypal;
        // End - PayPal related code
    }
    var basketHasGiftCard = basketHasGiftCardItems.giftCards;
    var basketHasEGiftCard = basketHasGiftCardItems.eGiftCards;
    if ('collectionPointRadiusOptions' in Site.current.preferences.custom && !empty(Site.current.getCustomPreferenceValue('collectionPointRadiusOptions'))) {
        viewData.radiusOptions = JSON.parse(Site.current.getCustomPreferenceValue('collectionPointRadiusOptions'));
    }
    viewData.shipToCollectionPoint = COHelpers.eligibleForShipToCollectionPoint(isEmployee, isVIP, orderContainsPreorder, basketHasEGiftCard);
    viewData.IsbasketHasOnlyEGiftCard = IsbasketHasOnlyEGiftCard;
    viewData.isCommercialPickup = isHALbasket;
    viewData.containsLocaleAddress = containsLocaleAddress;
    viewData.quantityTotal = quantityTotal;
    viewData.vipPoints = vipPoints;
    viewData.currentStage = currentStage;
    viewData.productLineItemExist = productLineItemExist;
    viewData.selectedPaymentMethod = selectedPaymentMethod;
    viewData.totals = basketModel.totals;
    viewData.actionUrls = basketModel.actionUrls;
    viewData.eligiblePaymentMethods = eligiblePaymentMethods;
    viewData.gcPaymentInstruments = giftCardFormData.gcResults.gcPaymentInstruments;
    viewData.isOrderTotalRedeemed = giftCardFormData.gcResults.isOrderTotalRedeemed;
    viewData.giftCardsLimitExceeded = giftCardFormData.gcResults.giftCardsLimitExceeded;
    viewData.getGcRedeemedAmount = giftCardFormData.gcResults.getGcRedeemedAmount;
    viewData.basketHasGiftCard = basketHasGiftCard;
    viewData.basketHasOnlyBOPISProducts = basketHasOnlyBOPISProducts;
    viewData.gcPaymentInstruments =	giftcardHelper.getGcPaymentInstruments(currentBasket);
    viewData.getRemaingBalance = giftCardFormData.gcResults.getRemaingBalance;
    viewData.isApplePayCancel = req.querystring.applePayRedirect;
    viewData.isEmployee = isEmployee;
    viewData.isVIP = isVIP;
    viewData.isBOPISEnabled = isBOPISEnabled;
    viewData.displayMultiShipCheckbox = displayMultiShipCheckbox;
    viewData.shopRunnerSignedIn = shopRunnerSignedIn;
    viewData.officeAddresses = !empty(Site.current.getCustomPreferenceValue('officeAddresses')) ? JSON.parse(Site.current.getCustomPreferenceValue('officeAddresses')) : JSON.parse('[]');
    viewData.hideEmployeeOfficeAddresses = Site.current.getCustomPreferenceValue('hideEmployeeOfficeAddresses') ? Site.current.getCustomPreferenceValue('hideEmployeeOfficeAddresses') : '';
    viewData.giftOptionsEnabled = !empty(Site.current.getCustomPreferenceValue('giftOptionsEnabled')) ? Site.getCurrent().getCustomPreferenceValue('giftOptionsEnabled') : false;
    var preOrderProductTileMessage = '';
    var setOfPreOrderProducts = (Site.current.getCustomPreferenceValue('preOrderStyles'));
    if (setOfPreOrderProducts) {
        var productLineItems = currentBasket.productLineItems;
        for (var index in productLineItems) { // eslint-disable-line
            var product = productLineItems[index].product;
            if (((setOfPreOrderProducts.indexOf(product.ID) > -1) || (setOfPreOrderProducts.indexOf(product.masterProduct ? product.masterProduct.ID : product.ID) > -1)) && product.custom.isPreOrder) { // eslint-disable-line
                preOrderProductTileMessage = Site.current.getCustomPreferenceValue('isPreOrderProductInCheckout');
                break;
            }
        }
    }
    viewData.preOrderProductTileMessage = preOrderProductTileMessage;
    viewData.isPhoneNumberMandatory = COHelpers.isPhoneNumberMandatory();
    viewData.isPaypalAddressExceeded = isPaypalAddressExceeded;
    res.setViewData(viewData);

    // Refresh Vertex error markers
    delete session.custom.VertexAddressSuggestionsError;
    var contentObj = ContentMgr.getContent('checkout-page-meta');
    if (contentObj) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
    }
    next();
}, pageMetaData.computedPageMetaData);

server.get('OrderSummary', server.middleware.https, function (req, res, next) {
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');

    var currentBasket = BasketMgr.getCurrentBasket();
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
        req.session.privacyCache.set('usingMultiShipping', false);
        usingMultiShipping = false;
    }

    COHelpers.recalculateBasket(currentBasket);

    var currentLocale = Locale.getLocale(req.locale.id);
    var basketModelObject = new OrderModel(
        currentBasket, {
            usingMultiShipping: usingMultiShipping,
            // eslint-disable-next-line spellcheck/spell-checker
            shippable: true,
            countryCode: currentLocale.country,
            containerView: 'basket'
        }
    );
    res.render('checkout/orderProductSummary', {
        order: basketModelObject
    });
    next();
});

server.get('ReplaceShippingContent',
    server.middleware.https,
    csrfProtection.generateToken,
    consentTracking.consent,
    function (req, res, next) {
        var AccountModel = require('*/cartridge/models/account');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);
        if (validatedProducts.error) {
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }

        if (currentBasket.shipments.length <= 1) {
            req.session.privacyCache.set('usingMultiShipping', false);
        }

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');

        if (isBOPISEnabled && usingMultiShipping && currentBasket.shipments.length > 1) {
            instorePickupStoreHelpers.splitShipmentsForBOPIS(currentBasket);
            COHelpers.ensureNoEmptyShipments(req);
        }
        var currentCustomer = req.currentCustomer.raw;
        var currentLocale = Locale.getLocale(req.locale.id);

        // Calculate the basket
        Transaction.wrap(function () {
            COHelpers.ensureNoEmptyShipments(req);
        });

        if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
            Transaction.wrap(function () {
                currentBasket.updateCurrency();
            });
        }

        COHelpers.recalculateBasket(currentBasket);

        var shippingForm = COHelpers.prepareShippingForm(currentBasket);

        // Loop through all shipments and make sure all are valid
        var allValid = COHelpers.ensureValidShipments(currentBasket);

        var orderModel = new OrderModel(
            currentBasket, {
                customer: currentCustomer,
                usingMultiShipping: usingMultiShipping,
                shippable: allValid,
                countryCode: currentLocale.country,
                containerView: 'basket'
            }
        );

        var accountModel = new AccountModel(req.currentCustomer);
        var isEmployee = !empty(currentCustomer.profile) && 'isEmployee' in currentCustomer.profile.custom && currentCustomer.profile.custom.isEmployee;
        var isVIP = Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !empty(currentCustomer.profile) && 'vipAccountId' in currentCustomer.profile.custom && !empty(currentCustomer.profile.custom.vipAccountId);
        var currentCountry = Site.getCurrent().getID();
        // Fetch gc Badge
        var gcBadge = giftcardHelper.getGCShipmentBadge(currentBasket);
        var template = 'checkout/shipping/shipping';

        var renderedTemplate = res.render(template, {
            order: orderModel,
            customer: accountModel,
            isBOPISEnabled: isBOPISEnabled,
            isEmployee: isEmployee,
            currentCountry: currentCountry,
            isVIP: isVIP,
            gcBadge: gcBadge,
            forms: {
                shippingForm: shippingForm
            }
        });

        res.json({
            error: false,
            renderedTemplate: renderedTemplate
        });
        return next();
    });

server.get('updateKlarnaSession', server.middleware.https, function (req, res, next) {
    var userSession = req.session.raw;
    var basket = BasketMgr.getCurrentBasket();
    if (basket && basket.getPaymentInstruments('KLARNA_PAYMENTS').length > 0) {
        if (COHelpers.isKlarnaPaymentEnabled() || !empty(userSession.privacy.KlarnaPaymentsSessionID)) {
            var KlarnaSessionManager = require('*/cartridge/scripts/common/klarnaSessionManager');
            var klarnaSessionManager = new KlarnaSessionManager();
            klarnaSessionManager.createOrUpdateSession();
        }
    }
    res.json({
        error: false,
        success: true
    });
    next();
});

server.post('SelectPaymentMethod', server.middleware.https, function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var Locale = require('dw/util/Locale');
    var OrderModel = require('*/cartridge/models/order');
    var AccountModel = require('*/cartridge/models/account');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    // remove existing payment instruments
    if (currentBasket && !empty(currentBasket.getPaymentInstruments())) {
        Transaction.wrap(function () {
            giftcardHelper.removeNonGcPaymentInstruments(currentBasket);
        });
    }
    var paymentMethodIdValue = req.querystring.PaymentMethod;
    if (req.querystring.PaymentMethod === 'klarna_pay_over_time') {
        paymentMethodIdValue = 'KLARNA_PAYMENTS';
    }

    // create payment instruments to apply promotions based on payment method
    var result = COHelpers.handlePaymentMethods(currentBasket, paymentMethodIdValue);
    if (result.success) {
        // Calculate the basket
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });
    } else {
        res.json({
            serverErrors: Resource.msg('error.technical', 'checkout', null),
            error: true
        });
        return;
    }

    // invoke klarna update session call if it is klarna payment method
    if (paymentMethodIdValue === 'KLARNA_PAYMENTS') {
        var userSession = req.session.raw;
        if (COHelpers.isKlarnaPaymentEnabled() || !empty(userSession.privacy.KlarnaPaymentsSessionID)) {
            var KlarnaSessionManager = require('*/cartridge/scripts/common/klarnaSessionManager');
            var klarnaSessionManager = new KlarnaSessionManager();
            klarnaSessionManager.createOrUpdateSession();
        }
    }
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var currentLocale = Locale.getLocale(req.locale.id);
    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
    );
    var countryCode = request.locale && request.locale != 'default' ? request.locale.split('_')[1] : 'US'; // eslint-disable-line
    var customerModel = new AccountModel(req.currentCustomer);
    if (!empty(customerModel)) {
        customerModel.countryCode = countryCode;
    }

    res.json({
        customer: customerModel,
        order: basketModel
    });
    next();
});
module.exports = server.exports();
