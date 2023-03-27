'use strict';

/* eslint-disable no-undef */

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('int_loyalty/global/global'));
    processInclude(require('int_loyalty/components/gatedEnrollment'));
});

