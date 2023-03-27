'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./account/account'));
    processInclude(require('./utils/bvDataLayer'));
    if ($('.validatePhoneField').length > 0) {
        $('.validatePhoneField').trigger('keyup');
    }
});
