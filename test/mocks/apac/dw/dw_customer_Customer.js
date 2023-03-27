'use strict';

class Customer {
    constructor() {
        this.ID = 'test';
        this.authenticated = 'true';
        this.registered = true;
        this.profile = {
            custom: {
                vipAccountId: '6298769367750939',
                isEmployee: false
            },
            email: 'testEmail@gmail.com',
            firstName: 'testFirstName',
            lastName: 'testlastName',
            credentials: {
                createResetPasswordToken: () => {
                    return 'token';
                },
                setPasswordWithToken: () => {
                    return true;
                }
            },
            getEmail: function () {
                return this.email;
            },
            describe: function () {
                return {
                    getSystemAttributeDefinition: function (value) {
                        return {
                            getValues: function () {
                                return {
                                    value: 1,
                                    displayValue: 'male',
                                    toArray: function () {
                                        return [{ getDisplayValue: function () { return 'male'; } }];
                                    }
                                };
                            }
                        };
                    }
                };
            },
            setFirstName: function (firstName) {
                this.firstName = firstName;
            },
            setLastName: function (lastName) {
                this.lastName = lastName;
            },
            setPhoneHome: function (phone) {
                this.phone = phone;
            },
            setGender: function (gender) {
                this.gender = gender;
            },
            setBirthday: function (birthday) {
                this.birthday = birthday;
            }
        };
        this.authenticated = false;
        this.isAuthenticated = function () {
            return this.authenticated;
        };
    }
    getProfile() {
        return this.profile;
    }
}

module.exports = Customer;
