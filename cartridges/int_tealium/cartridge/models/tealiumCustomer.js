const collections = require('*/cartridge/scripts/util/collections');
const PromotionMgr = require('dw/campaign/PromotionMgr');

module.exports.buildCustomerObject = function buildCustomerObject(logicArgs) {
    return {
        // used for client side mapping
        // TODO: filter for security?
        sfraModel: {},
        // used for server data mapping
        sessionID: logicArgs.sessionID,
        customerNo: logicArgs.customerNo,
        activeCustomerPromotions: (PromotionMgr.activeCustomerPromotions) ? {
            promotions: (PromotionMgr.activeCustomerPromotions.promotions) ? collections.map(PromotionMgr.activeCustomerPromotions.promotions, function (m) {
                const describe = m.describe && m.describe();
                return {
                    describe: describe ? {
                        ID: describe.ID
                    } : {},
                    ID: m.ID,
                    name: m.name,
                    promotionClass: m.promotionClass,
                    basedOnCoupons: m.basedOnCoupons,
                    coupons: collections.map(m.coupons || [], function (s) {
                        return {
                            ID: s.ID
                        };
                    }),
                    basedOnSourceCodes: m.basedOnSourceCodes,
                    sourceCodeGroups: collections.map(m.sourceCodeGroups || [], function (s) {
                        return {
                            ID: s.ID
                        };
                    }),
                    basedOnCustomerGroups: m.basedOnCustomerGroups,
                    customerGroups: collections.map(m.customerGroups || [], function (s) {
                        return {
                            ID: s.ID
                        };
                    })
                }
            }) : [],
        } : {},
        session: {
            customer: (session && session.customer) ? {
                authenticated: session.customer.authenticated,
                registered: session.customer.registered,
                profile: (session.customer.profile) ? {
                    customerNo: session.customer.profile.customerNo,
                    email: session.customer.profile.email
                } : {},
                customerGroups: (session.customer.customerGroups) ? collections.map(session.customer.customerGroups, function (cg) {
                    return {
                        ID: cg.ID
                    }
                }) : [],
                orderHistory: (session.customer.orderHistory) ? {
                    orderCount: session.customer.orderHistory
                } : undefined
            } : {},
            sourceCodeInfo: (session && session.sourceCodeInfo) ? {
                code: session.sourceCodeInfo.code,
                group: session.sourceCodeInfo.group ? {
                    ID: session.sourceCodeInfo.group.ID
                } : {}
            } : {},
            lastReceivedSourceCodeInfo: (session && session.lastReceivedSourceCodeInfo) ? {
                code: session.lastReceivedSourceCodeInfo.code,
                group: session.lastReceivedSourceCodeInfo.group ? {
                    ID: session.lastReceivedSourceCodeInfo.group.ID
                } : {}
            } : {},
        }
    };
};
