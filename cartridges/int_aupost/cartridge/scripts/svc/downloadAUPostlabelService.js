/* eslint-disable no-param-reassign */
'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

module.exports.downloadAUPostlabel = function (serviceID, url, returnCaseNumber) {
    var serviceRegistry = LocalServiceRegistry.createService(serviceID, {
        createRequest: function (svc) {
            svc.setRequestMethod('GET');
            svc.setURL(url);
            svc.client.setTimeout(10000);
            svc.client.open('GET', url);
            var File = require('dw/io/File');
            var assetFile = new File(File.IMPEX + '/src/returnlabel/aupost/' + returnCaseNumber + '.pdf');
            svc.client.sendAndReceiveToFile(assetFile);
        },
        parseResponse: function (svc, client) {
            return client.text;
        }
    });
    return serviceRegistry;
};
