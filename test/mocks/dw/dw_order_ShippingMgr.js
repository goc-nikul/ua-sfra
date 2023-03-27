/* eslint-disable */
var ArrayList = require('../scripts/util/dw.util.Collection');

var defaultShippingMethod =
{
    description: 'Order received within 7-10 business days',
    displayName: 'Ground',
    ID: '001',
    custom: {
        estimatedArrivalTime: '7-10 Business Days'
    }
};

function createShipmentShippingModel() {
    return {
        applicableShippingMethods: new ArrayList([
            {
                description: 'Order received within 7-10 business days',
                displayName: 'Ground',
                ID: '001',
                defaultMethod: false,
                shippingCost: '$0.00',
                custom: {
                    estimatedArrivalTime: '7-10 Business Days',
                    storePickupEnabled: false
                }
            },
            {
                description: 'Order received in 2 business days',
                displayName: '2-Day Express',
                ID: '002',
                shippingCost: '$0.00',
                defaultMethod: false,
                custom: {
                    estimatedArrivalTime: '2 Business Days',
                    storePickupEnabled: false
                }
            },
            {
                ID: 'standard-pre-order-AK-HI',
                custom: {
                    storePickupEnabled: false,
                    isHALshippingMethod: true
                }
            }
        ]),
        getApplicableShippingMethods: function () {
            return new ArrayList([
                {
                    description: 'Order received within 7-10 business days',
                    displayName: 'Ground',
                    ID: '001',
                    defaultMethod: false,
                    shippingCost: '$0.00',
                    custom: {
                        estimatedArrivalTime: '7-10 Business Days',
                        storePickupEnabled: false
                    }
                },
                {
                    description: 'Order received in 2 business days',
                    displayName: '2-Day Express',
                    ID: '002',
                    shippingCost: '$0.00',
                    defaultMethod: false,
                    custom: {
                        estimatedArrivalTime: '2 Business Days',
                        storePickupEnabled: false
                    }
                },
                {
                    ID: 'standard-pre-order-AK-HI',
                    custom: {
                        storePickupEnabled: false,
                        isHALshippingMethod: true
                    }
                }
            ]);
        },
        getShippingCost: function () {
            return {
                amount: {
                    valueOrNull: 7.99
                },
                getAmount: function () {
                    return 7.99;
                }
            };
        }        
    };
};

function getProductShippingModel(product) {
    return {
        getShippingCost: function (shippingMethod) {
            return {
                getAmount: function () {
                    return 7.99;
                },
                isSurcharge: function () {
                    return false;
                }
            }
        }
    }
}

function getAllShippingMethods() {
    return new ArrayList([
        {
            description: 'Order received within 7-10 business days',
            displayName: 'Ground',
            ID: '001',
            defaultMethod: false,
            shippingCost: '$0.00',
            custom: {
                estimatedArrivalTime: '7-10 Business Days',
                storePickupEnabled: false
            }
        },
        {
            description: 'Order received in 2 business days',
            displayName: '2-Day Express',
            ID: '002',
            shippingCost: '$0.00',
            defaultMethod: false,
            custom: {
                estimatedArrivalTime: '2 Business Days',
                storePickupEnabled: false
            }
        }
    ]);
}


module.exports = {
    allShippingMethods: getAllShippingMethods(),
    getDefaultShippingMethod: function () {
        return defaultShippingMethod;
    },
    getShipmentShippingModel: function (shipment) {
        return createShipmentShippingModel(shipment);
    },
    getProductShippingModel: getProductShippingModel,
    getAllShippingMethods: function () {
        return getAllShippingMethods();
    }
};
