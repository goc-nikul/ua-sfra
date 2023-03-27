'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./utils/bvDataLayer'));
    processInclude(require('./product/wishlist'));
    processInclude(require('./product/pdpInstoreInventory'));
    processInclude(require('./product/productIdCookie'));
    processInclude(require('./klarnaOsm'));
});
