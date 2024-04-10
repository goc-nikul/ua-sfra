'use strict';
/*
 * API Includes
 */
const firstDataPreferences = require('~/cartridge/scripts/firstDataPreferences');
const firstDataService = require('~/cartridge/scripts/services/firstDataService');
const Resource = require('dw/web/Resource');
const Logger = require('dw/system/Logger').getLogger('FirstData', 'FirstData');
const authTokenService = firstDataService.createAuthTokenService();
const createGraphQLService = firstDataService.createGraphQLService();
const defaultErrorMessage = Resource.msg('firstData.service.response.code.default', 'firstData', 'Something went wrong!');
const FirstDataAuthTokenHelper = require('~/cartridge/scripts/firstDataAuthTokenHelper');
const tokenHelper = new FirstDataAuthTokenHelper();

/**
 * Empty check for all the required site preferences.
 * @param {void} void - no parameter required.
 * @returns {boolean} returns true if all the required preferences are set, else false.
 */
function validateRequiredSitePreferences() {
    if (empty(firstDataPreferences.clientId) ||
        empty(firstDataPreferences.clientSecret) ||
        empty(firstDataPreferences.audience) ||
        empty(firstDataPreferences.grantType) ||
        empty(firstDataPreferences.authHostname)
    ) {
        return false;
    }
    return true;
}
/**
 * Returns error message per response code.
 * @param {Object} serviceResponseErrors object
 * @returns {string} Returns error message per response code.
 */
function handleErrorResponseCodes(serviceResponseErrors) {
    try {
        const responseCode = serviceResponseErrors[0].extensions.responseCode;
        return Resource.msg('firstData.service.response.code.' + responseCode, 'firstData', Resource.msg('firstData.service.response.code.default', 'firstData', 'Something went wrong!'));
    } catch (e) {
        Logger.warn('Error while fetching response code from service response. :: {0}', e.message);
    }
    return Resource.msg('firstData.service.response.code.default', 'firstData', 'Something went wrong!');
}
/**
 * Service response success status check.
 * @param {Object} serviceResponse - service response object.
 * @returns {boolean} returns true if service response status is OK and status code is 200, else false.
 */
function validateServiceResponse(serviceResponse) {
    if (serviceResponse && serviceResponse.status === 'OK' && serviceResponse.object && serviceResponse.object.statusCode === 200) {
        return true;
    }
    return false;
}
/**
 * Makes service call to get access token.
 * @param {void} void - no parameter required.
 * @returns {string} returns "accessToken" if there is no error in service call, else null.
 */
function getAuthAccessToken() {
    if (!validateRequiredSitePreferences()) {
        Logger.error('Error in firstDataHelper.js -> getAuthAccessToken() | All required site preferences are not set.');
        return null;
    }
    const params = {
        requestBody: {
            client_id: firstDataPreferences.clientId,
            client_secret: firstDataPreferences.clientSecret,
            audience: firstDataPreferences.audience,
            grant_type: firstDataPreferences.grantType
        },
        authHostname: firstDataPreferences.authHostname
    };
    var responseText = authTokenService.call(params);
    return responseText;
}
/**
 * Compares cached giftCards in order to reduce number of calls
 * @param {Object[]} giftCards Array of gift card objects
 * @returns {Object[]|null} cachedGiftCardsResponse
 */
function getCachedGC(giftCards) {
    if (!empty(session.privacy.giftCards) && !empty(session.privacy.giftCardsResponse)) {
        try {
            var cachedGC = JSON.parse(session.privacy.giftCards);
            // Cards can have different order, but a single card must be identical to cached version
            var isCached = (giftCards.length === cachedGC.length) &&
                            giftCards.every(function (card) {
                                return cachedGC.some(function (cachedCard) {
                                    return JSON.stringify(card) === JSON.stringify(cachedCard);
                                });
                            });
            if (isCached) {
                var cachedGiftCardsResponse = JSON.parse(session.privacy.giftCardsResponse);
                return cachedGiftCardsResponse;
            }
        } catch (e) {
            delete session.privacy.giftCards;
            delete session.privacy.giftCardsResponse;
        }
    }
    return null;
}
/**
 * Makes service call to generate new gift card number.
 * @param {number} amount - gift card amount.
 * @param {string} orderNo - The order number for the giftcard purchase order
 * @param {string} customerEmail - The customer email from the giftcard purchase order
 * @returns {Object} returns generated gift card data if there is no error in gc service.
 * Example Response
 *  {
 *     success : true,
 *	   errorMessage : '',
 *	   giftCardData : {
 *        "cardNumber": "7777007069967974",
 *        "pin": "91260152",
 *        "currentBalance": 100,
 *        "cardClass": 190,
 *        "transactionNumber": "712958"
 *     }
 *  }
 *
 */
function generateGiftCard(amount, orderNo, customerEmail) {
	// FIXME: Nothing appears to call this function. Can it be removed?
    const giftCardResponse = {
        success: false,
        errorMessage: defaultErrorMessage,
        giftCardData: null
    };
    try {
        if (!empty(amount) && amount > 0) {
            const accessToken = tokenHelper.getValidToken().accessToken;
            if (empty(accessToken) || empty(firstDataPreferences.graphQLApiUrl)) {
                Logger.error('Error in firstDataHelper.js -> generateGiftCard() | Access token or GraphQL API URL is null.');
                return giftCardResponse;
            }
            const params = {
                requestBody: {
                    query: 'mutation($activateGiftCard: GiftCardActivationInput!) {\n activateGiftCard(input: $activateGiftCard) {\n cardNumber\n pin\n currentBalance\n cardClass\n transactionNumber\n }\n }',
                    variables: {
                        activateGiftCard: {
                            amount: parseFloat(amount),
                            date: new Date().toISOString(),
                            orderNumber: orderNo,
                            email: customerEmail
                        }
                    }
                },
                token: accessToken,
                graphQLApiUrl: firstDataPreferences.graphQLApiUrl
            };
            const serviceResponse = createGraphQLService.call(params);
            if (validateServiceResponse(serviceResponse)) {
                const responseText = JSON.parse(serviceResponse.object.text);
                if (responseText.data && responseText.data.activateGiftCard) {
                    giftCardResponse.errorMessage = null;
                    giftCardResponse.success = true;
                    giftCardResponse.giftCardData = responseText.data.activateGiftCard;
                } else if (!empty(responseText.errors)) {
                    giftCardResponse.errorMessage = handleErrorResponseCodes(responseText.errors);
                }
            }
        }
    } catch (e) {
        Logger.error('Error while generating GC number. :: {0}', e.message);
    }
    return giftCardResponse;
}
/**
 * Makes service call to check gift card balance.
 * @param {string} gcNumber - gift card number.
 * @param {string} gcPin - gift card pin.
 * @returns {Object} returns gc balance if there is no error in gc service and gc number and pin are valid.
 * Example Response
 *  {
 *     "success": true,
 *     "errorMessage": null,
 *     "giftCardData": {
 *         "cardNumber": "7777007069967974",
 *         "currentBalance": 50,
 *         "cardClass": 190
 *     }
 *  }
 *
 */
function checkBalance(gcNumber, gcPin) {
    const giftCardResponse = {
        success: false,
        errorMessage: defaultErrorMessage,
        giftCardData: null
    };
    try {
        if (!empty(gcNumber) && !empty(gcPin)) {
            const accessToken = tokenHelper.getValidToken().accessToken;
            if (empty(accessToken) || empty(firstDataPreferences.graphQLApiUrl)) {
                Logger.error('Error in firstDataHelper.js -> checkBalance() | Access token or GraphQL API URL is null.');
                return giftCardResponse;
            }
            const params = {
                requestBody: {
                    query: 'query($giftCard: GiftCardSearchInput!) {\n giftCard(input: $giftCard) {\n cardNumber\n currentBalance\n cardClass\n }\n }',
                    variables: {
                        giftCard: {
                            cardNumber: gcNumber,
                            pin: gcPin
                        }
                    }
                },
                token: accessToken,
                graphQLApiUrl: firstDataPreferences.graphQLApiUrl
            };
            const serviceResponse = createGraphQLService.call(params);
            if (validateServiceResponse(serviceResponse)) {
                const responseText = JSON.parse(serviceResponse.object.text);
                if (responseText.data && responseText.data.giftCard) {
                    giftCardResponse.success = (responseText.data.giftCard.currentBalance !== 0);
                    giftCardResponse.errorMessage = responseText.data.giftCard.currentBalance === 0 ? Resource.msg('giftcards.apply.insufficient.balance', 'giftcards', 'Insufficient balance.') : '';
                    giftCardResponse.giftCardData = responseText.data.giftCard;
                    giftCardResponse.giftCardData.currentBalance = parseFloat((giftCardResponse.giftCardData.currentBalance) || 0, 10).toFixed(2);
                } else if (!empty(responseText.errors)) {
                    giftCardResponse.errorMessage = handleErrorResponseCodes(responseText.errors);
                }
            }
        }
    } catch (e) {
        Logger.error('Error while checking GC balance. :: {0}', e.message);
    }
    return giftCardResponse;
}
/**
 * Makes service call to authorize gift card amount.
 * @param {string} gcNumber - gift card number.
 * @param {string} gcPin - gift card pin.
 * @param {number} amount - authorization amount.
 * @param {string} orderNo - The order number for the giftcard purchase order
 * @param {string} customerEmail - The customer email from the giftcard purchase order
 * @returns {Object} returns authorization data if there is no error in gc service and gc number and pin are valid.
 * Example Response
 *  {
 *     "success": true,
 *     "errorMessage": null,
 *     "giftCardData": {
 *         "cardNumber": "7777007069967974",
 *         "currentBalance": 50,
 *         "transactionNumber": "713001"
 *     }
 *  }
 *
 */
function authorizeGiftCard(gcNumber, gcPin, amount, orderNo, customerEmail) {
    const giftCardResponse = {
        success: false,
        errorMessage: defaultErrorMessage,
        giftCardData: null
    };
    try {
        if (!empty(gcNumber) && !empty(gcPin) && !empty(amount) && amount > 0) {
            const accessToken = tokenHelper.getValidToken().accessToken;
            if (empty(accessToken) || empty(firstDataPreferences.graphQLApiUrl)) {
                Logger.error('Error in firstDataHelper.js -> authorizeGiftCard() | Access token or GraphQL API URL is null.');
                return giftCardResponse;
            }
            const params = {
                requestBody: {
                    query: 'mutation($makePurchase: GiftCardTransactionInput!) {\n  makePurchase(input: $makePurchase) {\n cardNumber\n currentBalance\n transactionNumber\n  }\n }',
                    variables: {
                        makePurchase: {
                            cardNumber: gcNumber,
                            pin: gcPin,
                            amount: parseFloat(amount),
                            date: new Date().toISOString(),
                            orderNumber: orderNo,
                            email: customerEmail
                        }
                    }
                },
                token: accessToken,
                graphQLApiUrl: firstDataPreferences.graphQLApiUrl
            };
            const serviceResponse = createGraphQLService.call(params);
            if (validateServiceResponse(serviceResponse)) {
                const responseText = JSON.parse(serviceResponse.object.text);
                if (responseText.data && responseText.data.makePurchase) {
                    giftCardResponse.giftCardData = responseText.data.makePurchase;
                    giftCardResponse.success = true;
                    giftCardResponse.errorMessage = null;
                    giftCardResponse.error = false;
                } else if (!empty(responseText.errors)) {
                    giftCardResponse.errorMessage = handleErrorResponseCodes(responseText.errors);
                    giftCardResponse.success = false;
                    giftCardResponse.error = true;
                }
            } else {
                giftCardResponse.success = false;
                giftCardResponse.error = true;
                giftCardResponse.errorMessage = null;
            }
        }
    } catch (e) {
        Logger.error('Error while gc authorization. :: {0}', e.message);
    }
    return giftCardResponse;
}
/**
 * Makes service call to reverse gift card amount.
 * @param {string} gcNumber - gift card number.
 * @param {string} gcPin - gift card pin.
 * @param {number} amount - amount to reverse.
 * @returns {Object} returns gc data with updated amount if there is no error in gc service and gc number and pin are valid.
 * Example Response
 *  {
 *    "success": true,
 *    "errorMessage": null,
 *    "giftCardsData": {
 *        "cardNumber": "7777007069967974",
 *        "currentBalance": 50,
 *        "transactionNumber": "713003"
 *    }
 *  }
 *
 */
function reverseGiftCardAmount(gcNumber, gcPin, amount) {
    const giftCardResponse = {
        success: false,
        errorMessage: defaultErrorMessage,
        giftCardData: null
    };
    try {
        if (!empty(gcNumber) && !empty(gcPin) && !empty(amount) && amount > 0) {
            const accessToken = tokenHelper.getValidToken().accessToken;
            if (empty(accessToken) || empty(firstDataPreferences.graphQLApiUrl)) {
                Logger.error('Error in firstDataHelper.js -> reverseGiftCardAmount() | Access token or GraphQL API URL is null.');
                return giftCardResponse;
            }
            const params = {
                requestBody: {
                    query: 'mutation($voidPurchase: GiftCardTransactionInput!) {\n voidPurchase(input: $voidPurchase) {\n cardNumber\n currentBalance\n transactionNumber\n  }\n }',
                    variables: {
                        voidPurchase: {
                            cardNumber: gcNumber,
                            pin: gcPin,
                            amount: parseFloat(amount),
                            date: new Date().toISOString()
                        }
                    }
                },
                token: accessToken,
                graphQLApiUrl: firstDataPreferences.graphQLApiUrl
            };
            const serviceResponse = createGraphQLService.call(params);
            if (validateServiceResponse(serviceResponse)) {
                const responseText = JSON.parse(serviceResponse.object.text);
                if (responseText.data && responseText.data.voidPurchase) {
                    giftCardResponse.success = true;
                    giftCardResponse.errorMessage = null;
                    giftCardResponse.giftCardData = responseText.data.voidPurchase;
                } else if (!empty(responseText.errors)) {
                    giftCardResponse.errorMessage = handleErrorResponseCodes(responseText.errors);
                }
            }
        }
    } catch (e) {
        Logger.error('Error while reversing GC amount. :: {0}', e.message);
    }
    return giftCardResponse;
}
/**
 * Makes service call to generate new gift cards.
 * @param {Object} amounts - gift cards amount array.
 * @param {string} orderNo - The order number for the giftcard purchase order
 * @param {string} customerEmail - The customer email from the giftcard purchase order
 * @returns {Object} returns generated gift cards data if there is no error in gc service.
 * Example Input Parameter
 * [100,150,300,500]
 * Example Response
 *{
 * "success": true,
 * "errorMessage": null,
 * "giftCardsData": [
 *   {
 *     "cardNumber": "7777007069967974",
 *     "pin": "91260152",
 *     "currentBalance": 100,
 *     "cardClass": 190,
 *     "transactionNumber": "712958"
 *   },
 *   {
 *     "cardNumber": "7777007069967974",
 *     "pin": "91260152",
 *     "currentBalance": 100,
 *     "cardClass": 190,
 *     "transactionNumber": "712958"
 *   }
 * ]
 *}
 */
function generateGiftCards(amounts, orderNo, customerEmail) {
    const giftCardsResponse = {
        success: false,
        errorMessage: defaultErrorMessage,
        giftCardData: null
    };
    try {
        if (!empty(amounts) && amounts.length > 0) {
            var i;
            var requestBody = [];
            for (i = 0; i < amounts.length; i++) {
                requestBody.push({
                    query: 'mutation($activateGiftCard: GiftCardActivationInput!) {\n activateGiftCard(input: $activateGiftCard) {\n cardNumber\n pin\n currentBalance\n cardClass\n transactionNumber\n recipientEmail\n}\n }',
                    variables: {
                        activateGiftCard: {
                            amount: parseFloat(amounts[i].amount),
                            date: new Date().toISOString(),
                            orderNumber: orderNo,
                            email: customerEmail,
                            recipientEmail: amounts[i].recipientEmail
                        }
                    }
                });
            }
            if (requestBody.length > 0) {
                const accessToken = tokenHelper.getValidToken().accessToken;
                if (empty(accessToken) || empty(firstDataPreferences.graphQLApiUrl)) {
                    Logger.error('Error in firstDataHelper.js -> generateGiftCards() | Access token or GraphQL API URL is null.');
                    return giftCardsResponse;
                }
                const params = {
                    requestBody: requestBody,
                    token: accessToken,
                    graphQLApiUrl: firstDataPreferences.graphQLApiUrl
                };
                const serviceResponse = createGraphQLService.call(params);
                if (validateServiceResponse(serviceResponse)) {
                    const responseText = JSON.parse(serviceResponse.object.text);
                    if (responseText && responseText.length > 0) {
                        giftCardsResponse.errorMessage = null;
                        giftCardsResponse.success = true;
                        var giftCardData = [];
                        for (i = 0; i < responseText.length; i++) {
                            giftCardData.push(responseText[i].data.activateGiftCard);
                        }
                        giftCardsResponse.giftCardData = giftCardData;
                    } else if (!empty(responseText.errors)) {
                        giftCardsResponse.errorMessage = handleErrorResponseCodes(responseText.errors);
                    }
                }
            }
        }
    } catch (e) {
        Logger.error('Error while generating GC numbers. :: {0}', e.message);
    }
    return giftCardsResponse;
}
/**
 * Makes service call to check gift cards balance.
 * @param {Object} giftCards - gift cards JSON object.
 * @returns {Object} returns gc balance if there is no error in gc service and gc number and pin are valid.
 * Example Input Parameter
 * [
 *   {
 *      gcNumber:'7777007069967974',
 *      gcPin:'98614955'
 *   },
 *   {
 *      gcNumber:'7777007069967975',
 *      gcPin:'98614956'
 *   }
 * ]
 * Example Response
 *  {
 *     "success": true,
 *     "errorMessage": null,
 *     "giftCardsData": [{
 *         "cardNumber": "7777007069967974",
 *         "currentBalance": 50,
 *         "cardClass": 190
 *     },{
 *         "cardNumber": "7777007069967975",
 *         "currentBalance": 50,
 *         "cardClass": 190
 *     }]
 *  }
 */
function checkGiftCardsBalance(giftCards) {
    const giftCardsResponse = {
        success: false,
        errorMessage: defaultErrorMessage,
        giftCardsData: null
    };
    // Reduce number of service calls for identical giftCards by using cached response
    var cachedGiftCardsResponse = getCachedGC(giftCards);
    if (!empty(cachedGiftCardsResponse)) {
        return cachedGiftCardsResponse;
    }

    try {
        if (!empty(giftCards)) {
            const requestBody = [];
            var i;
            for (i = 0; i < giftCards.length; i++) {
                if (!empty(giftCards[i]) && !empty(giftCards[i].gcNumber) && !empty(giftCards[i].gcPin));
                requestBody.push({
                    query: 'query($giftCard: GiftCardSearchInput!) {\n giftCard(input: $giftCard) {\n cardNumber\n currentBalance\n cardClass\n }\n }',
                    variables: {
                        giftCard: {
                            cardNumber: giftCards[i].gcNumber,
                            pin: giftCards[i].gcPin
                        }
                    }
                });
            }
            if (requestBody.length > 0) {
                const accessToken = tokenHelper.getValidToken().accessToken;
                if (empty(accessToken) || empty(firstDataPreferences.graphQLApiUrl)) {
                    Logger.error('Error in firstDataHelper.js -> checkGiftCardsBalance() | Access token or GraphQL API URL is null.');
                    return giftCardsResponse;
                }
                const params = {
                    requestBody: requestBody,
                    token: accessToken,
                    graphQLApiUrl: firstDataPreferences.graphQLApiUrl
                };
                const serviceResponse = createGraphQLService.call(params);
                if (validateServiceResponse(serviceResponse)) {
                    const responseText = JSON.parse(serviceResponse.object.text);
                    const gcBalanceData = [];
                    for (i = 0; i < responseText.length; i++) {
                        if (!empty(responseText[i]) && !empty(responseText[i].data) && !empty(responseText[i].data.giftCard)) {
                            gcBalanceData.push(responseText[i].data.giftCard);
                        }
                    }
                    if (gcBalanceData.length > 0) {
                        giftCardsResponse.success = true;
                        giftCardsResponse.errorMessage = null;
                        giftCardsResponse.giftCardsData = gcBalanceData;
                    }
                }
            }
        }
    } catch (e) {
        Logger.error('Error while checking gift cards balance. :: {0}', e.message);
    }

    try {
        // Refresh cached values
        session.privacy.giftCards = JSON.stringify(giftCards);
        session.privacy.giftCardsResponse = JSON.stringify(giftCardsResponse);
    } catch (e) {
        Logger.error('Error while refreshing cached gift cards data in session. :: {0}', e.message);
    }

    return giftCardsResponse;
}

/**
 * Makes service call to authorize gift cards.
 * @param {Object} giftCards - gift cards JSON object.
 * @param {string} orderNo - The order number for the giftcard purchase order
 * @param {string} customerEmail - The customer email from the giftcard purchase order
 * @returns {Object} returns authorization data for each gift card if there is no error in gc service and gc number and pin are valid.
 * Example Input Parameter
 * [
 *   {
 *      gcNumber:'7777007069967974',
 *      gcPin:'98614955',
 *      amount:10
 *   },
 *   {
 *      gcNumber:'7777007069967975',
 *      gcPin:'98614956',
 *      amount:10.5
 *   }
 * ]
 * Example Response
 *  {
 *     "success": true,
 *     "errorMessage": null,
 *     "giftCardsData": [{
 *         "cardNumber": "7777007069967974",
 *         "currentBalance": 50,
 *         "transactionNumber": 713001
 *     },{
 *         "cardNumber": "7777007069967975",
 *         "currentBalance": 50,
 *         "transactionNumber": 713001
 *     }]
 *  }
 */
function authorizeGiftCards(giftCards, orderNo, customerEmail) {
    const giftCardsResponse = {
        error: true,
        success: false,
        errorMessage: defaultErrorMessage,
        giftCardsData: null
    };
    try {
        if (!empty(giftCards)) {
            const requestBody = [];
            var i;
            for (i = 0; i < giftCards.length; i++) {
                if (!empty(giftCards[i]) && !empty(giftCards[i].gcNumber) && !empty(giftCards[i].gcPin) && !empty(giftCards[i].amount));
                requestBody.push({
                    query: 'mutation($makePurchase: GiftCardTransactionInput!) {\n  makePurchase(input: $makePurchase) {\n cardNumber\n currentBalance\n transactionNumber\n  }\n }',
                    variables: {
                        makePurchase: {
                            cardNumber: giftCards[i].gcNumber,
                            pin: giftCards[i].gcPin,
                            amount: parseFloat(giftCards[i].amount),
                            date: new Date().toISOString(),
                            orderNumber: orderNo,
                            email: customerEmail
                        }
                    }
                });
            }
            if (requestBody.length > 0) {
                const accessToken = tokenHelper.getValidToken().accessToken;
                if (empty(accessToken) || empty(firstDataPreferences.graphQLApiUrl)) {
                    Logger.error('Error in firstDataHelper.js -> authorizeGiftCards() | Access token or GraphQL API URL is null.');
                    return giftCardsResponse;
                }
                const params = {
                    requestBody: requestBody,
                    token: accessToken,
                    graphQLApiUrl: firstDataPreferences.graphQLApiUrl
                };
                const serviceResponse = createGraphQLService.call(params);
                if (validateServiceResponse(serviceResponse)) {
                    const responseText = JSON.parse(serviceResponse.object.text);
                    const gcAuthData = [];
                    for (i = 0; i < responseText.length; i++) {
                        if (!empty(responseText[i]) && !empty(responseText[i].data) && !empty(responseText[i].data.makePurchase)) {
                            gcAuthData.push(responseText[i].data.makePurchase);
                        }
                    }
                    if (gcAuthData.length > 0) {
                        giftCardsResponse.error = false;
                        giftCardsResponse.success = true;
                        giftCardsResponse.errorMessage = null;
                        giftCardsResponse.giftCardsData = gcAuthData;
                    }
                }
            }
        }
    } catch (e) {
        Logger.error('Error while gift cards authorization. :: {0}', e.message);
    }
    return giftCardsResponse;
}
/**
 * Makes service call to reverse gift cards amount.
 * @param {Object} giftCards - gift cards JSON object.
 * @returns {Object} returns authorization data for each gift card if there is no error in gc service and gc number and pin are valid.
 * Example Input Parameter
 * [
 *   {
 *      gcNumber:'7777007069967974',
 *      gcPin:'98614955',
 *      amount:10
 *   },
 *   {
 *      gcNumber:'7777007069967975',
 *      gcPin:'98614956',
 *      amount:10.5
 *   }
 * ]
 * Example Response
 *  {
 *     "success": true,
 *     "errorMessage": null,
 *     "giftCardsData": [{
 *         "cardNumber": "7777007069967974",
 *         "currentBalance": 50,
 *         "transactionNumber": 713001
 *     },{
 *         "cardNumber": "7777007069967975",
 *         "currentBalance": 50,
 *         "transactionNumber": 713001
 *     }]
 *  }
 */
function reverseGiftCardsAmount(giftCards) {
    const errorLogger = require('dw/system/Logger').getLogger('OrderFail', 'OrderFail');
    const giftCardsResponse = {
        success: false,
        errorMessage: defaultErrorMessage,
        giftCardsData: null
    };
    try {
        if (!empty(giftCards)) {
            const requestBody = [];
            var i;
            for (i = 0; i < giftCards.length; i++) {
                if (!empty(giftCards[i]) && !empty(giftCards[i].gcNumber) && !empty(giftCards[i].gcPin) && !empty(giftCards[i].amount));
                requestBody.push({
                    query: 'mutation($voidPurchase: GiftCardTransactionInput!) {\n voidPurchase(input: $voidPurchase) {\n cardNumber\n currentBalance\n transactionNumber\n  }\n }',
                    variables: {
                        voidPurchase: {
                            cardNumber: giftCards[i].gcNumber,
                            pin: giftCards[i].gcPin,
                            amount: parseFloat(giftCards[i].amount),
                            date: new Date().toISOString()
                        }
                    }
                });
            }
            if (requestBody.length > 0) {
                const accessToken = tokenHelper.getValidToken().accessToken;
                if (empty(accessToken) || empty(firstDataPreferences.graphQLApiUrl)) {
                    Logger.error('Error in firstDataHelper.js -> reverseGiftCardsAmount() | Access token or GraphQL API URL is null.');
                    return giftCardsResponse;
                }
                const params = {
                    requestBody: requestBody,
                    token: accessToken,
                    graphQLApiUrl: firstDataPreferences.graphQLApiUrl
                };
                const serviceResponse = createGraphQLService.call(params);
                if (validateServiceResponse(serviceResponse)) {
                    const responseText = JSON.parse(serviceResponse.object.text);
                    errorLogger.error('requestBody : {0}, responseText {1}', JSON.stringify(requestBody), serviceResponse.object.text);
                    const gcVoidPurchaseData = [];
                    for (i = 0; i < responseText.length; i++) {
                        if (!empty(responseText[i]) && !empty(responseText[i].data) && !empty(responseText[i].data.voidPurchase)) {
                            gcVoidPurchaseData.push(responseText[i].data.voidPurchase);
                        }
                    }
                    errorLogger.error('gcVoidPurchaseData {0}', JSON.stringify(gcVoidPurchaseData));
                    if (gcVoidPurchaseData.length > 0) {
                        giftCardsResponse.success = true;
                        giftCardsResponse.errorMessage = null;
                        giftCardsResponse.giftCardsData = gcVoidPurchaseData;
                    }
                }
            }
        }
    } catch (e) {
        Logger.error('Error while gift cards authorization. :: {0}', e.message);
    }
    return giftCardsResponse;
}

module.exports = {
    generateGiftCard: generateGiftCard,
    checkBalance: checkBalance,
    authorizeGiftCard: authorizeGiftCard,
    reverseGiftCardAmount: reverseGiftCardAmount,
    generateGiftCards: generateGiftCards,
    checkGiftCardsBalance: checkGiftCardsBalance,
    authorizeGiftCards: authorizeGiftCards,
    reverseGiftCardsAmount: reverseGiftCardsAmount,
    getAuthAccessToken: getAuthAccessToken,
    validateServiceResponse: validateServiceResponse,
    getCachedGC: getCachedGC
};
