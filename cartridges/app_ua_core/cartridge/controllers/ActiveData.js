'use strict';

var server = require('server');
var ProductMgr = require('dw/catalog/ProductMgr');
var log = require('dw/system/Logger').getLogger('ActiveData');

/**
 * Creates a compact "digest" of information from ProductActiveData for use on the front end.
 * @param {Product} product - The Product for which to retrieve ProductActiveData
 * @returns {{pid: string, pid: string, soldToday: number, viewedToday: number}} - digest
 */
function getActiveDataDigest(product) {
    var master = product.isVariant() ? product.getVariationModel().getMaster() : product;
    var activeData = master.getActiveData();

    var digest = {
        pid: master.getID(), // master pid
        vpid: product.getID(), // variation pid, just in case
        soldToday: activeData.getUnitsDay(), // data should be for master
        viewedToday: activeData.getViewsDay() // data should be for master
    };
    return digest;
}

/**
 * Builds the ActiveData digest object that we pass back to the front end.
 * @param {string} productId - Specifies product to retrieve data for.
 * @returns {{pid: string, pid: string, soldToday: number, viewedToday: number}} - digest
 */
function getDigest(productId) {
    try {
        var product = ProductMgr.getProduct(productId);
        var digest = getActiveDataDigest(product);
        return digest;
    } catch (e) {
        log.error(e);
        return {
            soldToday: 0,
            viewedToday: 0,
            error: e.toString()
        };
    }
}

server.get('Product', function (req, res, next) {
    var productId = req.querystring.pid; // Used for error logging in catch below.
    log.info('Finding Product Active Data for product {0}', productId);
    try {
        var digest = getDigest(productId);
        res.json(digest);
    } catch (e) {
        log.error('Error while retrieving ProductActiveData for {0}: {1} {2}', productId, e.message, e.stack);
        log.error(e);
        res.setStatusCode(410);
        res.render('error/notFound');
    }
    next();
});

module.exports = server.exports();
