'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/**
 * Creates a list of address model for the logged in user
 * @param {string} customerNo - customer number of the current customer
 * @returns {List} a plain list of objects of the current customer's addresses
 */
function getList(customerNo) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var AddressModel = require('*/cartridge/models/address');
    var collections = require('*/cartridge/scripts/util/collections');
    var addressHelper = require('*/cartridge/scripts/helpers/addressHelpers');

    var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
    var rawAddressBook = customer.addressBook.getAddresses();
    rawAddressBook = addressHelper.sortDefaultBillingAddress(customer, rawAddressBook);
    var addressBook = collections.map(rawAddressBook, function (rawAddress) {
        var addressModel = new AddressModel(rawAddress);
        addressModel.address.UUID = rawAddress.UUID;
        return addressModel;
    });
    return addressBook;
}

server.replace('List', userLoggedIn.validateLoggedIn, csrfProtection.generateToken, consentTracking.consent, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var addressHelper = require('*/cartridge/scripts/helpers/addressHelpers');
    var lastUpdatedDate = addressHelper.calenderHelper(req);
    var addressForm = session.forms.internationalAddress;
    addressHelper.setCountryOptions(addressForm);
    var countryRegion = addressHelper.getCountriesAndRegions(addressForm);
    var currentCustomer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var viewData = res.getViewData();
    addressForm = server.forms.getForm('internationalAddress');
    viewData.countryRegion = JSON.stringify(countryRegion);
    viewData.addressForm = addressForm;
    viewData.lastUpdated = lastUpdatedDate;
    viewData.isLegendSoftEnable = require('dw/system/Site').current.getCustomPreferenceValue('enableLegendSoft') || false;
    if (!empty(currentCustomer.profile)) {
        viewData.defaultBillingAddressID = 'defaultBillingAddressID' in currentCustomer.profile.custom && currentCustomer.profile.custom.defaultBillingAddressID;
    }
    viewData.pageContext = {
        ns: 'addressBook'
    };
    res.setViewData(viewData);
    var actionUrls = {
        deleteActionUrl: URLUtils.url('Address-DeleteAddress').toString(),
        listActionUrl: URLUtils.url('Address-List').toString()
    };
    res.render('account/addressBook', {
        addressBook: getList(req.currentCustomer.profile.customerNo),
        actionUrls: actionUrls,
        currentCountry: request.locale && request.locale !== 'default' ? request.locale.split('_')[1] : 'US'
    });
    // set page meta-data
    var ContentMgr = require('dw/content/ContentMgr');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var contentObj = ContentMgr.getContent('addresses-page-meta');
    if (contentObj) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
    }
    next();
}, pageMetaData.computedPageMetaData);

server.replace('SaveAddress', csrfProtection.validateAjaxRequest, csrfProtection.generateToken, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
    var addressForm = session.forms.internationalAddress;
    addressHelpers.setCountryOptions(addressForm);
    var countryRegion = addressHelpers.getCountriesAndRegions(addressForm);
    addressForm = server.forms.getForm('internationalAddress');
    var addressFormObj = addressForm.toObject();
    addressFormObj.addressForm = addressForm;
    var addressId = req.querystring.addressID;
    var viewData = res.getViewData();
    var calendar = new Calendar(new Date(req.currentCustomer.raw.profile.getLastModified()));
    var lastUpdatedDate = StringUtils.formatCalendar(calendar, 'MM/dd/yyyy');
    // updates the date format based on current site
    var Site = require('dw/system/Site');
    var currentSite = Site.getCurrent().getID();
    if (currentSite === 'MX') {
        lastUpdatedDate = StringUtils.formatCalendar(calendar, 'dd/MM/yyyy');
    }
    var actionUrls = {
        deleteActionUrl: URLUtils.url('Address-DeleteAddress').toString(),
        listActionUrl: URLUtils.url('Address-List').toString()
    };

    var customer;

    if (req.currentCustomer.profile) {
        customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
    }

    var addressBook = customer.getProfile().getAddressBook();
 // Server side validation against xss regex
    var inputFieldsValidation = addressHelpers.validateAddressInputFields(addressFormObj);
    if (inputFieldsValidation.error && (Object.keys(inputFieldsValidation.customerAddressErrors).length > 0)) {
        addressForm.valid = false;
        addressHelpers.inputValidationField(inputFieldsValidation, addressForm);
    }
    if (addressForm.valid) {
        res.setViewData(addressFormObj);
        this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
            var formInfo = res.getViewData();
            Transaction.wrap(function () {
                var address = null;
                var defaultBillingAddressID = null;

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
                    if (req.querystring.addressId) {
                        address.setID(formInfo.addressId);
                    }

                    // Save form's address
                    addressHelpers.updateAddressFields(address, formInfo);

                    // Save as Default shipping
                    if (addressFormObj.setAsDefault) {
                        addressBook.setPreferredAddress(address);
                    }
                    // Save as Default billing Address ID
                    var setAsDefaultBillingChecked = addressForm.setAsDefaultBilling.value;
                    var customerdefaultbillingAddressID = !empty(customer.profile) && 'defaultBillingAddressID' in customer.getProfile().custom ? customer.getProfile().custom.defaultBillingAddressID : null;
                    if (setAsDefaultBillingChecked) {
                        customer.getProfile().custom.defaultBillingAddressID = address.ID;
                        defaultBillingAddressID = address.ID;
                    } else if (address.ID === customerdefaultbillingAddressID && setAsDefaultBillingChecked === false) {
                        customer.getProfile().custom.defaultBillingAddressID = '';
                    } else {
                        defaultBillingAddressID = customerdefaultbillingAddressID;
                    }
                    // Send account edited email
                    accountHelpers.sendAccountEditedEmail(customer.profile);
                    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
                    var template = 'account/addressBookSaveAjax.isml';
                    var renderedTemplate = renderTemplateHelper.getRenderedHtml({ lastUpdated: lastUpdatedDate, actionUrls: actionUrls, csrf: viewData.csrf, addressForm: addressForm, addressBook: getList(req.currentCustomer.profile.customerNo), countryRegion: countryRegion, defaultBillingAddressID: defaultBillingAddressID }, template);

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Address-List').toString(),
                        renderedTemplate: renderedTemplate
                    });
                } else {
                    formInfo.addressForm.valid = false;
                    formInfo.addressForm.addressId.valid = false;
                    formInfo.addressForm.addressId.error =
                        Resource.msg('error.message.idalreadyexists', 'forms', null);
                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(addressForm)
                    });
                }
            });
        });
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(addressForm)
        });
    }
    return next();
});
server.append('DeleteAddress', function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var addressId = req.querystring.addressId;
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    Transaction.wrap(function () {
        var defaultbillAddressID = !empty(customer.profile) && 'defaultBillingAddressID' in customer.getProfile().custom ? customer.getProfile().custom.defaultBillingAddressID : '';
        Transaction.wrap(function () {
            if (addressId === defaultbillAddressID) {
                customer.getProfile().custom.defaultBillingAddressID = '';
            }
        });
    });
    return next();
});

module.exports = server.exports();
