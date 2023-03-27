/* globals empty, session */

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Return selected payment method in the payment checkout stage.
 *
 * @returns {string} payment method id.
 */
function getCheckoutSelectedPaymentMethod() {
    var BasketMgr = require('dw/order/BasketMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var paymentInstruments = currentBasket.getPaymentInstruments();

    if (!paymentInstruments.length) {
        return null;
    }

    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstruments[0].paymentMethod);

    return paymentMethod;
}

server.prepend('Begin',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var zippayEnabled = require('*/cartridge/config/preferences').isZipPayEnabled;
        if (zippayEnabled) {
            var ZipCheckoutSessionModel = require('*/cartridge/scripts/zip/helpers/checkoutSession');
            if (ZipCheckoutSessionModel.hasZipOrder()) {
                ZipCheckoutSessionModel.failZipOrder();
                res.redirect(require('dw/web/URLUtils').url('Checkout-Begin', 'stage', 'payment'));
            }
        }
        var AtomeEnabled = require('dw/system/Site').getCurrent().getCustomPreferenceValue('atomeEnabled');
        if (AtomeEnabled) {
            var AtomeCheckoutSessionModel = require('*/cartridge/scripts/atome/helpers/checkoutSessionHelper');
            if (AtomeCheckoutSessionModel.hasAtomeOrder()) {
                AtomeCheckoutSessionModel.failAtomeOrder();
                res.redirect(require('dw/web/URLUtils').url('Checkout-Begin', 'stage', 'payment'));
            }
        }

        var isKRCustomCheckoutEnabled = require('*/cartridge/config/preferences').isKRCustomCheckoutEnabled;
        if (isKRCustomCheckoutEnabled) {
            var viewData = res.getViewData();
            var billingForm = server.forms.getForm('billing');
            var shippingForm = server.forms.getForm('shipping');
            var preferredAddress;
            var billFirstName = '';
            var billLastName = '';
            var billPhone = '';
            if (req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress) {
                preferredAddress = req.currentCustomer.addressBook.preferredAddress;
                billFirstName = ((!empty(preferredAddress) && billingForm.addressFields.firstName.value !== preferredAddress.firstName) && (!empty(billingForm.addressFields.firstName.value) && billingForm.addressFields.firstName.value !== shippingForm.shippingAddress.addressFields.firstName.value)) ? billingForm.addressFields.firstName.value : '';
                billLastName = ((!empty(preferredAddress) && billingForm.addressFields.lastName.value !== preferredAddress.lastName) && (!empty(billingForm.addressFields.lastName.value) && billingForm.addressFields.lastName.value !== shippingForm.shippingAddress.addressFields.lastName.value)) ? billingForm.addressFields.lastName.value : '';
                billPhone = ((!empty(preferredAddress) && billingForm.addressFields.phone.value !== preferredAddress.phone) && (!empty(billingForm.addressFields.phone.value) && billingForm.addressFields.phone.value !== shippingForm.shippingAddress.addressFields.phone.value)) ? billingForm.addressFields.phone.value : '';
            } else {
                billFirstName = ((!empty(billingForm.addressFields.firstName.value))) ? billingForm.addressFields.firstName.value : '';
                billLastName = ((!empty(billingForm.addressFields.lastName.value))) ? billingForm.addressFields.lastName.value : '';
                billPhone = ((!empty(billingForm.addressFields.phone.value))) ? billingForm.addressFields.phone.value : '';
            }
            var sameAsShipCheck = billingForm.shippingAddressUseAsBillingAddress.checked;
            viewData.sameAsShipCheck = sameAsShipCheck;
            viewData.billFirstName = billFirstName;
            viewData.billLastName = billLastName;
            viewData.billPhone = billPhone;
            res.setViewData(viewData);
        }
        next();
    });

/**
 * Checkout-Begin : Append this method to add zip params to customer profile
 * @name Base/Checkout-Begin
 * @function
 * @memberof Checkout
 * @param {renders} - isml
 * @param {serverfunction} - append
 */
server.append('Begin', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var Site = require('dw/system/Site');
    var ArrayList = require('dw/util/ArrayList');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var addressHelper = require('*/cartridge/scripts/helpers/addressHelpers');
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var BasketMgr = require('dw/order/BasketMgr');
    var zippayEnabled = require('*/cartridge/config/preferences').isZipPayEnabled;
    var daumAddressLookupEnabled = require('*/cartridge/config/preferences').isDaumAddressLookupEnabled;
    var showOnlyLastNameAsNameFieldEnabled = require('*/cartridge/config/preferences').isShowOnlyLastNameAsNameFieldEnabled;
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    var showSplitEmailField = require('*/cartridge/config/preferences').isShowSplitEmailField;
    var isKRCustomCheckoutEnabled = require('*/cartridge/config/preferences').isKRCustomCheckoutEnabled;
    var viewData = res.getViewData();
    var currentBasket = BasketMgr.getCurrentBasket();
    viewData.smsOptInEnabled = COHelpers.smsOptInEnabled();
    // eslint-disable-next-line no-undef
    var country = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
    var customerRawData = req.currentCustomer.raw;
    var customerProfile = customerRawData.getProfile();
    viewData.customerAuthenticated = customerRawData.authenticated;
    if (zippayEnabled) {
        var CustomerTokenInWalletModel = require('*/cartridge/models/zip/customerTokenInWallet');

        viewData.zipForm = server.forms.getForm('zip');
        viewData.zipError = req.querystring.error;

        viewData.hasZipToken = false;

        var saveZip = (!empty(session.privacy.ZipSavePaymentMethod)) ? session.privacy.ZipSavePaymentMethod : false;

        if (saveZip && !empty(customerProfile) && customerRawData.authenticated) {
            var checkoutSelectedPaymentMethod = getCheckoutSelectedPaymentMethod();
            if (checkoutSelectedPaymentMethod) {
                var customerTokenInWalletModel = new CustomerTokenInWalletModel(customerProfile.getWallet());

                if (checkoutSelectedPaymentMethod && customerTokenInWalletModel.hasToken()) {
                    viewData.hasZipToken = true;
                }
            } else {
                Transaction.wrap(function () {
                    customerProfile.custom.ZipSaveToken = false;
                });
            }
        }
    }
    // Validate Order limit
    var resultCheckOrderLimit = COHelpers.checkOrderLimit();
    if (resultCheckOrderLimit.orderLimitExceeds && !empty(resultCheckOrderLimit.lineItemMaxLimitError)) {
        res.redirect(URLUtils.url('Cart-Show', 'errorMessage', resultCheckOrderLimit.lineItemMaxLimitError));
        return next();
    }
     // Validate If basket has products not available for locale
    if ('enableAvailablePerLocale' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('enableAvailablePerLocale')) {
        var resultCheckProductsInBasket = COHelpers.checkBasketHasProductsNotAvailableForLocale();
        if (resultCheckProductsInBasket.basketHasInvalidProducts && !empty(resultCheckProductsInBasket.ProductNames)) {
            res.redirect(URLUtils.url('Cart-Show', 'errorMessage', Resource.msg('error.cart.product.notavailable.locale', 'checkout', null) + resultCheckProductsInBasket.ProductNames));
            return next();
        }
    }
    if ('QASRestrictedCountries' in Site.getCurrent().getPreferences().getCustom()) {
        var qasRestrictedCountries = Site.current.getCustomPreferenceValue('QASRestrictedCountries');
        var qasRestrictedCountriesArrayList = new ArrayList(qasRestrictedCountries);
        var qasRestrictedCountriesrray = JSON.stringify(qasRestrictedCountriesArrayList.toArray());
        viewData.qasRestrictedCountries = qasRestrictedCountriesrray;
    }
    if (country && country === 'ID' && customerProfile && 'custom' in customerProfile && 'identificationType' in customerProfile.custom && 'identificationValue' in customerProfile.custom && customerProfile.custom.identificationType && customerProfile.custom.identificationValue) {
        viewData.customer.profile.identificationType = customerProfile.custom.identificationType;
        viewData.customer.profile.identificationValue = customerProfile.custom.identificationValue;
    }

    var countryData = {};
    var customerData = {};
    viewData.countryData = JSON.stringify(countryData);
    var isDropDownCity = false;
    var isPostalCodeDropDown = false;
    var isDistrictDropDown = false;
    var countryFields;
    if (!empty(Site.current.getCustomPreferenceValue('countryFields'))) {
        countryFields = Site.current.getCustomPreferenceValue('countryFields');
    }
    var currentCountryFields;
    var currentCF = [];
    if (!empty(countryFields)) {
        var currentCountry = session.custom.currentCountry || require('dw/util/Locale').getLocale(request.getLocale()).country; // eslint-disable-line
        currentCountryFields = JSON.parse(countryFields);
        currentCF = currentCountryFields[currentCountry];
    }
    if (currentCF && currentCF.fields) {
        for (var i = 0; i < currentCF.fields.length; i++) {
            var field = currentCF.fields[i];
            if (field.id === 'state') {
                viewData.dependencyOnState = field.dependency;
            } else if (field.id === 'city') {
                viewData.dependencyOnCity = field.dependency;
                isDropDownCity = true;
                viewData.isDropDownCity = isDropDownCity;
            } else if (field.id === 'postalCode') {
                isPostalCodeDropDown = true;
                viewData.isPostalCodeDropDown = isPostalCodeDropDown;
            } else if (field.id === 'district') {
                isDistrictDropDown = true;
                viewData.isDistrictDropDown = isDistrictDropDown;
            }
        }
    }
    viewData.qasValidCountries = require('*/cartridge/config/preferences').qasValidCountries;
    viewData.businessTypeAddressEnabled = require('*/cartridge/config/preferences').businessTypeAddressEnabled;
    var currentCountryDialingCode = COHelpers.getCountryDialingCodeBasedOnCurrentCountry();
    viewData.currentCountryDialingCode = currentCountryDialingCode;
    viewData.officeAddressesAvailableForCountry = COHelpers.isEmployeeOfficeAddressAvailableForCurrentCountry(viewData.officeAddresses, country);
    viewData.isDaumAddressLookupEnabled = daumAddressLookupEnabled;
    viewData.isShowOnlyLastNameAsNameFieldEnabled = showOnlyLastNameAsNameFieldEnabled;
    viewData.showSplitPhoneMobileField = showSplitPhoneMobileField;
    viewData.showSplitEmailField = showSplitEmailField;
    viewData.isKRCustomCheckoutEnabled = isKRCustomCheckoutEnabled;
    if (isKRCustomCheckoutEnabled) {
        viewData.forms.billinForm = COHelpers.setEmailFiledsInBillingForm(currentBasket, viewData.forms.billingForm);

        if (!session.custom.sameasship) {
            session.custom.sameasship = false;
        }

        if (!empty(customerProfile) && showSplitEmailField) {
            customerData.emailaddressName = customerProfile.custom.emailaddressName || '';
            customerData.emailaddressDomainSelect = customerProfile.custom.emailaddressDomainSelect || '';
            customerData.emailaddressDomain = customerProfile.custom.emailaddressDomain || '';
            customerData.emailaddressName2 = customerProfile.custom.emailaddressName2 || '';
            customerData.emailaddressDomainSelect2 = customerProfile.custom.emailaddressDomainSelect2 || '';
            customerData.emailaddressDomain2 = customerProfile.custom.emailaddressDomain2 || '';

            if (empty(customerData.emailaddressName2) && empty(customerData.emailaddressDomain2)) {
                if (!empty(customerProfile.custom.email2)) {
                    var splitEmail2Obj = COHelpers.splitEmail(customerProfile.custom.email2, viewData.forms.billingForm);

                    customerData.emailaddressName2 = splitEmail2Obj.emailaddressName || '';
                    customerData.emailaddressDomainSelect2 = splitEmail2Obj.emailaddressDomainSelect || '';
                    customerData.emailaddressDomain2 = splitEmail2Obj.emailaddressDomain || '';
                }
            }

            if (empty(customerData.emailaddressName) && empty(customerData.emailaddressDomain)) {
                if (!empty(customerProfile.email)) {
                    var splitEmailObj = COHelpers.splitEmail(customerProfile.email, viewData.forms.billingForm);

                    customerData.emailaddressName = splitEmailObj.emailaddressName || '';
                    customerData.emailaddressDomainSelect = splitEmailObj.emailaddressDomainSelect || '';
                    customerData.emailaddressDomain = splitEmailObj.emailaddressDomain || '';
                }
            }
        }

        if (!empty(customerProfile)) {
            customerData.email2 = customerProfile.custom.email2 || '';
        }

        if (!empty(customerProfile) && showSplitPhoneMobileField) {
            customerData.phoneMobile1 = customerProfile.custom.phoneMobile1 || '';
            customerData.phoneMobile2 = customerProfile.custom.phoneMobile2 || '';
            customerData.phoneMobile3 = customerProfile.custom.phoneMobile3 || '';

            if (empty(customerData.phoneMobile1) && empty(customerData.phoneMobile2) && empty(customerData.phoneMobile3)) {
                var customerPhone = customerProfile.phoneHome;

                if (!empty(customerPhone)) {
                    var splitPhone = addressHelper.splitPhoneField(customerPhone);
                    if (splitPhone[0]) {
                        customerData.phoneMobile1 = splitPhone[0];
                    }
                    if (splitPhone[1]) {
                        customerData.phoneMobile2 = splitPhone[1];
                    }
                    if (splitPhone[2]) {
                        customerData.phoneMobile3 = splitPhone[2];
                    }
                }
            }
        }

        if (!empty(customerProfile)) {
            customerData.isNaverUser = customerProfile.custom.isNaverUser || false;
            customerData.smsOptIn = customerProfile.custom.smsOptIn || false;
            viewData.customer.customerData = customerData;
        }

        if (showSplitPhoneMobileField && viewData.officeAddresses && viewData.officeAddresses.length) {
            var officeAddresses = viewData.officeAddresses;
            officeAddresses.forEach(address => {
                if (address && address.phone) {
                    var splitOfficePhone = addressHelper.splitPhoneField(address.phone);
                    if (splitOfficePhone[0]) {
                        address.phone1 = splitOfficePhone[0]; // eslint-disable-line no-param-reassign
                    }
                    if (splitOfficePhone[1]) {
                        address.phone2 = splitOfficePhone[1]; // eslint-disable-line no-param-reassign
                    }
                    if (splitOfficePhone[2]) {
                        address.phone3 = splitOfficePhone[2]; // eslint-disable-line no-param-reassign
                    }
                }
                return address;
            });
            viewData.officeAddresses = officeAddresses;
        }

        viewData.billFirstName = (viewData.billFirstName) || (viewData.customer && viewData.customer.profile && viewData.customer.profile.firstName) || '';
        viewData.billLastName = (viewData.billLastName) || (viewData.customer && viewData.customer.profile && viewData.customer.profile.lastName) || '';
        if (currentBasket.billingAddress && currentBasket.billingAddress.custom && currentBasket.billingAddress.custom.phone1 && currentBasket.billingAddress.custom.phone2 && currentBasket.billingAddress.custom.phone3) {
            viewData.billPhone1 = (viewData.order.billing.billingAddress.address && viewData.order.billing.billingAddress.address.phone1) || (viewData.customer && viewData.customer.customerData && viewData.customer.customerData.phoneMobile1) || '';
            viewData.billPhone2 = (viewData.order.billing.billingAddress.address && viewData.order.billing.billingAddress.address.phone2) || (viewData.customer && viewData.customer.customerData && viewData.customer.customerData.phoneMobile2) || '';
            viewData.billPhone3 = (viewData.order.billing.billingAddress.address && viewData.order.billing.billingAddress.address.phone3) || (viewData.customer && viewData.customer.customerData && viewData.customer.customerData.phoneMobile3) || '';
        } else {
            viewData.billPhone1 = (viewData.customer && viewData.customer.customerData && viewData.customer.customerData.phoneMobile1) || '';
            viewData.billPhone2 = (viewData.customer && viewData.customer.customerData && viewData.customer.customerData.phoneMobile2) || '';
            viewData.billPhone3 = (viewData.customer && viewData.customer.customerData && viewData.customer.customerData.phoneMobile3) || '';
        }
        viewData.billPhone = (viewData.billPhone) || (viewData.customer && viewData.customer.profile && viewData.customer.profile.phone) || '';

        if (viewData.sameAsShipCheck && session.custom.sameasship) {
            viewData.billFirstName = (viewData.order.shipping[0].shippingAddress && viewData.order.shipping[0].shippingAddress.firstName) || '';
            viewData.billLastName = (viewData.order.shipping[0].shippingAddress && viewData.order.shipping[0].shippingAddress.lastName) || '';
            viewData.billPhone1 = (viewData.order.shipping[0].shippingAddress && viewData.order.shipping[0].shippingAddress.phone1) || '';
            viewData.billPhone2 = (viewData.order.shipping[0].shippingAddress && viewData.order.shipping[0].shippingAddress.phone2) || '';
            viewData.billPhone3 = (viewData.order.shipping[0].shippingAddress && viewData.order.shipping[0].shippingAddress.phone3) || '';
            viewData.billPhone = (viewData.order.shipping[0].shippingAddress && viewData.order.shipping[0].shippingAddress.phone) || '';
        }
    }
    res.setViewData(viewData);

    return next();
});

server.get('GetAddressDefinition', function (req, res, next) {
    var addressHelper = require('*/cartridge/scripts/helpers/addressHelpers');
    var shippingAddressform = server.forms.getForm('shipping');
    var countryData = addressHelper.getCountriesDefinition(shippingAddressform.shippingAddress.addressFields, '');
    res.json({
        countryData: countryData
    });
    next();
});

module.exports = server.exports();
