'use strict';

/* eslint-disable */
var Site = require('dw/system/Site');

var SEOUtilsHelper = function() {

	var self = this;
	var shopAllCategories;

	this.isShopAllCategory = function(categoryID) {
		var i = 0;

		if (!shopAllCategories) {
			try {
	            shopAllCategories = JSON.parse(Site.getCurrent().getCustomPreferenceValue('shopAllCategoriesJSON')).categoriesIDsWithGender;
	        } catch(err) {
	            shopAllCategories = [];
	        }
		}

		while (i < shopAllCategories.length) {
		      if (categoryID && shopAllCategories[i].categoryID === categoryID.toLowerCase()) {
		          return true;
		      }
		      i++;
		}

		return false;
	};

};

module.exports = new SEOUtilsHelper();