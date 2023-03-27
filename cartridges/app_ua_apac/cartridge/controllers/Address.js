/* globals empty, session */

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');
var Site = require('dw/system/Site');

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

server.append('List', function (req, res, next) {
    var daumAddressLookupEnabled = require('*/cartridge/config/preferences').isDaumAddressLookupEnabled;
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    var showOnlyLastNameAsNameFieldEnabled = require('*/cartridge/config/preferences').isShowOnlyLastNameAsNameFieldEnabled;
    var viewData = res.getViewData();
    var countryData = {};
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
        var currentCountry = session.custom.currentCountry;
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
    viewData.daumAddressLookupEnabled = daumAddressLookupEnabled;
    viewData.showSplitPhoneMobileField = showSplitPhoneMobileField;
    viewData.showOnlyLastNameAsNameFieldEnabled = showOnlyLastNameAsNameFieldEnabled;
    res.setViewData(countryData);
    return next();
});

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
    var currentSite = Site.getCurrent().getID();
    var lastUpdatedDate = StringUtils.formatCalendar(calendar, 'MM/dd/yyyy');
    if (currentSite === 'KR') {
        lastUpdatedDate = StringUtils.formatCalendar(calendar, 'yyyy/MM/dd');
    }

    var actionUrls = {
        deleteActionUrl: URLUtils.url('Address-DeleteAddress').toString(),
        listActionUrl: URLUtils.url('Address-List').toString()
    };
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
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
                    var isDropDownCity = false;
                    var isPostalCodeDropDown = false;
                    var isDistrictDropDown = false;
                    var dependencyOnState;
                    var dependencyOnCity;
                    var countryFields;
                    if (!empty(Site.current.getCustomPreferenceValue('countryFields'))) {
                        countryFields = Site.current.getCustomPreferenceValue('countryFields');
                    }
                    var currentCountryFields;
                    var currentCF = [];
                    if (!empty(countryFields)) {
                        var currentCountry = session.custom.currentCountry;
                        currentCountryFields = JSON.parse(countryFields);
                        currentCF = currentCountryFields[currentCountry];
                    }
                    if (currentCF && currentCF.fields) {
                        for (var i = 0; i < currentCF.fields.length; i++) {
                            var field = currentCF.fields[i];
                            if (field.id === 'state') {
                                dependencyOnState = field.dependency;
                            } else if (field.id === 'city') {
                                dependencyOnCity = field.dependency;
                                isDropDownCity = true;
                            } else if (field.id === 'postalCode') {
                                isPostalCodeDropDown = true;
                            } else if (field.id === 'district') {
                                isDistrictDropDown = true;
                            }
                        }
                    }
                    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
                    var template = 'account/addressBookSaveAjax.isml';
                    var daumAddressLookupEnabled = require('*/cartridge/config/preferences').isDaumAddressLookupEnabled;
                    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
                    var showOnlyLastNameAsNameFieldEnabled = require('*/cartridge/config/preferences').isShowOnlyLastNameAsNameFieldEnabled;
                    var renderedTemplate = renderTemplateHelper.getRenderedHtml({ lastUpdated: lastUpdatedDate, actionUrls: actionUrls, csrf: viewData.csrf, addressForm: addressForm, addressBook: getList(req.currentCustomer.profile.customerNo), countryRegion: countryRegion, defaultBillingAddressID: defaultBillingAddressID, dependencyOnState: dependencyOnState, dependencyOnCity: dependencyOnCity, isDropDownCity: isDropDownCity, isPostalCodeDropDown: isPostalCodeDropDown, isDistrictDropDown: isDistrictDropDown, daumAddressLookupEnabled: daumAddressLookupEnabled, showSplitPhoneMobileField: showSplitPhoneMobileField, showOnlyLastNameAsNameFieldEnabled: showOnlyLastNameAsNameFieldEnabled }, template);

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

module.exports = server.exports();
