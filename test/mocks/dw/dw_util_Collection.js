'use strict';

class Collection {
    constructor(items) {
        this.items = items ? [items] : [];
        this.empty = !!this.items.length;
        this.length = this.items.length;
        this.size = function () {
            return this.items.length;
        };
    }

    toArray() {
        return this.items;
    }

    iterator() {
        var index = 0;
        return {
            items: this.items,
            hasNext: () => {
                return index < this.items.length;
            },
            next: () => {
                return this.items[index++];
            }
        };
    }

    add(item) {
        this.items.push(item);
        this.empty = !!this.items.length;
        this.length = this.items.length;
    }

    remove(item) {
        var index = this.items.findIndex(function(obj) {
            return JSON.stringify(obj) === JSON.stringify(item);
        });
        
        if (index !== -1) {
            this.items.splice(index, 1);
        }

        this.empty = !!this.items.length;
        this.length = this.items.length;
    }
}

module.exports = Collection;
