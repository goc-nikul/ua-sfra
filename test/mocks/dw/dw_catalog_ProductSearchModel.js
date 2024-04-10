'use strict';

/* eslint-disable */

var Collection = require('./dw_util_Collection');

class ProductSearchModel {
    constructor() {
        this.searchPhrase = '';
        this.categoryID = '';
        this.orderableProductsOnly = '';
        this.priceMin = '';
        this.priceMax = '';
        this.productID = '';
        this.productIDs = '';

        var variantsOne = new Collection();
        variantsOne.add(
        {
            ID: 196884789565,
            isMaster: function() {
                return false;
            },
            custom: {
                size: 'SM'
            }
        });
        variantsOne.add(
        {
            ID: 196884789367,
            isMaster: function() {
                return false;
            },
            custom: {
                size: 'MD'
            }
        });
        variantsOne.add(
        {
            ID: 196884789350,
            isMaster: function() {
                return false;
            },
            custom: {
                size: 'LG'
            }
        });

        var variantsTwo = new Collection();
        variantsTwo.add(
        {
            ID: 194513976577,
            isMaster: function() {
                return false;
            },
            custom: {
                size: 'XL'
            }
        });
        variantsTwo.add(
        {
            ID: 194513976546,
            isMaster: function() {
                return false;
            },
            custom: {
                size: 'XXL'
            }
        });
        variantsTwo.add(
        {
            ID: 194513976515,
            isMaster: function() {
                return false;
            },
            custom: {
                size: 'XXXL'
            }
        });

        this.productSearchHits = [
            {
                product: {
                    ID: 3026197,
                    isMaster: function() {
                        return true;
                    },
                    variants: variantsOne
                }
            },
            {
                product: {
                    ID: 1361033,
                    isMaster: function() {
                        return true;
                    },
                    variants: variantsTwo
                }
            }
        ];

        this.sortingRule = '';
        this.recursiveCategorySearch = false;
        this.refinementCategory = '';
        this.count = 0;
        this.hitTypeRefinement = '';
    }

    addHitTypeRefinement(hitTypeRefinement) {
        this.hitTypeRefinement = hitTypeRefinement;
    }

    setSearchPhrase(searchPhrase) {
        this.searchPhrase = searchPhrase;
    }

    setCategoryID(categoryID) {
        this.categoryID = categoryID;
        if (categoryID === 'top-gifts' || categoryID === 'ua-gift-cards') {
            this.refinements = {
                priceRefinementDefinition: {
                    displayName: 'Gifts By Price'
                }
            };
        } else {
            this.refinements = {
                priceRefinementDefinition: {
                    displayName: ''
                }
            };
        }
    }

    setOrderableProductsOnly(orderableProductsOnly) {
        this.orderableProductsOnly = orderableProductsOnly;
    }

    setProductID(productID) {
        this.productID = productID;
    }

    setProductIDs(productIDs) {
        this.productIDs = productIDs;
    }
  
    setPriceMin(priceMin) {
        this.priceMin = priceMin;
    }

    setPriceMax(priceMax) {
        this.priceMax = priceMax;
    }

    setSortingRule(sortingRule) {
        this.sortingRule = sortingRule;
    }

    setRecursiveCategorySearch(recursiveCategorySearch) {
        this.recursiveCategorySearch = recursiveCategorySearch;
    }

    setRefinementCategory(refinementCategory) {
        this.refinementCategory = refinementCategory;
    }

    search() {
        this.count = 1;
        return {
            priceRefinementDefinition: {
                displayName: 'Price'
            }
        };
    }

    getCount() {
        return 1;
    }

    getProductSearchHit(product) {
        return {
            ID: 'testProduct'
        };
    }

    getRefinements() {
        return {
            getAllRefinementDefinitions() {
                var collection = new Collection();
                collection.add(
                    {
                        attributeID: 'team',
                        displayName: 'Team'
                    }
                );
                collection.add(
                    {
                        attributeID: 'experienceType'
                    }
                );
                collection.add(
                    {
                        attributeID: 'agegroup'
                    }
                );
                collection.add(
                    {
                        attributeID: 'size'
                    }
                );
                
                return collection;
            },
            getAllRefinementValues(refinementDefinition) {
                var collection = new Collection();
                if ('displayName' in refinementDefinition && refinementDefinition.displayName === 'Price') {
                    collection.add(
                        {
                            ID: 'Price',
                            displayValue: '$0 - $25',
                            valueFrom: 0,
                            valueTo: 25
                        }
                    );
                } else {
                    var id = 'attributeID' in refinementDefinition ? refinementDefinition.attributeID : '';
                    var displayValue;

                    if (id === 'team') {
                        displayValue = 'Cubs';
                    } else if (id === 'experienceType') {
                        displayValue = 'Premium';
                    } else if (id === 'agegroup') {
                        displayValue = 'Adult';
                    } else if (id === 'size') {
                        displayValue = 'S';
                    }
                    
                    collection.add(
                        {
                            ID: id,
                            displayValue: displayValue
                        }
                    );
                }
                return collection;
            },
            getRefinementValue(refinementDefinition, attributeValue) {
                if ('displayName' in refinementDefinition && refinementDefinition.displayName === 'Price') {
                    return {
                        ID: 'Price',
                        displayValue: 'one',
                        valueFrom: 0,
                        valueTo: 25
                    };
                } else {
                    if (attributeValue === 'Team Value') {
                        return { displayValue: 'Cubs' };
                    } else if (attributeValue === 'Experience Type Value') {
                        return { displayValue: 'Premium' };
                    } else if (attributeValue === 'Age Group Value') {
                        return { displayValue: 'Adult' };
                    }
                }
            },
            getRefinementValues(refinementDefinition) {
                var collection = new Collection();
                if ('displayName' in refinementDefinition && refinementDefinition.displayName === 'Price') {
                    collection.add(
                        {
                            ID: 'Price',
                            displayValue: 'one',
                            valueFrom: 0,
                            valueTo: 25
                        }
                    );
                } else {
                    var id = 'attributeID' in refinementDefinition ? refinementDefinition.attributeID : '';
                    var displayValue;

                    if (id === 'team') {
                        displayValue = 'Cubs';
                    } else if (id === 'experienceType') {
                        displayValue = 'Premium';
                    } else if (id === 'agegroup') {
                        displayValue = 'Adult';
                    } else if (id === 'size') {
                        displayValue = 'S';
                    }
                    
                    collection.add(
                        {
                            ID: id,
                            displayValue: displayValue
                        }
                    );
                }
                return collection;
            },
            priceRefinementDefinition: {
                displayName: 'Price'
            }
        };
    }

    getSearchRedirect (queryString) {
        return {
            getLocation: function () {
                return 'some value';
            }
        };
    }

    getProductSearchHits() {
        var productSearchHits = this.productSearchHits;
        var index = 0;
        var initialLength = productSearchHits.length;
        return {
            items: productSearchHits,
            asList: function () {
                var searchHit = []
                var productData = {};
                productData.getProduct = function () {
                    var Product = require('./dw_catalog_Product');
                    return new Product();
                }
                searchHit.push(productData);
                return searchHit;
            },
            hasNext: () => {
                if (initialLength !== productSearchHits.length) {
                    initialLength = productSearchHits.length;
                    index--;
                }
                return index < productSearchHits.length;
            },
            next: () => {
                return productSearchHits[index++];
            }
        };
    }
}

module.exports = ProductSearchModel;
