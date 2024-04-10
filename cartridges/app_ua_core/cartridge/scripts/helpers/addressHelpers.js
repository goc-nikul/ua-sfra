'use strict';

var Resource = require('dw/web/Resource');
var ArrayList = require('dw/util/ArrayList');
var base = require('app_storefront_base/cartridge/scripts/helpers/addressHelpers');
/**
 * Add tax number to the Shipping Address
 * @param {FormField} formField - formField
 * @param {string} resourceFile - The resource File
 * @return {FormFields} fields - fields
 */
function getFieldOptions(formField, resourceFile) {
    if (empty(formField.options)) {
        return {};
    }
    var fields = {};

    var opts = formField.options;
    /* eslint-disable */
    for (var o in opts) {
        try {
            if (opts[o] && opts[o].value && opts[o].value.length > 0) {
                var option = opts[o];
                fields[option.value] = Resource.msg(option.label, resourceFile, option.label);
            }
        } catch (error) {
            if (!fields.error) {
                fields.error = [];
            }
            fields.error.push('Error: ' + error);
        }
    }
    /* eslint-enable */

    return fields;
}

/**
 * Copy information from address object and save it in the system
 * @param {dw.customer.CustomerAddress} newAddress - newAddress to save information into
 * @param {*} address - Address to copy from
 */
function updateAddressFields(newAddress, address) {
    newAddress.setAddress1(address.address1 || '');
    newAddress.setAddress2(address.address2 || '');
    newAddress.setCity(address.city || '');
    newAddress.setFirstName(address.firstName || '');
    newAddress.setLastName(address.lastName || '');
    newAddress.setPhone(address.phone || '');
    newAddress.setPostalCode(address.postalCode || '');

    if (address.states && address.states.stateCode) {
        newAddress.setStateCode(address.states.stateCode);
    }

    if (address.country) {
        newAddress.setCountryCode(address.country);
    }

    newAddress.setJobTitle(address.jobTitle || '');
    newAddress.setPostBox(address.postBox || '');
    newAddress.setSalutation(address.salutation || '');
    newAddress.setSecondName(address.secondName || '');
    newAddress.setCompanyName(address.companyName || '');
    newAddress.setSuffix(address.suffix || '');
    newAddress.setSuite(address.suite || '');
    newAddress.setJobTitle(address.title || '');
}

/**
 * Get the countries and regions
 * @param {FormField} addressForm - formField
 * @param {string} resource -resource File
 * @return {FormFields} fields - fields
 */
function getCountriesAndRegions(addressForm, resource) { //eslint-disable-line
    var list = {};
    var countryField = addressForm.country;
    var stateForm = addressForm.states;
    var resourceName = 'forms';

    if (empty(countryField.options)) {
        return list;
    }

    var countryOptions = countryField.options;
    /* eslint-disable */
    for (var o in countryOptions) {
        try {
            if (countryOptions[o] && countryOptions[o].value && countryOptions[o].value.length > 0) {
                var option = countryOptions[o];
                var cc = countryOptions[o].value;
                var cn = countryOptions[o].label;
                var stateField = !empty(stateForm['state' + option.value]) ? stateForm['state' + option.value] : stateForm.nostates;
                if (stateField != undefined) {
                list[option.value] = {
                    regionLabel: Resource.msg(stateField.label, resourceName, stateField.label),
                    regions: getFieldOptions(stateField, resourceName)
                };
                } else {
                    var fields = {};
                    fields[cc] = cn;
                    list[option.value] = {
                        label: 'State',
                        regions: fields
                    };
                }
            }
        } catch (error) {
            if (!list.error) {
                list.error = [];
            }
            list.error.push('Error: ' + error);
        }
    }
    /* eslint-enable */
    return list;
}
/**
 * Get the countries
 * @return {dw.util.ArrayList} countryList - countryList
 */
function getCountries() {
    var PreferencesUtil = require('~/cartridge/scripts/utils/PreferencesUtil');
    var countryListJson = PreferencesUtil.getJsonValue('billingCountryList');
    var countryList = new ArrayList();
    Object.keys(countryListJson).forEach(function (key) {
        var countryObject = {};
        countryObject.custom = {};
        countryObject.custom.ID = key;
        var translatedCountry = Resource.msg('global.country.' + key, 'locale', null);
        var countryDisplayName = translatedCountry.indexOf('global.country') > -1 ? countryListJson[key] : translatedCountry;
        countryObject.custom.displayName = countryDisplayName;
        countryList.push(countryObject);
    });

    return countryList;
}
/**
 * Set the country options in billing address form field
 * @param {FormField} billingAddressform - formField
 */
function setCountryOptions(billingAddressform) {
    try {
        var countryObj = getCountries();
        billingAddressform.country.setOptions(countryObj.iterator());
    } catch (e) {
        // Log the error
    }
    return;
}
/**
 * Set the country option in billing address form field for CA site
 * @param {FormField} billingAddressform - formField
 */
function setCountryOptionsCA(billingAddressform) {
    try {
        var countryListCA = new ArrayList();
        var countryObjectCA = {};
        countryObjectCA.custom = {};
        countryObjectCA.custom.ID = 'CA';
        countryObjectCA.custom.displayName = Resource.msg('global.country.CA', 'locale', 'Canada');
        countryListCA.push(countryObjectCA);
        billingAddressform.country.setOptions(countryListCA.iterator());
    } catch (e) {
        // Log the error
    }
    return;
}
/**
 * Set the country option in billing address form field for MX site
 * @param {FormField} billingAddressform - formField
 */
function setCountryOptionsMX(billingAddressform) {
    try {
        var countryListMX = new ArrayList();
        var countryObjectMX = {};
        countryObjectMX.custom = {};
        countryObjectMX.custom.ID = 'MX';
        countryObjectMX.custom.displayName = Resource.msg('global.country.MX', 'locale', 'Mexico');
        countryListMX.push(countryObjectMX);
        billingAddressform.country.setOptions(countryListMX.iterator());
    } catch (e) {
        // Log the error
    }
    return;
}
/**
 * Set the default billing address at first or second position in address
 * @param {dw.customer.Customer} customer - customer
 * @param {dw.customer.CustomerAddress} addressBook - addressBook
 * @return {dw.customer.CustomerAddress} addressBook - addressBook
 */
function sortDefaultBillingAddress(customer, addressBook) {
    var findIndex;
    var defaultBillingAddressID;
    if (!empty(customer.profile)) {
        defaultBillingAddressID = 'defaultBillingAddressID' in customer.profile.custom && customer.profile.custom.defaultBillingAddressID;
        if (!empty(defaultBillingAddressID)) {
            var defaultBillingAddress = customer.getProfile().getAddressBook().getAddress(defaultBillingAddressID);
            findIndex = addressBook.indexOf(defaultBillingAddress);
            if (findIndex > -1 && findIndex !== 0) {
                addressBook.swap(1, findIndex);
            }
        }
    }
    return addressBook;
}
/**
 * validate major input fields against xss regex pattern
 * @param {addressObject} addressObject - form object
 * @returns {Object} an error object
 */
function validateAddressInputFields(addressObject) {
    var checkCrossSiteScript = require('*/cartridge/scripts/utils/checkCrossSiteScript');
    // eslint-disable-next-line no-param-reassign
    addressObject.stateCode = addressObject.states && addressObject.states.stateCode ? addressObject.states.stateCode : '';
    var addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'city', 'stateCode', 'postalCode', 'country'];
    var inputValidationErrors = {
        error: false,
        customerAddressErrors: {},
        genericErrorMessage: ''
    };
    // Validate customer address
    if (addressObject) {
        inputValidationErrors.customerAddressErrors = checkCrossSiteScript.crossSiteScriptPatterns(addressObject, addressFieldsToVerify);
    }
    if (Object.keys(inputValidationErrors.customerAddressErrors).length > 0) {
        inputValidationErrors.error = true;
        inputValidationErrors.genericErrorMessage = Resource.msg('checkout.nonlatincharacters.error', 'checkout', null);
    }
    return inputValidationErrors;
}
/**
 * invalidate  input fields if any  xss valnarability is present in field
 * @param {inputFieldsValidation} inputFieldsValidation - form object
 * @param {addressForm} addressForm - form object
 */
function inputValidationField(inputFieldsValidation, addressForm) { /* eslint-disable no-param-reassign */
    if (inputFieldsValidation.customerAddressErrors.firstName) {
        addressForm.firstName.valid = false;
        addressForm.firstName.error = inputFieldsValidation.customerAddressErrors.firstName;
    }
    if (inputFieldsValidation.customerAddressErrors.lastName) {
        addressForm.lastName.valid = false;
        addressForm.lastName.error = inputFieldsValidation.customerAddressErrors.lastName;
    }
    if (inputFieldsValidation.customerAddressErrors.address1) {
        addressForm.address1.valid = false;
        addressForm.address1.error = inputFieldsValidation.customerAddressErrors.address1;
    }
    if (inputFieldsValidation.customerAddressErrors.address2) {
        addressForm.address2.valid = false;
        addressForm.address2.error = inputFieldsValidation.customerAddressErrors.address2;
    }
    if (inputFieldsValidation.customerAddressErrors.city) {
        addressForm.city.valid = false;
        addressForm.city.error = inputFieldsValidation.customerAddressErrors.city;
    }
    if (inputFieldsValidation.customerAddressErrors.stateCode) {
        addressForm.states.stateCode.valid = false;
        addressForm.states.stateCode.error = inputFieldsValidation.customerAddressErrors.stateCode;
    }
    if (inputFieldsValidation.customerAddressErrors.postalCode) {
        addressForm.postalCode.valid = false;
        addressForm.postalCode.error = inputFieldsValidation.customerAddressErrors.postalCode;
    }
    if (inputFieldsValidation.customerAddressErrors.country) {
        addressForm.country.valid = false;
        addressForm.country.error = inputFieldsValidation.customerAddressErrors.country;
    }
}
/**
 * updates the date format based on current site
 * @param {req} req - get customer last modified Date from req customer profiles
 * @returns{lastUpdatedDate} lastUpdatedDate - returns the formatted Date based current site
 */
function formatCalenderHelper(req) {
    var customerLastModidfied = req.currentCustomer.raw.profile.getLastModified();
    var Site = require('dw/system/Site');
    var currentSite = Site.getCurrent().getID();
    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var calendar = new Calendar(new Date(customerLastModidfied));
    var lastUpdatedDate = StringUtils.formatCalendar(calendar, 'MM/dd/yyyy');
    if (currentSite === 'EU' || currentSite === 'UKIE' || currentSite === 'OC' || currentSite === 'SEA' || currentSite === 'TH' || currentSite === 'MX') {
        lastUpdatedDate = StringUtils.formatCalendar(calendar, 'dd/MM/yyyy');
    }
    if (currentSite === 'KR') {
        lastUpdatedDate = StringUtils.formatCalendar(calendar, 'yyyy/MM/dd');
    }
    return lastUpdatedDate;
}

/**
 * Generate random address id for address creation
 * @param {dw.customer.AddressBook} addressBook - Object that customer addressBook
 * @returns {string} - String with the generated random address name
 */
function generateRandomAddressId(addressBook) {
    var randomID = Math.random().toString(36).substr(2);
    if (addressBook.getAddress(randomID)) {
        generateRandomAddressId(addressBook);
    }
    return randomID;
}

module.exports = {
    generateAddressName: base.generateAddressName,
    generateRandomAddressId: generateRandomAddressId,
    checkIfAddressStored: base.checkIfAddressStored,
    saveAddress: base.saveAddress,
    copyShippingAddress: base.copyShippingAddress,
    gatherShippingAddresses: base.gatherShippingAddresses,
    getCountriesAndRegions: getCountriesAndRegions,
    getCountries: getCountries,
    setCountryOptions: setCountryOptions,
    sortDefaultBillingAddress: sortDefaultBillingAddress,
    setCountryOptionsCA: setCountryOptionsCA,
    setCountryOptionsMX: setCountryOptionsMX,
    updateAddressFields: updateAddressFields,
    validateAddressInputFields: validateAddressInputFields,
    inputValidationField: inputValidationField,
    calenderHelper: formatCalenderHelper
};
