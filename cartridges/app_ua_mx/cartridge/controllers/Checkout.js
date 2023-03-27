'use strict';

var server = require('server');
server.extend(module.superModule);

server.append(
    'Begin', function (req, res, next) {
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var viewData = res.getViewData();
        viewData.selectedPaymentMethod = 'AdyenComponent';
        var mxTaxMap = COHelpers.getMxTaxMap();
        if (mxTaxMap) {
            viewData.cfdiMapJSON = mxTaxMap.cfdiMapJSON;
            viewData.regimenFiscalMapJSON = mxTaxMap.regimenFiscalMapJSON;
        }

        return next();
    }
);

module.exports = server.exports();
