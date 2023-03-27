'use strict';

var mockResponse = {
    authorization: {
        date: '2018-02-16T17:56:56.013Z',
        code: 'XI00',
        message: '[XiPay Null] Approved',
        referenceNumber: '110630231',
        referenceIndex: '18818',
        responseCode: '',
        avsCode: 'X',
        status: 'authorized'
    },
    payment: {
        type: 'CreditCardTokenized',
        cardToken: '-E803-4500-YCC46YKBPE5340',
        nameOnCard: 'Jane Doe',
        cardType: 'VISA',
        lastFour: '4500',
        ccBinRange: '366655',
        expiresMonth: '09',
        expiresYear: '2018'
    },
    external: 'external',
    internal: 'internal'
};

function call(payload) {
    return {
        object: JSON.stringify(mockResponse),
        status: 'OK',
        payload: payload
    };
}

function createDecryptService() {
    return call;
}

function exchangeTokenService() {
    return call;
}

module.exports = {
    createDecryptService: createDecryptService,
    exchangeTokenService: exchangeTokenService
};
