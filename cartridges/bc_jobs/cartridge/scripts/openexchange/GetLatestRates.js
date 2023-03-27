'use strict';

/* API imports */
const Logger = require('dw/system/Logger'),
    CustomObjectMgr = require('dw/object/CustomObjectMgr'),
    Transaction = require('dw/system/Transaction'),
    Status = require('dw/system/Status');

function UpdateRates() {
    let profileData = null,
        response = null,
        result = null,
        service = require('./OpenExchangeService.js');

    try {
        profileData = JSON.parse(service.configuration.profile.custom.data);
    } catch(e) {
        Logger.error('OpenExchange.js ERROR parsing JSON object from profileData service data: ' + e);
        return new Status(Status.ERROR);
    }

    let app_id = profileData['app_id'],
        configData = profileData['configData'],
        rates = "{",
        url = profileData['url'];

    if (app_id) {
        for (let key in configData) {
        	let config = configData[key],
            	baseRate = config.base,
            	symbols = config.currencies.replace(' ', ''),
            	buildCurrencies = symbols.split(',');

            service.URL = url + '?app_id=' + app_id + '&base=' + baseRate + '&symbols=' + symbols;

            result = service.call();

            if (result == null || service == null) {
                Logger.error('OpenExchange.js: "result" or "service" is null!');
                return new Status(Status.ERROR);
            }

            //parse response
            try {
			    if (result.object !=null && result.object.text !=null) {
				    response = JSON.parse(result.object.text);
				}
            } catch(e) {
                Logger.error('OpenExchange.js ERROR parsing JSON object from exhcange rates response: ' + e);
                return new Status(Status.ERROR);
            }

            //build JSON from service response
            rates += '"' + baseRate + '":{';
            for (let i = 0; i < buildCurrencies.length; i++) {
                rates += '"' + buildCurrencies[i] + '":"' + response.rates[buildCurrencies[i]] + '",';
            }
            rates = rates.slice(0, -1);
            rates += '},';
        }

        //remove last comma to produce valid JSON
        rates = rates.slice(0, -1);
        rates += '}';

        try {
            rates = JSON.parse(rates);
            Transaction.wrap(function() {
                let exchangeRate = CustomObjectMgr.getCustomObject('SiteData', 'exchangeRates');
                    exchangeRate.custom.data = JSON.stringify(rates);
            });
        } catch(e) {
            Logger.error('OpenExchange.js ERROR parsing JSON Rates and assigning to custom object SiteData.ExchangeRates: ' + e);
            return new Status(Status.ERROR);
        }
    }

    return new Status(Status.OK);
}

module.exports.execute = UpdateRates;
