'use strict';

var baseCheckoutHelper = require('app_ua_core/cartridge/scripts/helpers/addressHelpers');

/**
 * Combined splitted fields for  Address form
 * @param {addressForm} addressForm addressForm
 */
function combinePhoneField(addressForm) {
    var addForm = addressForm;
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    if (showSplitPhoneMobileField && addForm) {
        addForm.phone = addressForm.phone1 + '-' + addressForm.phone2 + '-' + addressForm.phone3;
    }
}

/**
 * Split phone with hyphen
 * @param {customerPhone} customerPhone addressForm
 * @returns {splitedPhone} splitedPhone splited phone array
 */
function splitPhoneField(customerPhone) {
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    if (showSplitPhoneMobileField && !empty(customerPhone)) {
        var splitedPhone;
        var regexPattern = /(\d{3})(\d{3,4})(\d{3,4})/;
        if (customerPhone.length < 9) {
            /* eslint-disable no-param-reassign */
            customerPhone = '0' + customerPhone;
            /* eslint-disable no-param-reassign */
        }
        var formattedCustomerPhone = customerPhone.replace(regexPattern, '$1-$2-$3');
        splitedPhone = formattedCustomerPhone.split('-');
        return splitedPhone;
    }
    return customerPhone;
}

/**
 * Copy information from address object and save it in the system
 * @param {dw.customer.CustomerAddress} newAddress - newAddress to save information into
 * @param {*} address - Address to copy from
 */
function updateAddressFields(newAddress, address) {
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    baseCheckoutHelper.updateAddressFields(newAddress, address); // eslint-disable-next-line no-param-reassign
    newAddress.custom.suburb = !empty(address) && address.suburb ? address.suburb : ''; // eslint-disable-next-line no-param-reassign
    newAddress.custom.businessName = !empty(address) && address.businessName ? address.businessName : ''; // eslint-disable-next-line no-param-reassign
    newAddress.custom.district = !empty(address) && address.district ? address.district : '';
    if (address.postalCode && typeof (address.postalCode) === 'object' && address.postalCode) {
        newAddress.setPostalCode(address.postalCode || '');
    }
    if (address.city && typeof (address.city) === 'object' && address.city) {
        newAddress.setCity(address.city || '');
    }
    if (address.district && typeof (address.district) === 'object' && address.district) { // eslint-disable-next-line no-param-reassign
        newAddress.custom.district = address.district;
    }
    if (address && address.state) {
        newAddress.setStateCode(address.state);
    }
    if (address && address.country && address.country === 'HK') {
        newAddress.setCity(('hkCityValue' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('hkCityValue') ? Site.current.getCustomPreferenceValue('hkCityValue') : '');
        newAddress.setPostalCode(('hkpostalCodeValue' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('hkpostalCodeValue') ? Site.current.getCustomPreferenceValue('hkpostalCodeValue') : '');
    }

    if (address && address.country && address.country === 'KR') {
        if (showSplitPhoneMobileField && address.phone1 && address.phone2 && address.phone3) {
            newAddress.custom.phone1 = address.phone1; // eslint-disable-line no-param-reassign
            newAddress.custom.phone2 = address.phone2; // eslint-disable-line no-param-reassign
            newAddress.custom.phone3 = address.phone3; // eslint-disable-line no-param-reassign
            combinePhoneField(address);
        }
        if (address.phone) {
            var phoneCleanRegex = new RegExp(Resource.msg('regex.phone.clean', '_preferences', '/[^a-z0-9\s]/gi')); // eslint-disable-line
            var tempPhoneNumber = address.phone;
            var phoneNumberCombined = tempPhoneNumber ? tempPhoneNumber.split(' ') : tempPhoneNumber;
            var phoneNumber = phoneNumberCombined ? phoneNumberCombined.join('') : tempPhoneNumber;
            phoneNumber = phoneNumber ? phoneNumber.replace(phoneCleanRegex, '') : tempPhoneNumber;
            phoneNumber = phoneNumber ? phoneNumber.replace(/[_\s]/g, '-') : tempPhoneNumber;
            newAddress.setPhone(phoneNumber);
        }
    }
}
/**
 * validate major input fields against xss regex pattern
 * @param {addressObject} addressObject - form object
 * @returns {Object} an error object
 */
function validateAddressInputFields(addressObject) {
    var COHelpers = require('~/cartridge/scripts/checkout/checkoutHelpers');
    return COHelpers.validateInputFieldsForShippingMethod(addressObject);
}
/**
 * invalidate  input fields if any  xss valnarability is present in field
 * @param {inputFieldsValidation} inputFieldsValidation - form object
 * @param {addressForm} addressForm - form object
 */
function inputValidationField(inputFieldsValidation, addressForm) { /* eslint-disable no-param-reassign */
    baseCheckoutHelper.inputValidationField(inputFieldsValidation, addressForm);
    if (inputFieldsValidation.customerAddressErrors.suburb) {
        addressForm.suburb.valid = false;
        addressForm.suburb.error = inputFieldsValidation.customerAddressErrors.suburb;
    }
}

/**
 * Get the countries and regions
 * @param {FormField} addressForm - formField
 * @param {string} resource -resource File
 * @return {FormFields} fields - fields
 */
function getCountriesDefinition(addressForm, resource) { //eslint-disable-line
    var Site = require('dw/system/Site');
    var server = require('server');
    var countryFields;
    if (!empty(Site.current.getCustomPreferenceValue('countryFields'))) {
        countryFields = Site.current.getCustomPreferenceValue('countryFields');
    }
    var currentCountry;
    var currentCountryFields;
    var currentCF;
    if (!empty(countryFields)) {
        currentCountry = addressForm.country.options.length > 0 ? addressForm.country.options[0].value : [];
        currentCountryFields = JSON.parse(countryFields);
        currentCF = currentCountryFields[currentCountry];
    }
    if (currentCF) {
        for (var i = 0; i < currentCF.fields.length; i++) {
            var field = currentCF.fields[i];
            if (field.id === 'state') {
                var dependencyOnState = field.dependency;
            } else if (field.id === 'city') {
                var dependencyOnCity = field.dependency;
            }
        }
    }
    var list = {};
    var countryField = addressForm.country;
    currentCountry = session.custom.currentCountry || require('dw/util/Locale').getLocale(request.getLocale()).country; // eslint-disable-line
    var addressFeilds = countryFields && JSON.parse(countryFields)[currentCountry] ? JSON.parse(countryFields)[currentCountry].fields : null;
    var hasCityDropdown;
    var hasDistrictDropdown;
    var hasPostalCodeDropdown;
    if (addressFeilds) {
        hasCityDropdown = addressFeilds.filter(function (obj) {
            return obj.id === 'city';
        });
        hasDistrictDropdown = addressFeilds.filter(function (obj) {
            return obj.id === 'district';
        });
        hasPostalCodeDropdown = addressFeilds.filter(function (obj) {
            return obj.id === 'postalCode';
        });
    }
    var cityForm = hasCityDropdown && hasCityDropdown.length > 0 ? server.forms.getForm('city') : {};
    var districtForm = hasDistrictDropdown && hasDistrictDropdown.length > 0 ? server.forms.getForm('district') : {};
    var postalCodeForm = hasPostalCodeDropdown && hasPostalCodeDropdown.length > 0 ? server.forms.getForm('postalCode') : {};
    var stateObj = {};
    if (empty(countryField.options)) {
        return list;
    }
    var stateOptions = addressForm.states ? addressForm.states.stateCode.options : [];
    list.states = {};
    /* eslint-disable */
    for (var o in stateOptions) {
        try {
            if (stateOptions[o] && stateOptions[o].value && stateOptions[o].value.length > 0) {
                var option = stateOptions[o];
                var cityObj = {};
                if (dependencyOnState == 'city') {
                    var cityField = !empty(cityForm['city' + option.id]) ? cityForm['city' + option.id] : cityForm.nocities;
                } else if (dependencyOnState == 'postalCode') {
                    var postalCodeField = !empty(postalCodeForm['postalCode' + option.id]) ? postalCodeForm['postalCode' + option.id] : postalCodeForm.nocities;
                }
                if (cityField != undefined) {
                    var cityOptions = cityField ? cityField.options :[];
                    for (var op in cityOptions)  {
                        if (cityOptions[op] && cityOptions[op].value && cityOptions[op].value.length > 0) {
                            var option = cityOptions[op];
                            if (dependencyOnCity !== null && dependencyOnCity === 'district') {
                                var districtField = !empty(districtForm['district' + option.id]) ? districtForm['district' + option.id] : districtForm.nocities;
                                var districtOptions = districtField ? districtField.options :'';
                                var disoption =[];
                                for (var dis in districtOptions) {
                                    if (districtOptions[dis].value != null) {
                                        disoption.push(districtOptions[dis].value);
                                    }
                                }
                                cityObj[cityOptions[op].value] = disoption;
                            } else if (dependencyOnCity!== null && dependencyOnCity === 'postalCode') {
                                var postalField = !empty(postalCodeForm['postalCode' + option.id]) ? postalCodeForm['postalCode' + option.id] : postalCodeForm.nocities;
                                var postalOp = postalField ? postalField.options :'';
                                var Postaloptions1 =[];
                                for (var option in postalOp) {
                                    if (postalOp[option].value != null) {
                                        Postaloptions1.push(postalOp[option].value);
                                    }
                                }
                               var cityObject = {};
                               cityObject.label = cityOptions[op].label;
                               cityObject.postalCodes = Postaloptions1;
                               cityObj[cityOptions[op].value] = cityObject;
                            } else {
                                var coptions = []
                                for (var cityop in cityOptions) {
                                    if (cityOptions[cityop].value != null) {
                                        coptions.push(cityOptions[cityop].value);
                                    }
                                }
                                var sobj = {};
                                sobj.cities = coptions;
                                stateObj[stateOptions[o].value] =  sobj;
                            }
                        }
                    }
                    if (Object.keys(cityObj).length > 0) {
                        var s = {}
                        s.cities = cityObj;
                        stateObj[stateOptions[o].value] =  s;
                    }
                } else if (postalCodeField != undefined) {
                    var postalCodeOptions = postalCodeField ? postalCodeField.options :[];
                    var postalOptions =[];
                    for (var posop in postalCodeOptions) {
                        if (postalCodeOptions [posop].value != null) {
                            postalOptions.push(postalCodeOptions[posop].value);
                        }
                    }
                    stateObj[stateOptions[o].value] = postalOptions;
                    if (Object.keys(cityObj).length > 0) {
                        var s = {}
                        s.cities = cityObj;
                        s.label = stateOptions[o].label;
                        stateObj[stateOptions[o].value] =  s;
                    }
                 }
            }
        } catch (error) {
            if (!list.error) {
                list.error = [];
            }
            list.error.push('Error: ' + error);
        }
    }
    list.states = stateObj;
    /* eslint-enable */
    return list;
}

/**
 * get TH Language
 * @param {string} state - state
 * @param {string} city -city
 * @return {Object} obj - obj
 */
function getTranslatedLabel(state, city) {
    var server = require('server');
    var Site = require('dw/system/Site');
    var currentCountry = session.custom.currentCountry || require('dw/util/Locale').getLocale(request.getLocale()).country; // eslint-disable-line
    var stateLabel = '';
    var cityLabel = '';
    var stateOptionId = '';
    var addressForm = require('server').forms.getForm('shipping').shippingAddress.addressFields;
    var stateOptions = addressForm.states ? addressForm.states.stateCode.options : [];
    var countryFields;
    var hasCityDropdown;
    if (!empty(Site.current.getCustomPreferenceValue('countryFields'))) {
        countryFields = Site.current.getCustomPreferenceValue('countryFields');
    }
    /* eslint-disable */
    for (var o in stateOptions) {
        if (stateOptions[o] && stateOptions[o].value && stateOptions[o].value.length > 0 && stateOptions[o].value === state) {
            stateLabel = stateOptions[o].label;
            stateOptionId =  stateOptions[o].id
            break;
        }
    }
    if (!empty(countryFields) && typeof countryFields !== undefined) {
        hasCityDropdown = JSON.parse(countryFields)[currentCountry] && JSON.parse(countryFields)[currentCountry].fields.filter(function (obj) {
            return obj.id === 'city';
        });
    }
    var cityForm = !empty(hasCityDropdown) && hasCityDropdown.length > 0 && !empty(session.forms.city) ? server.forms.getForm('city') : [];
    var cityField = !empty(cityForm['city' + stateOptionId]) ? cityForm['city' + stateOptionId] : cityForm.nocities;
    var cityOptions = cityField ? cityField.options : [];
    for (var op in cityOptions)  {
        if (cityOptions[op] && cityOptions[op].value && cityOptions[op].value.length > 0 && cityOptions[op].value === city) {
            cityLabel = cityOptions[op].label;
        }
    }
    var obj = {
        stateCode: stateLabel,
        city: cityLabel
    };
    return obj;
}

/**
 * Stores a new address for a given customer
 * @param {Object} address - New address to be saved
 * @param {Object} customer - Current customer
 * @param {string} addressId - Id of a new address to be created
 * @returns {void}
 */
 function saveAddress(address, customer, addressId) {
    var Transaction = require('dw/system/Transaction');

    var addressBook = customer.raw.getProfile().getAddressBook();
    Transaction.wrap(function () {
        var newAddress = addressBook.createAddress(addressId);
        updateAddressFields(newAddress, address);
    });
}

/**
 * Copy dwscript address object into JavaScript object
 * @param {dw.order.OrderAddress} address - Address to be copied
 * @returns {Object} - Plain object that represents an address
 */
 function copyShippingAddress(address) {
     var shippingAddress = baseCheckoutHelper.copyShippingAddress(address);
     shippingAddress.suburb = 'suburb' in address.custom && address.custom.suburb;
     shippingAddress.businessName = 'businessName' in address.custom && address.custom.businessName;
     shippingAddress.district = 'district' in address.custom && address.custom.district;

     return shippingAddress;
}

/**
 * Gather all addresses from shipments and return as an array
 * @param {dw.order.Basket} order - current order
 * @returns {Array} - Array of shipping addresses
 */
function gatherShippingAddresses(order) {
        var collections = require('*/cartridge/scripts/util/collections');
        var allAddresses = [];
        if (order.shipments) {
                collections.forEach(order.shipments, function (shipment) {
                if (shipment.shippingAddress) {
                    allAddresses.push(copyShippingAddress(shipment.shippingAddress));
                }
            });
        } else {
            allAddresses.push(order.defaultShipment.shippingAddress);
        }
        return allAddresses;
    }

Object.assign(module.exports, baseCheckoutHelper);
module.exports.updateAddressFields = updateAddressFields;
module.exports.inputValidationField = inputValidationField;
module.exports.validateAddressInputFields = validateAddressInputFields;
module.exports.getCountriesDefinition = getCountriesDefinition;
module.exports.getTranslatedLabel = getTranslatedLabel;
module.exports.copyShippingAddress = copyShippingAddress;
module.exports.gatherShippingAddresses = gatherShippingAddresses;
module.exports.saveAddress = saveAddress;
module.exports.combinePhoneField = combinePhoneField;
module.exports.splitPhoneField = splitPhoneField;