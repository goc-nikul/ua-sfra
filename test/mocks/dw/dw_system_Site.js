'use strict';
// Helper Functions

// Used to map Value with DisplayValue
function SetOfString(value, displayValue) {
    return {
        value: value,
        displayValue: displayValue,
        getValue: () => {
            return value;
        },
        getDisplayValue: () => {
            return displayValue;
        }
    };
}

// Site Preferences Map
function PrefObject(value) {
    this.value = {
        text: value,
        equals: function (input) {
            return this.text.toLocaleLowerCase() === input.toLocaleLowerCase();
        }
    };
}

class Site {
    constructor() {
        this.preferenceMap = {
            countryCode: new SetOfString('US', 'USA'),
            allowedLocales: [{
                id: 'en_US',
                currencyCode: 'USD'
            }, {
                id: 'fr_CA',
                currencyCode: 'CAD'
            }, {
                id: 'en_CA',
                currencyCode: 'CAD'
            }],
            QAS_EnableAddressVerification: true,
            Aurus_corporateIdentifier: 'test',
            Aurus_domainId: 'test',
            Aurus_merchantIdentifier: 'test',
            Aurus_storeId: 'test',
            Aurus_terminalId: 'test',
            Aurus_urlType: 'test',
            testString: 'test',
            testJson: '{"test": 1}',
            testStringAll: 'ALL',
            testStringUs: 'US',
            testStringNone: 'none',
            Paymetric_iframeURL: 'test',
            Paymetric_clientPath: 'test',
            sitesListBasic: '[{ "countryCode": "BE", "siteID": "PJG-BE", "locales": ["en_BE"], "currencyCode": "EUR" }, { "countryCode": "DE", "siteID": "PJG-DE", "locales": ["de_DE"], "currencyCode": "EUR" }]',
            sitesListFull: "{\"displayOrder\":[\"North_America\"]}",
            globalAccessCountries: '{CA: {url: "https://staging-ca.sfcc.ua-ecm.com/en-ca/"}, AU: {url: "https://staging.underarmour.com/en-au"}, KR: {url: "http://www.underarmour.co.kr/?cregion=%2Fen-us"}}',
            XSSListOfPatterns: "(<body)|(<iframe)|(.js$)|(javascript)|(<script>)|(<\/script>)|(<script\/>)|(<script)|(script>)|(script\/>)|(cookie)|(<img)|(vbscript)|(msgbox)|(alert())|<.*?>\\gmi|\\(.*?\\) ?\\gmi|(<)|(>)\\gmi",
            replaceableProductID: 'dummy',
            realTimeInventoryCallEnabled: true,
            MaoDomTokenChildOrgUsername: 'salesforce@ua-us.com',
            MaoDomTokenChildOrgPassword: 'Password1!',
            MaoDomSaveOrderEndpointUrl: 'https://uarms.omni.manh.com/order/api/order/order/save',
            maoViewDefinition: '{"ViewDefinitionId": "SFCC US","ViewName": "SFCC US"}',
            maoBOPISViewDefinition: '{"ViewDefinitionId": "BOPIS","ViewName": "BOPIS"}',
            UACAPIClientId: 'ONDWXtzzKcz9DymMB8WJyTllmMTXKb0w',
            UACAPIClientSecret: 'I0dFkkETUjn9JV4fdUW6IWfbKqKdMwhFR1flXJ-SAJpZebsEI3iySxlSjgs29L8t',
            UACAPIClientAudience: 'https://commerce.api.ua.com',
            realTimeInventoryCheckPoints: [new PrefObject('CartView'), new PrefObject('AddToCart'), new PrefObject('EditCart'), new PrefObject('StartCheckout'), new PrefObject('PlaceOrder')],
            MaoAvailabilityEndpointUrl: 'https://omni-uarms.omni.manh.com/inventory/api/availability/availabilitydetail',
            MaoAuthTokenEndpointUrl: 'https://uarms-auth.omni.manh.com/oauth/token',
            customerServicePhone: '18887276687',
            MaoBOPISAvailabilityEndpointUrl: 'https://omni-uarms.omni.manh.com/inventory/api/availability/location/availabilitydetail',
            billingCountryList: '{"US": "United States", "CA": "Canada"}',
            uaidmIsEnabled: true,
            uaidmUpdateProfileOnLogin: true,
            uaidmOauthProviderId: 'Under Armour',
            // eslint-disable-next-line spellcheck/spell-checker
            uaidmClientId: '3653ed6b-e356-4dd7-85a3-1885296d57e3',
            // eslint-disable-next-line spellcheck/spell-checker
            uaidmClientSecret: 'wtbxi3ewy7ypj77zlg2xduftd7aratrw7klavbocevdoo3qfspna',
            uaidmJwtSigningKeyId: 'cb68549f-ee89-4ccb-9dd0-c8765e958a89',
            // eslint-disable-next-line spellcheck/spell-checker
            uaidmJwtSigningKey: '3FyI1XdgLzJDwK0FsBvjh0dVOdZjlxuKA-3W73gc4TA-KBJSRcKFut_jUo26lSt1voLlR76RZEYxxkLBZCJrvg',
            uaidmSfccStorefrontPassword: '3131labs',
            uaidmRedirectURI: 'https://development-us.sfcc.ua-ecm.com/on/demandware.store/Sites-US-Site/en_US/Login-OAuthReentry',
            // eslint-disable-next-line spellcheck/spell-checker
            facebookAppID: '194992081310',
            addressVerificationProvider: 'QAS',
            addressProvider: 'FedEx',
            sr_enabled: true,
            eGiftCardAmountMin: 10,
            eGiftCardAmountMax: 2000,
            scheduledDeliveryDateMapping: '{"startDateOffset":30,"endDateOffset":60,"holidays":["01-01","21-04","01-05","07-09","12-10","02-11","15-11","25-12"]}',
            enablePersonalization: true,
            personalizationMaxName: 12,
            personalizationMaxNumber: 2,
            personalizationNegativeWordList: ['Nike', 'Puma'],
            scene7BaseURL: 'https://underarmour.scene7.com/is/image/',
            countryFields: '{"ID":{"fields":[{"id":"state","required":true,"type":"dropdown","dependency":"city"},{"id":"city","required":true,"type":"dropdown","dependency":"district"},{"id":"district","required":true,"type":"dropdown","dependency":""}]},"TH":{"fields":[{"id":"state","required":true,"type":"dropdown","dependency":"city"},{"id":"city","required":true,"type":"dropdown","dependency":"postalCode"},{"id":"postalCode","required":true,"type":"dropdown","dependency":""}]},"MY":{"fields":[{"id":"state","required":true,"type":"dropdown","dependency":"postalCode"},{"id":"postalCode","required":true,"type":"dropdown","dependency":""}]},"PH":{"fields":[{"id":"state","required":true,"type":"dropdown","dependency":"city"},{"id":"city","required":true,"type":"dropdown","dependency":""}]}}',
            hkCityValue: 'city',
            hkpostalCodeValue: '000000',
            limitOrderQuantityByCategory: '{"ID":{"footwear":{"order_limit":2,"message":[{"en":"Due to Ecommerce Regulations implemented by the Indonesian Government, UA.com can only allow customers to purchase a maximum of 2 pairs of footwear for each order. Please kindly remove any excess quantity to proceed with your order.","in":"Due to Ecommerce Regulations implemented by the Indonesian Government, UA.com can only allow customers to purchase a maximum of 2 pairs of footwear for each order. Please kindly remove any excess quantity to proceed with your order."}]},"apparel":{"order_limit":5,"message":[{"en":"Due to Ecommerce Regulations implemented by the Indonesian Government, UA.com can only allow customers to purchase a maximum of 5 pieces of apparels and accessories for each order. Please kindly remove any excess quantity to proceed with your order.","in":"Due to Ecommerce Regulations implemented by the Indonesian Government, UA.com can only allow customers to purchase a maximum of 5 pieces of apparels and accessories for each order. Please kindly remove any excess quantity to proceed with your order."}]}}}',
            smsOptInSitesConfig: '{"default":true,"ID":true,"HK":true,"SG":true,"MY":true,"PH":true}',
            countriesJSON: '[{"countryCode":"SG","locales":["en_SG"],"currencyCode":"SGD","hostname":"development-ap01.ecm.underarmour.com.sg","priceBooks":["SGD-list","SGD-sale"],"countryDialingCode":"+65","regexp":"^[0-9]{8}$","areaCode":"+65","areaCodeDigitCount":3},{"countryCode":"AU","locales":["en_AU"],"currencyCode":"AUD","hostname":"development-ap01.ecm.underarmour.com.au","priceBooks":["AUD-list","AUD-sale"],"areaCode":"+61","areaCodeDigitCount":3,"countryDialingCode":"+61","regexp":"^[0-9]{9}$"}]',
            afterPayMin: 200,
            afterPayMax: 1000,
            aupostConfigurations: '{"movementType":"RETURN","requestType":"PRINT","layout":"A4-1pp","branding":true,"leftOffset":0,"topOffset":0,"templateName":"Parcel Post","deliveryInstructions":"Deliver to Under Armour Aus/NZ. Call 1800 863 372 for support","chargeCode":"PR","authorityToLeave":false,"deliverPartConsignment":false,"containsDangerousGoods":false,"safeDropEnabled":false,"authToken":"NTc1YTYzODAtYWNkZC00YTViLWE5NDEtMTZjZDVlMjY4YjExOldCMmdmNlQ2eTVqNGNobmlyRHpJ"}',
            returnFromAddress: ' {"name":"UA Australia Pty Ltd","lines":["41-43 Bourke Rd","Level 1, The Mill 2"],"suburb":"Alexandria","state":"NSW","postcode":"2015","phone":"1800863372","country":"AU"}',
            returnAddress: '{"name":"True Alliance Reverse Logistic Team","lines":["19 O Riordan Street"],"suburb":"Alexandria","postcode":"2015","state":"NSW","phone":"1800863372","country":"AU","delivery_instructions":"Deliver to Under Armour Aus/NZ. Call 1800 863 372 for support ORDER: "}',
            trustarcSRC: 'https://consent.truste.com/notice?domain=underarmour.com&c=teconsent&text=true&gtm=1',
            shopRunnerCarrierCodes: '{"AK":{"residential":"RATEE","business":"RATET"}}',
            maoMaxFailedCount: 2,
            Paymetric_XiPay_Is_PayPal_Auth_Enabled: true,
            maoManipulatePostalCode: '12345',
            maoSpecialZipCodes: '11111',
            bfxIsEnabled: true,
            preOrderProductList: 'pid1, pid2',
            inStockProductList: 'pid3',
            halShippingEnabled: true,
            halEnabledForShopApp: true,
            isRadioPaymentExperienceEnabled: true,
            isBOPISEnabled: true,
            paazlEnabled: true,
            brandifyAppKey: 'brandifyAppKey',
            isBrandifyEnabled: true,
            enableVIPCheckoutExperience: true,
            internationalShippingCountriesList: '{"GB": ["US", "CA"]}',
            isCategoryLocaleCheckEnabled: false,
            qasProvinceMapping: true,
            shippingCutOffTime: 1,
            naverSSOClientID: 'test123456',
            naverSSOClientSecret: '123456test',
            orderHistoryDetailsProvider: {
                value: 'UACAPI'
            },
            isInternationalBillingAddressEnabled: 'isInternationalBillingAddressEnabled',
            statesCodeMapping: '{}',
            NaverPayMode: {
                value: 'development',
                displayValue: 'development'
            },
            NaverPayMerchantID: 'NaverPayMerchantID',
            orderHistoryEndCoursor: 10,
            isLoyaltyEnable: true,
            loyaltyPilotZipCodes: ['00009'],
            isLoyaltyPilotEnable: true,
            isLoyaltyRewardsReconciliationEnabled: true,
            loyaltyLandingContentAssetID: 'rewards',
            returnsConfiguration: '{ "holidayStart": "11-01", "holidayEnd": "12-24", "holidayReturnPeriod": 90, "nonHolidayReturnPeriod": 60 }',
            pickupDateRange: {
                'daysstartFrom': 2,
                'daysEndTill': 7,
                'weekendsoff': true
            },
            pickupTimeSlots: ['09:00-18:00'],
            publicHolidayList: [],
            isKlarnaEnabled: true,
            adobeTargetOrgId: 'testAdobeTargetOrgId',
            returnCountryOverride: '{    "FR": {        "carrierName": "FedEx",        "accountNumber": "584667800"    },    "ES": {        "carrierName": "FedEx",        "accountNumber": "584667800"    },    "IT": {        "carrierName": "FedEx",        "accountNumber": "584667800"    },    "AT": {        "carrierName": "FedEx",        "accountNumber": "584667800"    },    "SE": {        "carrierName": "FedEx",        "accountNumber": "584667800"    },    "DK": {        "carrierName": "FedEx",        "accountNumber": "584667800"    },    "PT": {        "carrierName": "FedEx",        "accountNumber": "584667800"    },    "PL": {        "carrierName": "FedEx",        "accountNumber": "584667800"    },    "UK": {        "carrierName": "FedEx",        "accountNumber": "683638978"    },    "CH": {        "carrierName": "DHLExpress",        "accountNumber": "952761486"    },    "IE": {        "carrierName": "DHLExpress",        "accountNumber": "952761486"    },    "NO": {        "carrierName": "DHLExpress",        "accountNumber": "952761486"    },    "NL": {        "carrierName": "DHLParcel",        "accountNumber": "06266456"    },    "DE": {        "carrierName": "DHLParcel",        "accountNumber": "06266456"    },    "BE": {        "carrierName": "DHLParcel",        "accountNumber": "06266456"    }}',
            dhlParcelAPIUser: '657947af-0447-4630-bbf7-9ccd9010ad5f',
            dhlParcelAPIKey: '913f4eab-76dc-4e5f-a23d-e6c324e66e1b',
            voucherCancellationNotificationEmails: ['test@test.com', 'test.test@test.com'],
            membersonAPIUser: 'test111',
            membersonAPIPassword: 'Test@1234',
            eGiftCardProductID: '883814258849',
            DeleteAccountJiraProject: 'Testt',
            DeleteAccountJiraAssignee: 'Test123',
            DeleteAccountJiraAPIUser: 'test222',
            DeleteAccountJiraAPIPassword: 'test333',
            enableMobileAuthentication: true,
            mobileAuthProvider: 'NiceID',
            NiceIDUsername: 'test',
            NiceIDSecret: 'test',
            NiceIDProductID: 'test'

        };
        this.preferences = {
            custom: this.preferenceMap
        };
        this.timezoneOffset = 1;
    }

    getCustomPreferenceValue(key) {
        return this.preferenceMap[key];
    }
    setCustomPreferenceValue(key, value) {
        this.preferenceMap[key] = value;
    }
    // Access preferences by key/ID
    getID() {
        return 'TestID';
    }
    getDefaultCurrency() {
        return 'USD';
    }
    getDefaultLocale() {
        return 'default';
    }
    getAllowedLocales() {
        return new Array('defautl','test');
    }
    getPreferences() {
        return {
            getCustom: () => {
                return this.preferenceMap;
            },
            custom: this.preferenceMap
        };
    }
    getTimezone() {
        return '';
    }
    // dw.system.Site methods
    static getCurrent() {
        if (Site.current) {
            return Site.current;
        }
        return new Site();
    }
    getCalendar() {
        var Calendar = require('../../mocks/dw/dw_util_Calendar');
        return new Calendar();;
    }
}

Site.current = Site.getCurrent();

module.exports = Site;
