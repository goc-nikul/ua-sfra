'use strict';

var base = module.superModule;

/**
* @DEPRECATED
* !!!! Deprecated do not use.
* !!!! Find decimal values to use instead of cleaning string.
* Returns a stringed decimal version of formatted money
* Example: '$4.00' to '4.00'
* Example: '$1.000,00 CAD' to '1,000.00'
* @param {string} dirtyValue $4.00'
* @returns {string} '4.00'
*/
function cleanMoney(dirtyValue) {
    /** USD or CDN to decimal **/
    const clean = dirtyValue.replace(/[^0-9.,]/g, ''); // removes currency letters
    const length = clean.length;
    if ((clean[length - 3] === ',') || (clean[length - 4] === '.')) {
        // '1.356,80' to '1,356.80' or 1
        return clean.replace(/,/g, '_').replace(/\./g, ',').replace(/_/g, '.');
    }
    return clean;
}


base.cleanMoney = cleanMoney;
module.exports = base;
