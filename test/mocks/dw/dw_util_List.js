'use strict';

let Collection = require('../../mocks/dw/dw_util_Collection');

class List {
    constructor(items) {
        return new Collection(items);
    }
}

module.exports = List;
