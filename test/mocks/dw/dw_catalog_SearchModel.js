'use strict';

class SearchModel {
    constructor() {
        this.refinements = {};
    }

    addRefinementValues(key, value) {
        this.refinements[key] = value;
    }
}

module.exports = SearchModel;
