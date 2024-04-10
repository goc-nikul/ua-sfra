'use strict';

function getSessionReqBody() {
    var mockSessionReqBody = {
        SessionRequest: {
            CardExpiryDate: '',
            CardIdentifier: '',
            CardNumber: '',
            CardType: '',
            CorpID: 'test', // custom pref
            DomainId: 'test', // custom pref
            KI: '',
            MerchantIdentifier: 'test', //custom pref
            StoreId: 'test', // custom pref
            TemplateId: '1', // determines which CC form is retrieved
            TerminalId: 'test',// custom pref
            URLType: 'test', // custom pref
            CardTypeSupport: '1111111000000000',
            TokenType: '102',
            ECOMMFingerPrintInfo: {
                BrowserDetails: '',
                BrowserLanguage: '',
                City: '',
                CountryCode: '',
                DeviceOS: '',
                DeviceScreenResolution: '',
                DeviceType: '',
                IPAddress: '',
                NetworkDownloadSpeed: '',
                NetworkMaxDownloadSpeed: '',
                NetworkSubType: '',
                NetworkType: '',
                ReferralURL: '',
                StateName: '',
                WebsiteSessionID: ''
            }
        }
    };
    return mockSessionReqBody;
}

function getMockConsumerObject() {
    var mockConsumerObject = {
        "sessionId": "test",
        "customer": {
            "skipShippingAddress": "0",
            "billing_address": {
                "firstName": "test",
                "lastName": "test",
                "emailAddress": "test@ua.com",
                "street": "test",
                "street2": "test",
                "city": "test",
                "state": "CA",
                "postalCode": "",
                "countryCode": "US",
                "phoneNumber": "9234567890"
            },
            "shipping_address": {
                "firstName": "Test",
                "lastName": "Test",
                "emailAddress": "test@ua.com",
                "street": "1 microsoft way",
                "street2": "",
                "city": "Redmond",
                "state": "WA",
                "postalCode": "98052",
                "countryCode": "US",
                "phoneNumber": "9234567890"
            }
        },
        "order": {
            "purchaseCountry": "US",
            "purchaseCurrency": "USD",
            "locale": "en-US",
            "intent": "AUTHORIZE",
            "softDescriptor": "ECHI5786786",
            "client": [
                "desktop",
                "mobile_browser"
            ],
            "request_datetime": "",
            "language_code": "ES",
            "merchant_currency_code": "USD",
            "items": [
                {
                    "reference": "Total_Tax",
                    "name": "Tax",
                    "quantity": "1",
                    "totalAmount": 0,
                    "type": "sales_tax",
                    "price": {
                        "amount": 0,
                        "currency": "USD"
                    }
                }
            ],
            "tax_amount": {
                "amount": 0,
                "currency": "USD"
            },
            "order_amount": {
                "amount": 0,
                "currency": "USD"
            },
            "merchant": {
                "payment_error_url": "test/AurusPay-SafetyPayErrorCallback",
                "payment_ok_url": "test/AurusPay-SafetyPayCallback",
                "callBackUrl": "",
                "merchant_set_pay_amount": true
              },
              "shopper": {
                "phone": {
                  "phone_type": "mobile",
                  "phone_country_code": "+1",
                  "phone_number": "9234567890",
                  "is_sms_enabled": false
                },
                "first_name": "Test",
                "last_name": "Test"
            }
        }
    }
    return mockConsumerObject;
}

function getMockSessionTokenResponseForPaypal() {
    var mockSessionTokenResponse = {
        "GetSessionTokenResponse": {
            "CardNumber": "",
            "ProfileId": "",
            "ResponseCode": "00000",
            "RequestId": "",
            "MerchantSessionId": "",
            "ProcessorToken": "",
            "ProcessorPayerId": "",
            "ECOMMInfo": {
                "OneTimeToken": "20000000000000000000000023583447",
                "StoreId": "",
                "MerchantIdentifier": "",
                "TerminalId": ""
            },
            "Pay_Wallet": "{\"create_time\":\"2022-06-10T20:47:18Z\",\"processing_instruction\":\"ORDER_SAVED_EXPLICITLY\",\"purchase_units\":[{\"payee\":{\"email_address\":\"sb-3k02e1226431@business.example.com\",\"merchant_id\":\"JEYDEQDRFU5NG\"},\"amount\":{\"value\":\"475.00\",\"currency_code\":\"USD\"},\"reference_id\":\"default\",\"shipping\":{\"address\":{\"country_code\":\"US\",\"admin_area_1\":\"NY\",\"address_line_1\":\"100 11th Ave\",\"admin_area_2\":\"New York\",\"address_line_2\":\"Apt 8d\",\"postal_code\":\"10011-2857\"},\"name\":{\"full_name\":\"Syed Muhammad Ali Gillani\"}},\"soft_descriptor\":\"ECHI5786786\"}],\"links\":[{\"method\":\"GET\",\"rel\":\"self\",\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/1M850060317284415\"},{\"method\":\"PATCH\",\"rel\":\"update\",\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/1M850060317284415\"},{\"method\":\"POST\",\"rel\":\"save\",\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/1M850060317284415/save\"}],\"id\":\"1M850060317284415\",\"intent\":\"AUTHORIZE\",\"payer\":{\"email_address\":\"sb-em3ge5227393@personal.example.com\",\"address\":{\"country_code\":\"US\",\"admin_area_1\":\"CA\",\"address_line_1\":\"1 Main St\",\"admin_area_2\":\"San Jose\",\"postal_code\":\"95131\"},\"phone\":{\"phone_type\":\"HOME\",\"phone_number\":{\"national_number\":\"4089482775\"}},\"name\":{\"surname\":\"Doe\",\"given_name\":\"John\"},\"payer_id\":\"VD77SBB6RM4G6\"},\"status\":\"APPROVED\"}",
            "CardToken": "",
            "BillingAddress": {
                "BillingAddressLine1": "1 Main St",
                "BillingAddressLine2": "",
                "BillingCountry": "US",
                "BillingEmailId": "sb-em3ge5227393@personal.example.com",
                "BillingCity": "San Jose",
                "BillingMobileNumber": "4089482775",
                "BillingFirstName": "John",
                "BillingLastName": "Doe",
                "BillingZip": "95131",
                "BillingState": "CA",
                "BillingMiddleName": ""
            },
            "CardType": "PPC",
            "SubCardType": "",
            "TransactionIdentifier": "",
            "CardExpiryDate": "",
            "ShippingAddress": {
                "ShippingAddressLine1": "100 11th Ave",
                "ShippingEmailId": "",
                "ShippingMiddleName": "",
                "ShippingFirstName": "Syed",
                "ShippingZip": "10011-2857",
                "ShippingCountry": "US",
                "ShippingCity": "New York",
                "ShippingState": "NY",
                "ShippingMobileNumber": "4089482775",
                "ShippingAddressLine2": "Apt 8d",
                "ShippingLastName": "Muhammad"
            },
            "ResponseText": "APPROVED",
            "CartId": "",
            "WalletIdentifier": "4",
            "walletUrl": ""
        }
    }
    return JSON.stringify(mockSessionTokenResponse);
}

function getSessionService() {
    var mockSessionResponse = {
        "SessionResponse": {
            "ResponseCode": "00000",
            "StoreId": "45678",
            "RequestId": "d49e97c6-c11a-43d3-b872-769a7bcddea0",
            "MerchantIdentifier": "100000090630",
            "SessionValidity": "30",
            "AlternatePaymentMatrix": "00010010001001000000000000000000",
            "TerminalId": "34147045",
            "ResponseText": "APPROVAL",
            "SessionId": "200000000000000000000023948345",
            "DigitalWalletJsUrl": ""
        }
    };
    return JSON.stringify(mockSessionResponse);
}

function getBillingToken() {
    var mockBillingTokenResponse = {
        "GetBillerTokenResponse": {
            "ResponseCode": "00000",
            "RequestId": "8df95b44-cff4-4e38-9e3d-9bada501a0ba",
            "SubTransType": "",
            "WalletObject": {
                "client_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjgyMzA1ZWJjLWI4MTEtMzYzNy1hYTRjLTY2ZWNhMTg3NGYzZCJ9.eyJzZXNzaW9uX2lkIjoiMGViZGY2NmEtZjM1Yy00ODk4LTg3YjQtMWM3ZWRkZjdhYzk2IiwiYmFzZV91cmwiOiJodHRwczovL2pzLnBsYXlncm91bmQua2xhcm5hLmNvbS9uYS9rcCIsImRlc2lnbiI6ImtsYXJuYSIsImxhbmd1YWdlIjoiZW4iLCJwdXJjaGFzZV9jb3VudHJ5IjoiVVMiLCJlbnZpcm9ubWVudCI6InBsYXlncm91bmQiLCJtZXJjaGFudF9uYW1lIjoiVW5kZXIgQXJtb3VyLCBJbmMiLCJzZXNzaW9uX3R5cGUiOiJQQVlNRU5UUyIsImNsaWVudF9ldmVudF9iYXNlX3VybCI6Imh0dHBzOi8vbmEucGxheWdyb3VuZC5rbGFybmFldnQuY29tIiwic2NoZW1lIjp0cnVlLCJleHBlcmltZW50cyI6W3sibmFtZSI6ImtwYy1sdiIsInZhcmlhdGUiOiJsdiJ9LHsibmFtZSI6ImtwLWNsaWVudC11dG9waWEtcG9wdXAtcmV0cmlhYmxlIiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImtwLWNsaWVudC1vcGYtc2FmYXJpLXNwbGFzaC1zY3JlZW4tcHNlbC0yODE4IiwidmFyaWF0ZSI6InZhcmlhdGUifSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLXN0YXRpYy13aWRnZXQiLCJ2YXJpYXRlIjoiaW5kZXgifSx7Im5hbWUiOiJpbi1hcHAtc2RrLW5ldy1pbnRlcm5hbC1icm93c2VyIiwidmFyaWF0ZSI6Im5ldy1pbnRlcm5hbC1icm93c2VyLWVuYWJsZSIsInBhcmFtZXRlcnMiOnsidmFyaWF0ZV9pZCI6Im5ldy1pbnRlcm5hbC1icm93c2VyLWVuYWJsZSJ9fSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLXNkay1mbG93IiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImtwLWNsaWVudC11dG9waWEtd2Vidmlldy1mbG93IiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImluLWFwcC1zZGstY2FyZC1zY2FubmluZyIsInZhcmlhdGUiOiJjYXJkLXNjYW5uaW5nLWVuYWJsZSIsInBhcmFtZXRlcnMiOnsidmFyaWF0ZV9pZCI6ImNhcmQtc2Nhbm5pbmctZW5hYmxlIn19XSwicmVnaW9uIjoidXMiLCJ1YV9lbmFibGVkX2FuZF9vbmVfcG0iOnRydWV9.IxGwjSGl09XJC-wF4dbvGzJPTocOJFoZ4GcVK8tDBXOJVdRuQbA3tEl8J1QDSDTxckoHm9ElsDYeyzeTB5yPqYwUwORMEa9jk98luKPXbyeVrDIMajXVGo9RNrT-O5wn7CzAZlyAMvjkJgBLvoaqZ5JYHQ3STE1sdUDkHBIQFY9AzeL-3M6utkFuzKaLTWv3e1-9m8fP92WRIeBkW7Y-hrodlN9Obb222LJmZiDitK8KdWuZnmYPUQcoyh9BMkeGG3IZbOfsybag81Q4UsixoXRs2RKUNf63ueQsJt1nzOxAWLMG176PRs3Kx9MpFd8r_h5pxF1B9pCW909iPl8iyQ",
                "payment_method_categories": [
                    {
                        "asset_urls": {
                            "standard": "https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg",
                            "descriptive": "https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg"
                        },
                        "identifier": "pay_over_time",
                        "name": "4 interest-free payments"
                    }
                ],
                "session_id": "0ebdf66a-f35c-4898-87b4-1c7eddf7ac96"
            },
            "ProcessorToken": "",
            "ECOMMInfo": {
                "StoreId": "99999",
                "MerchantIdentifier": "100000090522",
                "TerminalId": "77218055"
            },
            "RedirectCheckoutURL": "",
            "EcomToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjgyMzA1ZWJjLWI4MTEtMzYzNy1hYTRjLTY2ZWNhMTg3NGYzZCJ9.eyJzZXNzaW9uX2lkIjoiMGViZGY2NmEtZjM1Yy00ODk4LTg3YjQtMWM3ZWRkZjdhYzk2IiwiYmFzZV91cmwiOiJodHRwczovL2pzLnBsYXlncm91bmQua2xhcm5hLmNvbS9uYS9rcCIsImRlc2lnbiI6ImtsYXJuYSIsImxhbmd1YWdlIjoiZW4iLCJwdXJjaGFzZV9jb3VudHJ5IjoiVVMiLCJlbnZpcm9ubWVudCI6InBsYXlncm91bmQiLCJtZXJjaGFudF9uYW1lIjoiVW5kZXIgQXJtb3VyLCBJbmMiLCJzZXNzaW9uX3R5cGUiOiJQQVlNRU5UUyIsImNsaWVudF9ldmVudF9iYXNlX3VybCI6Imh0dHBzOi8vbmEucGxheWdyb3VuZC5rbGFybmFldnQuY29tIiwic2NoZW1lIjp0cnVlLCJleHBlcmltZW50cyI6W3sibmFtZSI6ImtwYy1sdiIsInZhcmlhdGUiOiJsdiJ9LHsibmFtZSI6ImtwLWNsaWVudC11dG9waWEtcG9wdXAtcmV0cmlhYmxlIiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImtwLWNsaWVudC1vcGYtc2FmYXJpLXNwbGFzaC1zY3JlZW4tcHNlbC0yODE4IiwidmFyaWF0ZSI6InZhcmlhdGUifSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLXN0YXRpYy13aWRnZXQiLCJ2YXJpYXRlIjoiaW5kZXgifSx7Im5hbWUiOiJpbi1hcHAtc2RrLW5ldy1pbnRlcm5hbC1icm93c2VyIiwidmFyaWF0ZSI6Im5ldy1pbnRlcm5hbC1icm93c2VyLWVuYWJsZSIsInBhcmFtZXRlcnMiOnsidmFyaWF0ZV9pZCI6Im5ldy1pbnRlcm5hbC1icm93c2VyLWVuYWJsZSJ9fSx7Im5hbWUiOiJrcC1jbGllbnQtdXRvcGlhLXNkay1mbG93IiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImtwLWNsaWVudC11dG9waWEtd2Vidmlldy1mbG93IiwidmFyaWF0ZSI6InZhcmlhdGUtMSJ9LHsibmFtZSI6ImluLWFwcC1zZGstY2FyZC1zY2FubmluZyIsInZhcmlhdGUiOiJjYXJkLXNjYW5uaW5nLWVuYWJsZSIsInBhcmFtZXRlcnMiOnsidmFyaWF0ZV9pZCI6ImNhcmQtc2Nhbm5pbmctZW5hYmxlIn19XSwicmVnaW9uIjoidXMiLCJ1YV9lbmFibGVkX2FuZF9vbmVfcG0iOnRydWV9.IxGwjSGl09XJC-wF4dbvGzJPTocOJFoZ4GcVK8tDBXOJVdRuQbA3tEl8J1QDSDTxckoHm9ElsDYeyzeTB5yPqYwUwORMEa9jk98luKPXbyeVrDIMajXVGo9RNrT-O5wn7CzAZlyAMvjkJgBLvoaqZ5JYHQ3STE1sdUDkHBIQFY9AzeL-3M6utkFuzKaLTWv3e1-9m8fP92WRIeBkW7Y-hrodlN9Obb222LJmZiDitK8KdWuZnmYPUQcoyh9BMkeGG3IZbOfsybag81Q4UsixoXRs2RKUNf63ueQsJt1nzOxAWLMG176PRs3Kx9MpFd8r_h5pxF1B9pCW909iPl8iyQ",
            "ProcessorReferenceNumber": "0ebdf66a-f35c-4898-87b4-1c7eddf7ac96",
            "ProcessorResponseCode": "",
            "ThirdPartyURL": "",
            "ResponseText": "APPROVAL",
            "WalletIdentifier": "14",
            "PaymentItemCategory": "pay_over_time"
        }
    };
    return JSON.stringify(mockBillingTokenResponse);
}

module.exports = {
    getBillingToken: getBillingToken,
    getSessionService: getSessionService,
    getSessionReqBody: getSessionReqBody,
    getMockConsumerObject: getMockConsumerObject,
    getMockSessionTokenResponseForPaypal: getMockSessionTokenResponseForPaypal
};