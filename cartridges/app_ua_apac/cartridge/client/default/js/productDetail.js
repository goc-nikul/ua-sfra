'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('org/utils/bvDataLayer'));
    processInclude(require('org/product/wishlist'));
    processInclude(require('org/product/pdpInstoreInventory'));
    processInclude(require('org/product/productIdCookie'));
    processInclude(require('org/klarnaOsm'));
    processInclude(require('./product/memberPrice'));
});
