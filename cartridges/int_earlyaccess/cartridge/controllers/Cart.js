/* globals empty, session */

'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('AddProduct', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var earlyAccessHelpers = require('*/cartridge/scripts/helpers/earlyAccessHelpers');
    var product = ProductMgr.getProduct(req.form.pid);
    if (product) {
        var earlyAccessObj = earlyAccessHelpers.checkEarlyAccess(product);
        if ((earlyAccessObj.isEarlyAccessProduct && !earlyAccessObj.isEarlyAccessCustomer) || earlyAccessObj.hideProduct) {
            var URLUtils = require('dw/web/URLUtils');
            res.json({
                error: true,
                pdpRedirect: URLUtils.url('Product-Show', 'pid', req.form.pid).toString()
            });
            this.emit('route:Complete', req, res);
            return;
        }
    }
    next();
});

module.exports = server.exports();
