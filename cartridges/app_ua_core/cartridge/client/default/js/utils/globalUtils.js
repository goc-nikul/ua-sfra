'use strict';

/**
 * @description estend global classes
 */
function init() {
    // extend String in order to use resources with {0} {1} etc.
    // eslint-disable-next-line no-extend-native
    String.prototype.supplant = function (obj) {
        return this.replace(/{([^{}]*)}/g, (a, b) => ['string', 'number'].indexOf(typeof obj[b]) > -1 ? obj[b] : a);
    };
}

/**
 * @description Check if element is visible.
 * @param {string} element - selector
 * @return {boolean} Returns boolean based on if element is visible
 */
function isInViewPort(element) {
    const rect = document.querySelector(element).getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}
module.exports = {
    init: init,
    viewPort: isInViewPort
};
