var pathToCoreMock = '../../../../mocks/';
var CustomObjectMgr = require(pathToCoreMock + 'dw/dw_object_CustomObjectMgr');

module.exports = {
    saveNotifyCO: function () {
        return true;
    },

    getNotifyCO: function (orderNo) {
        return CustomObjectMgr.getCustomObject('AccertifyNotify', orderNo);
    },

    getAllNotifyCO: function () {
        var customObjects = [{
            custom: {
                orderNo: '001',
                isProcessed: false,
                notifyData: [{
                    accertifyTransactionID: 'test',
                    accertifyRules: 'test',
                    accertifyScore: 'test',
                    accertifyActionType: 'test',
                    accertifyRecCode: 'test'
                }]
            }
        }];
        var index = 0;
        return {
            items: customObjects,
            hasNext: function () {
                return index < customObjects.length;
            },
            next: function () {
                return customObjects[index++];
            }
        };
    },

    deleteNotifyCO: function () {
        return true;
    },

    updateNotifyStatus: function () {
        return true;
    }
};
