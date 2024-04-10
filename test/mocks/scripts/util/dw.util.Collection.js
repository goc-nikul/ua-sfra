'use strict';

module.exports = function (array) {
    var items = [];
    if (array) {
        items = array;
    }

    this.add = function (item) {
        items.push(item);
        this.length = items.length;
    };

    this.add1 = function (item) {
        items.push(item);
        this.length = items.length;
    };

    this.push = function (item) {
        items.push(item);
        this.length = items.length;
    };

    this.iterator = function () {
        var i = 0;
        return {
            hasNext: function () {
                return i < items.length;
            },
            next: function () {
                return items[i++];
            }
        };
    };

    this.getLength = function () {
        return items.length;
    };

    this.size = function () {
        return items.length;
    };

    this.length = this.getLength();

    this.toArray = function () {
        return items;
    };
    this.remove = function (item) {
        var idx = items.indexOf(item);
        var itemFound = idx >= 0;
        if (itemFound) {
            items.splice(idx, 1);
            this.length = items.length;
        }
        return itemFound;
    };
    this.addAll = function (collection) {
        items = items.concat(collection.toArray());
        this.length = items.length;
    };

    this.contains = function (item) {
        return array.indexOf(item) >= 0;
    };

    this.map = function () {
        var args = Array.from(arguments);
        var list = args[0];
        var callback = args[1];
        if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
            list = list.toArray();
        }
        return list ? list.map(callback) : [];
    };

    this.every = function () {
        var args = Array.from(arguments);
        var list = args[0];
        var callback = args[1];
        const { length } = list;

        for (let index = 0; index < length; index += 1) {
            const value = list[index];
            if (!callback(value, index, list)) {
                return false;
            }
        }
        return true;
    };

    this.get = function (index) {
        return items[index];
    };
    this.isEmpty = function () {
        return items.length <= 0;
    };
    this.empty = function () {
        return items.length <= 0;
    };
};
