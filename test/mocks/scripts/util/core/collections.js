'use strict';
function map() {
    var args = Array.from(arguments);
    var list = args[0];
    var callback = args[1];
    if (list && Object.prototype.hasOwnProperty.call(list, 'toArray')) {
        list = list.toArray();
    }
    return list ? list : null;
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

module.exports = {
    find: find,
    forEach: forEach,
    map: map,
    every: every
};
