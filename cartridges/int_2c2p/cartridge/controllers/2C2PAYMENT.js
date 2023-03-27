'use strict';

var server = require('server');

var logger = require('*/cartridge/scripts/logs/2c2p');
var twoCp2Pref = require('*/cartridge/scripts/config/2c2Prefs');
var c2pHelper = require('*/cartridge/scripts/helpers/2c2pHelper');
var OrderMgr = require('dw/order/OrderMgr');

server.post('HandleReturnResponse', function (req, res, next) {
    var order = null;
    try {
        var payload = req.form.paymentResponse;
        logger.writelog(logger.LOG_TYPE.DEBUG, 'HandleReturnResponse: ' + payload);
        var paylaodDecode = require('dw/util/StringUtils').decodeBase64(payload);
        var resp = JSON.parse(paylaodDecode);

        var configuration2C2P = (twoCp2Pref.configuration2C2P) ? JSON.parse(twoCp2Pref.configuration2C2P) : null;
        var successRespCode = configuration2C2P ? configuration2C2P.returnresponsecode : ['2000', '2001'];
        if (successRespCode.indexOf(resp.respCode) === -1) throw new Error('Invalid Transaction code');

        order = OrderMgr.getOrder(resp.invoiceNo);
        if (!order) throw new Error('Order Not found');

        require('dw/system/Transaction').wrap(() => order.addNote('FrontEndNotification', paylaodDecode));

        var redirectURL = c2pHelper.getRedirectURL(order);
        if (!redirectURL) throw new Error('Unknown order status');
        res.redirect(redirectURL);
    } catch (e) {
        logger.writelog(logger.LOG_TYPE.ERROR, e.message + '\n' + e.stack);
    }
    return next();
});

server.post('HandleReturnResponseBE', function (req, res, next) {
    try {
        var responseBody = JSON.parse(req.body).payload;
        logger.writelog(logger.LOG_TYPE.DEBUG, 'HandleReturnResponseBE: ' + req.body);
        var response = JSON.parse(c2pHelper.decrypt(responseBody));

        var order = OrderMgr.getOrder(response.invoiceNo);
        if (!order) throw new Error('Order Not found');
        require('dw/system/Transaction').wrap(() => order.addNote('BackEndNotification', JSON.stringify(response)));

        if (!c2pHelper.updateOrderDetails(response)) throw new Error('Failed to update order Details ' + response.invoiceNo);
        res.json({ status: 'success' });
    } catch (e) {
        logger.writelog(logger.LOG_TYPE.ERROR, e.message + '\n' + e.stack);
    }
    return next();
});

module.exports = server.exports();
