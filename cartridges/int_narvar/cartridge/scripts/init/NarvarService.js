'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var StringUtils = require('dw/util/StringUtils');

var getNarvarService = LocalServiceRegistry.createService('narvar.http', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/json');
        var base64Credentials = StringUtils.encodeBase64(svc.configuration.credential.user + ':' + svc.configuration.credential.password);
        svc.addHeader('Authorization', 'Basic ' + base64Credentials);
        return JSON.stringify(params);
    },
    parseResponse: function (svc, response) {
        return response;
    },
    filterLogMessage: function (msg) {
        var filteredLog = msg;
        var stars = '********';

        try {
            filteredLog = JSON.parse(msg);

            if ('order_info' in filteredLog && 'customer' in filteredLog.order_info) {
                filteredLog.order_info.customer.first_name = stars;
                filteredLog.order_info.customer.last_name = stars;
                filteredLog.order_info.customer.phone = stars;
                filteredLog.order_info.customer.email = stars;
                filteredLog.order_info.customer.address.street_1 = stars;
                filteredLog.order_info.billing.billed_to.first_name = stars;
                filteredLog.order_info.billing.billed_to.last_name = stars;
                filteredLog.order_info.billing.billed_to.phone = stars;
                filteredLog.order_info.billing.billed_to.email = stars;
                filteredLog.order_info.billing.billed_to.address.street_1 = stars;
            }

            if ('order_info' in filteredLog && 'shipments' in filteredLog.order_info) {
                filteredLog.order_info.shipments.map(shipment => {
                    let ship = shipment;
                    if ('shipped_to' in ship) {
                        ship.shipped_to.first_name = stars;
                        ship.shipped_to.last_name = stars;
                        ship.shipped_to.phone = stars;
                        ship.shipped_to.email = stars;
                        ship.shipped_to.address.street_1 = stars;
                    }

                    return ship;
                });
            }

            filteredLog = JSON.stringify(filteredLog);
        } catch (e) {
            return filteredLog;
        }

        return filteredLog;
    }
});

module.exports = {
    getNarvarService: getNarvarService
};
