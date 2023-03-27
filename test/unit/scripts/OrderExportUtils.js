'use strict';

const {
    assert
} = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
global.empty = (data) => {
    return !data;
};


String.prototype.equalsIgnoreCase = function (str) {
    return this.toLocaleLowerCase() === str.toLocaleLowerCase();
};

String.prototype.toNumberString = function () {
    return '';
};
describe('int_mao/cartridge/scripts/OrderExportUtils.js', () => {

    var CustomString = require('../../mocks/CustomString');

    var applepay = new CustomString('DW_APPLE_PAY');
    var PayPal = new CustomString('PayPal');
    var kLARNAPAYMENTS = new CustomString('KLARNA_PAYMENTS');
    var AurusPayment = new CustomString('AURUS_CREDIT_CARD');
    var Gift_Card = new CustomString('giftCardTypeId');

    var OrderExportUtilsMock = require('./mao/OrderExportUtilsMock');

    var creationDate = OrderExportUtilsMock.creationDate;
    var order = OrderExportUtilsMock.order;
    var Maoconstants = OrderExportUtilsMock.Maoconstants;
    var validateProfileFields = OrderExportUtilsMock.validateProfileFields;
    var basketHasGiftCardItems = OrderExportUtilsMock.basketHasGiftCardItems;
    var isAurusEnabled = OrderExportUtilsMock.isAurusEnabled;


    it('Testing method getOrderJSON', () => {
        order.custom = {
            isEmployeeOrder: 'isEmployeeOrder',
            vertex_taxationDetails: '{"JurisdictionID":"aaaaaa"}',
            eaEmployeeId: 'eaEmployeeId'
        };
        order.getDefaultShipment = function () {
            return {
                gift: false,
                custom: {
                    paazlDeliveryInfo: '{"paazl":"aaaa"}'
                }
            };
        };
        order.getShipments = function () {
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
                        shippingMethodID: 'shoprunner',
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
                                                        },
                                                        toNumberString: function () {
                                                            return 1;
                                                        }
                                                    };
                                                },
                                                toNumberString: function () {
                                                    return 1;
                                                },
                                                getValue: function () {
                                                    return 1;
                                                }
                                            };
                                        },
                                        basePrice: {
                                            available: false
                                        },
                                        getBasePrice: function () {
                                            return false
                                        },
                                        getPriceAdjustments: function () {
                                            return {
                                                0: {
                                                    promotionID: '',
                                                    getUUID: function () {
                                                        return 1;
                                                    },
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
                                                        multiply: function () {
                                                            return {
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
                                                toNumberString: function () {
                                                    return 1;
                                                },
                                                getValue: function () {
                                                    return 1;
                                                }
                                            };
                                        },
                                        getTax: function () {
                                            return {
                                                isAvailable: function () {
                                                    return true;
                                                },
                                                toNumberString: function () {
                                                    return 1;
                                                }
                                            };
                                        },
                                        getTaxRate: function () {

                                        },
                                        getTax: function () {
                                            return {
                                                isAvailable: function () {
                                                    return true;
                                                },
                                                toNumberString: function () {
                                                    return '0.20';
                                                }
                                            }
                                        },
                                        adjustedPrice: {
                                            available: true,
                                            divide: function () {
                                                return {
                                                    toNumberString: function () {
                                                        return 1;
                                                    }
                                                };
                                            },
                                            toNumberString: function () {
                                                return 1;
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
        };

        order.getPriceAdjustments = function () {
            return {
                0: {
                    promotionID: '',
                    getUUID: function () {
                        return 1;
                    },
                    promotion: {
                        details: {
                            markup: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                        }
                    }
                },
                size: function () {
                    return 0;
                }
            };
        };

        order.getPaymentInstruments = function (payment) {
            if (payment !== 'VIP_POINTS') {
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
                                gcNumber: '6065103375390002',
                                gcClass: '111'
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
            } else {
                return {
                    length: 0
                }
            }
        };
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils', {
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/campaign/Promotion': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                maoCarrierCodes: '{"AK":{"residential":"RATEE","business":"RATET"},"HI":{"residential":"RATEE","business":"RATET"},"defaults":{"residential":"RATEN","business":"RATEM"}}'
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'US',
                    preferences: {
                        custom: {}
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        });
        global.dw = {
            order: {
                Shipment: Object,
                ProductLineItem: Object
            }
        };
        var result = OrderExportUtils.getOrderJSON(order);
        assert.isNotNull(result);
        var parseRes = JSON.parse(result);
        assert.isNotNull(parseRes.MessageHeader);
        assert.isNotNull(parseRes.CurrencyCode, 'USD');
        assert.isNotNull(parseRes.OrderLine);
    });

    it('Testing method getOrderJSON isEmployeeOrder exist and shippingMethodID is shoprunner ', () => {
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils', {
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/campaign/Promotion': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                maoCarrierCodes: '{"AK":{"residential":"RATEE","business":"RATET"},"HI":{"residential":"RATEE","business":"RATET"},"defaults":{"residential":"RATEN","business":"RATEM"}}'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'US',
                    preferences: {
                        custom: {}
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        });
        var result = OrderExportUtils.getOrderJSON(order);
        assert.isNotNull(result);
        var parseRes = JSON.parse(result);
        assert.isNotNull(parseRes.MessageHeader);
        assert.isNotNull(parseRes.CurrencyCode, 'USD');
        assert.isNotNull(parseRes.OrderLine);
    });

    it('Testing method getOrderJSON isEmployeeOrder exist and handle GiftCard scenario', () => {
        order.getPaymentInstruments = function (payment) {
            if (payment !== 'DW_APPLE_PAY') {
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
                                gcNumber: '0',
                                gcClass: '0'
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
            } else {
                return {
                    length: 0
                }
            }
        };

        order.getProductLineItems = function () {
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
                                        },
                                        toNumberString: function () {
                                            return 1;
                                        }
                                    };
                                },
                                toNumberString: function () {
                                    return 1;
                                },
                                getValue: function () {
                                    return 1;
                                }
                            };
                        },
                        basePrice: {
                            available: false
                        },
                        getBasePrice: function () {
                            return false
                        },
                        getPriceAdjustments: function () {
                            return {
                                0: {
                                    promotionID: '',
                                    getUUID: function () {
                                        return 1;
                                    },
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
                                        multiply: function () {
                                            return {
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
                                toNumberString: function () {
                                    return 1;
                                },
                                getValue: function () {
                                    return 1;
                                }
                            };
                        },
                        getTax: function () {
                            return {
                                isAvailable: function () {
                                    return true;
                                },
                                toNumberString: function () {
                                    return 1;
                                }
                            };
                        },
                        getTaxRate: function () {

                        },
                        getTax: function () {
                            return {
                                isAvailable: function () {
                                    return true;
                                },
                                toNumberString: function () {
                                    return '0.20';
                                }
                            }
                        },
                        adjustedPrice: {
                            available: true,
                            divide: function () {
                                return {
                                    toNumberString: function () {
                                        return 1;
                                    }
                                };
                            },
                            toNumberString: function () {
                                return 1;
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
        };
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils.js', {
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/campaign/Promotion': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                maoCarrierCodes: '{"US":{"residential":"RATEE","business":"RATET"},"HI":{"residential":"RATEE","business":"RATET"},"defaults":{"residential":"RATEN","business":"RATEM"}}'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'US',
                    preferences: {
                        custom: {}
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList'),
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            }
        });
        var result = OrderExportUtils.getOrderJSON(order);

        assert.isNotNull(result);
        var parseRes = JSON.parse(result);
        assert.isNotNull(parseRes.MessageHeader);
        assert.isNotNull(parseRes.CurrencyCode, 'USD');
        assert.isDefined(parseRes.OrderLine);

    });

    it('Testing method getOrderJSON getRegion CA', () => {
        order.custom.sapCarrierCode = 'sapCarrierCode';
        order.getPaymentInstruments = function (payment) {
            return {
                0: {
                    paymentTransaction: {
                        transactionID: 'transactionID',
                        custom: {
                            xipayTRTransRefId: ''
                        }
                    }
                },
                iterator: function () {
                    var customObj = [{
                        custom: {
                            maoStatusUpdateFailedCount: null,
                            gcNumber: '100',
                            gcPin: '04096523'
                        },
                        paymentTransaction: {
                            amount: {},
                            custom: {}
                        },
                        getPaymentMethod: function () {
                            return Gift_Card;
                        },
                        creationDate: creationDate,
                        paymentMethod: 'GIFT_CARD'
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
        };
        order.paymentInstruments = {
            iterator: function () {
                var customObj = [{
                    custom: {
                        maoStatusUpdateFailedCount: null
                    },
                    paymentMethod: PayPal,
                    getPaymentMethod: function () {
                        return PayPal;
                    },
                    paymentTransaction: {
                        amount: {

                        },
                        custom: {
                            xipayTRTransRefId: '',
                            xipayTRPaypalRefId: 'xipayTRPaypalRefId'
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
            }
        };

        global.dw = {
            order: {
                Shipment: Object,
                ProductLineItem: Object
            }
        };
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils.js', {
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/campaign/Promotion': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                maoCarrierCodes: '{"US":{"residential":"RATEE","business":"RATET"},"HI":{"residential":"RATEE","business":"RATET"},"defaults":{"residential":"RATEN","business":"RATEM"}}'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'CA',
                    preferences: {
                        custom: {}
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'CA';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList'),
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            }
        });
        var result = OrderExportUtils.getOrderJSON(order);
        assert.isNotNull(result);
        var parseRes = JSON.parse(result);
        assert.isNotNull(parseRes.MessageHeader);
        assert.isNotNull(parseRes.CurrencyCode, 'USD');
        assert.isDefined(parseRes.OrderLine);
    });

    it('Testing method getOrderJSON getRegion EU', () => {
        order.custom = {
            isVipOrder: 'isVipOrder',
            vertex_taxationDetails: '{"JurisdictionID":"aaaaaa"}'
        };
        order.getShipments().iterator().next().shippingMethodID = null;
        order.custom.isCommercialPickup = true;
        order.getShipments = function () {
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
                                    addressType: ''
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
                        shippingMethodID: '',
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
                                                        },
                                                        toNumberString: function () {
                                                            return 1;
                                                        }
                                                    };
                                                },
                                                toNumberString: function () {
                                                    return 1;
                                                },
                                                getValue: function () {
                                                    return 1;
                                                }
                                            };
                                        },
                                        basePrice: {
                                            available: false
                                        },
                                        getBasePrice: function () {
                                            return false
                                        },
                                        getPriceAdjustments: function () {
                                            return {
                                                0: {
                                                    promotionID: '',
                                                    getUUID: function () {
                                                        return 1;
                                                    },
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
                                                        multiply: function () {
                                                            return {
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
                                                toNumberString: function () {
                                                    return 1;
                                                },
                                                getValue: function () {
                                                    return 1;
                                                }
                                            };
                                        },
                                        getTax: function () {
                                            return {
                                                isAvailable: function () {
                                                    return true;
                                                },
                                                toNumberString: function () {
                                                    return 1;
                                                }
                                            };
                                        },
                                        getTaxRate: function () {

                                        },
                                        getTax: function () {
                                            return {
                                                isAvailable: function () {
                                                    return true;
                                                },
                                                toNumberString: function () {
                                                    return '0.20';
                                                }
                                            }
                                        },
                                        adjustedPrice: {
                                            available: true,
                                            divide: function () {
                                                return {
                                                    toNumberString: function () {
                                                        return 1;
                                                    }
                                                };
                                            },
                                            toNumberString: function () {
                                                return 1;
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
        };

        global.dw = {
            order: {
                Shipment: Object,
                ProductLineItem: Object
            }
        };
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils.js', {
            'dw/campaign/Promotion': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'EU',
                    preferences: {
                        custom: {
                            MAO_SAP_carrierCodes: '{"FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                        }
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            }
        });

        order.paymentInstruments = {
            iterator: function () {
                var customObj = [{
                    custom: {
                        maoStatusUpdateFailedCount: null
                    },
                    paymentMethod: 'PAYMETRIC',
                    getPaymentMethod: function () {
                        return PayPal;
                    },
                    paymentTransaction: {
                        amount: {

                        },
                        custom: {
                            xipayTRTransRefId: '',
                            authCode: 'authCode'
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
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        };
        var result = OrderExportUtils.getOrderJSON(order);
        assert.isNotNull(result);
        var parseRes = JSON.parse(result);
        assert.isNotNull(parseRes.MessageHeader);
        assert.isNotNull(parseRes.CurrencyCode, 'USD');
        assert.isDefined(parseRes.OrderLine);
    });

    it('Testing method getOrderJSON getRegion UKIE', (done) => {
        order.getShipments().iterator().next().shippingMethodID = null;
        delete order.custom.isCommercialPickup;
        order.paymentInstruments = {
            iterator: function () {
                var customObj = [{
                    custom: {
                        maoStatusUpdateFailedCount: null
                    },
                    paymentMethod: kLARNAPAYMENTS,
                    getPaymentMethod: function () {
                        return PayPal;
                    },
                    paymentTransaction: {
                        amount: {

                        },
                        custom: {
                            xipayTRTransRefId: ''
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
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        };

        global.dw = {
            order: {
                Shipment: Object,
                ProductLineItem: Object
            }
        };
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils.js', {
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/campaign/Promotion': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                specialZipCodes: 'specialZipCodes',
                ManipulatePostalCode: '11111',
                ManipulatePostalCodeSeparator: '\\',
                ManipulatePostalCodePosition: 0,
                MaoSpecialZipCodes: 'A0A,A0B,A0C,A0E,A0G,A0H,A0J,A0K,A0L,A0M,A0N,A0P,A0R,A1V,A1Y,A2A,A2B,A2H,A2N,A2V,A5A,A8A,B0C,B0E,B0H,B0J,B0K,B0L,B0M,B0N,B0P,B0R,B0S,B0T,B0V,B0W,B2S,E1N,E1W,E1X,E3L,E3N,E3Y,E3Z,E4A,E4B,E4C,E4E,E4G,E4H,E4M,E4T,E4X,E4Y,E4Z,E5A,E5B,E5C,E5E,E5G,E5H,E5J,E5L,E5M,E5N,E5P,E5R,E5T,E5V,E6A,E6B,E6C,E6E,E6G,E6H,E6J,E6K,E7A,E7B,E7C,E7E,E7G,E7H,E7J,E7K,E7L,E7M,E7N,E7P,E8A,E8B,E8C,E8E,E8G,E8J,E8M,E8N,E8P,E8R,E8S,E8T,E9A,E9B,E9C,E9E,E9G,E9H,G0A,G0C,G0E,G0G,G0H,G0J,G0K,G0L,G0M,G0R,G0T,G0V,G0W,G0X,G0Y,G3Z,G4A,G4R,G4S,G4T,G4V,G4W,G4X,G4Z,G5A,G5B,G5C,G5J,G5T,G8G,G8H,G8J,G8K,G8L,G8M,G8N,G8P,G9X,H0M,J0B,J0E,J0J,J0K,J0M,J0S,J0T,J0V,J0W,J0X,J0Y,J0Z,J8G,J8L,J8N,J9E,J9L,J9T,J9V,J9X,J9Y,J9Z,K0B,K0C,K0E,K0G,K0H,K0J,K0L,K0M,N0H,P0A,P0B,P0C,P0E,P0G,P0H,P0J,P0K,P0L,P0M,P0N,P0P,P0R,P0S,P0T,P0V,P0W,P0X,P0Y,P5A,P5E,P5N,P8T,R0A,R0B,R0C,R0E,R0G,R0H,R0J,R0K,R0L,R0M,R7N,R8A,R8N,R9A,S0A,S0C,S0E,S0G,S0H,S0J,S0K,S0L,S0M,S0N,S0P,S9X,T0A,T0B,T0C,T0E,T0G,T0H,T0J,T0K,T0L,T0M,T0P,T0V,T4T,T7A,T7E,T7N,T7P,T7S,T7V,T8S,T9C,T9M,T9N,T9S,T9W,T9X,V0A,V0B,V0C,V0E,V0G,V0H,V0J,V0K,V0L,V0M,V0N,V0P,V0R,V0S,V0T,V0V,V0W,V0X,V1G,V1J,V1K,V2G,V2J,V8A,V8C,V8G,V8J,V9Z,X0A,X0B,X0C,X0E,X0G,X1A,Y0A,Y0B,Y1A'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'UKIE',
                    preferences: {
                        custom: {
                            MAO_SAP_carrierCodes: '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                        }
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList'),
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: function () {
                     return false;
                }
            }
        });
        var result = OrderExportUtils.getOrderJSON(order);
        assert.isNotNull(result);
        var parseRes = JSON.parse(result);
        assert.isNotNull(parseRes.MessageHeader);
        assert.isNotNull(parseRes.CurrencyCode, 'USD');
        assert.isDefined(parseRes.OrderLine);
        done();
    });

    it('Testing method getOrderJSON getRegion--> UKIE Test Custom Exception for getSAPCarrierCode method', () => {
        order.getShipments().iterator().next().shippingMethodID = null;
        order.paymentInstruments = {
            iterator: function () {
                var customObj = [{
                    custom: {
                        maoStatusUpdateFailedCount: null
                    },
                    paymentMethod: kLARNAPAYMENTS,
                    getPaymentMethod: function () {
                        return PayPal;
                    },
                    paymentTransaction: {
                        amount: {

                        },
                        custom: {
                            xipayTRTransRefId: ''
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
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        };
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils.js', {
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            'dw/campaign/Promotion': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                specialZipCodes: 'specialZipCodes',
                ManipulatePostalCode: '11111',
                ManipulatePostalCodeSeparator: '\\',
                ManipulatePostalCodePosition: 0,
                MaoSpecialZipCodes: 'A0A,A0B,A0C,A0E,A0G,A0H,A0J,A0K,A0L,A0M,A0N,A0P,A0R,A1V,A1Y,A2A,A2B,A2H,A2N,A2V,A5A,A8A,B0C,B0E,B0H,B0J,B0K,B0L,B0M,B0N,B0P,B0R,B0S,B0T,B0V,B0W,B2S,E1N,E1W,E1X,E3L,E3N,E3Y,E3Z,E4A,E4B,E4C,E4E,E4G,E4H,E4M,E4T,E4X,E4Y,E4Z,E5A,E5B,E5C,E5E,E5G,E5H,E5J,E5L,E5M,E5N,E5P,E5R,E5T,E5V,E6A,E6B,E6C,E6E,E6G,E6H,E6J,E6K,E7A,E7B,E7C,E7E,E7G,E7H,E7J,E7K,E7L,E7M,E7N,E7P,E8A,E8B,E8C,E8E,E8G,E8J,E8M,E8N,E8P,E8R,E8S,E8T,E9A,E9B,E9C,E9E,E9G,E9H,G0A,G0C,G0E,G0G,G0H,G0J,G0K,G0L,G0M,G0R,G0T,G0V,G0W,G0X,G0Y,G3Z,G4A,G4R,G4S,G4T,G4V,G4W,G4X,G4Z,G5A,G5B,G5C,G5J,G5T,G8G,G8H,G8J,G8K,G8L,G8M,G8N,G8P,G9X,H0M,J0B,J0E,J0J,J0K,J0M,J0S,J0T,J0V,J0W,J0X,J0Y,J0Z,J8G,J8L,J8N,J9E,J9L,J9T,J9V,J9X,J9Y,J9Z,K0B,K0C,K0E,K0G,K0H,K0J,K0L,K0M,N0H,P0A,P0B,P0C,P0E,P0G,P0H,P0J,P0K,P0L,P0M,P0N,P0P,P0R,P0S,P0T,P0V,P0W,P0X,P0Y,P5A,P5E,P5N,P8T,R0A,R0B,R0C,R0E,R0G,R0H,R0J,R0K,R0L,R0M,R7N,R8A,R8N,R9A,S0A,S0C,S0E,S0G,S0H,S0J,S0K,S0L,S0M,S0N,S0P,S9X,T0A,T0B,T0C,T0E,T0G,T0H,T0J,T0K,T0L,T0M,T0P,T0V,T4T,T7A,T7E,T7N,T7P,T7S,T7V,T8S,T9C,T9M,T9N,T9S,T9W,T9X,V0A,V0B,V0C,V0E,V0G,V0H,V0J,V0K,V0L,V0M,V0N,V0P,V0R,V0S,V0T,V0V,V0W,V0X,V1G,V1J,V1K,V2G,V2J,V8A,V8C,V8G,V8J,V9Z,X0A,X0B,X0C,X0E,X0G,X1A,Y0A,Y0B,Y1A'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'UKIE',
                    preferences: {
                        custom: {
                            MAO_SAP_carrierCodes: '{"pickupLocation:"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                        }
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation:"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        });
        var result = OrderExportUtils.getOrderJSON(order);
        assert.isNotNull(result);
    });

    it('Testing method getConfirmOrderRequestJSON', () => {
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils.js', {
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                specialZipCodes: 'specialZipCodes',
                ManipulatePostalCode: '11111',
                ManipulatePostalCodeSeparator: '\\',
                ManipulatePostalCodePosition: 0,
                MaoSpecialZipCodes: 'A0A,A0B,A0C,A0E,A0G,A0H,A0J,A0K,A0L,A0M,A0N,A0P,A0R,A1V,A1Y,A2A,A2B,A2H,A2N,A2V,A5A,A8A,B0C,B0E,B0H,B0J,B0K,B0L,B0M,B0N,B0P,B0R,B0S,B0T,B0V,B0W,B2S,E1N,E1W,E1X,E3L,E3N,E3Y,E3Z,E4A,E4B,E4C,E4E,E4G,E4H,E4M,E4T,E4X,E4Y,E4Z,E5A,E5B,E5C,E5E,E5G,E5H,E5J,E5L,E5M,E5N,E5P,E5R,E5T,E5V,E6A,E6B,E6C,E6E,E6G,E6H,E6J,E6K,E7A,E7B,E7C,E7E,E7G,E7H,E7J,E7K,E7L,E7M,E7N,E7P,E8A,E8B,E8C,E8E,E8G,E8J,E8M,E8N,E8P,E8R,E8S,E8T,E9A,E9B,E9C,E9E,E9G,E9H,G0A,G0C,G0E,G0G,G0H,G0J,G0K,G0L,G0M,G0R,G0T,G0V,G0W,G0X,G0Y,G3Z,G4A,G4R,G4S,G4T,G4V,G4W,G4X,G4Z,G5A,G5B,G5C,G5J,G5T,G8G,G8H,G8J,G8K,G8L,G8M,G8N,G8P,G9X,H0M,J0B,J0E,J0J,J0K,J0M,J0S,J0T,J0V,J0W,J0X,J0Y,J0Z,J8G,J8L,J8N,J9E,J9L,J9T,J9V,J9X,J9Y,J9Z,K0B,K0C,K0E,K0G,K0H,K0J,K0L,K0M,N0H,P0A,P0B,P0C,P0E,P0G,P0H,P0J,P0K,P0L,P0M,P0N,P0P,P0R,P0S,P0T,P0V,P0W,P0X,P0Y,P5A,P5E,P5N,P8T,R0A,R0B,R0C,R0E,R0G,R0H,R0J,R0K,R0L,R0M,R7N,R8A,R8N,R9A,S0A,S0C,S0E,S0G,S0H,S0J,S0K,S0L,S0M,S0N,S0P,S9X,T0A,T0B,T0C,T0E,T0G,T0H,T0J,T0K,T0L,T0M,T0P,T0V,T4T,T7A,T7E,T7N,T7P,T7S,T7V,T8S,T9C,T9M,T9N,T9S,T9W,T9X,V0A,V0B,V0C,V0E,V0G,V0H,V0J,V0K,V0L,V0M,V0N,V0P,V0R,V0S,V0T,V0V,V0W,V0X,V1G,V1J,V1K,V2G,V2J,V8A,V8C,V8G,V8J,V9Z,X0A,X0B,X0C,X0E,X0G,X1A,Y0A,Y0B,Y1A'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'UKIE',
                    preferences: {
                        custom: {
                            MAO_SAP_carrierCodes: '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                        }
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        });
        var result = OrderExportUtils.getConfirmOrderRequestJSON(order);
        assert.isNotNull(result);
        assert.isNotNull(JSON.parse(result).IsConfirmed);
    });

    it('Testing method getOrderCancelRequestJSON', () => {
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils.js', {
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                specialZipCodes: 'specialZipCodes',
                ManipulatePostalCode: '11111',
                ManipulatePostalCodeSeparator: '\\',
                ManipulatePostalCodePosition: 0,
                MaoSpecialZipCodes: 'A0A,A0B,A0C,A0E,A0G,A0H,A0J,A0K,A0L,A0M,A0N,A0P,A0R,A1V,A1Y,A2A,A2B,A2H,A2N,A2V,A5A,A8A,B0C,B0E,B0H,B0J,B0K,B0L,B0M,B0N,B0P,B0R,B0S,B0T,B0V,B0W,B2S,E1N,E1W,E1X,E3L,E3N,E3Y,E3Z,E4A,E4B,E4C,E4E,E4G,E4H,E4M,E4T,E4X,E4Y,E4Z,E5A,E5B,E5C,E5E,E5G,E5H,E5J,E5L,E5M,E5N,E5P,E5R,E5T,E5V,E6A,E6B,E6C,E6E,E6G,E6H,E6J,E6K,E7A,E7B,E7C,E7E,E7G,E7H,E7J,E7K,E7L,E7M,E7N,E7P,E8A,E8B,E8C,E8E,E8G,E8J,E8M,E8N,E8P,E8R,E8S,E8T,E9A,E9B,E9C,E9E,E9G,E9H,G0A,G0C,G0E,G0G,G0H,G0J,G0K,G0L,G0M,G0R,G0T,G0V,G0W,G0X,G0Y,G3Z,G4A,G4R,G4S,G4T,G4V,G4W,G4X,G4Z,G5A,G5B,G5C,G5J,G5T,G8G,G8H,G8J,G8K,G8L,G8M,G8N,G8P,G9X,H0M,J0B,J0E,J0J,J0K,J0M,J0S,J0T,J0V,J0W,J0X,J0Y,J0Z,J8G,J8L,J8N,J9E,J9L,J9T,J9V,J9X,J9Y,J9Z,K0B,K0C,K0E,K0G,K0H,K0J,K0L,K0M,N0H,P0A,P0B,P0C,P0E,P0G,P0H,P0J,P0K,P0L,P0M,P0N,P0P,P0R,P0S,P0T,P0V,P0W,P0X,P0Y,P5A,P5E,P5N,P8T,R0A,R0B,R0C,R0E,R0G,R0H,R0J,R0K,R0L,R0M,R7N,R8A,R8N,R9A,S0A,S0C,S0E,S0G,S0H,S0J,S0K,S0L,S0M,S0N,S0P,S9X,T0A,T0B,T0C,T0E,T0G,T0H,T0J,T0K,T0L,T0M,T0P,T0V,T4T,T7A,T7E,T7N,T7P,T7S,T7V,T8S,T9C,T9M,T9N,T9S,T9W,T9X,V0A,V0B,V0C,V0E,V0G,V0H,V0J,V0K,V0L,V0M,V0N,V0P,V0R,V0S,V0T,V0V,V0W,V0X,V1G,V1J,V1K,V2G,V2J,V8A,V8C,V8G,V8J,V9Z,X0A,X0B,X0C,X0E,X0G,X1A,Y0A,Y0B,Y1A'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'UKIE',
                    preferences: {
                        custom: {
                            MAO_SAP_carrierCodes: '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                        }
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        });
        var result = OrderExportUtils.getOrderCancelRequestJSON(order);
        assert.isNotNull(result);
        assert.isNotNull(JSON.parse(result).IsCancelled);
    });

    it('Testing method getUpdatePaymentRequestJSON Gift Card', () => {
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils.js', {
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                specialZipCodes: 'specialZipCodes',
                ManipulatePostalCode: '11111',
                ManipulatePostalCodeSeparator: '\\',
                ManipulatePostalCodePosition: 0,
                MaoSpecialZipCodes: 'A0A,A0B,A0C,A0E,A0G,A0H,A0J,A0K,A0L,A0M,A0N,A0P,A0R,A1V,A1Y,A2A,A2B,A2H,A2N,A2V,A5A,A8A,B0C,B0E,B0H,B0J,B0K,B0L,B0M,B0N,B0P,B0R,B0S,B0T,B0V,B0W,B2S,E1N,E1W,E1X,E3L,E3N,E3Y,E3Z,E4A,E4B,E4C,E4E,E4G,E4H,E4M,E4T,E4X,E4Y,E4Z,E5A,E5B,E5C,E5E,E5G,E5H,E5J,E5L,E5M,E5N,E5P,E5R,E5T,E5V,E6A,E6B,E6C,E6E,E6G,E6H,E6J,E6K,E7A,E7B,E7C,E7E,E7G,E7H,E7J,E7K,E7L,E7M,E7N,E7P,E8A,E8B,E8C,E8E,E8G,E8J,E8M,E8N,E8P,E8R,E8S,E8T,E9A,E9B,E9C,E9E,E9G,E9H,G0A,G0C,G0E,G0G,G0H,G0J,G0K,G0L,G0M,G0R,G0T,G0V,G0W,G0X,G0Y,G3Z,G4A,G4R,G4S,G4T,G4V,G4W,G4X,G4Z,G5A,G5B,G5C,G5J,G5T,G8G,G8H,G8J,G8K,G8L,G8M,G8N,G8P,G9X,H0M,J0B,J0E,J0J,J0K,J0M,J0S,J0T,J0V,J0W,J0X,J0Y,J0Z,J8G,J8L,J8N,J9E,J9L,J9T,J9V,J9X,J9Y,J9Z,K0B,K0C,K0E,K0G,K0H,K0J,K0L,K0M,N0H,P0A,P0B,P0C,P0E,P0G,P0H,P0J,P0K,P0L,P0M,P0N,P0P,P0R,P0S,P0T,P0V,P0W,P0X,P0Y,P5A,P5E,P5N,P8T,R0A,R0B,R0C,R0E,R0G,R0H,R0J,R0K,R0L,R0M,R7N,R8A,R8N,R9A,S0A,S0C,S0E,S0G,S0H,S0J,S0K,S0L,S0M,S0N,S0P,S9X,T0A,T0B,T0C,T0E,T0G,T0H,T0J,T0K,T0L,T0M,T0P,T0V,T4T,T7A,T7E,T7N,T7P,T7S,T7V,T8S,T9C,T9M,T9N,T9S,T9W,T9X,V0A,V0B,V0C,V0E,V0G,V0H,V0J,V0K,V0L,V0M,V0N,V0P,V0R,V0S,V0T,V0V,V0W,V0X,V1G,V1J,V1K,V2G,V2J,V8A,V8C,V8G,V8J,V9Z,X0A,X0B,X0C,X0E,X0G,X1A,Y0A,Y0B,Y1A'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'UKIE',
                    preferences: {
                        custom: {
                            MAO_SAP_carrierCodes: '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                        }
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        });

        order.paymentInstruments = {
            iterator: function () {
                return {
                    hasNext: function () {
                        return false;
                    },
                    next: function () {
                        return {};
                    },
                    count: 0
                };
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        };

        var result = OrderExportUtils.getUpdatePaymentRequestJSON(order);
        assert.isNotNull(result);
        var orderResponse = JSON.parse(result);
        assert.isNotNull(orderResponse.MessageHeader);
        assert.isNotNull(orderResponse.IsConfirmed);
        assert.equal(orderResponse.Payment[0].PaymentMethod[0].AccountDisplayNumber, 'Gift card ending with 0');
        assert.equal(orderResponse.Payment[0].PaymentMethod[0].GiftCardPin, '04096523');
        assert.equal(orderResponse.Payment[0].PaymentMethod[0].PaymentType.PaymentTypeId, Gift_Card);
    });

    it('Testing method getUpdatePaymentRequestJSON credit card', () => {
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils', {
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                specialZipCodes: 'specialZipCodes',
                ManipulatePostalCode: '11111',
                ManipulatePostalCodeSeparator: '\\',
                ManipulatePostalCodePosition: 0,
                MaoSpecialZipCodes: 'A0A,A0B,A0C,A0E,A0G,A0H,A0J,A0K,A0L,A0M,A0N,A0P,A0R,A1V,A1Y,A2A,A2B,A2H,A2N,A2V,A5A,A8A,B0C,B0E,B0H,B0J,B0K,B0L,B0M,B0N,B0P,B0R,B0S,B0T,B0V,B0W,B2S,E1N,E1W,E1X,E3L,E3N,E3Y,E3Z,E4A,E4B,E4C,E4E,E4G,E4H,E4M,E4T,E4X,E4Y,E4Z,E5A,E5B,E5C,E5E,E5G,E5H,E5J,E5L,E5M,E5N,E5P,E5R,E5T,E5V,E6A,E6B,E6C,E6E,E6G,E6H,E6J,E6K,E7A,E7B,E7C,E7E,E7G,E7H,E7J,E7K,E7L,E7M,E7N,E7P,E8A,E8B,E8C,E8E,E8G,E8J,E8M,E8N,E8P,E8R,E8S,E8T,E9A,E9B,E9C,E9E,E9G,E9H,G0A,G0C,G0E,G0G,G0H,G0J,G0K,G0L,G0M,G0R,G0T,G0V,G0W,G0X,G0Y,G3Z,G4A,G4R,G4S,G4T,G4V,G4W,G4X,G4Z,G5A,G5B,G5C,G5J,G5T,G8G,G8H,G8J,G8K,G8L,G8M,G8N,G8P,G9X,H0M,J0B,J0E,J0J,J0K,J0M,J0S,J0T,J0V,J0W,J0X,J0Y,J0Z,J8G,J8L,J8N,J9E,J9L,J9T,J9V,J9X,J9Y,J9Z,K0B,K0C,K0E,K0G,K0H,K0J,K0L,K0M,N0H,P0A,P0B,P0C,P0E,P0G,P0H,P0J,P0K,P0L,P0M,P0N,P0P,P0R,P0S,P0T,P0V,P0W,P0X,P0Y,P5A,P5E,P5N,P8T,R0A,R0B,R0C,R0E,R0G,R0H,R0J,R0K,R0L,R0M,R7N,R8A,R8N,R9A,S0A,S0C,S0E,S0G,S0H,S0J,S0K,S0L,S0M,S0N,S0P,S9X,T0A,T0B,T0C,T0E,T0G,T0H,T0J,T0K,T0L,T0M,T0P,T0V,T4T,T7A,T7E,T7N,T7P,T7S,T7V,T8S,T9C,T9M,T9N,T9S,T9W,T9X,V0A,V0B,V0C,V0E,V0G,V0H,V0J,V0K,V0L,V0M,V0N,V0P,V0R,V0S,V0T,V0V,V0W,V0X,V1G,V1J,V1K,V2G,V2J,V8A,V8C,V8G,V8J,V9Z,X0A,X0B,X0C,X0E,X0G,X1A,Y0A,Y0B,Y1A'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'UKIE',
                    preferences: {
                        custom: {
                            MAO_SAP_carrierCodes: '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                        }
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        });

        order = OrderExportUtilsMock.order;
        order.paymentInstruments = {
            iterator: function () {
                var customObj = [{
                    custom: {
                        CardTypeId: "VIC",
                        GatewayId: "Aurus",
                        AccountDisplayNumber: "XXXXXXXXXXXX1111",
                        maoStatusUpdateFailedCount: null,
                        CardToken: "2000000000002615",
                        OneOrderToken: "20000000000007978687"
                    },
                    creditCardHolder: "test name",
                    creditCardExpirationMonth: "8",
                    creditCardExpirationYear: "2027",
                    paymentMethod: AurusPayment,
                    getPaymentMethod: function () {
                        return {
                            equalsIgnoreCase: function (str) {
                                return false;
                            },
                        };
                    },
                    PaymentType: {
                        PaymentTypeId: "Credit Card"
                    },
                    paymentTransaction: {
                        amount: {

                        },
                        custom: {
                            xipayTRTransRefId: ''
                        }
                    },
                    creationDate: creationDate,
                    creditCardType: 'VIC'
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
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        };

        order.getPaymentInstruments = function (payment) {
            return {
                iterator: function () {
                    return {
                        hasNext: function () {
                            return '';
                        },
                        next: function () {
                            return {};
                        },
                        count: 0
                    };
                },
            }
        };

        Maoconstants.Payment.gcPaymentMethodId = '';
        var result = OrderExportUtils.getUpdatePaymentRequestJSON(order);
        assert.isNotNull(result);
        var orderResponse = JSON.parse(result);
        assert.isNotNull(orderResponse.MessageHeader);
        assert.isNotNull(orderResponse.IsConfirmed);
        assert.isNotNull(orderResponse.Payment);
        assert.isNotNull(orderResponse.Payment[0].PaymentMethod);
        assert.equal(orderResponse.Payment[0].PaymentMethod[0].CardExpiryMonth, '8');
        assert.equal(orderResponse.Payment[0].PaymentMethod[0].CardExpiryYear, '2027');
        assert.equal(orderResponse.Payment[0].PaymentMethod[0].CardTypeId, 'VIC');
        assert.equal(orderResponse.Payment[0].PaymentMethod[0].GatewayId, 'Aurus');
    });

    it('Testing method getUpdatePaymentRequestJSON Apple Pay', () => {
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils', {
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                specialZipCodes: 'specialZipCodes',
                ManipulatePostalCode: '11111',
                ManipulatePostalCodeSeparator: '\\',
                ManipulatePostalCodePosition: 0,
                MaoSpecialZipCodes: 'A0A,A0B,A0C,A0E,A0G,A0H,A0J,A0K,A0L,A0M,A0N,A0P,A0R,A1V,A1Y,A2A,A2B,A2H,A2N,A2V,A5A,A8A,B0C,B0E,B0H,B0J,B0K,B0L,B0M,B0N,B0P,B0R,B0S,B0T,B0V,B0W,B2S,E1N,E1W,E1X,E3L,E3N,E3Y,E3Z,E4A,E4B,E4C,E4E,E4G,E4H,E4M,E4T,E4X,E4Y,E4Z,E5A,E5B,E5C,E5E,E5G,E5H,E5J,E5L,E5M,E5N,E5P,E5R,E5T,E5V,E6A,E6B,E6C,E6E,E6G,E6H,E6J,E6K,E7A,E7B,E7C,E7E,E7G,E7H,E7J,E7K,E7L,E7M,E7N,E7P,E8A,E8B,E8C,E8E,E8G,E8J,E8M,E8N,E8P,E8R,E8S,E8T,E9A,E9B,E9C,E9E,E9G,E9H,G0A,G0C,G0E,G0G,G0H,G0J,G0K,G0L,G0M,G0R,G0T,G0V,G0W,G0X,G0Y,G3Z,G4A,G4R,G4S,G4T,G4V,G4W,G4X,G4Z,G5A,G5B,G5C,G5J,G5T,G8G,G8H,G8J,G8K,G8L,G8M,G8N,G8P,G9X,H0M,J0B,J0E,J0J,J0K,J0M,J0S,J0T,J0V,J0W,J0X,J0Y,J0Z,J8G,J8L,J8N,J9E,J9L,J9T,J9V,J9X,J9Y,J9Z,K0B,K0C,K0E,K0G,K0H,K0J,K0L,K0M,N0H,P0A,P0B,P0C,P0E,P0G,P0H,P0J,P0K,P0L,P0M,P0N,P0P,P0R,P0S,P0T,P0V,P0W,P0X,P0Y,P5A,P5E,P5N,P8T,R0A,R0B,R0C,R0E,R0G,R0H,R0J,R0K,R0L,R0M,R7N,R8A,R8N,R9A,S0A,S0C,S0E,S0G,S0H,S0J,S0K,S0L,S0M,S0N,S0P,S9X,T0A,T0B,T0C,T0E,T0G,T0H,T0J,T0K,T0L,T0M,T0P,T0V,T4T,T7A,T7E,T7N,T7P,T7S,T7V,T8S,T9C,T9M,T9N,T9S,T9W,T9X,V0A,V0B,V0C,V0E,V0G,V0H,V0J,V0K,V0L,V0M,V0N,V0P,V0R,V0S,V0T,V0V,V0W,V0X,V1G,V1J,V1K,V2G,V2J,V8A,V8C,V8G,V8J,V9Z,X0A,X0B,X0C,X0E,X0G,X1A,Y0A,Y0B,Y1A'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'UKIE',
                    preferences: {
                        custom: {
                            MAO_SAP_carrierCodes: '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                        }
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        });

        order = OrderExportUtilsMock.order;
        order.paymentInstruments = {
            iterator: function () {
                var customObj = [{
                    custom: {
                        CardTypeId: "NVC",
                        GatewayId: "Aurus",
                        AccountDisplayNumber: "XXXXXXXXXXXX4524",
                        maoStatusUpdateFailedCount: null,
                        CardToken: "2000000000000489",
                        OneOrderToken: "20000000000008033021",
                        AurusWalletIdentifier: '7'
                    },
                    creditCardHolder: "",
                    creditCardExpirationMonth: "",
                    creditCardExpirationYear: "",
                    paymentMethod: AurusPayment,
                    getPaymentMethod: function () {
                        return {
                            equalsIgnoreCase: function (str) {
                                return false;
                            },
                        };
                    },
                    PaymentType: {
                        PaymentTypeId: "Credit Card"
                    },
                    paymentTransaction: {
                        amount: {

                        },
                        custom: {
                            xipayTRTransRefId: ''
                        }
                    },
                    creationDate: creationDate,
                    creditCardType: 'NVC'
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
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        };

        order.getPaymentInstruments = function (payment) {
            return {
                iterator: function () {
                    return {
                        hasNext: function () {
                            return '';
                        },
                        next: function () {
                            return {};
                        },
                        count: 0
                    };
                },
            }
        };

        Maoconstants.Payment.gcPaymentMethodId = '';
        var result = OrderExportUtils.getUpdatePaymentRequestJSON(order);
        assert.isNotNull(result);
        var orderResponse = JSON.parse(result);
        assert.isNotNull(orderResponse.MessageHeader);
        assert.isNotNull(orderResponse.IsConfirmed);
        assert.isNotNull(orderResponse.Payment);
        assert.isNotNull(orderResponse.Payment[0].PaymentMethod);
        assert.equal(orderResponse.Payment[0].PaymentMethod[0].GatewayId, 'Aurus');
        assert.equal(orderResponse.Payment[0].PaymentMethod[0].CardTypeId, 'NVC');
        assert.equal(orderResponse.Payment[0].PaymentMethod[0].Extended.AurusWalletIdentifier, '7');
    });

    it('Testing method getUpdatePaymentRequestJSON Paypal', () => {
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils', {
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                specialZipCodes: 'specialZipCodes',
                ManipulatePostalCode: '11111',
                ManipulatePostalCodeSeparator: '\\',
                ManipulatePostalCodePosition: 0,
                MaoSpecialZipCodes: 'A0A,A0B,A0C,A0E,A0G,A0H,A0J,A0K,A0L,A0M,A0N,A0P,A0R,A1V,A1Y,A2A,A2B,A2H,A2N,A2V,A5A,A8A,B0C,B0E,B0H,B0J,B0K,B0L,B0M,B0N,B0P,B0R,B0S,B0T,B0V,B0W,B2S,E1N,E1W,E1X,E3L,E3N,E3Y,E3Z,E4A,E4B,E4C,E4E,E4G,E4H,E4M,E4T,E4X,E4Y,E4Z,E5A,E5B,E5C,E5E,E5G,E5H,E5J,E5L,E5M,E5N,E5P,E5R,E5T,E5V,E6A,E6B,E6C,E6E,E6G,E6H,E6J,E6K,E7A,E7B,E7C,E7E,E7G,E7H,E7J,E7K,E7L,E7M,E7N,E7P,E8A,E8B,E8C,E8E,E8G,E8J,E8M,E8N,E8P,E8R,E8S,E8T,E9A,E9B,E9C,E9E,E9G,E9H,G0A,G0C,G0E,G0G,G0H,G0J,G0K,G0L,G0M,G0R,G0T,G0V,G0W,G0X,G0Y,G3Z,G4A,G4R,G4S,G4T,G4V,G4W,G4X,G4Z,G5A,G5B,G5C,G5J,G5T,G8G,G8H,G8J,G8K,G8L,G8M,G8N,G8P,G9X,H0M,J0B,J0E,J0J,J0K,J0M,J0S,J0T,J0V,J0W,J0X,J0Y,J0Z,J8G,J8L,J8N,J9E,J9L,J9T,J9V,J9X,J9Y,J9Z,K0B,K0C,K0E,K0G,K0H,K0J,K0L,K0M,N0H,P0A,P0B,P0C,P0E,P0G,P0H,P0J,P0K,P0L,P0M,P0N,P0P,P0R,P0S,P0T,P0V,P0W,P0X,P0Y,P5A,P5E,P5N,P8T,R0A,R0B,R0C,R0E,R0G,R0H,R0J,R0K,R0L,R0M,R7N,R8A,R8N,R9A,S0A,S0C,S0E,S0G,S0H,S0J,S0K,S0L,S0M,S0N,S0P,S9X,T0A,T0B,T0C,T0E,T0G,T0H,T0J,T0K,T0L,T0M,T0P,T0V,T4T,T7A,T7E,T7N,T7P,T7S,T7V,T8S,T9C,T9M,T9N,T9S,T9W,T9X,V0A,V0B,V0C,V0E,V0G,V0H,V0J,V0K,V0L,V0M,V0N,V0P,V0R,V0S,V0T,V0V,V0W,V0X,V1G,V1J,V1K,V2G,V2J,V8A,V8C,V8G,V8J,V9Z,X0A,X0B,X0C,X0E,X0G,X1A,Y0A,Y0B,Y1A'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'UKIE',
                    preferences: {
                        custom: {
                            MAO_SAP_carrierCodes: '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                        }
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        });

        order = OrderExportUtilsMock.order;
        order.customerEmail = 'unittest@gmail.com';
        order.paymentInstruments = {
            iterator: function () {
                var customObj = [{
                    custom: {
                        CardTypeId: "VIC",
                        GatewayId: "Aurus",
                        AccountDisplayNumber: "",
                        maoStatusUpdateFailedCount: null,
                        CardToken: "",
                        OneOrderToken: "20000000000007978687"
                    },
                    creditCardHolder: "",
                    creditCardExpirationMonth: "",
                    creditCardExpirationYear: "",
                    paymentMethod: PayPal,
                    getPaymentMethod: function () {
                        return {
                            equalsIgnoreCase: function (str) {
                                return false;
                            },
                        };
                    },
                    PaymentType: {
                        PaymentTypeId: PayPal
                    },
                    paymentTransaction: {
                        transactionID: '192221675024585144',
                        amount: {

                        },
                        custom: {
                            xipayTRTransRefId: ''
                        }
                    },
                    creationDate: creationDate,
                    creditCardType: 'VIC'
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
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        };

        Maoconstants.Payment.gcPaymentMethodId = '';
        var result = OrderExportUtils.getUpdatePaymentRequestJSON(order);
        assert.isNotNull(result);
        var orderResponse = JSON.parse(result);
        assert.isNotNull(orderResponse.MessageHeader);
        assert.isNotNull(orderResponse.IsConfirmed);
        assert.isNotNull(orderResponse.Payment);
        assert.isNotNull(orderResponse.Payment[0].PaymentMethod);
        assert.equal(orderResponse.Payment[0].PaymentMethod[0].PaymentType.PaymentTypeId, PayPal);
        assert.equal(orderResponse.Payment[0].PaymentMethod[0].Extended.PayPalUserEmail, 'unittest@gmail.com');
    });

    it('Testing method getUpdatePaymentRequestJSON No Payment', () => {
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils', {
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                specialZipCodes: 'specialZipCodes',
                ManipulatePostalCode: '11111',
                ManipulatePostalCodeSeparator: '\\',
                ManipulatePostalCodePosition: 0,
                MaoSpecialZipCodes: 'A0A,A0B,A0C,A0E,A0G,A0H,A0J,A0K,A0L,A0M,A0N,A0P,A0R,A1V,A1Y,A2A,A2B,A2H,A2N,A2V,A5A,A8A,B0C,B0E,B0H,B0J,B0K,B0L,B0M,B0N,B0P,B0R,B0S,B0T,B0V,B0W,B2S,E1N,E1W,E1X,E3L,E3N,E3Y,E3Z,E4A,E4B,E4C,E4E,E4G,E4H,E4M,E4T,E4X,E4Y,E4Z,E5A,E5B,E5C,E5E,E5G,E5H,E5J,E5L,E5M,E5N,E5P,E5R,E5T,E5V,E6A,E6B,E6C,E6E,E6G,E6H,E6J,E6K,E7A,E7B,E7C,E7E,E7G,E7H,E7J,E7K,E7L,E7M,E7N,E7P,E8A,E8B,E8C,E8E,E8G,E8J,E8M,E8N,E8P,E8R,E8S,E8T,E9A,E9B,E9C,E9E,E9G,E9H,G0A,G0C,G0E,G0G,G0H,G0J,G0K,G0L,G0M,G0R,G0T,G0V,G0W,G0X,G0Y,G3Z,G4A,G4R,G4S,G4T,G4V,G4W,G4X,G4Z,G5A,G5B,G5C,G5J,G5T,G8G,G8H,G8J,G8K,G8L,G8M,G8N,G8P,G9X,H0M,J0B,J0E,J0J,J0K,J0M,J0S,J0T,J0V,J0W,J0X,J0Y,J0Z,J8G,J8L,J8N,J9E,J9L,J9T,J9V,J9X,J9Y,J9Z,K0B,K0C,K0E,K0G,K0H,K0J,K0L,K0M,N0H,P0A,P0B,P0C,P0E,P0G,P0H,P0J,P0K,P0L,P0M,P0N,P0P,P0R,P0S,P0T,P0V,P0W,P0X,P0Y,P5A,P5E,P5N,P8T,R0A,R0B,R0C,R0E,R0G,R0H,R0J,R0K,R0L,R0M,R7N,R8A,R8N,R9A,S0A,S0C,S0E,S0G,S0H,S0J,S0K,S0L,S0M,S0N,S0P,S9X,T0A,T0B,T0C,T0E,T0G,T0H,T0J,T0K,T0L,T0M,T0P,T0V,T4T,T7A,T7E,T7N,T7P,T7S,T7V,T8S,T9C,T9M,T9N,T9S,T9W,T9X,V0A,V0B,V0C,V0E,V0G,V0H,V0J,V0K,V0L,V0M,V0N,V0P,V0R,V0S,V0T,V0V,V0W,V0X,V1G,V1J,V1K,V2G,V2J,V8A,V8C,V8G,V8J,V9Z,X0A,X0B,X0C,X0E,X0G,X1A,Y0A,Y0B,Y1A'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'UKIE',
                    preferences: {
                        custom: {
                            MAO_SAP_carrierCodes: '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                        }
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        });

        order = OrderExportUtilsMock.order;
        order.paymentInstruments = {
            iterator: function () {
                return {
                    hasNext: function () {
                        return false;
                    },
                    next: function () {
                        return {};
                    },
                    count: 0
                };
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        };

        Maoconstants.Payment.gcPaymentMethodId = '';
        var result = OrderExportUtils.getUpdatePaymentRequestJSON(order);
        assert.isNotNull(result);
        var orderResponse = JSON.parse(result);
        assert.isNotNull(orderResponse.MessageHeader);
        assert.isNotNull(orderResponse.IsConfirmed);
        assert.isNotNull(orderResponse.Payment);
        assert.isNotNull(orderResponse.Payment[0].PaymentMethod);
    });

    it('Testing method getUpdatePaymentRequestJSON --> Test Custom Exception', () => {
        order = {};
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils', {
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            'dw/campaign/Promotion': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                specialZipCodes: 'specialZipCodes',
                ManipulatePostalCode: '11111',
                ManipulatePostalCodeSeparator: '\\',
                ManipulatePostalCodePosition: 0,
                MaoSpecialZipCodes: 'A0A,A0B,A0C,A0E,A0G,A0H,A0J,A0K,A0L,A0M,A0N,A0P,A0R,A1V,A1Y,A2A,A2B,A2H,A2N,A2V,A5A,A8A,B0C,B0E,B0H,B0J,B0K,B0L,B0M,B0N,B0P,B0R,B0S,B0T,B0V,B0W,B2S,E1N,E1W,E1X,E3L,E3N,E3Y,E3Z,E4A,E4B,E4C,E4E,E4G,E4H,E4M,E4T,E4X,E4Y,E4Z,E5A,E5B,E5C,E5E,E5G,E5H,E5J,E5L,E5M,E5N,E5P,E5R,E5T,E5V,E6A,E6B,E6C,E6E,E6G,E6H,E6J,E6K,E7A,E7B,E7C,E7E,E7G,E7H,E7J,E7K,E7L,E7M,E7N,E7P,E8A,E8B,E8C,E8E,E8G,E8J,E8M,E8N,E8P,E8R,E8S,E8T,E9A,E9B,E9C,E9E,E9G,E9H,G0A,G0C,G0E,G0G,G0H,G0J,G0K,G0L,G0M,G0R,G0T,G0V,G0W,G0X,G0Y,G3Z,G4A,G4R,G4S,G4T,G4V,G4W,G4X,G4Z,G5A,G5B,G5C,G5J,G5T,G8G,G8H,G8J,G8K,G8L,G8M,G8N,G8P,G9X,H0M,J0B,J0E,J0J,J0K,J0M,J0S,J0T,J0V,J0W,J0X,J0Y,J0Z,J8G,J8L,J8N,J9E,J9L,J9T,J9V,J9X,J9Y,J9Z,K0B,K0C,K0E,K0G,K0H,K0J,K0L,K0M,N0H,P0A,P0B,P0C,P0E,P0G,P0H,P0J,P0K,P0L,P0M,P0N,P0P,P0R,P0S,P0T,P0V,P0W,P0X,P0Y,P5A,P5E,P5N,P8T,R0A,R0B,R0C,R0E,R0G,R0H,R0J,R0K,R0L,R0M,R7N,R8A,R8N,R9A,S0A,S0C,S0E,S0G,S0H,S0J,S0K,S0L,S0M,S0N,S0P,S9X,T0A,T0B,T0C,T0E,T0G,T0H,T0J,T0K,T0L,T0M,T0P,T0V,T4T,T7A,T7E,T7N,T7P,T7S,T7V,T8S,T9C,T9M,T9N,T9S,T9W,T9X,V0A,V0B,V0C,V0E,V0G,V0H,V0J,V0K,V0L,V0M,V0N,V0P,V0R,V0S,V0T,V0V,V0W,V0X,V1G,V1J,V1K,V2G,V2J,V8A,V8C,V8G,V8J,V9Z,X0A,X0B,X0C,X0E,X0G,X1A,Y0A,Y0B,Y1A'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'UKIE',
                    preferences: {
                        custom: {
                            MAO_SAP_carrierCodes: '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                        }
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields,
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        });
        var result = OrderExportUtils.getUpdatePaymentRequestJSON(order);
        assert.isNotNull(result);
        assert.isTrue(JSON.parse(result).error);
        assert.isNotNull(JSON.parse(result).errorMsg);
    });

    it('Testing method getOrderJson --> Test Custom Exception', () => {
        order.customerName = 'aaa bbb';
        order.billingAddress = { countryCode: {} };
        var OrderExportUtils = proxyquire('../../../cartridges/int_mao/cartridge/scripts/OrderExportUtils', {
            'dw/util/Calendar': require('../../mocks/dw/dw_util_Calendar'),
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            'dw/order/PaymentMgr': require('../../mocks/dw/dw_order_PaymentMgr'),
            'dw/campaign/Promotion': require('../../mocks/dw/dw_campaign_PromotionMgr'),
            '~/cartridge/scripts/MaoPreferences': {
                xiPayPayPalAuthEnabled: true,
                specialZipCodes: 'specialZipCodes',
                ManipulatePostalCode: '11111',
                ManipulatePostalCodeSeparator: '\\',
                ManipulatePostalCodePosition: 0,
                MaoSpecialZipCodes: 'A0A,A0B,A0C,A0E,A0G,A0H,A0J,A0K,A0L,A0M,A0N,A0P,A0R,A1V,A1Y,A2A,A2B,A2H,A2N,A2V,A5A,A8A,B0C,B0E,B0H,B0J,B0K,B0L,B0M,B0N,B0P,B0R,B0S,B0T,B0V,B0W,B2S,E1N,E1W,E1X,E3L,E3N,E3Y,E3Z,E4A,E4B,E4C,E4E,E4G,E4H,E4M,E4T,E4X,E4Y,E4Z,E5A,E5B,E5C,E5E,E5G,E5H,E5J,E5L,E5M,E5N,E5P,E5R,E5T,E5V,E6A,E6B,E6C,E6E,E6G,E6H,E6J,E6K,E7A,E7B,E7C,E7E,E7G,E7H,E7J,E7K,E7L,E7M,E7N,E7P,E8A,E8B,E8C,E8E,E8G,E8J,E8M,E8N,E8P,E8R,E8S,E8T,E9A,E9B,E9C,E9E,E9G,E9H,G0A,G0C,G0E,G0G,G0H,G0J,G0K,G0L,G0M,G0R,G0T,G0V,G0W,G0X,G0Y,G3Z,G4A,G4R,G4S,G4T,G4V,G4W,G4X,G4Z,G5A,G5B,G5C,G5J,G5T,G8G,G8H,G8J,G8K,G8L,G8M,G8N,G8P,G9X,H0M,J0B,J0E,J0J,J0K,J0M,J0S,J0T,J0V,J0W,J0X,J0Y,J0Z,J8G,J8L,J8N,J9E,J9L,J9T,J9V,J9X,J9Y,J9Z,K0B,K0C,K0E,K0G,K0H,K0J,K0L,K0M,N0H,P0A,P0B,P0C,P0E,P0G,P0H,P0J,P0K,P0L,P0M,P0N,P0P,P0R,P0S,P0T,P0V,P0W,P0X,P0Y,P5A,P5E,P5N,P8T,R0A,R0B,R0C,R0E,R0G,R0H,R0J,R0K,R0L,R0M,R7N,R8A,R8N,R9A,S0A,S0C,S0E,S0G,S0H,S0J,S0K,S0L,S0M,S0N,S0P,S9X,T0A,T0B,T0C,T0E,T0G,T0H,T0J,T0K,T0L,T0M,T0P,T0V,T4T,T7A,T7E,T7N,T7P,T7S,T7V,T8S,T9C,T9M,T9N,T9S,T9W,T9X,V0A,V0B,V0C,V0E,V0G,V0H,V0J,V0K,V0L,V0M,V0N,V0P,V0R,V0S,V0T,V0V,V0W,V0X,V1G,V1J,V1K,V2G,V2J,V8A,V8C,V8G,V8J,V9Z,X0A,X0B,X0C,X0E,X0G,X1A,Y0A,Y0B,Y1A'
            },
            '~/cartridge/scripts/MaoConstants': Maoconstants,
            'dw/system/Site': {
                current: {
                    ID: 'UKIE',
                    preferences: {
                        custom: {
                            MAO_SAP_carrierCodes: '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}'
                        }
                    }
                },
                getCurrent: function () {
                    return {
                        getID: function () {
                            return '';
                        },
                        getCustomPreferenceValue: function () {
                            return '{"pickupLocation":"pickupLocation","FED-PUP":"FED-PUP","FED-STD":"FED-EXP","DHL-BBX":"DHL-BBX","DHL-ECX":"DHL-ECX","DHL_DE_PACKSTATION":"DHL-P02","DHL_DE_POST_OFFICE_DIRECT":"DHL-P02","DHL_DE_PAKET":"DHL-S02","HERMES_UK_STANDARD_SERVICE_POINT":"HER-P02","HERMES_UK_STANDARD":"HER-S02","PAKJEGEMAK_SIGNATURE_NOTIFICATION":"PNL-P02","AVG":"PNL-S02","UPS_AP_STANDARD":"UPS-PUP","UPS_EXPRESS":"UPS-EXS","UPS_STANDARD":"UPS-STD"}';
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/accountHelpers': {
                validateProfileFields: validateProfileFields
            },
            '*/cartridge/scripts/helpers/sitePreferencesHelper': {
                isAurusEnabled: isAurusEnabled
            },
            '*/cartridge/scripts/giftcard/giftcardHelper': {
                basketHasGiftCardItems: basketHasGiftCardItems
            },
            'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayList')
        });
        var result = OrderExportUtils.getOrderJSON(order);
        var resultObject = JSON.parse(result);
        assert.isNotNull(result);
        assert.isTrue(resultObject.error);
        assert.isNotNull(resultObject.errorMsg);
    });
});
