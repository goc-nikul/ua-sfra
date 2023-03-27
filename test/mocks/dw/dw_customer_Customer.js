'use strict';

class Customer {
    constructor() {
        this.ID = 'test';
        this.authenticated = 'true';
        this.registered = true;
        this.profile = {
            custom: {
                vipAccountId: '6298769367750939',
                isEmployee: false,
                loyaltyLastReconcileDate: ''
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
            }
        };
        this.authenticated = false;
        this.isAuthenticated = function () {
            return this.authenticated;
        };
        this.custom = {};
    }
    getProfile() {
        return this.profile;
    }
}

module.exports = Customer;
