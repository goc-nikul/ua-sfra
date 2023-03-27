'use strict';

var base = module.superModule;
var Site = require('dw/system/Site');
var preferences = Site.current.preferences.custom;

base.qasProvinceMapping = 'qasProvinceMapping' in preferences ? preferences.qasProvinceMapping : null;

module.exports = base;
