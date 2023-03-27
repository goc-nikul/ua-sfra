'use strict';

var Address = require('./Address');
var QASService = require('../../services/QASService');

var AddressTypeDownSearch = Address.extend({
    updateResult: function () {
        this.updateRefinedList();
    },
    updateResultUsingCache: function (cachedData) {
        this.response.error = cachedData.error;
        this.refinedList = cachedData.refinedList;
    },
    clearState: function () {
        this.clearRefinedList();
        this.clearResponse();
    },
    execute: function (search) {
        this.clearState();
        var response = QASService.addressTypeDownSearchService.call({
            layout: this.getLayout(),
            country: this.getCountry(),
            search: search
        });

        this.response.error = response.ok ? false : response.errorMessage;
        this.response.result = response.object;

        this.updateResult();
        return this;
    },
    getResult: function () {
        return {
            error: this.response.error,
            storage: this.response.storage,
            refinedList: this.refinedList
        };
    }
});

module.exports = AddressTypeDownSearch;
