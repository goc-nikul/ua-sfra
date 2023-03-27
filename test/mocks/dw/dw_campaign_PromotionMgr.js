'use strict';

const PromotionPlan = require('./dw_campaign_PromotionPlan');

class PromotionMgr {
    constructor() {
        this.activeCustomerPromotions = new PromotionPlan();
    }

    getActiveCustomerPromotions() {
        return this.activeCustomerPromotions;
    }
}

module.exports = new PromotionMgr();
