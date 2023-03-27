'use strict';
var CustomString = require('./String');

class CustomerAddress {
    constructor() {
        this.custom = {
            addressType: 'someType'
        };
        this.firstName = 'Test';
        this.lastName = 'Test';
        this.address1 = '1 microsoft way';
        this.address2 = '';
        this.city = 'Redmond';
        this.postalCode = '98052';
        this.stateCode = 'WA';
        this.countryCode = {
            value: 'US',
            displayValue: new CustomString('US')
        };
        this.phone = '9234567890';
    }

    getFirstName() {
        return this.firstName;
    }

    getLastName() {
        return this.lastName;
    }

    getAddress1() {
        return this.address1;
    }

    getAddress2() {
        return this.address2;
    }

    getCity() {
        return this.city;
    }

    getPostalCode() {
        return this.postalCode;
    }

    getStateCode() {
        return this.stateCode;
    }

    getCountryCode() {
        return this.countryCode;
    }

    getPhone() {
        return this.phone;
    }

    getCustom() {
        return this.custom;
    }

    setFirstName(firstName) {
        this.firstName = firstName;
    }

    setLastName(lastName) {
        this.lastName = lastName;
    }

    setAddress1(address1) {
        this.address1 = address1;
    }

    setAddress2(address2) {
        this.address2 = address2;
    }

    setCity(city) {
        this.city = city;
    }

    setPostalCode(postalCode) {
        this.postalCode = postalCode;
    }

    setStateCode(stateCode) {
        this.stateCode = stateCode;
    }

    setCountryCode() {
        return this.countryCode;
    }

    setPhone() {
        return this.phone;
    }

    setCustom() {
        return this.custom;
    }

}

// CustomerAddress.setClassConstants();

module.exports = CustomerAddress;
