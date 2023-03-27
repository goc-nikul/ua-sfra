'use strict';

var base = module.superModule;
var Site = require('dw/system/Site');
var ReturnsUtils = require('app_ua_emea/cartridge/scripts/orders/ReturnsUtils');
var StringUtils = require('dw/util/StringUtils');
var returnsUtils = new ReturnsUtils();
var Resource = require('dw/web/Resource');

/**
 * Order class that represents the current order
 * @param {dw.order.ReturnCase} returnCase - Return Case Object
 * @param {Object} options - The current order's line items
 * @constructor
 */
function returnOrderModel(returnCase, options) {
    var Calendar = require('dw/util/Calendar');
    if (returnCase) {
        base.call(this, returnCase, options);
        var lineItemContainer = returnCase.getOrder();
        var refundsJson = 'refundsJson' in lineItemContainer.custom && lineItemContainer.custom.refundsJson ? lineItemContainer.custom.refundsJson : '';
        var refundInfo = !empty(refundsJson) ? returnsUtils.getRefundInfoForOrderDetail(this.rmaNumber, refundsJson) : '';
        if (refundInfo) {
            this.status = Resource.msg('order.status.processed', 'account', null);
            this.displayStatus = Resource.msg('order.status.processed', 'account', null);
        } else {
            this.status = Resource.msg('order.status.received', 'account', null);
            this.displayStatus = Resource.msg('order.status.received', 'account', null);
            if (Site.getCurrent().getID() === 'KR') {
                this.creationDate = Object.hasOwnProperty.call(returnCase, 'creationDate')
                ? StringUtils.formatCalendar(new Calendar(returnCase.creationDate), 'MM/dd') : null;
            } else {
                this.creationDate = Object.hasOwnProperty.call(returnCase, 'creationDate')
                ? StringUtils.formatCalendar(new Calendar(returnCase.creationDate), 'dd/MM') : null;
            }
        }
        this.orderItems.forEach((item) => {
            if (options && options.containerView === 'orderDetails') {
                // To display the product return info
                if ((Site.getCurrent().getID() === 'SEA' || Site.getCurrent().getID() === 'TH')) {
                    // eslint-disable-next-line no-param-reassign
                    item.returnReason = Resource.msg('return.reason.' + item.returnReason.replace(/[^a-zA-Z0-9_]/gi, '_'), 'account', null);
                }
            }
        });
    }
}

module.exports = returnOrderModel;
