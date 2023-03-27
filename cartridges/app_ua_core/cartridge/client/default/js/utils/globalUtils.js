'use strict';

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
    viewPort: isInViewPort
};
