'use strict';

class SeekableIterator {
    constructor(items) {
        this.items = items || [];
        this.count = this.items.length;
        this.index = 0;
    }

    getCount() {
        return this.items.length;
    }
    hasNext() {
        return this.items && this.index < this.items.length;
    }
    next() {
        var result;
        if (this.items && this.index < this.items.length) {
            result = this.items[this.index];
            this.index = this.index + 1;
            return result;
        }
        throw new Error('SeekableIterator has no more elements');
    }
    close() {
        return true;
    }
}

module.exports = SeekableIterator;
