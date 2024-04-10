'use strict';

function getPriceBook(priceBookID) {
    return priceBookID === 'USD-list' || priceBookID === 'USD-sale' ? {
        getID() {
            return priceBookID;
        }
    } :
    null;
}

module.exports = {
    getPriceBook: getPriceBook
};
