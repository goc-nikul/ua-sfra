/**
 * This script creates CSV file with site inventory information
 */
'use strict';

/* API Includes */
let Logger = require('dw/system/Logger'),
	Money = require('dw/value/Money'),
 	Site = require('dw/system/Site'),
	Catalog = require('dw/catalog'),
	Util = require('dw/util'),
	IO = require('dw/io');

let productsCount : Number = 0;

function execute(params) {
	let useSearchIndex = true,
		includeOfflineVariants = false,
		skuLevel = false,
		includeZeroCounts = params.includeZeroCounts;
	if(params.productMode == 'OFFLINE_VARIANTS'){
		includeOfflineVariants = true;
	}
	if(params.productMode == 'ALL' ){
		useSearchIndex = false;
		includeOfflineVariants = true;
	}
	if(params.outputRow == 'SKU_LEVEL' ){
		skuLevel = true;
	}
	let products = getProducts(useSearchIndex);
	
	
	if(empty(products)) {
		Logger.error("InventoryHealth.js: couldn't get any products for current site");
	}

	var Parameters = {
			"exportDirectory" : params.exportDirectory, 
			"fileName" : params.fileName,
			"pricebookValue" : params.pricebookValue
	};

	if(empty(Parameters.exportDirectory) || empty(Parameters.fileName)) {
		Logger.error("InventoryHealth.js: incorrect job params configurations. Export directory and file name should be populated");
	}
	
	var siteId : String = Site.getCurrent().getID(),
		filePath : String = IO.File.IMPEX + IO.File.SEPARATOR + Parameters.exportDirectory,
		fileDir : File = IO.File(filePath).mkdirs(),
		feedFile : File = IO.File(filePath + IO.File.SEPARATOR + Parameters.fileName + siteId + ".csv");
	
	if(feedFile.exists()) {
		feedFile.remove();
		feedFile = IO.File(filePath + IO.File.SEPARATOR + Parameters.fileName + siteId + ".csv");
	}
	
	var feedFileWriter : FileWriter = IO.FileWriter(feedFile, "UTF-8");

	writeCSV(feedFileWriter, products, params.pricebookValue, useSearchIndex, includeOfflineVariants, skuLevel, includeZeroCounts);
	Logger.info("InventoryHealth.js: " + productsCount + " records has been added to feed");
	
}

function getProducts(useSearchIndex){
	if(useSearchIndex){
		var	psm : ProductSearchModel = Catalog.ProductSearchModel();
		psm.setCategoryID('root');
		psm.setRecursiveCategorySearch(true);
		psm.setOrderableProductsOnly(true);
		psm.search();
		return psm.getProductSearchHits();
	}
	else{
		let ProductMgr = require('dw/catalog/ProductMgr');
		return ProductMgr.queryAllSiteProductsSorted();
	}
}

/**
 * @description Writes product feed to file
 * 
 * @param {FileWriter}
 *            feedFileWriter - Constructs the writer for the specified file
 * @param {SeekableIterator}
 *            products - Iterator of products assigned to current site
 * @param {String}
 *            pricebookValue
 * @return {Void}
 */
function writeCSV(feedFileWriter, products, pricebookValue, useSearchIndex, includeOfflineVariants, skuLevel, includeZeroCounts) {
	
	feedFileWriter.writeLine("sep=|");
	feedFileWriter.writeLine("Catalog|Gender|Division|End Use Description|Silhouette|SubSilhouette|Gear line|Season|SAP Product Code|Product Description|SAP Material Code|Variant Code|UPC|List Price|Sale Price|Sku Count|Active Count|InActive Count|Health %|Inventory Units|Product Launch Date|Start Ship Date|Final Ship Date|pdpMainDesktop|Outlet");
	var exportedProducts = Util.ArrayList();
	
	while(products.hasNext()) {
		let product = null;
		if(useSearchIndex){
			let productSearchHit = products.next();
			if(empty(productSearchHit.firstRepresentedProduct)) continue;
			product = productSearchHit.firstRepresentedProduct.getVariationModel().getMaster();
			
		}
		else product = products.next();
		if (product == null || !product.isMaster()) continue;
		
		if(useSearchIndex){
			if (exportedProducts.indexOf(product.ID) == -1) {
				processProductData(product, feedFileWriter, pricebookValue, includeOfflineVariants, skuLevel, includeZeroCounts);
				exportedProducts.add(product.ID);
			}	
		}
		else{
			processProductData(product, feedFileWriter, pricebookValue, includeOfflineVariants, skuLevel, includeZeroCounts);	
		}
	}
	
	feedFileWriter.flush();
	feedFileWriter.close();	
}

/**
 * @description Collects feed data from product and writes it into a csv file
 * 
 * @param {Product}
 *            product
 * @param {FileWriter}
 *            feedFileWriter - Constructs the writer for the specified file
 * @param {String}
 *            pricebookValue
 * @return {Void}
 */
function processProductData(product, feedFileWriter, pricebookValue, includeOfflineVariants, skuLevel, includeZeroCounts) {
	
		let variants : Collection = product.getVariants(),
			siteId : String = Site.getCurrent().getID(),
			productDataObj = {},
			priceData;
		for each (let variant in variants) {
			
			let material = empty(variant.custom.style) ? "" : variant.custom.style + '-' + variant.custom.color,
				productData = {},
				inventoryRecord : ProductInventoryRecord = variant.getAvailabilityModel().getInventoryRecord(),
				onlineFrom = variant.onlineFrom;
			
			if (!empty(productDataObj[material])) {
				productData = productDataObj[material];
			}
			else { 
				productData = {
					"catalog" : siteId,
					"gender" : empty(product.custom.gender) ? "" : product.custom.gender,
					"division" : empty(product.custom.division) ? "" : product.custom.division,
					"endUseDescription": empty(product.custom.enduse) ? "" : product.custom.enduse,
					"gearline" : empty(product.custom.gearline) ? "" : product.custom.gearline,
					"SAPProductCode" : empty(product.custom.style) ? "" : product.custom.style,
					"SAPMaterialCode" : material,
					"silh" : empty(product.custom.silhouette) ? "" : product.custom.silhouette,
					"subSilh" : empty(product.custom.subsilhouette) ? "" : product.custom.subsilhouette,
					"season" : empty(product.custom.season) ? "" : product.custom.season,
					"description" : empty(product.name) ? "" : product.name,
					"variantCode" : null,
					"listPrice" : 0,
					"salePrice" : 0,
					"skuCount" : 0,
					"activeCount" : 0,
					"inActiveCount" : 0,
					"health" : 0,
					"inventoryUnits" : 0,
					"productLaunchDate" : null,
					"startShipDate" : null,
					"finalShipDate" : null,
					"pdpMainDesktop" : null,
					"outlet" : null
				};
			}

			if (productData.productLaunchDate == null && onlineFrom) {
				productData.productLaunchDate = Util.StringUtils.formatCalendar(Util.Calendar(onlineFrom), "yyyy-MM-dd HH:mm:ss:S");
				
			}
			if (productData.startShipDate == null) {
				productData.startShipDate = variant.custom.shipmentstartdate;
				
			}
			
			if (variant.isOnline() || includeOfflineVariants) {
				productData.skuCount ++;
				productData.variantCode = empty(variant.custom.sku) ? "" : variant.custom.sku;
				productData.pdpMainDesktop = variant.getImages('pdpMainDesktop').size() >0 ? "Y" : "N";
				productData.UPC = variant.ID;
			}
			
			if ((variant.isOnline() || includeOfflineVariants ) && variant.getAvailabilityModel().isInStock()) {
				productData.activeCount ++;
			} 
			if ((variant.isOnline() || includeOfflineVariants ) && !variant.getAvailabilityModel().isInStock()) {
				productData.inActiveCount ++;
			}
			if ((variant.isOnline() || includeOfflineVariants ) && productData.outlet == null) {
				priceData = getPriceData(variant, pricebookValue);
				productData.outlet = priceData.outlet ? "Y" : "N";
				if (productData.listPrice == 0) productData.listPrice = priceData.list;
				if (productData.salePrice == 0) productData.salePrice = priceData.sale;
			}
			productData.inventoryUnits = productData.inventoryUnits + (empty(inventoryRecord) ? 0 : inventoryRecord.ATS.value);
			// if file is being generated at the SKU level, write data to csv
			// and then reset counters to 0 for next variant
			if(skuLevel){
				if (variant.isOnline() || includeOfflineVariants ) {
					if (productData.skuCount != 0) {
						productData.health = productData.activeCount/productData.skuCount;
						productData.health = productData.health.toFixed(5);
					}
					if ((productData.activeCount > 0 && productData.inventoryUnits > 0) || includeZeroCounts) {
			    		let convertedProductData = convertProductData(productData);
			    		writeItem(convertedProductData, feedFileWriter);
					}	
				}
				productData.inventoryUnits = 0;
				productData.skuCount = 0;
				productData.activeCount = 0;
				productData.inActiveCount = 0;
				productData.list = 0;
				productData.sale = 0;
				productData.productLaunchDate = null;
			}
			//Save data for productDataObj for next variant to use
			productDataObj[material] = productData;
		}
		// If not at sku level, iterate through productData,
		// write each material to csv if data is valid
		if(!skuLevel){
			for each(let productData in productDataObj){
				if (productData.skuCount != 0) {
					productData.health = productData.activeCount/productData.skuCount;
					productData.health = productData.health.toFixed(5);
				}
				if ((productData.activeCount > 0 && productData.inventoryUnits > 0) || includeZeroCounts) {
		    		let convertedProductData = convertProductData(productData);
		    		writeItem(convertedProductData, feedFileWriter);
				}
			}
		}
}

/**
 * @description Converts product data from object to String
 * 
 * @param {Object}
 *            productData - Collected product data
 * @return {String}
 */
function convertProductData( productData : Object ) {
	var itemsArray : Array = new Array(),
		feedItems = ["catalog","gender","division","endUseDescription","silh","subSilh","gearline","season","SAPProductCode","description","SAPMaterialCode","variantCode","UPC","listPrice","salePrice","skuCount","activeCount","inActiveCount","health","inventoryUnits","productLaunchDate","startShipDate","finalShipDate","pdpMainDesktop","outlet"];

	for (let i = 0; i < feedItems.length; i++) {
		itemsArray.push(productData[feedItems[i]]);
	}
	
	return itemsArray.join("|");
}

/**
 * @description Writes line with product data
 * 
 * @param {String}
 *            productData - String with product data
 * @param {FileWriter}
 *            feedFileWriter - Constructs the writer for the specified file
 * @return {Void}
 */
function writeItem(productData : String, feedFileWriter : FileWriter) {
	feedFileWriter.writeLine(productData);
	feedFileWriter.flush();
	productsCount ++;
}

/**
 * @description Identifies if material is 'outlet' based on product prices
 * 
 * @param {Product}
 *            product - Product Model
 * @param {String}
 *            pricebookValue
 * @return {Boolean}
 */
function getPriceData (product : Product, pricebookValue : String) {
	
	var priceModel : ProductPriceModel = product.priceModel;

	if (!empty(priceModel)) {
		
		let list = priceModel.getPriceBookPrice(pricebookValue + '-list');
		let sale = priceModel.getPriceBookPrice(pricebookValue + '-sale');
		// Check that both prices exist and sale is less than list
		if (sale != null && sale != Money.NOT_AVAILABLE && list != null && list != Money.NOT_AVAILABLE) {
			if (parseFloat(sale.decimalValue) < parseFloat(list.decimalValue)) {
				return { list : list.decimalValue, sale : sale.decimalValue, outlet: true};
			}
			else return { list : list.decimalValue, sale : sale.decimalValue, outlet: false};
		}
	}
	return { list : 0.00, sale : 0.00, outlet: false};
}
module.exports.execute = execute;