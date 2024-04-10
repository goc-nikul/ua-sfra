'use strict';
function map(collection, callback, scope) {
    var iterator = Object.hasOwnProperty.call(collection, 'iterator')
        ? collection.iterator()
        : collection;
    var index = 0;
    var item = null;
    var result = [];
    while (iterator.hasNext()) {
        item = iterator.next();
        result.push(scope ? callback.call(scope, item, index, collection)
            : callback(item, index, collection));
        index++;
    }
    return result;
}


function find() {
    var args = Array.from(arguments);
    var list = args[0];
    var callback = args[1];
    if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
        list = list.toArray();
    }
    return list ? list.find(callback) : null;
}

function forEach() {
    var args = Array.from(arguments);
    var list = args[0];
    var callback = args[1];
    if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
        list = list.toArray();
    }
    return list ? list.forEach(callback) : null;
}

function every() {
    var args = Array.from(arguments);
    var list = args[0].toArray();
    var callback = args[1];
    const { length } = list;

    for (let index = 0; index < length; index += 1) {
        const value = list[index];
        if (!callback(value, index, list)) {
            return false;
        }
    }
    return true;
}
function first() {
    var args = Array.from(arguments);
    var list = args[0];
    if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
        list = list.toArray();
    }
    return list && list.length > 0 ? list[0] : null;
}

module.exports = {
    find: find,
    forEach: forEach,
    map: map,
    every: every,
    first: first
};
