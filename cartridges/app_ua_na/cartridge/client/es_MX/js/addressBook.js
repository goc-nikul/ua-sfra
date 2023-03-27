'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./addressBook/addressBook'));
    if ($('div[data-is-legendsoft]').data('is-legendsoft')) processInclude(require('legendsoft/checkout/suggestions'));
});
