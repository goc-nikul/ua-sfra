'use strict';

var AbstractFraudScreenProvider = require('./AbstractFraudScreenProvider');
var AccertifyServices = require('int_accertify/cartridge/scripts/hooks/AccertifyCalls');

var FraudScreenProvider = AbstractFraudScreenProvider.extend({
    validate: function () {
        return AccertifyServices.getNotification(this.order);
    }
});

module.exports = FraudScreenProvider;
