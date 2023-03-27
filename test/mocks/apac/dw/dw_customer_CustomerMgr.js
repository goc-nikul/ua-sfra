'use strict';

var Customer = require('./dw_customer_Customer');
class CustomerMgr {
    static createCustomer() {
        return new Customer();
    }
    static authenticateCustomer() {
        return {
            authenticated: true,
            customer: new Customer(),
            status: 'AUTH_OK'
        };
    }
    static loginCustomer() {
        return new Customer();
    }
    static getCustomerByLogin() {
        return new Customer();
    }
    static getCustomerByToken() {
        return new Customer();
    }
    static getExternallyAuthenticatedCustomerProfile(oauthProviderId, userId) {
        var customer = new Customer();
        var profile = customer.profile;
        profile.email = userId;
        customer.setFirstName = function (firstName) {
            this.firstName = firstName;
        };
        customer.setSecondName = function (secondName) {
            this.secondName = secondName;
        };
        customer.setLastName = function (lastName) {
            this.lastName = lastName;
        };
        customer.setBirthday = function (birthDay) {
            this.birthDay = birthDay;
        };
        customer.setGender = function (gender) {
            this.gender = gender;
        };
        customer.setEmail = function (email) {
            this.gender = email;
        };
        customer.custom = {};
        customer.getCredentials = function () {
            return {
                isEnabled: function () {
                    return true;
                }
            };
        };
        this.customer = customer;
        return customer;
    }
    static loginExternallyAuthenticatedCustomer() {
        var customer = this.customer ? this.customer : new Customer();
        customer.authenticated = true;
        return customer;
    }
}

module.exports = CustomerMgr;
