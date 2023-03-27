'use strict';

function call() {
    return {
        status: 'OK'
    };
}

function getResponse() {
    return {
        classification: 'RESIDENTIAL',
        status: 'OK'
    };
}

function getType() {
    return call;
}

module.exports = {
    getType: getType,
    getResponse: getResponse
};
