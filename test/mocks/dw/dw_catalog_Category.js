'use strict';

var Collection = require('./dw_util_Collection');

class Category {
    constructor() {
        this.custom = {
            hideInMobileNavigation: false
        };
        this.ID = 'testID';
        this.displayName = 'testDisplayName';
        this.subcategories = new Collection();
    }

    getID() {
        return this.ID;
    }

    getDisplayName() {
        return this.displayName;
    }

    hasOnlineSubCategories() {
        return !!this.subcategories.length;
    }

    getOnlineSubCategories() {
        return this.subcategories;
    }

    hasOnlineProducts() {
        return true;
    }
}

module.exports = Category;
