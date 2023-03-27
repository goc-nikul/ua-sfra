'use strict';

const ArrayList = require('dw/util/ArrayList');
const ProductSearchModel = require('dw/catalog/ProductSearchModel');
const CatalogMgr = require('dw/catalog/CatalogMgr');
const Logger = require('dw/system/Logger').getLogger('Bazaarvoice', 'BrandHelper.js');

function getBrandList() {
	var brands = new ArrayList(); 
	brands.add("Under Armour");
	return brands;
}

module.exports = {
	getBrandList: getBrandList
};