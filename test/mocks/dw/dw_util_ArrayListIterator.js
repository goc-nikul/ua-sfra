'use strict';

// Iterator method copied from Collection
class ArrayList {
    constructor(items) {
        this.items = items ? [items] : [];
        this.empty = !!this.items.length;
        this.length = this.items.length;
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

    push(item) {
        this.items.push(item);
        this.length = this.items.length;
        this.empty = !!this.items.length;
    }

    add(item) {
        this.items.push(item);
        this.length = this.items.length;
        this.empty = !!this.items.length;
    }
}

module.exports = ArrayList;
