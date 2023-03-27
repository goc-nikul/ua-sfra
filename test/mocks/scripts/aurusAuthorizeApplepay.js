'use strict';

function getApplepayEventData() {
    var mockApplepayEventData = {
        payment: {
            token: {
                "paymentData": {
                    "data": "tkXvUg4bvYJ/RjVKpm+z9SA0SJshSirJP7PuFAux6BO34BUX5Neu0SZ8LTY5YCPZLUa4GdH6FV/4b6EpePT4ZZrBXPTS2l61uFNH3fSKNqIJI3USWY91s+1MzlMQAhAHSv5TSyK3suH+3JzPM47aPTUf5WcLskGLRnHY8T9Y02OfomXRRjjvK4/SG3U3pHp+5AD0/66Yf51dYvODTBPpoZ77o46egRaO39UZduWaviPxo/6tmGAwA4eH698v58HOvNbLAL7VCaxxmB8wYNm+7SloxKnyAMc+dYpQMCkLpE2qDhbA+1sjCmRV+WokZdauFShPRvBjpcJ6Ul8wmlXh3XVqgyl4QoKQctIQh0uxO3ET67BHpIjVq8vPi8fGUSXcCjA+H0L33qNVfDDMRQycd6hhHsISJh9LUhmpMK5/N4XB",
                    "signature": "test",
                    "header": {
                        "ephemeralPublicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEzf0/67FH4lmN/sw+wKL/IwNPlrXpGvw+siL0qMyX6zi128YtuHuqCZ1QJiggJs3Y0RICyX2u7oEeE76FjmZgUw==",
                        "publicKeyHash": "rLQbRaJr0SJxndXBepKCz0YpWnBFntWja9DV9BDa8uI=",
                        "transactionId": "813e5c9f03d1b01ede3fd2bf7a28649499a41795ea95327a222ac1734e50ce7e"
                    },
                    "version": "EC_v1"
                },
                "transactionIdentifier": "5AD02CEEA660D838179DD397265E282E41440D7B2A21DB27F4D938845A8D9E4D",
                "paymentMethod": {
                    "displayName": "Visa 0121",
                    "type": "credit",
                    "network": "Visa"
                }
            }
        }
    }
    return mockApplepayEventData;
}

function getApplepaySessionToken() {
    var mockSessionTokenResponse = {
        "GetSessionTokenResponse": {
            "CardNumber": "XXXXXXXXXXXX2182",
            "ProfileId": "",
            "ResponseCode": "00000",
            "RequestId": "17ed099c-3dad-4a86-9d51-312d0ae41da2",
            "MerchantSessionId": "",
            "ProcessorToken": "",
            "ProcessorPayerId": "",
            "SubCardType": "",
            "ECOMMInfo": {
                "OneTimeToken": "20000000000000000000000023169182",
                "StoreId": "99999",
                "MerchantIdentifier": "100000090522",
                "TerminalId": "77218055"
            },
            "Pay_Wallet": "{\"deviceManufacturerIdentifier\":\"040010030273\",\"transactionAmount\":1304,\"paymentDataType\":\"3DSecure\",\"paymentData\":{\"onlinePaymentCryptogram\":\"Audn8JAACslAU2CfcWjBMAACAAA=\",\"eciIndicator\":\"7\"},\"currencyCode\":\"840\",\"applicationExpirationDate\":\"231231\"}",
            "CardToken": "",
            "BillingAddress": {
                "BillingAddressLine1": "100 11th Ave",
                "BillingAddressLine2": "",
                "BillingCountry": "US",
                "BillingEmailId": "test@test.com",
                "BillingCity": "NY",
                "BillingMobileNumber": "4089741010",
                "BillingFirstName": "test",
                "BillingLastName": "test",
                "BillingZip": "10011",
                "BillingState": "NY",
                "BillingMiddleName": ""
            },
            "CardType": "VIC",
            "TransactionIdentifier": "193221123023345842",
            "CardExpiryDate": "1223",
            "ShippingAddress": {
                "ShippingAddressLine1": "100 11th Ave",
                "ShippingEmailId": "test@test.com",
                "ShippingMiddleName": "",
                "ShippingFirstName": "test",
                "ShippingZip": "100112857",
                "ShippingCountry": "US",
                "ShippingCity": "New York",
                "ShippingState": "NY",
                "ShippingMobileNumber": "4089741010",
                "ShippingAddressLine2": "",
                "ShippingLastName": "test"
            },
            "ResponseText": "APPROVAL",
            "CartId": "",
            "WalletIdentifier": "7"
        }
    }

    return JSON.stringify(mockSessionTokenResponse);
}

function getApplepaySession() {
    var mockSessionResponse = {
        "SessionResponse": {
            "ResponseCode": "00000",
            "StoreId": "99999",
            "RequestId": "38c6ebb1-4bc6-4c92-99b3-37bcce5c1290",
            "MerchantIdentifier": "100000090522",
            "SessionValidity": "30",
            "AlternatePaymentMatrix": "00010010001001000000000100000000",
            "TerminalId": "77218055",
            "ResponseText": "APPROVAL",
            "SessionId": "200000000000000000000023862049",
            "DigitalWalletJsUrl": ""
        }
    }
    return JSON.stringify(mockSessionResponse);
}

module.exports = {
    getApplepayEventData: getApplepayEventData,
    getApplepaySessionToken: getApplepaySessionToken,
    getApplepaySession: getApplepaySession
}