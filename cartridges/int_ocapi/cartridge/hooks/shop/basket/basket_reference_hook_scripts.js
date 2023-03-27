/**
 * basket_reference_hook_scripts.js
 *
 * Handles OCAPI hooks for basket calls
 */

exports.afterPOST = function (source, basket) {
    var basketHooks = require('./basket_hook_scripts');

    return basketHooks.afterPOST(basket);
};
