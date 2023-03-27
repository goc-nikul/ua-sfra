'use strict';
var base = module.superModule;
/**
 * Address class that represents an orderAddress
 * @param {dw.order.OrderAddress} addressObject - User's address
 * @constructor
 */
function address(addressObject) {
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    var addressHelper = require('*/cartridge/scripts/helpers/addressHelpers');
    base.call(this, addressObject);
    if (addressObject && 'custom' in addressObject && 'suburb' in addressObject.custom && !empty(addressObject.custom.suburb)) {
        this.address.suburb = addressObject.custom.suburb;
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && !empty(addressObject.raw.custom.suburb)) {
        this.address.suburb = addressObject.raw.custom.suburb;
    }
    if (addressObject && 'custom' in addressObject && 'district' in addressObject.custom && !empty(addressObject.custom.district)) {
        this.address.district = addressObject.custom.district;
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && !empty(addressObject.raw.custom.district)) {
        this.address.district = addressObject.raw.custom.district;
    }
    if (addressObject && 'custom' in addressObject && 'businessName' in addressObject.custom && !empty(addressObject.custom.businessName)) {
        this.address.businessName = addressObject.custom.businessName;
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && !empty(addressObject.raw.custom.businessName)) {
        this.address.businessName = addressObject.raw.custom.businessName;
    }
    if (showSplitPhoneMobileField) {
        if (addressObject && 'custom' in addressObject && 'phone1' in addressObject.custom && !empty(addressObject.custom.phone1)) {
            this.address.phone1 = addressObject.custom.phone1;
        } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && !empty(addressObject.raw.custom.phone1)) {
            this.address.phone1 = addressObject.raw.custom.phone1;
        }
        if (addressObject && 'custom' in addressObject && 'phone2' in addressObject.custom && !empty(addressObject.custom.phone2)) {
            this.address.phone2 = addressObject.custom.phone2;
        } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && !empty(addressObject.raw.custom.phone2)) {
            this.address.phone2 = addressObject.raw.custom.phone2;
        }
        if (addressObject && 'custom' in addressObject && 'phone3' in addressObject.custom && !empty(addressObject.custom.phone3)) {
            this.address.phone3 = addressObject.custom.phone3;
        } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && !empty(addressObject.raw.custom.phone3)) {
            this.address.phone3 = addressObject.raw.custom.phone3;
        }
        if (this.address && empty(this.address.phone1) && empty(this.address.phone2) && empty(this.address.phone3) && !empty(this.address.phone)) {
            var customerPhone = addressHelper.splitPhoneField(this.address.phone);
            if (customerPhone && Array.isArray(customerPhone) && customerPhone.length) {
                if (customerPhone[0]) {
                    this.address.phone1 = customerPhone[0];
                }
                if (customerPhone[1]) {
                    this.address.phone2 = customerPhone[1];
                }
                if (customerPhone[2]) {
                    this.address.phone3 = customerPhone[2];
                }
                this.address.phone = customerPhone.join('-');
            }
        }
    }
    var obj;
    if (addressObject && addressObject.stateCode && addressObject.city) {
        obj = addressHelper.getTranslatedLabel(addressObject.stateCode, addressObject.city);
    }
    if (!empty(obj && obj.stateCode)) {
        this.address.stateCodeLabel = obj.stateCode;
    }
    if (!empty(obj && obj.city)) {
        this.address.cityLabel = obj.city;
    }
    if (addressObject && addressObject.countryCode && addressObject.countryCode.value === 'HK') {
        this.address.hideCityAndPostalCode = true;
    }
}

module.exports = address;
