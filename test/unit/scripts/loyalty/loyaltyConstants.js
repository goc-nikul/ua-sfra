'use strict';

const {
    assert
} = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_loyalty/cartridge/scripts/LoyaltyConstants.js', () => {
    var LoyaltyConstants = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/LoyaltyConstants.js', {
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
    });

    it('Loyalty_Status is defined', () => {
        assert.isNotNull(LoyaltyConstants.ENROLLED);
        assert.equal(LoyaltyConstants.LOYALTY_STATUS.ENROLLED, 'ENROLLED');
        assert.isNotNull(LoyaltyConstants.UNENROLLED);
        assert.equal(LoyaltyConstants.LOYALTY_STATUS.UNENROLLED, 'UNENROLLED');
    });

    it('Loyalty_Reward_Flow_Type is defined', () => {
        assert.isNotNull(LoyaltyConstants.ONLINE_DOLLAR_OFF);
        assert.equal(LoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.ONLINE_DOLLAR_OFF, 'ONLINE_DOLLAR_OFF');
        assert.isNotNull(LoyaltyConstants.INSTORE_DOLLAR_OFF);
        assert.equal(LoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.INSTORE_DOLLAR_OFF, 'INSTORE_DOLLAR_OFF');
        assert.isNotNull(LoyaltyConstants.FREE_PRODUCT);
        assert.equal(LoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.FREE_PRODUCT, 'FREE_PRODUCT');
        assert.isNotNull(LoyaltyConstants.BIRTHDAY_REWARD);
        assert.equal(LoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.BIRTHDAY_REWARD, 'BIRTHDAY_REWARD');
        assert.isNotNull(LoyaltyConstants.SWEEPSTAKE);
        assert.equal(LoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.SWEEPSTAKE, 'SWEEPSTAKE');
        assert.isNotNull(LoyaltyConstants.ATHLETE_ASSESSMENT);
        assert.equal(LoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.ATHLETE_ASSESSMENT, 'ATHLETE_ASSESSMENT');
        assert.isNotNull(LoyaltyConstants.MEMBERPERK_URLCTA);
        assert.equal(LoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.MEMBERPERK_URLCTA, 'MEMBERPERK_URLCTA');
    });

    it('Loyalty_Prefix is defined', () => {
        assert.isNotNull(LoyaltyConstants.LOYALTY_PREFIX);
        assert.equal(LoyaltyConstants.LOYALTY_PREFIX, 'LYLD');
    });
});
