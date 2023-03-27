var AccertifyOrderHelper = function () {
    this.addNotificationData = function (order) {
        /* eslint-disable no-param-reassign */
        order.custom.accertifyRecCode = 'test';
    };

    this.addCONotificationData = function (order, object) {
        order.custom.accertifyTransactionID = object.accertifyTransactionID;
        order.custom.accertifyRules = object.accertifyRules;
        order.custom.accertifyScore = object.accertifyScore;
        order.custom.accertifyRecCode = object.accertifyRecCode;
        order.custom.accertifyActionType = object.accertifyActionType;
        return true;
    };

    this.parseAccertifyNotification = function () {
        return true;
    };

    this.createCustomObject = function () {
        return true;
    };

    this.changeOrderStatus = function () {
        return true;
    };
};

module.exports = AccertifyOrderHelper;
