/* globals session, empty */
/* eslint-disable consistent-return */
'use strict';

var page = module.superModule;
var server = require('server');
var zippayEnabled = require('*/cartridge/config/preferences').isZipPayEnabled;
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.extend(page);

/**
 * CheckoutServices-PlaceOrder : Prepend method to save the identification value in shippingAddress before clears the form
 * @name Base/CheckoutServices-PlaceOrder
 * @function
 * @memberof CheckoutServices
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - prepend
 */
server.prepend(
    'PlaceOrder',
    function (req, res, next) {
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var Transaction = require('dw/system/Transaction');
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var paymentForm = server.forms.getForm('billing');
        var contactInfoFormErrors = COHelpers.validateFields(paymentForm.contactInfoFields);
        var profile = customer.getProfile();
        var formFieldErrors = [];
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');

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

        if (COHelpers.isAfterPayBasket(currentBasket) && COHelpers.isBasketExceedingAfterPayLimit(currentBasket)) {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.afterpay.range.exceed', 'checkout', null)
            });
            this.emit('route:Complete', req, res);
            return true;
        }
     // Validate Order limit
        var resultCheckOrderLimit = COHelpers.checkOrderLimit();
        if (resultCheckOrderLimit.orderLimitExceeds && !empty(resultCheckOrderLimit.lineItemMaxLimitError)) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show', 'errorMessage', resultCheckOrderLimit.lineItemMaxLimitError).toString()
            });
            this.emit('route:Complete', req, res);
            return true;
        }

        // To save identification value into shipping address and profile for only indonesia site
        if (paymentForm.contactInfoFields && 'identification' in paymentForm.contactInfoFields && paymentForm.contactInfoFields.identification.identificationType.value && paymentForm.contactInfoFields.identification.identificationValue.value) {
            if (currentBasket.defaultShipment.shippingAddress) {
                Transaction.wrap(function () {
                    currentBasket.defaultShipment.shippingAddress.custom.identificationType = paymentForm.contactInfoFields.identification.identificationType.value;
                    currentBasket.defaultShipment.shippingAddress.custom.identificationValue = paymentForm.contactInfoFields.identification.identificationValue.value;
                });
            }
            if (customer.registered) {
                Transaction.wrap(function () {
                    profile.custom.identificationType = paymentForm.contactInfoFields.identification.identificationType.value;
                    profile.custom.identificationValue = paymentForm.contactInfoFields.identification.identificationValue.value;
                });
            }
        }
        // Email signup - Checkout
        var emailSignUp = req.querystring.emailSignUp;
        if (COHelpers.smsOptInEnabled()) {
            if (emailSignUp === 'true' && 'email' in paymentForm.contactInfoFields && paymentForm.contactInfoFields.phone.value && paymentForm.contactInfoFields.email.value && currentBasket.defaultShipment.shippingAddress) {
                Transaction.wrap(function () {
                    currentBasket.defaultShipment.shippingAddress.custom.addToSMSList = true;
                    if (customer.registered && (profile.phoneMobile === paymentForm.contactInfoFields.phone.value || profile.phoneHome === paymentForm.contactInfoFields.phone.value)) {
                        customer.getProfile().custom.smsOptIn = true;
                    }
                });
            }
        }

        var phoneNumber = paymentForm.contactInfoFields.phone.value;
        var countryDialingCode = paymentForm.contactInfoFields.countryDialingCode.value;
        var updatedPhone = phoneNumber ? phoneNumber.split(' ').join('').replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-') : phoneNumber;
        paymentForm.contactInfoFields.phone.value = updatedPhone;
        var isValidAreaCode = COHelpers.validatePhoneAreaCode(updatedPhone, countryDialingCode);
        var isValidPhoneNumber = COHelpers.validatephoneNumber(updatedPhone, countryDialingCode);
        var viewData = res.getViewData();
        viewData.isValidAreaCode = isValidAreaCode;
        viewData.isValidPhoneNumber = isValidPhoneNumber;
        res.setViewData(viewData);
        return next();
    }
);

/**
 * CheckoutServices-PlaceOrder : Append this method to clear zip session variable
 * @name Base/CheckoutServices-PlaceOrder
 * @function
 * @memberof CheckoutServices
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - append
 */
server.append(
    'PlaceOrder',
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var OrderMgr = require('dw/order/OrderMgr');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var viewData = res.getViewData();
        if (zippayEnabled && !empty(session.privacy.ZipErrorCode)) {
            viewData.zipError = session.privacy.ZipErrorCode;

            session.privacy.ZipErrorCode = null;

            res.json(viewData);
        }
        var paymentForm = server.forms.getForm('billing');
        var countryDialingCode = paymentForm.contactInfoFields.countryDialingCode ? paymentForm.contactInfoFields.countryDialingCode.value : '';
        if (!empty(countryDialingCode)) {
            Transaction.wrap(function () {
                if (viewData.orderID) {
                    var order = OrderMgr.getOrder(viewData.orderID);
                    if (order) {
                        order.custom.countryDialingCode = countryDialingCode;
                    }
                }
            });
        }
        // Handles payment authorization
        var Resource = require('dw/web/Resource');
        var viewDat = res.getViewData();
        var order = OrderMgr.getOrder(viewDat.orderID);

        // Remove the value of the custom attribute Adyen_paymentMethod if AdyenComponent is not used on the order
        if (order && order.getPaymentInstruments('AdyenComponent').length === 0) {
            Transaction.wrap(function () {
                order.custom.Adyen_paymentMethod = '';
            });
        }

        // Code changes to store Phone from Shipping address in shipemnt
        var isKRCustomCheckoutEnabled = require('*/cartridge/config/preferences').isKRCustomCheckoutEnabled;
        var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
        var showSplitEmailField = require('*/cartridge/config/preferences').isShowSplitEmailField;
        var currentCustomer = req.currentCustomer.raw.profile;

        // code chnages only for KR site
        if (isKRCustomCheckoutEnabled) {
            var shippingForm = server.forms.getForm('shipping');

            // To update phone number in shipping address
            Transaction.wrap(function () {
                if (order && order.shipments) {
                    var shipments = order.shipments;
                    for (var i = 0; i < shipments.length; i++) {
                        var currentShipment = shipments[i];
                        if (currentShipment && currentShipment.shippingAddress && !(currentShipment.custom && currentShipment.custom.fromStoreId)) {
                            if (showSplitPhoneMobileField && currentShipment.shippingAddress.custom.phone1 && currentShipment.shippingAddress.custom.phone2 && currentShipment.shippingAddress.custom.phone3) {
                                currentShipment.shippingAddress.setPhone(currentShipment.shippingAddress.custom.phone1 + '-' + currentShipment.shippingAddress.custom.phone2 + '-' + currentShipment.shippingAddress.custom.phone3);
                            } else {
                                currentShipment.shippingAddress.setPhone(shippingForm.shippingAddress.addressFields.phone.value);
                            }
                        }
                    }
                }

                if (order) {
                    if (showSplitPhoneMobileField) {
                        // to save phone in billing address
                        order.billingAddress.setPhone(order.billingAddress.custom.phone1 + '-' + order.billingAddress.custom.phone2 + '-' + order.billingAddress.custom.phone3);
                    } else {
                        order.billingAddress.setPhone(paymentForm.addressFields.phone.value);
                    }

                    // to register email for subscription
                    var subscriptionStatus; // eslint-disable-line
                    if (showSplitEmailField) {
                        var finalEmail = order.custom.emailaddressName + '@' + order.custom.emailaddressDomain;
                        order.setCustomerEmail(finalEmail);

                        if (paymentForm.contactInfoFields.addtoemaillist.value) {
                            subscriptionStatus = require('*/cartridge/modules/providers').get('Newsletter', {
                                email: finalEmail
                            }).subscribe();
                        }
                    } else {
                        order.setCustomerEmail(paymentForm.billEmail.value);
                        if (paymentForm.contactInfoFields.addtoemaillist.value) { // eslint-disable-line
                            subscriptionStatus = require('*/cartridge/modules/providers').get('Newsletter', {
                                email: paymentForm.billEmail.value
                            }).subscribe();
                        }
                    }

                    if (!empty(currentCustomer)) {
                        // To update IDM profile from contact information section of check
                        var idmHelper = require('plugin_ua_idm/cartridge/scripts/idmHelper.js');
                        var CustomerMgr = require('dw/customer/CustomerMgr');
                        var idmPreferences = require('plugin_ua_idm/cartridge/scripts/idmPreferences.js');
                        var customer = CustomerMgr.getCustomerByCustomerNumber(
                            req.currentCustomer.profile.customerNo
                        );
                        var phoneNumber;
                        if (showSplitPhoneMobileField && !empty(paymentForm.contactInfoFields.phoneMobile1.value) && !empty(paymentForm.contactInfoFields.phoneMobile2.value) && !empty(paymentForm.contactInfoFields.phoneMobile3.value)) {
                            currentCustomer.custom.phoneMobile1 = paymentForm.contactInfoFields.phoneMobile1.value;
                            currentCustomer.custom.phoneMobile2 = paymentForm.contactInfoFields.phoneMobile2.value;
                            currentCustomer.custom.phoneMobile3 = paymentForm.contactInfoFields.phoneMobile3.value;

                            var newPhone = paymentForm.contactInfoFields.phoneMobile1.value + '-' + paymentForm.contactInfoFields.phoneMobile2.value + '-' + paymentForm.contactInfoFields.phoneMobile3.value;

                            var phoneCleanRegex = new RegExp(Resource.msg('regex.phone.clean', '_preferences', '/[^a-z0-9\s]/gi')); // eslint-disable-line
                            var tempPhoneNumber = newPhone;
                            var phoneNumberCombined = tempPhoneNumber ? tempPhoneNumber.split(' ') : tempPhoneNumber;
                            phoneNumber = phoneNumberCombined ? phoneNumberCombined.join('') : tempPhoneNumber;
                            phoneNumber = phoneNumber ? phoneNumber.replace(phoneCleanRegex, '') : tempPhoneNumber;
                            phoneNumber = phoneNumber ? phoneNumber.replace(/[_\s]/g, '-') : tempPhoneNumber;
                        } else {
                            phoneNumber = paymentForm.contactInfoFields.phone.value;
                        }

                        if (!empty(phoneNumber)) {
                            currentCustomer.setPhoneHome(phoneNumber);
                            // to create profile for object to update phone in IDM
                            var profileObj = COHelpers.prepProfileObjFromContactInfo(customer, phoneNumber);
                            // IDM Update Profile
                            var updateProfileObject; // eslint-disable-line
                            var externalProfiles = customer.externalProfiles;
                            var idmProfile = false;
                            for (var profile in externalProfiles) { // eslint-disable-line
                                var authenticationProviderID = externalProfiles[profile].authenticationProviderID;
                                if (authenticationProviderID === idmPreferences.oauthProviderId) {
                                    idmProfile = true;
                                }
                            }
                            if (idmPreferences.isIdmEnabled && idmProfile) {
                                updateProfileObject = idmHelper.updateUser(profileObj, customer, true);
                            }
                        }

                        // to update addToSMSList value in default shipment address
                        if (paymentForm.contactInfoFields.smsOptIn.value) {
                            order.defaultShipment.shippingAddress.custom.addToSMSList = true;
                            currentCustomer.custom.smsOptIn = true;
                        }

                        // Update email2 fields for Naver SSO login customer
                        if (customer.profile.custom.isNaverUser) {
                            if (showSplitEmailField) {
                                if (!empty(paymentForm.contactInfoFields.emailaddressName2.value) && !empty(paymentForm.contactInfoFields.emailaddressDomain2.value)) {
                                    var contactEmail2 = paymentForm.contactInfoFields.emailaddressName2.value + '@' + paymentForm.contactInfoFields.emailaddressDomain2.value;
                                    if (currentCustomer.email !== contactEmail2) {
                                        currentCustomer.custom.emailaddressName2 = paymentForm.contactInfoFields.emailaddressName2.value;
                                        currentCustomer.custom.emailaddressDomainSelect2 = paymentForm.contactInfoFields.emailaddressDomainSelect2.value;
                                        currentCustomer.custom.emailaddressDomain2 = paymentForm.contactInfoFields.emailaddressDomain2.value;
                                        currentCustomer.custom.email2 = contactEmail2;
                                    }
                                }
                            } else {
                                if (!empty(paymentForm.contactInfoFields.email2.value)) { // eslint-disable-line
                                    if (currentCustomer.email !== paymentForm.contactInfoFields.email2.value) {
                                        currentCustomer.custom.email2 = paymentForm.contactInfoFields.email2.value;
                                    }
                                }
                            }
                        }

                        if (showSplitEmailField && empty(currentCustomer.custom.emailaddressName) && empty(currentCustomer.custom.emailaddressDomain)) {
                            if (paymentForm && paymentForm.contactInfoFields) {
                                var splitedEmailObj = COHelpers.splitEmail(currentCustomer.email, paymentForm);
                                if (splitedEmailObj && splitedEmailObj.emailaddressName && splitedEmailObj.emailaddressDomain) {
                                    currentCustomer.custom.emailaddressName = splitedEmailObj.emailaddressName;
                                    currentCustomer.custom.emailaddressDomain = splitedEmailObj.emailaddressDomain;
                                    currentCustomer.custom.emailaddressDomainSelect = splitedEmailObj.emailaddressDomainSelect;
                                }
                            }
                        }
                    }
                }
            });
        }

        if (dw.system.Site.getCurrent().getCustomPreferenceValue('atomeEnabled') && order && order.getPaymentInstruments('ATOME_PAYMENT').length > 0) {
            var atomeApis = require('*/cartridge/scripts/service/atomeApis');
            var logger = dw.system.Logger.getLogger('AtomeService');
            // Creates a new order.
            // var order = COHelpers.createOrder(currentBasket);
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
                    Transaction.wrap(function () {
                        order.custom.isAtomePayment = true;
                    });
                    res.json({
                        error: false,
                        cartError: false,
                        continueUrl: paymentAPIResultObj.redirectUrl
                    });
                    this.emit('route:Complete', req, res);
                    var AtomeCheckoutSessionModel = require('*/cartridge/scripts/atome/helpers/checkoutSessionHelper');
                    if (order) {
                        AtomeCheckoutSessionModel.saveAtomeOrder(order);
                    }
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
                try {
                    if (Object.prototype.hasOwnProperty.call(order.custom, 'Loyalty-VoucherName') && !empty(order.custom['Loyalty-VoucherName'])) {
                        var loyaltyVoucherName = order.custom['Loyalty-VoucherName'].split('=')[1];
                        var HookMgr = require('dw/system/HookMgr');
                        if (HookMgr.hasHook('app.memberson.UnUtilizeMemberVoucher')) {
                            HookMgr.callHook('app.memberson.UnUtilizeMemberVoucher', 'unUtilizeMemberVoucher', order, loyaltyVoucherName);
                        }
                    }
                } catch (e) {
                    var Logger = require('dw/system/Logger');
                    Logger.error('Unable to unutlize Loyalty voucher ' + e.message + e.stack);
                }
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order, true);
                });
                this.emit('route:Complete', req, res);
                return true;
            }
        }
        next();
    }
);

/**
 * CheckoutServices-SubmitPayment : prepend this method to achive the suburb field to save in customer account
 * by get all the existing addressID from user account and comparing in append method
 * @name Base/CheckoutServices-SubmitPayment
 * @function
 * @memberof CheckoutServices
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - prepend
 */
server.prepend(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var billingForm = server.forms.getForm('billing');
        var customerAddressIDArray = [];
        var addressId = req.querystring.addressID;
        if (!addressId && billingForm.addressFields.saveToAccount && billingForm.addressFields.saveToAccount.checked) {
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var addressBook = customer.getProfile().getAddressBook();
            var allAddressList = addressBook.addresses;
            for (var i = 0; i < allAddressList.length; i++) {
                var addressID = allAddressList[i].ID;
                customerAddressIDArray.push(addressID);
            }
        } else {
            customerAddressIDArray.push(addressId);
        }
        res.setViewData({ customerAddressIDArray: customerAddressIDArray });
        next();
    });

/**
 * CheckoutServices-SubmitPayment : Append this method to add zip params after submitting payment information and saving new suburb field updating to basket and user account
 * @name Base/CheckoutServices-SubmitPayment
 * @function
 * @memberof CheckoutServices
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - append
 */
server.append(
    'SubmitPayment',
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var BasketMgr = require('dw/order/BasketMgr');

        var viewData = res.getViewData();
        var paymentForm = server.forms.getForm('billing');
        if (paymentForm.addressFields && 'suburb' in paymentForm.addressFields && paymentForm.addressFields.suburb.value) {
            viewData.address.suburb = { value: paymentForm.addressFields.suburb.value };
        }
        if (paymentForm.addressFields && 'businessName' in paymentForm.addressFields && paymentForm.addressFields.businessName.value) {
            viewData.address.businessName = { value: paymentForm.addressFields.businessName.value };
        }
        if (!viewData.error && viewData.address) {
            viewData.address.district = paymentForm.addressFields.district && paymentForm.addressFields.district.value ? { value: paymentForm.addressFields.district.value } : { value: '' };
            if (paymentForm.addressFields && paymentForm.addressFields.city && 'city' in paymentForm.addressFields.city && paymentForm.addressFields.city && paymentForm.addressFields.city.value) {
                viewData.address.city.value = paymentForm.addressFields.city.value;
            }
            if (paymentForm.addressFields && paymentForm.addressFields.district && 'district' in paymentForm.addressFields.district && paymentForm.addressFields.district && paymentForm.addressFields.district.value) {
                viewData.address.district.value = paymentForm.addressFields.district.value;
            }
            if (paymentForm.addressFields && paymentForm.addressFields.postalCode && 'postalCode' in paymentForm.addressFields.postalCode && paymentForm.addressFields.postalCode && paymentForm.addressFields.postalCode.value) {
                viewData.address.postalCode.value = paymentForm.addressFields.postalCode.value;
            }
            if (Object.prototype.hasOwnProperty
                .call(paymentForm.addressFields, 'state')) {
                viewData.address.stateCode = { value: paymentForm.addressFields.state.value };
            }
        }
        if (zippayEnabled && empty(viewData.error) && !viewData.error) {
            var CustomerTokenInWalletModel = require('*/cartridge/models/zip/customerTokenInWallet');
            var PaymentMgr = require('dw/order/PaymentMgr');

            var saveZipParam = req.querystring.dwfrm_zip_saveZip;
            var saveZip = true;
            if (saveZipParam && saveZipParam.empty) {
                saveZip = false;
            }

            var hasZipToken = false;
            var customerRawData = req.currentCustomer.raw;
            var customerProfile = customerRawData.getProfile();
            var paymentMethodId = viewData.paymentMethod.value;
            var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);
            var ZipHelpers = require('*/cartridge/scripts/zip/helpers/zip');
            if (ZipHelpers.isTokenizationRequired(paymentMethod) && !empty(customerProfile) && customerRawData.authenticated) {
                var customerTokenInWalletModel = new CustomerTokenInWalletModel(customerProfile.getWallet());

                if (customerTokenInWalletModel.hasToken()) {
                    hasZipToken = true;
                }

                Transaction.wrap(function () {
                    customerProfile.custom.ZipSaveToken = saveZip;
                });
            }

            Transaction.wrap(function () {
                session.privacy.ZipPaymentMethodId = paymentMethodId;
                session.privacy.ZipSavePaymentMethod = saveZip;
            });

            Transaction.wrap(function () {
                var currentBasket = BasketMgr.getCurrentBasket();
                currentBasket.removeAllPaymentInstruments();
            });
            viewData.hasZipToken = hasZipToken;
        }
        viewData.countryDialingCode = { value: paymentForm.contactInfoFields.countryDialingCode.value };
        if (!paymentForm.contactInfoFields.countryDialingCode.value && customer.profile && customer.profile.custom.countryDialingCode) {
            viewData.countryDialingCode = { value: customer.profile.custom.countryDialingCode };
        }
        var basket = BasketMgr.getCurrentBasket();
        var billingAddr = basket.billingAddress;
        var isKRCustomCheckoutEnabled = require('*/cartridge/config/preferences').isKRCustomCheckoutEnabled;
        var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
        var showSplitEmailField = require('*/cartridge/config/preferences').isShowSplitEmailField;
        if (isKRCustomCheckoutEnabled) {
            Transaction.wrap(function () {
                session.custom.sameasship = paymentForm.shippingAddressUseAsBillingAddress.checked || false;
                if (showSplitPhoneMobileField) {
                    billingAddr.custom.phone1 = paymentForm.addressFields.phone1.value;
                    billingAddr.custom.phone2 = paymentForm.addressFields.phone2.value;
                    billingAddr.custom.phone3 = paymentForm.addressFields.phone3.value;
                    billingAddr.setPhone(billingAddr.custom.phone1 + '-' + billingAddr.custom.phone2 + '-' + billingAddr.custom.phone3);
                } else {
                    billingAddr.setPhone(paymentForm.addressFields.phone.value);
                }

                viewData.phone.value = billingAddr.phone;

                if (showSplitEmailField) {
                    basket.custom.emailaddressName = paymentForm.emailaddressName.value;
                    basket.custom.emailaddressDomainSelect = paymentForm.emailaddressDomainSelect.value;
                    basket.custom.emailaddressDomain = paymentForm.emailaddressDomain.value;
                    basket.setCustomerEmail(basket.custom.emailaddressName + '@' + basket.custom.emailaddressDomain);
                } else {
                    basket.setCustomerEmail(paymentForm.billEmail.value);
                }
                viewData.email.value = basket.customerEmail;
            });
        } else {
            Transaction.wrap(function () {
                if (viewData.storedPaymentUUID) {
                    billingAddr.setPhone(req.currentCustomer.profile.phone);
                } else {
                    billingAddr.setPhone(viewData.phone.value);
                }
            });
        }
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var billingData = res.getViewData();
            var currentBasket = BasketMgr.getCurrentBasket();
            var billingAddress = currentBasket.billingAddress;
            var billingForm = server.forms.getForm('billing');
            var OrderModel = require('*/cartridge/models/order');
            var Locale = require('dw/util/Locale');
            var Site = require('dw/system/Site');
            Transaction.wrap(function () {
                if (zippayEnabled) {
                    var collections = require('*/cartridge/scripts/util/collections');

                    var paymentInstruments = currentBasket.getPaymentInstruments(billingData.paymentMethod.value);
                    collections.forEach(paymentInstruments, function (paymentInstrument) {
                        paymentInstrument.custom.zipEmail = currentBasket.getCustomerEmail(); // eslint-disable-line no-param-reassign
                        paymentInstrument.custom.zipPhone = billingAddress.getPhone(); // eslint-disable-line no-param-reassign
                    });
                }

                if (billingAddress) {
                    billingAddress.custom.suburb = (!empty(billingData.address) && 'suburb' in billingData.address && !empty(billingData.address.suburb.value) && billingData.address.suburb.value !== undefined) ? billingData.address.suburb.value : '';
                    billingAddress.custom.businessName = (!empty(billingData.address) && 'businessName' in billingData.address && !empty(billingData.address.businessName.value) && billingData.address.businessName.value !== undefined) ? billingData.address.businessName.value : '';
                    billingAddress.custom.district = (!empty(billingData.address) && 'district' in billingData.address && !empty(billingData.address.district.value) && billingData.address.district.value !== undefined) ? billingData.address.district.value : '';
                    if (billingData.address && billingData.address.countryCode && billingData.address.countryCode.value === 'HK') {
                        billingAddress.city = ('hkCityValue' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('hkCityValue') ? Site.current.getCustomPreferenceValue('hkCityValue') : '';
                        billingAddress.postalCode = ('hkCityValue' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('hkpostalCodeValue') ? Site.current.getCustomPreferenceValue('hkpostalCodeValue') : '';
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
                            if (!empty(billingData.address) && 'suburb' in billingData.address && !empty(billingData.address.suburb.value)) {
                                address.custom.suburb = billingData.address.suburb.value;
                            }
                            if (!empty(billingData.address) && 'businessName' in billingData.address && !empty(billingData.address.businessName.value)) {
                                address.custom.businessName = billingData.address.businessName.value;
                            }
                            if (!empty(billingData.address) && 'district' in billingData.address && !empty(billingData.address.district.value)) {
                                address.custom.district = billingData.address.district.value;
                            }
                        }
                    });
                }
            }

            if (zippayEnabled) {
                if (empty(billingData.customer)) {
                    billingData.customer = {};
                }

                billingData.customer.zip = {
                    hasZipToken: billingData.hasZipToken
                };
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
                error: false
            });
        });

        return next();
    }
);

module.exports = server.exports();
