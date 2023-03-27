'use strict'

var creationDate = {
    toISOString: function () {
        return '';
    }
};

var CustomString = require('../../../mocks/CustomString');

var applepay = new CustomString('DW_APPLE_PAY');
var order = {
    customerName: 'under armour',
    billingAddress: {
        address1: '',
        address2: '',
        city: '',
        countryCode: {
            value: 'aa'
        },
        customerEmail: '',
        firstName: '',
        lastName: '',
        phone: '',
        postalCode: '',
        stateCode: 'stateCode'
    },
    creationDate: creationDate,
    currencyCode: 'USD',
    custom: {
        vertex_taxationDetails: '["JurisdictionID:"]',
        bfxMerchantOrderRef: 'bfxMerchantOrderRef',
        csrEmailAddress: 'csrEmailAddress'
    },
    getPaymentInstruments: function (payment) {
        if (payment === 'Gift Card') {
            return {
                count: 0
            };
        } else {
            return {
                0: {
                    paymentTransaction: {
                        custom: {
                            xipayTRTransRefId: 'xipayTRTransRefId'
                        }
                    }
                },
                iterator: function () {
                    var customObj = [{
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            gcNumber: '100',
                            gcClass: '190'
                        },
                        getPaymentMethod: function () {
                            return applepay;
                        },
                        paymentMethod: 'PAYMETRIC',
                        paymentTransaction: {
                            amount: {
                                available: false
                            },
                            transactionID: 'transactionID',
                            custom: {
                                xipayTRTransRefId: '',
                                xipayTransactionId: 'aaa',
                                xipayTransactionType: 'Authorization'
                            }
                        },
                        creationDate: creationDate
                    }];
                    var cnt = 0;
                    return {
                        count: 1,
                        hasNext: () => {
                            cnt++;
                            return cnt === 1;
                        },
                        next: () => customObj[0]
                    };
                },
                length: 1
            };
        }
    },
    getCreatedBy: function () {
        return {
            toLowerCase: function () {
                return '';
            }
        };
    },
    getDefaultShipment: function () {
        return {
            gift: true,
            custom: {
                paazlDeliveryInfo: '{"paazl":"aaaa"}'
            },
            giftMessage: 'giftMessagegiftMessagegiftMessagegiftMessagegiftMessagegiftMessagegiftMessagegiftMessage'
        };
    },
    getShipments: function () {
        return {
            iterator: function () {
                var customObj = [{
                    custom: {
                        maoStatusUpdateFailedCount: null,
                        fromStoreId: 'fromStoreId',
                        paazlDeliveryInfo: '{"pickupLocation": "pickupLocation", "FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                    },
                    shippingAddress: {
                        firstName: ''
                    },
                    getShippingAddress: function () {
                        return {
                            countryCode: {},
                            custom: {
                                isOfficeAddress: true,
                                addressType: 'business'
                            },
                            postalCode: '12345',
                            stateCode: 'US'
                        };
                    },
                    getShippingMethod: function () {
                        return null;
                    },
                    shippingMethod: {
                        custom: {
                            sapCarrierCodeResidential: {},
                        }
                    },
                    getProductLineItems: function () {
                        return {
                            length: 1,
                            iterator: function () {
                                var customObj1 = [{
                                    custom: {
                                        maoStatusUpdateFailedCount: null,
                                        fromStoreId: 'fromStoreId'
                                    },
                                    getShippingAddress: function () {
                                        return {
                                            countryCode: {}
                                        };
                                    },
                                    quantity: {
                                        value: 1
                                    },
                                    product: {
                                        custom: {}
                                    },
                                    getPrice: function () {
                                        return {
                                            divide: function () {
                                                return '1';
                                            },
                                            subtract: function () {
                                                return {
                                                    divide: function () {
                                                        return {
                                                            toNumberString: function () {
                                                                return 1;
                                                            }
                                                        };
                                                    }
                                                };
                                            }
                                        };
                                    },
                                    basePrice: {
                                        available: false
                                    },
                                    getPriceAdjustments: function () {
                                        return {
                                            0: {
                                                promotionID: ''
                                            },
                                            size: function () {
                                                return 1;
                                            }
                                        };
                                    },
                                    getProratedPrice: function () {
                                        return {
                                            divide: function () {
                                                return {
                                                    divide: function () {
                                                        return {
                                                            multiply: function () {
                                                                return {
                                                                    toNumberString: function () {
                                                                        return 1;
                                                                    }
                                                                };
                                                            }
                                                        };
                                                    },
                                                    toNumberString: function () {
                                                        return 1;
                                                    }
                                                };
                                            },
                                            toNumberString: function () {
                                                return 1;
                                            }
                                        };
                                    },
                                    getTaxRate: function () {

                                    },
                                    adjustedPrice: {
                                        available: true,
                                        divide: function () {
                                            return {
                                                toNumberString: function () {
                                                    return 1;
                                                }
                                            };
                                        }
                                    }
                                }];
                                var cnt = 0;
                                return {
                                    count: 1,
                                    hasNext: () => {
                                        cnt++;
                                        return cnt === 1;
                                    },
                                    next: () => customObj1[0]
                                };
                            }
                        };
                    }
                }];
                var cnt = 0;
                return {
                    count: 1,
                    hasNext: () => {
                        cnt++;
                        return cnt === 1;
                    },
                    next: () => customObj[0]
                };
            }
        };
    },
    getPriceAdjustments: function () {
        return {
            0: {
                promotionID: '',
                promotion: {
                    details: {
                        markup: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                    }
                }
            },
            size: function () {
                return 1;
            }
        };
    },
    getCreationDate: function () {
        return {
            toISOString: function () {
                return '';
            }
        };
    },
    paymentInstruments: {
        iterator: function () {
            var customObj = [{
                custom: {
                    maoStatusUpdateFailedCount: null
                },
                creditCardHolder: "test",
                creditCardExpirationMonth: "8",
                creditCardExpirationYear: "2027",
                paymentMethod: new CustomString('DW_APPLE_PAY'),
                getPaymentMethod: function () {
                    return applepay;
                },
                paymentTransaction: {
                    amount: {

                    },
                    custom: {
                        xipayTRTransRefId: ''
                    },
                    transactionID: 'transactionID'
                },
                creditCardHolder: 'creditCardHolder',
                creationDate: creationDate
            }];
            var cnt = 0;
            return {
                count: 1,
                hasNext: () => {
                    cnt++;
                    return cnt === 1;
                },
                next: () => customObj[0]
            };
        }
    },
    customer: {
        profile: {
            customerNo: '12345'
        }
    },
    adjustedMerchandizeTotalTax: {
        available: false
    },
    adjustedShippingTotalPrice: {},
    adjustedShippingTotalTax: {}
};

var Maoconstants = {
    MessageHeader: 'MessageHeader',
    DocType: 'DocType',
    Extended: {
        customerSource: {
            Customer: new CustomString('Customer'),
            Employee: 'Employee',
            Athlete: 'Athlete',
            E4X: 'E4X'
        },
        sapSalesDocumentTypeFMS: {
            defaultSapSalesDocumentTypeFMS: 'defaultSapSalesDocumentTypeFMS',
            vipSapSalesDocumentTypeFMS: 'vipSapSalesDocumentTypeFMS',
            applepaySapSalesDocumentTypeFMS: 'applepaySapSalesDocumentTypeFMS'
        },
        transactionTypeFMS: {
            applepayTransactionTypeFMS: 'applepayTransactionTypeFMS'
        },
        authcode: {
            applepay: 'applepay'
        }
    },
    OrderLine: {
        Extended: {
            packlistType: {
                defaultPacklistType: '',
                vipPacklistType: 'vipPacklistType'
            }
        },
        DeliveryMethod: {
            DeliveryMethodId: {
                inStore: {

                },
                shipToAddress: {

                }
            }
        }
    },
    Payment: {
        gcPaymentMethodId: 'Gift Card',
        paymentCard: {
            expiryMonth: ''
        }
    },
    PaymentTransaction: {
        TransactionType: {
            PaymentTransactionTypeId: 'Authorization'
        }
    },
    PaymentType: {
        PaymentTypeId: {
            creditcardPaymentTypeId: 'Credit Card',
            applepayPaymentTypeId: 'ApplePay',
            paypalPaymentTypeId: 'PayPal',
            KlarnaPaymentTypeId: 'Klarna',
            giftCardTypeId: 'Gift Card',
        }
    },
    AurusPaymentType: {
        PaymentTypeId: {
            creditcardPaymentTypeId: 'creditcardPaymentTypeId',
            applepayPaymentTypeId: 'applepayPaymentTypeId',
            paypalPaymentTypeId: 'PayPal',
            KlarnaPaymentTypeId: 'KlarnaPaymentTypeId',
            vipPaymentTypeId: 'vipPaymentTypeId',
            giftCardTypeId: 'giftCardTypeId'
        }
    },
    OrderHold: {},
    OrderNote: {}
};

function isAurusEnabled() {
    return true;
}

function validateProfileFields () {
    return {
        error: true
    };
}

function basketHasGiftCardItems () {
    return {
        eGiftCards: ''
    };
}

module.exports = {
    creationDate: creationDate,
    order: order,
    Maoconstants: Maoconstants,
    isAurusEnabled: isAurusEnabled,
    validateProfileFields: validateProfileFields,
    basketHasGiftCardItems: basketHasGiftCardItems
};