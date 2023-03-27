'use strict';

function BaseOrderModel() {
    this.orderItems = [
        {
            ID: '123456',
            uuid: '9876543210',
            isEligibleForReturn: true,
            isPersonalizationEligible: false,
            shippingAddress: {
                businessName: 'UA',
                stateCode: 'TAS',
                city: 'Wellington'
            }
        }
    ];
}

module.exports = BaseOrderModel;
