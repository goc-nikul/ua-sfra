'use strict';
var base = module.superModule;
/**
 * Address class that represents an orderAddress
 * @param {dw.order.OrderAddress} addressObject - User's address
 * @constructor
 */
function address(addressObject) {
    base.call(this, addressObject);
    var form = require('server').forms.getForm('shipping');
    if (addressObject && 'custom' in addressObject && 'exteriorNumber' in addressObject.custom && !empty(addressObject.custom.exteriorNumber)) {
        this.address.exteriorNumber = addressObject.custom.exteriorNumber;
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && 'exteriorNumber' in addressObject.raw.custom && !empty(addressObject.raw.custom.exteriorNumber)) {
        this.address.exteriorNumber = addressObject.raw.custom.exteriorNumber;
    }
    if (addressObject && 'custom' in addressObject && 'interiorNumber' in form.shippingAddress.addressFields) {
        this.address.interiorNumber = 'interiorNumber' in addressObject.custom && !empty(addressObject.custom.interiorNumber) ? addressObject.custom.interiorNumber : '';
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && 'interiorNumber' in addressObject.raw.custom && !empty(addressObject.raw.custom.interiorNumber)) {
        this.address.interiorNumber = addressObject.raw.custom.interiorNumber;
    }
    if (addressObject && 'custom' in addressObject && 'colony' in form.shippingAddress.addressFields) {
        this.address.colony = 'colony' in addressObject.custom && !empty(addressObject.custom.colony) ? addressObject.custom.colony : '';
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && 'colony' in addressObject.raw.custom && !empty(addressObject.raw.custom.colony)) {
        this.address.colony = addressObject.raw.custom.colony;
    }
    if (addressObject && 'custom' in addressObject && 'dependentLocality' in form.shippingAddress.addressFields) {
        this.address.dependentLocality = 'dependentLocality' in addressObject.custom && !empty(addressObject.custom.dependentLocality) ? addressObject.custom.dependentLocality : '';
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && 'dependentLocality' in addressObject.raw.custom && !empty(addressObject.raw.custom.dependentLocality)) {
        this.address.dependentLocality = addressObject.raw.custom.dependentLocality;
    }
    if (addressObject && 'custom' in addressObject && 'exteriorNumber' in form.shippingAddress.addressFields) {
        this.address.exteriorNumber = 'exteriorNumber' in addressObject.custom && !empty(addressObject.custom.exteriorNumber) ? addressObject.custom.exteriorNumber : '';
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && 'exteriorNumber' in addressObject.raw.custom && !empty(addressObject.raw.custom.exteriorNumber)) {
        this.address.exteriorNumber = addressObject.raw.custom.exteriorNumber;
    }
    if (addressObject && 'custom' in addressObject && 'additionalInformation' in form.shippingAddress.addressFields) {
        this.address.additionalInformation = 'additionalInformation' in addressObject.custom && !empty(addressObject.custom.additionalInformation) ? addressObject.custom.additionalInformation : '';
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && 'additionalInformation' in addressObject.raw.custom && !empty(addressObject.raw.custom.additionalInformation)) {
        this.address.additionalInformation = addressObject.raw.custom.additionalInformation;
    }
    if (addressObject && 'custom' in addressObject && 'colony' in addressObject.custom && !empty(addressObject.custom.colony)) {
        this.address.colony = addressObject.custom.colony;
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && 'colony' in addressObject.raw.custom && !empty(addressObject.raw.custom.colony)) {
        this.address.colony = addressObject.raw.custom.colony;
    }
    if (addressObject && 'custom' in addressObject && 'dependentLocality' in addressObject.custom && !empty(addressObject.custom.dependentLocality)) {
        this.address.dependentLocality = addressObject.custom.dependentLocality;
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && 'dependentLocality' in addressObject.raw.custom && !empty(addressObject.raw.custom.dependentLocality)) {
        this.address.dependentLocality = addressObject.raw.custom.dependentLocality;
    }
    if (addressObject && 'custom' in addressObject && 'rfc' in addressObject.custom && !empty(addressObject.custom.rfc)) {
        this.address.rfc = addressObject.custom.rfc;
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && 'rfc' in addressObject.raw.custom && !empty(addressObject.raw.custom.rfc)) {
        this.address.rfc = addressObject.raw.custom.rfc;
    }
    if (addressObject && 'custom' in addressObject && 'razonsocial' in addressObject.custom && !empty(addressObject.custom.razonsocial)) {
        this.address.razonsocial = addressObject.custom.razonsocial;
    } else if (!empty(addressObject) && 'raw' in addressObject && !empty(addressObject.raw.custom) && 'razonsocial' in addressObject.raw.custom && !empty(addressObject.raw.custom.razonsocial)) {
        this.address.razonsocial = addressObject.raw.custom.razonsocial;
    }
}

module.exports = address;
