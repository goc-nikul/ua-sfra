'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('SubmitShipping', function (req, res, next) {
    var form = server.forms.getForm('shipping');
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    var showSplitEmailField = require('*/cartridge/config/preferences').isShowSplitEmailField;
    var isKRCustomCheckoutEnabled = require('*/cartridge/config/preferences').isKRCustomCheckoutEnabled;
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var billingForm = server.forms.getForm('billing');
    var addressHelper = require('*/cartridge/scripts/helpers/addressHelpers');
    var currentCustomer = req.currentCustomer.raw.profile;
    var result = res.getViewData();
    var Site = require('dw/system/Site');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!empty(result.address) && typeof result.address !== undefined) {
        if (form.shippingAddress.addressFields && 'suburb' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.suburb.value) {
            result.address.suburb = form.shippingAddress.addressFields && 'suburb' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.suburb.value ? form.shippingAddress.addressFields.suburb.value : '';
        }
        if (form.shippingAddress.addressFields && 'businessName' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.businessName.value) {
            result.address.businessName = form.shippingAddress.addressFields && 'businessName' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.businessName.value ? form.shippingAddress.addressFields.businessName.value : '';
        }
        if (Object.prototype.hasOwnProperty
            .call(form.shippingAddress.addressFields, 'postalCode')) {
            result.address.postalCode =
            form.shippingAddress.addressFields.postalCode ? form.shippingAddress.addressFields.postalCode.value : form.shippingAddress.addressFields.postalCode.value;
        }
        result.address.district = form.shippingAddress.addressFields && 'district' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.district.value ? form.shippingAddress.addressFields.district.value : '';
        if (Object.prototype.hasOwnProperty
            .call(form.shippingAddress.addressFields, 'city')) {
            result.address.city =
            form.shippingAddress.addressFields.city ? form.shippingAddress.addressFields.city.value : form.shippingAddress.addressFields.city.value;
        }
        if (Object.prototype.hasOwnProperty
            .call(form.shippingAddress.addressFields, 'district')) {
            result.address.district =
            form.shippingAddress.addressFields.district ? form.shippingAddress.addressFields.district.value : form.shippingAddress.addressFields.district;
        }
        if (form.shippingAddress.addressFields && form.shippingAddress.addressFields.country && form.shippingAddress.addressFields.country.value === 'HK') {
            result.address.city = ('hkCityValue' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('hkCityValue') ? Site.current.getCustomPreferenceValue('hkCityValue') : '';
            result.address.postalCode = ('hkCityValue' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('hkpostalCodeValue') ? Site.current.getCustomPreferenceValue('hkpostalCodeValue') : '';
        }
        if (showSplitPhoneMobileField) {
            if (form.shippingAddress.addressFields && 'phone1' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.phone1.value) {
                result.address.phone1 = form.shippingAddress.addressFields && 'phone1' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.phone1.value ? form.shippingAddress.addressFields.phone1.value : '';
            }
            if (form.shippingAddress.addressFields && 'phone2' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.phone2.value) {
                result.address.phone2 = form.shippingAddress.addressFields && 'phone2' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.phone2.value ? form.shippingAddress.addressFields.phone2.value : '';
            }
            if (form.shippingAddress.addressFields && 'phone3' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.phone3.value) {
                result.address.phone3 = form.shippingAddress.addressFields && 'phone3' in form.shippingAddress.addressFields && form.shippingAddress.addressFields.phone3.value ? form.shippingAddress.addressFields.phone3.value : '';
            }
            if (result.address.phone1 && result.address.phone2 && result.address.phone3) {
                result.address.phone = result.address.phone1 + '-' + result.address.phone2 + '-' + result.address.phone3;
            }
        }

        if ('carrierMessage' in form.shippingAddress.addressFields && !empty(form.shippingAddress.addressFields.carrierMessage.value)) {
            Transaction.wrap(function () {
                currentBasket.defaultShipment.custom.carrierMessage = form.shippingAddress.addressFields.carrierMessage.value;
            });
        }
    }
    if (Object.prototype.hasOwnProperty
        .call(form.shippingAddress.addressFields, 'state')) {
        result.address.stateCode =
        form.shippingAddress.addressFields.state.value;
    }

    var customerData = {};
    var basketEmail = {};
    var billName = {};

    if (isKRCustomCheckoutEnabled && !empty(currentCustomer) && currentCustomer.customer.registered) {
        if (showSplitPhoneMobileField) {
            customerData.phoneMobile1 = currentCustomer.custom.phoneMobile1;
            customerData.phoneMobile2 = currentCustomer.custom.phoneMobile2;
            customerData.phoneMobile3 = currentCustomer.custom.phoneMobile3;

            if (empty(customerData.phoneMobile1) && empty(customerData.phoneMobile2) && empty(customerData.phoneMobile3)) {
                var customerPhone = currentCustomer.phoneHome;

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

        if (showSplitEmailField) {
            customerData.emailaddressName = currentCustomer.custom.emailaddressName;
            customerData.emailaddressDomainSelect = currentCustomer.custom.emailaddressDomainSelect;
            customerData.emailaddressDomain = currentCustomer.custom.emailaddressDomain;

            if (empty(customerData.emailaddressName) && empty(customerData.emailaddressDomain)) {
                if (!empty(currentCustomer.email)) {
                    var splitEmailObj = COHelpers.splitEmail(currentCustomer.email, billingForm);

                    customerData.emailaddressName = splitEmailObj.emailaddressName || '';
                    customerData.emailaddressDomainSelect = splitEmailObj.emailaddressDomainSelect || '';
                    customerData.emailaddressDomain = splitEmailObj.emailaddressDomain || '';
                }
            }
        }

        result.customerData = customerData;
    }

    basketEmail.emailaddressName = currentBasket.custom.emailaddressName || '';
    basketEmail.emailaddressDomainSelect = currentBasket.custom.emailaddressDomainSelect || '';
    basketEmail.emailaddressDomain = currentBasket.custom.emailaddressDomain || '';

    billName.firstName = (currentBasket.billingAddress && currentBasket.billingAddress.firstName) || '';
    billName.lastName = (currentBasket.billingAddress && currentBasket.billingAddress.lastName) || '';

    result.showSplitPhoneMobileField = showSplitPhoneMobileField;
    result.isKRCustomCheckoutEnabled = isKRCustomCheckoutEnabled;
    result.showSplitEmailField = showSplitEmailField;
    result.basketEmail = basketEmail;
    result.billName = billName;
    next();
});

server.prepend('UpdateShippingMethodsList', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var basket = BasketMgr.getCurrentBasket();
    if (basket) {
        var shippingAddress = basket.getDefaultShipment().getShippingAddress();
        if (shippingAddress) {
            var suburb = req.form.suburb;
            var businessName = req.form.businessName;
            Transaction.wrap(function () {
                if (!empty(suburb)) {
                    shippingAddress.custom.suburb = suburb;
                }
                if (!empty(businessName)) {
                    shippingAddress.custom.businessName = businessName;
                }
            });
        }
    }
    next();
});

server.append('UpdateShippingMethodsList', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var basket = BasketMgr.getCurrentBasket();
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    var isKRCustomCheckoutEnabled = require('*/cartridge/config/preferences').isKRCustomCheckoutEnabled;
    var viewData = res.getViewData();
    /* Update phone field with  combinned field (phone1,phone2,phone3)  becuase base cartridge is overirding the phone field with undefined  when  showSplitPhoneMobileField preference is enable */
    if (isKRCustomCheckoutEnabled && showSplitPhoneMobileField) {
        var shippingAddress = basket.getDefaultShipment().getShippingAddress();
        if (viewData.order.shipping[0] && viewData.order.shipping[0].shippingAddress && 'phone' in viewData.order.shipping[0].shippingAddress && empty(viewData.order.shipping[0].shippingAddress.phone)) {
            var shippingData = viewData.order.shipping[0].shippingAddress;
            if (shippingData.phone1 && shippingData.phone2 && shippingData.phone3) {
                var combinePhone = shippingData.phone1 + '-' + shippingData.phone2 + '-' + shippingData.phone3;
                Transaction.wrap(function () {
                    shippingAddress.setPhone(combinePhone);
                });
                viewData.order.shipping[0].shippingAddress.phone = combinePhone;
            }
        }
    }
    var countryCode = request.locale && request.locale != 'default' ? request.locale.split('_')[1] : ''; // eslint-disable-line
    if (!empty(viewData.customer)) {
        viewData.customer.countryCode = countryCode;
    }
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
