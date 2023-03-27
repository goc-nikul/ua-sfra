'use strict';

var preferences = require('dw/system/Site').current.preferences.custom;

module.exports = {
    catalogId: 'personlizationCatalog' in preferences ? preferences.personlizationCatalog : 'APACCatalog'
};
