'use strict';

var processInclude = require('base/util');
var layout = require('org/layout').init();

$(document).ready(function () {
    processInclude(require('org/account'));

    if ($('.memberson-points-summary').length) {
        if (layout.isAndroid()) {
            $('.apple-app').addClass('d-none');
        }
        if (layout.isIOS() || (navigator.platform === 'MacIntel' && layout.getMode() !== 'large')) {
            $('.android-app').addClass('d-none');
        }
    }
});
