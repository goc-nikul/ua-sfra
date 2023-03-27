'use strict';
var base = module.superModule;

var AddressGet = require('*/cartridge/scripts/QASActions/actions/AddressGet');
var AddressSearch = require('*/cartridge/scripts/QASActions/actions/AddressSearch');

base.get = new AddressGet();
base.search = new AddressSearch();
module.exports = base;
