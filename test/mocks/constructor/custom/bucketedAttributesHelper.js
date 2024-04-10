'use strict';

var SystemObjectMgr = require('../../dw/dw_object_SystemObjectMgr');
var ProductSearchModel = require('../../dw/dw_catalog_ProductSearchModel');
var ArrayList = require('../../dw/dw.util.Collection');
var logger = require('../helpers/logger');
var CatalogMgr = require('../../../mocks/dw/dw_catalog_CatalogMgr');

function getSearchRefinements(filter, searchType, orderableOnly) {
    // create the product search model and set options
    var productSearchModel = new ProductSearchModel();

    if (!empty(orderableOnly)) {
        // we're overriding the default behavior in the else block below
        productSearchModel.setOrderableProductsOnly(orderableOnly);
    } else {
        productSearchModel.setOrderableProductsOnly(false);
    }

    if (searchType === 'product') {
        var ids = new ArrayList();

        // Filter by the product ID to match the correct refinements
        ids.add(filter.ID);
        productSearchModel.setProductIDs(ids);

        // set category as the site catalogs root category
        productSearchModel.setCategoryID(CatalogMgr.getSiteCatalog().getRoot().getID());
        productSearchModel.setRecursiveCategorySearch(true);
    } else {
        productSearchModel.setCategoryID(filter.ID);
        productSearchModel.setRecursiveCategorySearch(false);
    }

    // Execute the search
    productSearchModel.search();

    try {
        return productSearchModel.getRefinements();
    } catch (e) {
        logger.log('bucketedAttributeValues', 'error', 'productSearchModel.getRefinements() failed on ' + searchType + ' ' + filter.ID);
        return null;
    }
}

function getRefinementValues(product, attributeID, orderableOnly) {
    var refinementValues = [];

    if (!empty(product) && !empty(attributeID)) {
        // search for the product
        var refinements = getSearchRefinements(product, 'product', orderableOnly);

        if (!empty(refinements) && Object.keys(refinements).length) {
            // get search refinement definitions
            var refinementDefinitions = refinements.getAllRefinementDefinitions().toArray();

            // get search refinement definition for passed attribute
            var index = refinementDefinitions.findIndex(item => (item.attributeID === attributeID));

            if (index >= 0) {
                // get refinement values
                refinementValues = refinements.getAllRefinementValues(refinementDefinitions[index]).toArray();
            }
        }
    }

    return refinementValues;
}

function filterValue(value) {
    if (value === 'true') {
        return true;
    } else if (value === 'false') {
        return false;
    }

    return value;
}

function getAttributeValuesMap(product) {
    var attributeIDs = 'team,experienceType,agegroup'.split(',');
    var constructorKeyMap = [];

    attributeIDs.forEach(function (attributeID) {
        var def = SystemObjectMgr.describe('Product').getCustomAttributeDefinition(attributeID);
        if (!empty(def)) {
            // build map of SFCC attribute ids to Constructor keys
            if (attributeID === 'merchCollection') {
                constructorKeyMap[attributeID] = 'collection';
            } else if (attributeID === 'agegroup') {
                constructorKeyMap[attributeID] = 'ageGroup';
            } else if (attributeID === 'colorgroup') {
                constructorKeyMap[attributeID] = 'colorGroup';
            } else if (attributeID === 'fittype') {
                constructorKeyMap[attributeID] = 'fitType';
            } else if (attributeID !== 'length') {
                constructorKeyMap[attributeID] = attributeID;
            }
        } else {
            // remove attributes that dont exist in the Product object from the attributeIDs list
            logger.log('bucketedAttributeValues', 'error', 'Process tried to get a definition for attribute ' + attributeID + ' in the Product object, but the attribute does not exist. Change the name of the attribute in the Constructor_BucketedAttributeIdsToSend site preference.');
            delete attributeIDs[attributeID];
        }
    });

    var attributeValues = [];
    var refinementDefinitions;

    // search for the product and get the resulting refinements
    var productSearchRefinements = getSearchRefinements(product, 'product', null);
    if (!empty(productSearchRefinements)) {
        refinementDefinitions = productSearchRefinements.getAllRefinementDefinitions().toArray();
    }

    attributeIDs.forEach(function (attributeID) {
        // build the key
        var key = attributeID === 'length' ? 'length' : constructorKeyMap[attributeID];

        if (!empty(refinementDefinitions)) {
            if (!empty(product.custom[attributeID])) {
                // get the refinement definition for the current attribute
                var index = refinementDefinitions.findIndex(item => (item.attributeID === attributeID));

                if (index >= 0) {
                    // get the refinement values
                    var refinementValues = productSearchRefinements.getRefinementValues(refinementDefinitions[index]).toArray();

                    if (Array.isArray(refinementValues) && refinementValues.length) {
                        var values = [];

                        // filter and save refinement display values only
                        values = refinementValues
                            .filter(refinementValue => 'displayValue' in refinementValue && !empty(refinementValue.displayValue))
                            .map(refinementValue => filterValue(refinementValue.displayValue));

                        // add the array of refinement values
                        attributeValues.push({
                            key: key,
                            value: values
                        });
                    }
                }
            }
        } else {
            // if no refinement value present, get the attribute value
            var attributeValue = typeof product.custom[attributeID] === 'object' ? product.custom[attributeID].value : product.custom[attributeID];

            // add the attribute value
            attributeValues.push({
                key: key,
                value: filterValue(attributeValue)
            });
        }
    });

    return attributeValues;
}

function getPriceMap(category, searchRefinementsObj) {
    var map = [];

    if (!empty(category) && 'ID' in category && !empty(category.ID)) {
        // search for the category and get the resulting refinements
        var searchRefinements = searchRefinementsObj || getSearchRefinements(category, 'category', true);
        if (!empty(searchRefinements) && 'priceRefinementDefinition' in searchRefinements && !empty(searchRefinements.priceRefinementDefinition)) {
            // get the price buckets
            var priceValues = searchRefinements.getAllRefinementValues(searchRefinements.priceRefinementDefinition).toArray();
            priceValues.forEach(function (priceValue) {
                map.push(
                    {
                        displayName: priceValue.displayValue,
                        valueFrom: priceValue.valueFrom,
                        valueTo: priceValue.valueTo
                    }
                );
            });
        }
    }
    return map;
}

function isDisplayName(type, displayName) {
    if (!empty(type) && !empty(displayName)) {
        if (type === 'price') {
            // custom price refinement display names
            var names = [
                'gifts by price',
                'cadeaux par prix'
            ];

            // check to see if the passed displayName matches any of the refinement display names
            for (var i = 0; i < names.length; ++i) {
                if (names[i] === displayName.toLowerCase()) {
                    return true;
                }
            }
        }
    }

    return false;
}

function buildSizeList(product, sizeList) {
    // get size attribute value
    var sizeAttr = product.custom.size;

    // get search refinement values
    var refinementValues = getRefinementValues(product, 'size', true);

    refinementValues.forEach(function (value) {
        if ('displayValue' in value) {
            var displayValue = value.displayValue.toString();

            if (sizeList[displayValue]) {
                // check for dup attribute value
                var index = sizeList[displayValue].findIndex(item => (item === sizeAttr));

                // if not a dup, add attribute value to list
                if (index === -1) {
                    sizeList[displayValue].push(sizeAttr);
                }
            } else {
                // create list for this refinement value and add attribute value to list
                sizeList[displayValue] = [sizeAttr];
            }
        }
    });

    return sizeList;
}

function getSizeList(parameters) {
    var productsGetter = require('../../../mocks/constructor/getters/products');

    // get all orderable products
    var productGetterModel = productsGetter.getProducts(parameters);
    var productSearchHits = productGetterModel.productSearchHits;

    var sizeList = {};

    while (productSearchHits.hasNext()) {
        var hit = productSearchHits.next();

        // only process variants or simple products since master products are not relevant here
        var products = hit.product.isMaster() ? hit.product.variants.toArray() : [hit.product];

        products.forEach(function (product) {
            // get attribute and search refinement values for this product
            sizeList = buildSizeList(product, sizeList);
        });
    }

    return sizeList;
}

function getDisplayNamesMap(category, facets) {
    if (!empty(facets)) {
        facets.changeMade = false;
        // search for the category and get the resulting refinements
        var searchRefinements = getSearchRefinements(category, 'category', null);
        if (!empty(searchRefinements)) {
            var refinementDefinitions = searchRefinements.getAllRefinementDefinitions().toArray();
            if (!empty(refinementDefinitions)) {
                facets.forEach(function (facet) {
                    // get the index for the refinement definition with the matching attribute(facet)
                    var index = refinementDefinitions.findIndex(item => (item.attributeID.toLowerCase() === facet.name.toLowerCase()));
                    if (index >= 0 && !empty(refinementDefinitions[index].displayName) && refinementDefinitions[index].displayName !== facet.display_name) {
                        // add categoryOverrides property if it doesnt exist
                        if (!('categoryOverrides' in facet.data)) {
                            facet.data.categoryOverrides = {};
                        }

                        // add refinement display name and category id
                        facet.data.categoryOverrides[category.ID] = refinementDefinitions[index].displayName;

                        // record that a change has been made to the facet array
                        facets.changeMade = true;
                    }
                });
            }
        }
    }

    return facets;
}

module.exports = {
    getSearchRefinements: getSearchRefinements,
    getAttributeValuesMap: getAttributeValuesMap,
    getPriceMap: getPriceMap,
    isDisplayName: isDisplayName,
    buildSizeList: buildSizeList,
    getSizeList: getSizeList,
    getDisplayNamesMap: getDisplayNamesMap
};