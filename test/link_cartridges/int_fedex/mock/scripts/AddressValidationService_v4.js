'use strict';

class AddressValidationRequest {
    constructor() {
        this.webAuthenticationDetail = '';
        this.clientDetail = '';
        this.version = '';
        this.addressesToValidate = '';
    }

    setWebAuthenticationDetail(webAuthenticationDetail) {
        this.webAuthenticationDetail = webAuthenticationDetail;
    }

    setClientDetail(clientDetail) {
        this.clientDetail = clientDetail;
    }

    setVersion(version) {
        this.version = version;
    }

    setAddressesToValidate(addressesToValidate) {
        this.addressesToValidate = addressesToValidate;
    }
}

class WebAuthenticationDetail {
    constructor() {
        this.userCredential = '';
    }

    setUserCredential(webAuthenticationCredential) {
        this.userCredential = webAuthenticationCredential;
    }
}

class WebAuthenticationCredential {
    constructor() {
        this.key = '';
        this.password = '';
    }

    setKey(key) {
        this.key = key;
    }

    setPassword(password) {
        this.password = password;
    }
}

class ClientDetail {
    constructor() {
        this.accountNumber = '';
        this.meterNumber = '';
    }

    setAccountNumber(accountNumber) {
        this.accountNumber = accountNumber;
    }

    setMeterNumber(meterNumber) {
        this.meterNumber = meterNumber;
    }
}

class VersionId {
    constructor() {
        this.serviceId = '';
        this.major = '';
        this.intermediat = '';
        this.minor = '';
    }

    setServiceId(serviceId) {
        this.serviceId = serviceId;
    }

    setMajor(major) {
        this.major = major;
    }

    setIntermediate(intermediat) {
        this.intermediat = intermediat;
    }

    setMinor(minor) {
        this.minor = minor;
    }
}

class AddressToValidate {
    constructor() {
        this.address = '';
    }

    setAddress(address) {
        this.address = address;
    }
}

class Address {
    constructor() {
        this.streetLines = '';
        this.city = '';
        this.stateCode = '';
        this.postalCode = '';
        this.countryCode = '';
    }

    setStreetLines(streetLines) {
        this.streetLines = streetLines;
    }

    setCity(city) {
        this.city = city;
    }

    setStateOrProvinceCode(stateCode) {
        this.stateCode = stateCode;
    }

    setPostalCode(postalCode) {
        this.postalCode = postalCode;
    }

    setCountryCode(country) {
        this.countryCode = country;
    }
}

module.exports = {
    AddressValidationRequest: AddressValidationRequest,
    WebAuthenticationDetail: WebAuthenticationDetail,
    WebAuthenticationCredential: WebAuthenticationCredential,
    ClientDetail: ClientDetail,
    VersionId: VersionId,
    AddressToValidate: AddressToValidate,
    Address: Address
};
