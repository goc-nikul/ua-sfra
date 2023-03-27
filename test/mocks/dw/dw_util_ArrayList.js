'use strict';

class ArrayList extends Array {
    contains(data) {
        return this.includes(data);
    }
}

module.exports = ArrayList;
