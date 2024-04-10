'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');

// Path to test scripts
var pathToCoreMock = '../../../../mocks/';
var pathToLinkMock = '../../mock/';

describe('int_narvar/cartridge/scripts/helpers/narvarShippingHelper.js', () => {
    global.empty = (data) => {
        return !data;
    };
    var orderObj;
    var narvarShippingHelper = proxyquire('../../../../../cartridges/int_narvar/cartridge/scripts/helpers/narvarShippingHelper.js', {
        '*/cartridge/models/product/productImages': sinon.stub().returns({
            cartFullDesktop: [{
                url: 'url'
            }]
        }),
        'dw/web/URLUtils': {
            url: sinon.stub().returns({
                toString: sinon.stub().returns({})
            }),
            https: sinon.stub().returns({
                toString: sinon.stub().returns({})
            })
        },
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger')
    });
    var result;
    var carrierMapping = {
        'UPS-STD': 'UPS',
        'UPS-PUP': 'UPS',
        'UPS-EXS': 'UPS',
        'HER-P02': 'Hermes',
        'HER-S02': 'Hermes',
        'DHL-P02': 'DHL',
        'DHL-S02': 'DHL',
        'PNL-S02': 'PostNL',
        'PNL-P02': 'PostNL',
        'FED-EXP': 'fedex',
        'narvar': {
            'DHPG': 'dhlparcel',
            'DHL-P01': 'dhlparcel',
            'DHPX': 'dhlparcel',
            'DHL-P03': 'dhlparcel',
            'DHL-ECX': 'dhl',
            'DHL-BBX': 'dhl',
            'DHLM': 'dhl',
            'DHL-PUP': 'dhl',
            'DHLG': 'dhl',
            'FEG1': 'fedex',
            'FED-PUP': 'fedex',
            'FED-EXP': 'fedex',
            'DHL1': 'dhl',
            'DHL_DE_POST_OFFICE_DIRECT': 'dhl-de',
            'PAKJEGEMAK_SIGNATURE_NOTIFICATION': 'tnt',
            'UPS_AP_STANDARD': 'ups'
        }
    };

    it('Testing method: getShippedOrderObj :should return empty orderObj', () => {
        orderObj = {
            productLineItems: [{
                product: {
                    longDescription: '',
                    custom: {
                        colorgroup: '',
                        sku: 'test'
                    }
                },
                quantity: {
                    value: ''
                },
                basePrice: {
                    valueOrNull: ''
                },
                shipment: {
                    shippingStatus: {
                        displayValue: ''
                    }
                }
            }],
            defaultShipment: {
                custom: {
                    paazlDeliveryInfo: '{"success":true,"ID":"paazl_EUR","deliveryType":"HOME","carrierName":"DHL_EXPRESS","carrierDescription":"DHL Express","cost":0,"identifier":"DHPG","name":"DHL For You","deliveryDates":[],"estimatedDeliveryRange":{"min":1,"max":2,"earliestDate":"2023-10-31","latestDate":"2023-11-01"}}'
                }
            },
            shipments: [{
                shippingMethod: {
                    custom: {
                        narvarShipSourceCode: {
                            displayValue: ''
                        }
                    },
                    displayName: ''
                },
                shippingAddress: {
                    firstName: '',
                    lastName: '',
                    phone: '',
                    countryCode: {
                        value: ''
                    }
                }
            }],
            billingAddress: {
                firstName: '',
                lastName: '',
                phone: '',
                countryCode: {
                    value: ''
                }
            },
            custom: {
                shippingJson: '[{"emailSent":true,"date":"","carrier":"","deliveryNumber":"","trackingCode":"","trackingLink":"","items":{"test":"1"}}]',
                shippedCallToNarvar: 0
            },
            customer: {
                ID: ''
            },
            totalNetPrice: {
                value: ''
            },
            totalTax: {
                value: ''
            }
        };
        result = narvarShippingHelper.getShippedOrderObj(orderObj, carrierMapping);
        assert.equal(result.orderObject.order_info.order_number, '');
    });

    it('Testing method: getShippedOrderObj :should return success false', () => {
        orderObj = {
            productLineItems: [{
                product: {
                    longDescription: '',
                    custom: {
                        colorgroup: '',
                        sku: 'test'
                    }
                },
                quantity: {
                    value: ''
                },
                basePrice: {
                    valueOrNull: ''
                },
                shipment: {
                    shippingStatus: {
                        displayValue: ''
                    }
                }
            }],
            defaultShipment: {
                custom: {
                    paazlDeliveryInfo: null
                }
            },
            shipments: [{
                shippingMethod: {
                    custom: {
                        narvarShipSourceCode: {
                            displayValue: ''
                        }
                    },
                    displayName: ''
                },
                shippingAddress: {
                    firstName: '',
                    lastName: '',
                    phone: '',
                    countryCode: {
                        value: ''
                    }
                }
            }],
            billingAddress: {
                firstName: '',
                lastName: '',
                phone: '',
                countryCode: {
                    value: ''
                }
            },
            custom: {
                shippingJson: '[{"emailSent":true,"date":"","carrier":"","deliveryNumber":"","trackingCode":"","trackingLink":"","items":{"test":"1"}}]',
                shippedCallToNarvar: 0
            },
            customer: {
                ID: ''
            },
            totalNetPrice: {
                value: ''
            },
            totalTax: {
                value: ''
            }
        };
        result = narvarShippingHelper.getShippedOrderObj(orderObj, carrierMapping);
        assert.equal(result.success, false);
    });

    it('Testing method: getShippedOrderObj :should return empty orderObj', () => {
        orderObj = {
            productLineItems: [{
                product: {
                    longDescription: '',
                    custom: {
                        colorgroup: '',
                        sku: 'test'
                    }
                },
                quantity: {
                    value: ''
                },
                basePrice: {
                    valueOrNull: ''
                },
                shipment: {
                    shippingStatus: {
                        displayValue: ''
                    }
                }
            }],
            defaultShipment: {
                custom: {
                    paazlDeliveryInfo: '{"success":true,"ID":"paazl_EUR","deliveryType":"HOME","carrierName":"DHL_EXPRESS","carrierDescription":"DHL Express","cost":0,"identifier":"DHPG","name":"DHL For You","deliveryDates":[],"estimatedDeliveryRange":{"min":1,"max":2,"earliestDate":"2023-10-31","latestDate":"2023-11-01"}}'
                }
            },
            shipments: [{
                shippingMethod: {
                    custom: {
                        narvarShipSourceCode: {
                            displayValue: ''
                        }
                    },
                    displayName: ''
                },
                shippingAddress: {
                    firstName: '',
                    lastName: '',
                    phone: '',
                    countryCode: {
                        value: ''
                    }
                }
            }],
            billingAddress: {
                firstName: '',
                lastName: '',
                phone: '',
                countryCode: {
                    value: ''
                }
            },
            custom: {
                shippingJson: '[{"emailSent":true,"date":"","carrier":"","deliveryNumber":"","trackingCode":"","trackingLink":"","items":{"test":"1"}}]',
                shippedCallToNarvar: 0
            },
            customer: {
                ID: ''
            },
            totalNetPrice: {
                value: ''
            },
            totalTax: {
                value: ''
            }
        };
        result = narvarShippingHelper.getShippedOrderObj(orderObj, carrierMapping);
        assert.equal(result.orderObject.order_info.order_number, '');
    });

    it('Testing method: getShippedOrderObj :should return success false', () => {
        orderObj = {
            productLineItems: [{
                product: {
                    longDescription: '',
                    custom: {
                        colorgroup: '',
                        sku: 'test'
                    }
                },
                quantity: {
                    value: ''
                },
                basePrice: {
                    valueOrNull: ''
                },
                shipment: {
                    shippingStatus: {
                        displayValue: ''
                    }
                }
            }],
            defaultShipment: {
                custom: {
                    paazlDeliveryInfo: 'asdsada'
                }
            },
            shipments: [{
                shippingMethod: {
                    custom: {
                        narvarShipSourceCode: {
                            displayValue: ''
                        }
                    },
                    displayName: ''
                },
                shippingAddress: {
                    firstName: '',
                    lastName: '',
                    phone: '',
                    countryCode: {
                        value: ''
                    }
                }
            }],
            billingAddress: {
                firstName: '',
                lastName: '',
                phone: '',
                countryCode: {
                    value: ''
                }
            },
            custom: {
                shippingJson: 'asdasd',
                shippedCallToNarvar: 0
            },
            customer: {
                ID: ''
            },
            totalNetPrice: {
                value: ''
            },
            totalTax: {
                value: ''
            }
        };
        result = narvarShippingHelper.getShippedOrderObj(orderObj, carrierMapping);
        assert.equal(result.success, false);
    });

    it('Testing method: getShippedOrderObj :should return empty orderObj', () => {
        orderObj = {
            productLineItems: [{
                product: {
                    longDescription: '',
                    custom: {
                        colorgroup: '',
                        sku: 'test'
                    }
                },
                quantity: {
                    value: ''
                },
                basePrice: {
                    valueOrNull: ''
                },
                shipment: {
                    shippingStatus: {
                        displayValue: ''
                    }
                }
            }],
            defaultShipment: {
                custom: {
                    paazlDeliveryInfo: '{"success":true,"ID":"paazl_EUR","deliveryType":"HOME","carrierName":"DHL_EXPRESS","carrierDescription":"DHL Express","cost":0,"identifier":"DHPG","name":"DHL For You","deliveryDates":[],"estimatedDeliveryRange":{"min":1,"max":2,"earliestDate":"2023-10-31","latestDate":"2023-11-01"}}'
                }
            },
            shipments: [{
                shippingMethod: {
                    custom: {
                        narvarShipSourceCode: {
                            displayValue: ''
                        }
                    },
                    displayName: ''
                },
                shippingAddress: {
                    firstName: '',
                    lastName: '',
                    phone: '',
                    countryCode: {
                        value: ''
                    }
                }
            }],
            billingAddress: {
                firstName: '',
                lastName: '',
                phone: '',
                countryCode: {
                    value: ''
                }
            },
            custom: {
                shippingJson: '[{"emailSent":true,"date":"","carrier":"","deliveryNumber":"","trackingCode":"","trackingLink":"","items":{"test":"1"}}]',
                shippedCallToNarvar: 0
            },
            customer: {
                ID: ''
            },
            totalNetPrice: {
                value: ''
            },
            totalTax: {
                value: ''
            }
        };
        result = narvarShippingHelper.getShippedOrderObj(orderObj, carrierMapping);
        assert.equal(result.orderObject.order_info.order_number, '');
    });
});
