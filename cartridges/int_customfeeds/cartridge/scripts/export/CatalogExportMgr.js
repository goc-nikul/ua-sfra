'use strict';

let ProductSearchModel = require('dw/catalog/ProductSearchModel'),
    CatalogMgr = require('dw/catalog/CatalogMgr'),
    ProductMgr = require('dw/catalog/ProductMgr'),
    ArrayList = require('dw/util/ArrayList'),
    Logger = require('dw/system/Logger');

const PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
const MAX_ELEMENTS_IN_ARRAY = 10000;
// Hack, because vars cannot be imported in DW, only functions
module.exports.getCatalogExportMgr = function() {
    return CatalogExportMgr;
}

/**
 * Create a CatalogExportmanager instance to export the catalog.
 *
 * Register new handlers by calling registerExportHandler(handler).
 */
function CatalogExportMgr() {
    this.logger = Logger.getLogger('GlobalFeedExport', 'GlobalFeedExport');
    this.exportMasters = true;
    this.exportProducts = false;
    this.variationsOnly = false;
    this.exportCategories = false;
    this.exportProductCategoryAssignments = false;
    this.handlers = [];
    this.statistics = {
        categories: 0,
        products: 0,
        masters: 0,
        categoryAssignments: 0
    };
    this.isLoyaltyEnable = PreferencesUtil.getValue('isLoyaltyEnable');

    this.productSearchModel = new ProductSearchModel();
}


CatalogExportMgr.prototype = {
    /**
     * Registers a new export handler which needs to be a subclass of AbstractExportHandler.
     */
    registerExportHandler: function(handler) {
        this.handlers.push(handler);
        this.exportMasters = this.exportMasters || handler.handlesMasters;
        this.exportProducts = this.exportProducts || handler.handlesProducts;
        this.variationsOnly = this.variationsOnly || handler.variationsOnly;
        this.exportCategories = this.exportCategories || handler.handlesCategories;
        this.feed = this.feed || handler.feedConfig.feed;
        this.exportProductCategoryAssignments = this.exportProductCategoryAssignments || handler.handlesCategoryAssignments;
    },
    /**
     * Runs the export and notifies all registered handlers for all products, catagories etc.
     */
    runExport: function() {
        this.handleBeginExport();
        let rootCategory = CatalogMgr.getSiteCatalog().getRoot();
        this.handleCategories(rootCategory);
        
        //We should iterate all products not relative to each category
        //because product can be assigned to more than 1 category and then duplication appear
        if (this.exportMasters || this.exportProducts) {
            this.handleProducts(rootCategory) 
        };
        this.handleEndExport();
    },
    handleCategories: function(category) {
        if (category == null || !category.isOnline()) {
            return;
        }
        if (this.exportCategories) {
            this.handleCategory(category);
        }
        if (this.exportProductCategoryAssignments) {
            this.handleProductCategoryAssignments(category);
        }
        //if (this.exportProducts) { this.handleProducts(category) };
        for each (let cat in category.subCategories) {
            this.handleCategories(cat);
        }
    },
    
    handleProducts: function(category) {
        // do search and handle products (and assignements)
        // when we encounter a new master we  call handleMaster

        if (this.feed === 'Primary') {
            var orderableProductHits = ProductMgr.queryAllSiteProducts();
            var ap = orderableProductHits.count;
        } else {
            // search for available products
            this.productSearchModel.setCategoryID(category.ID);
            this.productSearchModel.setOrderableProductsOnly(true);
            this.productSearchModel.setRecursiveCategorySearch(true);
            this.productSearchModel.search();
            var orderableProductHits = this.productSearchModel.getProductSearchHits();
            var ap = this.productSearchModel.count;
        }

        this.logger.info('Handle category ' + category.ID + ' with '+ap+' products.');

        let exportedProducts = [];
        while (orderableProductHits.hasNext()) {
            let master = null;

            if (this.feed === 'Primary') {
                var productHit = orderableProductHits.next();

                if (!productHit.master) {
                    continue;
                }

                master = productHit;

            } else {
                var productHit = orderableProductHits.next();

                //Used to get master items from search hit
                if (productHit.firstRepresentedProduct.variant) {
                    master = productHit.firstRepresentedProduct.getMasterProduct();
                } else {
                    master = productHit.firstRepresentedProduct;
                }
            }

            //Skip loyalty master products
            if (this.isLoyaltyEnable 
                && !empty(master) 
                && 'isLoyaltyExclusive' in master.custom 
                && master.custom.isLoyaltyExclusive) {
                continue;
            }

            if (this.exportMasters && master != null && !findInArray(master.ID, exportedProducts)) {
                addToArray(master.ID, exportedProducts);

                if (!this.variationsOnly) {
                    this.handleProduct(master);
                }

                let variants = master.getVariants();
                for each(let productVariant in variants) {
                    let isLoyaltyVariant = this.isLoyaltyEnable
                                            && !empty(productVariant)
                                            && 'isLoyaltyExclusive' in productVariant.custom
                                            && productVariant.custom.isLoyaltyExclusive;
                    if (!productVariant.online && this.feed != 'Primary' || isLoyaltyVariant) {
                        continue;
                    }

                    this.handleProduct(productVariant);
                }
            }
        }
    },
    
    /**
     * Handles a model (called once per model)
     *
     * @param {dw.catalog.Product} master The master representing the model
     */
    handleMaster: function(master, product) {
        for each (var handler in this.handlers) {
            handler.exportMaster(master, product);
            //delete handler;
            handler = null;
        };
        this.statistics.masters++;
    },
    
    /**
     * Handles product
     * @param {dw.catalog.Product} product
     */
    handleProduct: function(product){
        for each (let handler in this.handlers) {
            handler.exportProduct(product);
            //delete handler;
            handler = null;
        }
        this.statistics.products++;
    },
    
    /**
     * Handles a category
     * @param {dw.catalog.Category} category
     */
    handleCategory: function(category){
        for each (let handler in this.handlers) {
            handler.exportCategory(category);
            //delete handler;
            handler = null;
        }
        this.statistics.categories++;
    },
    
    /**
     * Handles category assignments
     * @param {dw.catalog.Category} category
     */
    handleProductCategoryAssignments: function(category){
        
        // TODO write functional for this function
        /*
        this.handlers.forEach(function(handler){
            handler.exportCategoryAssignments(pca);
        });
        */
        this.statistics.categoryAssignments++;
    },
    
    handleBeginExport: function(){
        for each (let handler in this.handlers) {
            handler.beginExport();
            //delete handler;
            handler = null;
        }
    },
    handleEndExport: function(){
        for each (let handler in this.handlers) {
            handler.endExport();
            //delete handler;
            handler = null;
        }
        let msg = 'Export done (categories processed: ' + this.statistics.categories + ', masters processed: ' + this.statistics.masters + ', products processed: ' + this.statistics.products + ')';
        this.logger.info(msg);
    }
}

function findInArray(elem, arr) {
	let isFind = false;
  
  for (let i = 0; i < arr.length; i++) {
  	if (isFind) {
      break;
    }
    
    let subArr = arr[i];  
    isFind = subArr.indexOf(elem) >= 0;
  }
  
  return isFind;
}

function addToArray(elem, arr) {
	if (!arr.length || arr[arr.length - 1].length >= MAX_ELEMENTS_IN_ARRAY) {
  	arr.push([]);
  }
  
  arr[arr.length - 1].push(elem);
}