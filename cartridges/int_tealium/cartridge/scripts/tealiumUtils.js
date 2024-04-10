/* eslint spellcheck/spell-checker: 0 */
const collections = require('*/cartridge/scripts/util/collections');
const priceFactory = require('*/cartridge/scripts/factories/price');
const Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');

/**
* Merge objects
* @param {Array} arrayOfObjects [{}, {}]
* @returns {Object} merged object. {}
*/
module.exports.objectsMerge = function objectsMerge(arrayOfObjects) {
    const out = {};
    arrayOfObjects.forEach(function extend(src) {
        Object.keys(src).forEach(function (key) { out[key] = src[key]; });
    });
    return out;
}

/**
* @DEPRECATED
* !!!! Deprecated do not use. 
* !!!! Find decimal values to use instead of cleaning string.
* Returns a stringed decimal version of formatted money
* Example: '$4.00' to '4.00'
* Example: '$1.000,00 CAD' to '1,000.00'
* @param {String} dirtyValue $4.00'
* @returns {String} '4.00'
*/
module.exports.cleanMoney = function cleanMoney(dirtyValue) {
    /** USD or CDN to decimal **/
    const clean = dirtyValue.replace(/[^0-9.,]/g, ''); // removes currency letters
    const length = clean.length;
    if (clean[length-3] === ',') {
        // '1.356,80' to '1,356.80'
        return clean.replace(/,/g, '_').replace(/\./g, ',').replace(/\_/g, '.');
    }
    return clean;
}

/**
* get object property if exists
* @param {object} object
* @returns {mixed} value of property or null
*/
function getObjectProp(o, key) {
    if (typeof o === 'object') {
        return Object.hasOwnProperty.call(o, key)
          ? o[key]
          : null
    }
    return null;
}
module.exports.priceValue = priceValue;

/**
* priceValue
* @param {dw.order.Money} m - promotion
* @returns {mixed} int or null
*/
function priceValue(m) {
    return m && typeof m.value === 'number' ? m.value : null;
}
module.exports.priceValue = priceValue;

/**
* quantityValue
* @param {dw.order.Quantity} q - quantity
* @returns {mixed} int or null
*/
function quantityValue(q) {
    return q && typeof q.value === 'number' ? q.value : null;
}
module.exports.quantityValue = quantityValue;
/**
 * paymentMethod
 * @param {dw.order.Order}- order
 * @returns {string} paymentMethod
 */
module.exports.paymentMethod = function paymentMethod(ORDER) {
    let orderPaymentMethod = '';
    try {
        if (ORDER.paymentInstruments.length > 0 && ORDER.paymentInstruments[0].custom && 'adyenPaymentMethod' in ORDER.paymentInstruments[0].custom) {
            let adyenPaymentMethod = ORDER.paymentInstruments[0].custom.adyenPaymentMethod;
            if (ORDER.paymentInstruments[0].paymentTransaction && ORDER.paymentInstruments[0].paymentTransaction.custom && 'Adyen_log' in ORDER.paymentInstruments[0].paymentTransaction.custom) {
                const orderPaymentMethodAdyenLog = JSON.parse(ORDER.paymentInstruments[0].paymentTransaction.custom.Adyen_log);
                let additionalData = orderPaymentMethodAdyenLog.additionalData;
                if (additionalData && additionalData.paymentMethod) {
                    orderPaymentMethod = additionalData.paymentMethod;
                } else if (orderPaymentMethodAdyenLog && orderPaymentMethodAdyenLog.paymentMethod) {
                    orderPaymentMethod = orderPaymentMethodAdyenLog.paymentMethod;

                    //Handling for when adyen returns an object instead of a string.
                    if(orderPaymentMethod instanceof Object && 'brand' in orderPaymentMethod) {
                        orderPaymentMethod = orderPaymentMethod.brand;
                    }

                } else if (adyenPaymentMethod && adyenPaymentMethod.toLowerCase() !== 'credit card' && !adyenPaymentMethod.includes('*')) {
                    orderPaymentMethod = adyenPaymentMethod.replace(/<[^>]+>/g, '');
                }
            }
        }

        return orderPaymentMethod ? orderPaymentMethod.toLowerCase() : '';
    } catch (e) {
        orderPaymentMethod = '';
        const Logger = require('dw/system/Logger');
        Logger.error('Error in tealiumUtil.js: ' + e.message);
    }

    return '';
    
}
/**
* pricebook
* @param {dw.catalog.PriceBook} pb - priceBook
* @returns {object} mapped priceBook
*/
function mapPriceBook(pb) {
    if (!pb) {
        return null;
    }
    return {
        currencyCode: pb.currencyCode,
        description: pb.description,
        displayName: pb.displayName,
        ID: pb.ID,
        online: pb.online,
        parentPriceBook: mapPriceBook(pb.parentPriceBook)
    }
}
module.exports.mapPriceBook = mapPriceBook;

/**
* mapPromotion
* @param {dw.order.Promotion} p - promotion
* @returns {Object} mapped promotion
*/
function mapPromotion(p) {
    if (!p) {
        return null;
    }
    return {
        ID: p.ID,
        name: p.name,
        active: p.active,
        promotionClass: p.promotionClass,
        exclusivity: p.exclusivity,
        qualifierMatchMode: p.qualifierMatchMode,
        rank: p.rank,
        basedOnCoupons: p.basedOnCoupons,
        coupons: collections.map(p.coupons || [], function (s) {
            return {
                ID: s.ID
            };
        }),
        basedOnSourceCodes: p.basedOnSourceCodes,
        sourceCodeGroups: collections.map(p.sourceCodeGroups || [], function (s) {
            return {
                ID: s.ID
            };
        }),
        basedOnCustomerGroups: p.basedOnCustomerGroups,
        customerGroups: collections.map(p.customerGroups || [], function (s) {
            return {
                ID: s.ID
            };
        })
    };
}
module.exports.mapPromotion = mapPromotion;

/**
* mapPromotion
* @param {dw.order.PriceAdjustment} p - priceAdjustment
* @returns {Object} mapped priceAdjustment
*/
function mapPriceAdjustment(p) {
    var pCampaign = p.campaign || {};
    var pCouponLineItem = p.couponLineItem || {};
    var pAppliedDiscount = p.appliedDiscount || {};
    return {
        price: priceValue(p.price),
        campaign: p.campaign ? {
            ID: pCampaign.ID,
            description: pCampaign.description
        } : null,
        couponLineItem: p.couponLineItem ? {
            couponCode: pCouponLineItem.couponCode,
            statusCode: pCouponLineItem.statusCode,
            valid: pCouponLineItem.valid
        } : null,
        sourceCodeFromSession: session && session.sourceCodeInfo && session.sourceCodeInfo.code,
        promotion: mapPromotion(p.promotion),
        appliedDiscount: pAppliedDiscount ? {
            type: pAppliedDiscount.type,
            quantity: pAppliedDiscount.quantity
        } : null
    };
};
module.exports.mapPriceAdjustment = mapPriceAdjustment;

/**
* mapCouponLineItem
* @param {dw.order.CouponLineItem} couponLineItem - couponLineItem
* @returns {Object} mapped couponLineItem
*/
module.exports.mapCouponLineItem = function mapCouponLineItem(couponLineItem) {
    if (!couponLineItem) {
        return;
    }
    return {
        applied: couponLineItem.applied,
        couponCode: couponLineItem.couponCode,
        rewardFlowType: couponLineItem.custom.loyaltyRewardFlowType,
        priceAdjustments: (couponLineItem.priceAdjustments) ? collections.map(couponLineItem.priceAdjustments, function (m) {
            return mapPriceAdjustment(m);
        }) : []
    };
};

/**
* mapProratedPriceAdjustmentPrices
* - hash map of discounted prices to priceAdjustment responsible for adjustment
* @param {dw.util.Map} proratedPriceAdjustmentPrices - map of { Money_discounted: PriceAdjustment }
* @returns {Array} mapped [{ moneyValue: int, priceAdjustment: {}  }]
*/
function mapProratedPriceAdjustmentPrices(proratedPriceAdjustmentPrices) {
    if (!proratedPriceAdjustmentPrices) {
        return;
    }
    const priceAdjustments = proratedPriceAdjustmentPrices.keySet().toArray();
    return collections.map(
        proratedPriceAdjustmentPrices.values(),
        function mapPAP(money, index) {
            return {
                proratedPriceAdjustmentPriceValue: priceValue(money),
                priceAdjustment: mapPriceAdjustment(priceAdjustments[index])
            }
        }
    );
};
module.exports.mapProratedPriceAdjustmentPrices = mapProratedPriceAdjustmentPrices;

/**
* ProductLineItem
* @param {dw.order.ProductLineItem} productLineItem - productLineItem
* @returns {Object} mapped productLineItem
*/
module.exports.mapProductLineItem = function mapProductLineItem(productLineItem) {
    if (!productLineItem) {
        return;
    }
    var bopisStock = false;
    var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
    var preSelectedStoreCookie = cookieHelper.read('preSelectedStore');
    var bopisMsg = ('instoreAvailability' in productLineItem.custom && productLineItem.custom.instoreAvailability) && ('storeAvailabilityMsg' in productLineItem.custom && productLineItem.custom.storeAvailabilityMsg) ? 
                   productLineItem.custom.storeAvailabilityMsg : Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
    if (preSelectedStoreCookie) {
        var storeData = JSON.parse(preSelectedStoreCookie);
        var storeID = storeData && storeData.ID;
        if (storeID) {
           if ('instoreAvailability' in productLineItem.custom && productLineItem.custom.instoreAvailability) {
               bopisStock = true;
           } else {
               bopisStock = false;
           }
        } else {
            bopisMsg = Resource.msg('cart.store.tealium.pickup.selectstore', 'storeLocator', null);
        }
    }
    return {
        productID: productLineItem.productID,
        category: productLineItem.category
          ? {
              displayName: productLineItem.category.displayName,
              ID: productLineItem.category.ID
          } : null,
        categoryID: productLineItem.categoryID,
        adjustedGrossPriceValue: priceValue(productLineItem.adjustedGrossPrice),
        adjustedNetPriceValue: priceValue(productLineItem.adjustedNetPrice),
        adjustedPriceValue: priceValue(productLineItem.adjustedPrice),
        adjustedTaxValue: priceValue(productLineItem.adjustedTax),
        proratedPriceValue: priceValue(productLineItem.proratedPrice),
        proratedPriceAdjustmentPrices:  mapProratedPriceAdjustmentPrices(productLineItem.proratedPriceAdjustmentPrices),
        quantityValue: productLineItem.quantityValue,
        product: mapProduct(productLineItem.product),
        bopis: ('fromStoreId' in productLineItem.custom && productLineItem.custom.fromStoreId) && ('instoreAvailability' in productLineItem.custom && productLineItem.custom.instoreAvailability) ? true : false,
        bopis_selected: ('fromStoreId' in productLineItem.custom && productLineItem.custom.fromStoreId) && ('instoreAvailability' in productLineItem.custom && productLineItem.custom.instoreAvailability) ? true : false,
        bopis_available: 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled') && (productLineItem.product.custom.availableForInStorePickup !== false),
        bopis_stock: bopisStock,
        bopis_message: bopisMsg,
        store_id: 'fromStoreId' in productLineItem.custom && productLineItem.custom.fromStoreId ? productLineItem.custom.fromStoreId : undefined,
        productUUID: productLineItem.UUID
    };
};

/**
* mapProductPriceModel
* @param {dw.catalog.ProductPriceModel} pm - productPriceModel
* @returns {Object} mapped product
*/
function mapPriceModel(pm){
    return {
        priceFactoryListPriceValue: priceValue(priceFactory.getListPrice(pm)),
        basePriceQuantityValue: quantityValue(pm.basePriceQuantity),
        'maxPriceNote': 'max for all variants of qty 1',
        maxPriceValue: priceValue(pm.maxPrice),
        'minPriceNote': 'min for all variants of qty 1',
        minPriceValue: priceValue(pm.minPrice),
        priceValue: priceValue(pm.price),
        // dw.catalog.ProductPriceInfo
        priceInfos: collections.map(pm.priceInfos, function (pi) {
            return {
                percentage: pi.percentage,
                priceValue: priceValue(pi.price),
                priceBook: mapPriceBook(pi.priceBook),
                priceInfo: pi.priceInfo
            };
        }),
        priceRange: pm.priceRange,
    };
}
/**
* mapOutOfStock
* @param {dw.catalog.Product} p - product
* @returns {String} product availability
*/
function mapOutOfStock(p) {
    var outOfStock = 'yes';
    if (p.availabilityModel) {
        outOfStock = p.availabilityModel.availability > 0 ? 'no' : 'yes';
    }
    return outOfStock;
}
/**
* mapProduct
* @param {dw.catalog.Product} p - product
* @returns {Object} mapped product
*/
function mapProduct(p) {
    if (!p) {
        return null;
    }
    return {
      ID: p.ID,
      master: p.master,
      productSet: p.productSet,
      online: p.online,
      searchable: p.searchable,
      name: p.name,
      isVariant: p.isVariant(),
      isProduct: p.isProduct(),
      custom: {
          sku: 'sku' in p.custom ? p.custom.sku : null,
          color: 'color' in p.custom ? p.custom.color : null,
          size: 'size' in p.custom ? p.custom.size : null,
          style: 'style' in p.custom ? p.custom.style : null,
          silhouette: 'silhouette' in p.custom ? p.custom.silhouette : null,
          gender: 'gender' in p.custom ? p.custom.gender : null,
          preorder: 'isPreOrder' in p.custom ? p.custom.isPreOrder : null,
          availableForInStorePickup : 'availableForInStorePickup' in p.custom ? p.custom.availableForInStorePickup !== false : false,
          icons: 'icons' in p.custom ? p.custom.icons : null // feature/benefit icons
      },
      priceModel: mapPriceModel(p.priceModel),
      outOfStock: mapOutOfStock(p)
    };
}
module.exports.mapProduct = mapProduct;

/**
* getSitePriceBooks
* @returns {Array} pricebooks
*/
function getSitePriceBooks() {
    const PriceBookMgr = require('dw/catalog/PriceBookMgr');
    return collections.map(PriceBookMgr.getSitePriceBooks(), mapPriceBook)
}

/**
* get the currently active AB test data
* @returns {object} JSON object with currently active AB test data
*/
function getABTestData() {
    var testSegments =  require('dw/campaign/ABTestMgr').getAssignedTestSegments();
    if(testSegments.length < 1) {
        return {};
    }
    var testSegment = testSegments.toArray()[testSegments.length - 1];
    var testVariant =  {   
        campaignId: testSegment.getABTest().ID,
        experienceId: testSegment.ID,
        testGroup: !testSegment.isControlSegment(),
        controlGroup: testSegment.isControlSegment()
    }
    return testVariant;
}

/**
* get the currently active AB test data
* @returns {object} JSON object with currently active AB test data
*/
function getfeatures() {
    var features = ''
    return features + 'isQuickATCenabled' in dw.system.Site.current.preferences.custom && dw.system.Site.current.getCustomPreferenceValue('isQuickATCenabled') ? 'quick_atb'  : '';
}

module.exports.getSitePriceBooks = getSitePriceBooks;
module.exports.getABTestData = getABTestData;
module.exports.getfeatures = getfeatures;
