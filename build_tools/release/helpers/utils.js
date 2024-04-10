/**
 * @param {Array} arr 
 * @returns {Array} - Removes duplicates of elements from the array
 */
let removeDuplicates = (arr) => {
    //remove duplicates
    arr = arr.filter(function (item, pos) {
        return arr.indexOf(item) == pos;
    });

    return arr;
}

module.exports = {
    removeDuplicates
}