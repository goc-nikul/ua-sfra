'use strict';

class HashMap extends Map {
    put(key, data) {
        return this.set(key, data);
    }
}

module.exports = HashMap;
