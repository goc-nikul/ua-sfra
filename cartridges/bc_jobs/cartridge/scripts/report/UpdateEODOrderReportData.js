'use strict';

/* API imports */
var Logger = require('dw/system/Logger'),
    CustomObjectMgr = require('dw/object/CustomObjectMgr'),
    Transaction = require('dw/system/Transaction'),
    JSONUtils = require('int_customfeeds/cartridge/scripts/util/JSONUtils'),
    EODReportManager = require('*/cartridge/scripts/orders/EODReportMgr'),
    HelperQuota = require('~/cartridge/scripts/utils/HelperQuotaAPI'),
    Status = require('dw/system/Status');

function execute(parameters, stepExecution) {
    if (parameters && empty(parameters.EODCustomObjectType)) {
        return new Status(
            Status.ERROR,
            'ERROR',
            "Parameter 'EODCustomObjectType' is missing"
        );
    }

    if (parameters && empty(parameters.queue)) {
        return new Status(
            Status.ERROR,
            'ERROR',
            "Parameter 'queue' is missing"
        );
    }

    var EODCustomObjectType = parameters.EODCustomObjectType,
        queryString = "custom.ID LIKE '" + parameters.queue + "*'",
        sortString = 'lastModified asc';

    var queueCO = EODReportManager.getQueueObjects(
            EODCustomObjectType,
            queryString,
            sortString
        ),
        queueCOLength = queueCO.length;

    for (var i = 0; i < queueCOLength; i++) {
        //get current co
        var co = queueCO[i],
            coData = JSONUtils.parse(co.custom.data, {}),
            reportDate = co.custom.data
                .match(/\d{2}-\d{2}-\d{4}/g)[0]
                .toString(),
            reportType = Object.keys(coData[reportDate])[0].toString(),
            orderNumber = coData[reportDate][reportType]['order'];

        //get the main editable co
        var coDate = Object.keys(coData)[0].toString(),
            coMainEditableID = coDate
                .split('-')
                .reverse()
                .join('-')
                .replace(/-\d{2}-/, '-')
                .toString(),
            coMainEditable = EODReportManager.getCustomObjectForEdit(
                EODCustomObjectType,
                coMainEditableID
            ),
            coMainEditableData = JSONUtils.parse(
                coMainEditable.custom.data,
                {}
            );

        if (!(reportDate in coMainEditableData)) {
            coMainEditableData[reportDate] = {};
        }
        if (!(reportType in coMainEditableData[reportDate])) {
            coMainEditableData[reportDate][reportType] = {
                count: 0,
                orders: []
            };
        }

        if (coData[coDate][reportType]['count'] == 1) {
            let orders = coMainEditableData[reportDate][reportType]['orders'];

            orders = HelperQuota.shatterArray(orders);
            HelperQuota.addToArray(orderNumber, orders);
            coMainEditableData[reportDate][reportType]['count'] = orders.length;
            //after a successful operation remove the current co
            removeCO(co);
        } else {
            var indexOrder = coMainEditableData[reportDate][reportType][
                'orders'
            ].indexOf(orderNumber);
            if (indexOrder != -1) {
                coMainEditableData[reportDate][reportType]['orders'].splice(
                    indexOrder,
                    1
                );
                coMainEditableData[reportDate][reportType]['count']--;
                //after a successful operation remove the current co
                removeCO(co);
            } else {
                Logger.error(
                    "UpdateEODOrderReportData.js: {0} is not in co : {1}, reportDate: {2}, reportType: {3}. We can't decrement it.",
                    orderNumber,
                    coMainEditableID,
                    reportDate,
                    reportType
                );
                removeCO(co);
                continue;
            }
        }

        try {
            Transaction.wrap(function () {
                coMainEditable.custom.data = JSON.stringify(coMainEditableData);
            });
        } catch (e) {
            Logger.error(
                'UpdateEODOrderReportData.js: Can not create {0} the custom object. Error: {1}.',
                coMainEditableID,
                e
            );
        }
    }
}

//remove CO
function removeCO(co) {
    try {
        Transaction.wrap(function () {
            CustomObjectMgr.remove(co);
        });
    } catch (e) {
        Logger.error(
            'UpdateEODOrderReportData.js: Can not remove the  the custom object. Error: {0}.',
            e
        );
        return;
    }
}

/* Exported methods*/
module.exports = {
    execute: execute
};
