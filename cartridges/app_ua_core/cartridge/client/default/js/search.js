'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    if (window.location.href.indexOf('start=') !== -1) {
        $('.js-grid_footer button.triggerMore').removeClass('triggerMore');
    }
    setTimeout(function () {
        $('body .js-grid_footer button.triggerMore').click();
    }, 1000);
    processInclude(require('./search/search'));
});
