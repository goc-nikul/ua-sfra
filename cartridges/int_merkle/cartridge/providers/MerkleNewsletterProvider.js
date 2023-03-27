'use strict';

var AbstractNewsletterProvider = require('./AbstractNewsletterProvider');
var MerkleLogger = require('dw/system/Logger').getLogger('merkle');

var NewsletterProvider = AbstractNewsletterProvider.extend({
    subscribe: function () {
        var serviceResult;
        try {
            var svc = require('*/cartridge/scripts/services/MerkleHTTPService').getSubscriptionEmail();
            serviceResult = svc.call({
                email: this.options.email,
                language: this.options.locale,
                email_source: this.options.merkleSourceCode,
                country: this.options.country,
                lng: this.options.lng
            });
        } catch (err) {
            return MerkleLogger.error('Error when call subscribe on server: {0}', err);
        }

        return serviceResult.object;
    },
    status: function () {
        var serviceResult;
        try {
            var svc = require('*/cartridge/scripts/services/MerkleHTTPService').getSubscriptionStatus();
            serviceResult = svc.call({
                email: this.options.email
            });
        } catch (err) {
            return MerkleLogger.error('Error when call checking subscription status on server: {0}', err);
        }

        return serviceResult.object;
    }
});

module.exports = NewsletterProvider;
