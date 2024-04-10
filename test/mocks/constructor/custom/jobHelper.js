'use strict';

function updateIngestionStrategy(parameters) {
    if (parameters.DataType === 'product') {
        return parameters.Strategy;
    } else if (parameters.DataType === 'inventory') {
        return parameters.Strategy;
    } else if (parameters.DataType === 'category') {
        return parameters.Strategy;
    }
}

module.exports = {
    updateIngestionStrategy
};
