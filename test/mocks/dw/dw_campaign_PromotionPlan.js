'use strict';

class PromotionPlan {
    constructor() {
        this.lineItems = [{
            ID: 'testID'
        }];

        this.productPromotions = () => {
            var index = 0;
            return {
                items: this.lineItems,
                iterator: () => {
                    return {
                        items: this.lineItems,
                        hasNext: () => {
                            return index < this.lineItems.length;
                        },
                        next: () => {
                            return this.lineItems[index++];
                        }
                    };
                }
            };
        };
    }

    getProductPromotions() {
        return this.productPromotions();
    }
}

module.exports = PromotionPlan;