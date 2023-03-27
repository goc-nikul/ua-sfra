'use strict';

var server = require('server');

// Helper methods

var getAccessToken = function () {
    // TODO: Make these site prefs and/or service credentials
    var domTokenEndpointUrl = 'https://uarms-auth.omni.manh.com/oauth/token'; // Site.current.getCustomPreferenceValue('domAuthorizationEndpointUrl');
    var domBasicAuthUsername = 'omnicomponent.1.0.0'; // Site.current.getCustomPreferenceValue('domBasicAuthUsername');
    var domBasicAuthPassword = 'b4s8rgTyg55XYNun'; // Site.current.getCustomPreferenceValue('domBasicAuthPassword');
    var domTokenChildOrgUsername = 'admin@ua-us.com'; // Site.current.getCustomPreferenceValue('domTokenChildOrgUsername');
    var domTokenChildOrgPassword = 'Password@1'; // Site.current.getCustomPreferenceValue('domTokenChildOrgPassword');

    var Encoding = require('dw/crypto/Encoding');
    var StringUtils = require('dw/util/StringUtils');

    var parameters = 'grant_type=password&username={0}&password={1}';
    // Replace placeholders with URL-encoded username and password
    parameters = StringUtils.format(parameters, Encoding.toURI(domTokenChildOrgUsername), Encoding.toURI(domTokenChildOrgPassword));

    var HTTPClient = require('dw/net/HTTPClient');
    var httpClient = new HTTPClient();
    httpClient.setTimeout(2000);
    httpClient.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    httpClient.open('POST', domTokenEndpointUrl, domBasicAuthUsername, domBasicAuthPassword);
    httpClient.send(parameters);

    var accessToken = null;
    if (httpClient.statusCode === 200) {
        var response = JSON.parse(httpClient.getText());
        accessToken = response.access_token;
    }

    return accessToken;
};

var saveOrder = function (orderNo, accessToken) {
    // TODO: Make this a service
    var saveOrderEndpointUrl = 'https://uarmsl05.omni.manh.com/order/api/order/order/save';

    var HTTPClient = require('dw/net/HTTPClient');
    var httpClient = new HTTPClient();
    httpClient.setTimeout(10000);
    httpClient.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    httpClient.setRequestHeader('Content-Type', 'application/json');

    httpClient.open('POST', saveOrderEndpointUrl);

    // TODO: Parse passed order into this template. The following is a hardcoded mock order.
    var saveOrderRequest = JSON.stringify({
        MessageHeader: {
            MSG_TYPE: 'SaveOrderMSGType'
        },
        CapturedDate: new Date().toISOString(),
        CurrencyCode: 'USD',
        CustomerFirstName: 'Kim',
        CustomerLastName: 'Baucher',
        DocType: {
            DocTypeId: 'CustomerOrder'
        },
        Extended: {
            OrderRegion: 'United States',
            orderUid: '67129791-66d5-4804-9a58-9a05053c595c',
            orderType: 'web',
            sapSalesDocumentTypeFMS: 'ZOSO',
            orderReasonFMS: '600',
            customerUid: 'kba167somersetlnapt13avonlakeoh440123218starred36a',
            sapCustomerId: '',
            enteredBy: '',
            itemsTaxTotal: '21.44',
            isPoBox: '0',
            freeReturnShippingFMS: 'Y',
            paymentUid: '78429b88-b303-48a8-be27-1ad5f499fc4d',
            transactionTypeFMS: '',
            authReferenceIndex: null,
            PayPalExpressprocessorUserEmail: null,
            packlistType: 'DR',
            Jurisdiction: '360930100',
            customerSource: 'customer',
            encryptionProfileCode: 'TOKEN',
            PaymentSequenceId: '1',
            shippingTotal: '0.00',
            shippingTaxTotal: '0.00'
        },
        IsConfirmed: false,
        OrderActions: {
            IsAlreadyPriced: true,
            IsAlreadyCharged: true,
            IsAlreadyTaxed: true,
            IsReturnFeeApplied: false,
            IsImport: true
        },
        OrderChargeDetail: [{
            ChargeDetailId: orderNo,
            ChargeTotal: '0.00',
            ChargeType: {
                ChargeTypeId: 'Shipping'
            }
        }],
        OrderHold: [{
            HoldTypeId: 'PendingAuthorization',
            StatusId: '1000'
        }],
        OrderId: orderNo,
        OrderLine: [{
            DeliveryMethod: {
                DeliveryMethodId: 'ShipToAddress'
            },
            Extended: {
                packlistType: 'DR',
                ShippingAddresssnapshotUid: '44c4c426-4b07-4845-b5c0-0140aea772b3',
                sapCarrierCode: 'RATEN',
                ShippingMethodsnapshotUid: '3072a362-f68e-444d-a4b4-096539880a58',
                shipmentMethodUid: 'd792f4d4-09ef-4e73-8dfc-9cb16b87df59',
                sapShippingCondition: 'EO',
                discountedWebLineTotal: '18.74',
                promotionalCode: '',
                promotionalDesc: '',
                sapDeliveryPriority: '0020',
                perItemDiscount: '0.00'
            },
            IsGift: false,
            IsGiftCard: false,
            ItemBarcode: '191169259696',
            ItemId: '1331377-834-LG',
            OrderId: orderNo,
            OrderLineId: '1',
            OrderLinePromisingInfo: {
                ReqCapacityPerUnit: 1
            },
            OrderLineSubTotal: '18.74',
            Quantity: '1',
            RequestedDeliveryDate: '2019-12-22T00:00:00',
            ShipToAddress: {
                Address: {
                    Address1: '167 Somerset Ln',
                    Address2: 'Apt 13',
                    City: 'Avon Lake',
                    Country: 'US',
                    Email: 'starred36@aol.com',
                    FirstName: 'Kim',
                    LastName: 'Baucher',
                    Phone: '18887276687',
                    PostalCode: '44012-3218',
                    State: 'OH'
                }
            },
            ShippingMethodId: 'Standard',
            TotalTaxes: '1.27',
            UOM: 'EA',
            UnitPrice: '18.74'
        }],
        OrderSubTotal: '317.65',
        OrderTotal: '339.09',
        OrderType: {
            OrderTypeId: 'web'
        },
        Payment: [{
            PaymentMethod: [{
                Amount: '339.09',
                BillingAddress: {
                    Address: {
                        Address1: '167 Somerset Ln',
                        Address2: 'Apt 13',
                        City: 'Avon Lake',
                        Country: 'US',
                        Email: 'starred36@aol.com',
                        FirstName: 'Kim',
                        LastName: 'Baucher',
                        Phone: '',
                        PostalCode: '44012-3218',
                        State: 'OH'
                    }
                },
                CardExpiryMonth: '6',
                CardExpiryYear: '2023',
                CardTypeId: 'VISA',
                CurrencyCode: 'USD',
                NameOnCard: 'Kimberly A Baucher',
                PaymentMethodId: '1',
                PaymentTransaction: [{
                    PaymentResponseStatus: {
                        PaymentResponseStatusId: 'Success'
                    },
                    PaymentTransactionId: '78429b88-b303-48a8-be27-1ad5f499fc4d',
                    ProcessedAmount: '339.09',
                    RemainingBalance: 0,
                    RequestToken: '-E803-2417-B2DRMRWMT5DN6Y',
                    RequestedAmount: '339.09',
                    Status: {
                        PaymentTransactionStatusId: 'Closed'
                    },
                    TransactionType: {
                        PaymentTransactionTypeId: 'Authorization'
                    }
                }],
                PaymentType: {
                    PaymentTypeId: 'Credit Card'
                }
            }]
        }],
        TotalTaxes: '21.44'
    });

    httpClient.send(saveOrderRequest);

    var saveOrderResponse;

    if (httpClient.statusCode === 401) {
        saveOrderResponse = {
            success: false,
            header: null,
            data: null,
            messageKey: 'error.401',
            message: 'error.401',
            errors: [],
            exceptions: null,
            messages: {
                Message: [
                    {
                        Type: 'ERROR',
                        Code: 'invalid_token',
                        Description: 'Cannot convert access token to JSON',
                        ErrorCode: null,
                        ErrorField: null,
                        BusinessKeys: null
                    }
                ],
                Size: 1
            }
        };
    } else {
        try {
            saveOrderResponse = JSON.parse(httpClient.getText());
        } catch (e) {
            saveOrderResponse = {
                success: false,
                header: null,
                data: httpClient.getText()
            };
        }
    }

    return saveOrderResponse;
};

// Test controller
server.get('Test', function (req, res, next) {
    var orderNo = req.querystring.orderno || '12345678';
    var accessToken = getAccessToken();
    var saveOrderResponse;

    if (accessToken) {
        saveOrderResponse = saveOrder(orderNo, accessToken);
    } else {
        saveOrderResponse = { error: 'Could not obtain access token.' };
    }

    res.json(saveOrderResponse);

    next();
});

module.exports = server.exports();
