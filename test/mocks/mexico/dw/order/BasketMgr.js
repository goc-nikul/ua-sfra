
function getCurrentBasket() {
    return {
        defaultShipment: {
            shippingAddress: {
                firstName: 'Amanda',
                lastName: 'Jones',
                address1: '65 May Lane',
                address2: '',
                city: 'Allston',
                postalCode: '02135',
                countryCode: { value: 'us' },
                phone: '617-555-1234',
                stateCode: 'MA',
                custom: {
                    exteriorNumber: 'exteriorNumber',
                    interiorNumber: 'interiorNumber',
                    additionalInformation: 'additionalInformation',
                    colony: 'colony',
                    dependentLocality: 'dependentLocality'
                },

                setFirstName: function (firstNameInput) { this.firstName = firstNameInput; },
                setLastName: function (lastNameInput) { this.lastName = lastNameInput; },
                setAddress1: function (address1Input) { this.address1 = address1Input; },
                setAddress2: function (address2Input) { this.address2 = address2Input; },
                setCity: function (cityInput) { this.city = cityInput; },
                setPostalCode: function (postalCodeInput) { this.postalCode = postalCodeInput; },
                setStateCode: function (stateCodeInput) { this.stateCode = stateCodeInput; },
                setCountryCode: function (countryCodeInput) { this.countryCode.value = countryCodeInput; },
                setPhone: function (phoneInput) { this.phone = phoneInput; }
            }
        },
        totalGrossPrice: {
            value: 250.00
        },
        billingAddress: {
            firstName: 'Amanda',
            lastName: 'Jones',
            address1: '65 May Lane',
            address2: '',
            city: 'Allston',
            postalCode: '02135',
            countryCode: { value: 'us' },
            phone: '617-555-1234',
            stateCode: 'MA',
            custom: {
                exteriorNumber: 'exteriorNumber',
                interiorNumber: 'interiorNumber',
                additionalInformation: 'additionalInformation',
                colony: 'colony',
                dependentLocality: 'dependentLocality'
            }
        },
        productLineItems: [
            {
                UUID: 'testUUID',
                id: 'testProductID',
                quantity: {
                    value: 3
                },
                product: {
                    masterProduct: {
                        custom: {
                            division: 'footwear'
                        }
                    },
                    custom: {
                        availableForLocale: {
                            value: 'No'
                        }
                    }
                }
            },
            {
                UUID: 'testUUID1',
                id: 'testProductID1',
                quantity: {
                    value: 3
                },
                product: {
                    custom: {
                        availableForLocale: {
                            value: 'No'
                        }
                    }
                }
            }
        ]
    };
}

module.exports = {
    getCurrentBasket: getCurrentBasket
};
