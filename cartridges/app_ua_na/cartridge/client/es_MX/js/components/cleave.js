'use strict';

var baseCleave = require('base/components/cleave');

baseCleave.serializeData = function (form) {
    var serializedArray = form.serializeArray();
    return $.param(serializedArray);
};

module.exports = baseCleave;
