'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./product/details'));
    processInclude(require('./product/pdpInstoreInventory'));
});
