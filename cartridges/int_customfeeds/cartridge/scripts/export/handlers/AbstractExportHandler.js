'use strict';

/* Script Modules */
var Class = require('~/cartridge/scripts/util/Class').Class;

// Hack, because vars cannot be imported in DW, only functions
module.exports.getAbstractExportHandler = function() {
	return AbstractExportHandler;
}

var AbstractExportHandler = Class.extend(
/** @lends AbstractExportHandler.prototype */
{
	/**
	 * Creates a new handler instance 
	 * Implementing classes need to set this.handlesXXX to indicate to the manager which methods are handled.
	 *
	 * @constructs
	 */
	init: function(){
		this.handlesMasters = false;
		this.handlesProducts = false;
		this.handlesCategories = false;
		this.handlesCategoryAssignments = false;
		// open file writer here
	},
	/**
	 * Handles a master product, called once per master
	 *
	 * @param {dw.catalog.Product} product The product to export
	 */
	exportMaster: function (product) {
	},
	/**
	 * Handles a (non-master) product, called once per product
	 *
	 * @param {dw.catalog.Product} product The product to export
	 */
	exportProduct: function (product) {
	},
	/**
	 * Handles a category, the category tree is traversed recursively
	 *
	 * @param {dw.catalog.Category} category The category to export
	 */
	exportCategory: function (category) {
	},
	/**
	 * Handles a category assignment
	 *
	 * @param {dw.catalog.Category} category The category to export
	 */
	exportCategoryAssignment: function(pca) {
	},
	/**
	 * Called once at the begin of the export, initialize Writers here
	 */
	beginExport: function() {
	},
	/**
	 * Called once at the end of the export, close all resources like Writers here
	 */
	endExport: function() {
	}
});