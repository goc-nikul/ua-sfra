'use strict';

const MAX_ELEMENTS_IN_ARRAY = 10000;

/**
 *
 * @param {*} elem
 * @param {Array} arr
 * @description Use this method only if elements in your array is arrays
 */
function findInArray(elem, arr) {
    let isFind = false;

    for (let i = 0; i < arr.length; i++) {
        if (isFind) {
            break;
        }

        let subArr = arr[i];
        isFind = subArr.indexOf(elem) >= 0;
    }

    return isFind;
}

/**
 *
 * @param {*} elem
 * @param {Array} arr
 * @description When you add more 20000 elements to array it call Quota api.jsArraySize.
 * This function will separate elements on more children arrays with length MAX_ELEMENTS_IN_ARRAY and Quota will not call error.
 */
function addToArray(elem, arr) {
    if (!arr.length || arr[arr.length - 1].length >= MAX_ELEMENTS_IN_ARRAY) {
        arr.push([]);
    }

    arr[arr.length - 1].push(elem);
}

/**
 * @param {Array} arr
 */
function shatterArray(arr) {
    const preparedArray = [];

    if (arr.length && arr[0] instanceof Array) {
        return arr;
    }

    if (arr.length > MAX_ELEMENTS_IN_ARRAY) {
        while (arr.length) {
            addToArray(arr.pop(), preparedArray);
        }
    } else {
        return [arr];
    }

    return preparedArray;
}

module.exports = {
    findInArray: findInArray,
    addToArray: addToArray,
    shatterArray: shatterArray
};
