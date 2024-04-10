'use strict';

/* Script modules */
/**
 * This module extends cartHelpers.js as defined in app_storefront_base. It exports
 * everything from the base module and overrides or adds to module.exports.
 */
var base = require('app_storefront_base/cartridge/scripts/cart/cartHelpers');
var collections = require('*/cartridge/scripts/util/collections');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var arrayHelper = require('*/cartridge/scripts/util/array');
var StoreMgr = require('dw/catalog/StoreMgr');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var instorePickupStoreHelper = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
var ProductMgr = require('dw/catalog/ProductMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var UUIDUtils = require('dw/util/UUIDUtils');
var Logger = require('dw/system/Logger');
const eGiftCard = 'EGIFT_CARD';
var ShippingMgr = require('dw/order/ShippingMgr');

/**
 * Adds a line item for this product to the Cart
 *
 * @param {dw.order.Basket} currentBasket -
 * @param {dw.catalog.Product} product -
 * @param {number} quantity - Quantity to add
 * @param {string[]}  childProducts - the products' sub-products
 * @param {dw.catalog.ProductOptionModel} optionModel - the product's option model
 * @param {dw.order.Shipment} defaultShipment - the cart's default shipment method
 * @param {boolean} isGiftItem - Update the gift info to product line item
 * @param {string} giftMessage - Update the gift message info to product line item
 * @return {dw.order.ProductLineItem} - The added product line item
 */
function addLineItem(
    currentBasket,
    product,
    quantity,
    childProducts,
    optionModel,
    defaultShipment,
    isGiftItem,
    giftMessage
) {
    var productLineItem = currentBasket.createProductLineItem(
        product,
        optionModel,
        defaultShipment
    );

    if (product.bundle && childProducts.length) {
        base.updateBundleProducts(productLineItem, childProducts);
    }

    productLineItem.setQuantityValue(quantity);
    if (isGiftItem) {
        productLineItem.gift = isGiftItem;
        productLineItem.giftMessage = giftMessage;
    }
    // Assigning sku custom attribute PHX-1746
    productLineItem.custom.sku = 'sku' in productLineItem.product.custom ? productLineItem.product.custom.sku : '';

    return productLineItem;
}

/**
 * Adds as new line item for this product to the Cart
 *
 * @param {dw.order.Basket} currentBasket -
 * @param {dw.catalog.Product} product -
 * @param {number} quantity - Quantity to add
 * @param {string[]}  childProducts - the products' sub-products
 * @param {dw.catalog.ProductOptionModel} optionModel - the product's option model
 * @param {dw.order.Shipment} defaultShipment - the cart's default shipment method
 * @param {boolean} isGiftItem - Update the gift info to product line item
 * @param {string} giftMessage - Update the gift message info to product line item
 * @return {dw.order.ProductLineItem} - The added product line item
 */
function addNewLineItem(currentBasket, product, quantity, childProducts, optionModel, defaultShipment, isGiftItem, giftMessage) {
    var productLineItem;
    const Site = require('dw/system/Site');
    if ('replaceableProductID' in Site.getCurrent().getPreferences().getCustom() && !empty(Site.getCurrent().getCustomPreferenceValue('replaceableProductID'))) {
        var replaceableProductID = Site.getCurrent().getCustomPreferenceValue('replaceableProductID');
        var replaceableProduct = ProductMgr.getProduct(replaceableProductID);
        if (!empty(replaceableProduct)) {
            var shipment = defaultShipment;
            productLineItem = currentBasket.createProductLineItem(replaceableProduct.ID, shipment);
            productLineItem.replaceProduct(product);
            productLineItem.setQuantityValue(quantity);

            if (isGiftItem) {
                productLineItem.gift = isGiftItem;
                productLineItem.giftMessage = giftMessage;
            }

            if (isGiftItem) {
                productLineItem.gift = isGiftItem;
                productLineItem.giftMessage = giftMessage;
            }

            // Assigning sku custom attribute PHX-1746
            productLineItem.custom.sku = 'sku' in productLineItem.product.custom ? productLineItem.product.custom.sku : '';
        }
    }
    return productLineItem;
}

/**
 * Sets a flag to exclude the quantity for a product line item matching the provided UUID.  When
 * updating a quantity for an already existing line item, we want to exclude the line item's
 * quantity and use the updated quantity instead.
 * @param {string} selectedUuid - Line item UUID to exclude
 * @param {string} itemUuid - Line item in-process to consider for exclusion
 * @return {boolean} - Whether to include the line item's quantity
 */
function excludeUuid(selectedUuid, itemUuid) {
    return selectedUuid
        ? itemUuid !== selectedUuid
        : true;
}

// eslint-disable-next-line valid-jsdoc spellcheck/spell-checker
/**
 * Sets a flag whether the current product line item is present in the wishlist and saved for later or not
 * @param {dw.order.Basket} currentBasket -
 * @param {dw.customer.ProductList} list -
 * @param {dw.customer.ProductList} wishlist -
 * @return {Object} savedForLaterList - Whether line Item Exists in  WishList or not
 */
function isListItemExistInBasket(currentBasket, list) {
    var savedForLaterList = {};
    if (!empty(currentBasket)) {
        collections.forEach(currentBasket.getProductLineItems(), function (pli) {
            savedForLaterList[pli.UUID] = false;
            if (list != null && list.length > 0) {
                collections.forEach(list[0].items, function (listItem) {
                    if (listItem.productID === pli.productID) {
                        savedForLaterList[pli.UUID] = true;
                    }
                });
            }
        });
    }
    return savedForLaterList;
}

// eslint-disable-next-line valid-jsdoc
/**
 * Removes product line item upon clicking of save for later in cart page
 * @param {dw.system.Request} req - Current Request
 * @param {dw.order.Basket} currentBasket -
 */
function removePLItem(req, currentBasket, bonusProductsUUIDs) {
    if (req.querystring.pid && req.querystring.uuid) {
        var productLineItems = currentBasket.getAllProductLineItems(req.querystring.pid);
        var bonusProductLineItems = currentBasket.bonusLineItems;
        var mainProdItem;
        collections.forEach(productLineItems, function (item) {
            if ((item.UUID === req.querystring.uuid)) {
                if (bonusProductLineItems && bonusProductLineItems.length > 0) {
                    collections.forEach(bonusProductLineItems, function (bonusItem) {
                        mainProdItem = bonusItem.getQualifyingProductLineItemForBonusProduct();
                        if (mainProdItem !== null
                            && (mainProdItem.productID === item.productID)) {
                            // eslint-disable-next-line no-undef
                            bonusProductsUUIDs.push(bonusItem.UUID);
                        }
                    });
                }

                var shipmentToRemove = item.shipment;
                currentBasket.removeProductLineItem(item);
                if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                    currentBasket.removeShipment(shipmentToRemove);
                }
                return;
            }
        });
    }
    return bonusProductsUUIDs;
}

/**
 * Calculate the quantities for any existing instance of a product, either as a single line item
 * with the same or different options, as well as inclusion in product bundles.  Providing an
 * optional "uuid" parameter, typically when updating the quantity in the Cart, will exclude the
 * quantity for the matching line item, as the updated quantity will be used instead.  "uuid" is not
 * used when adding a product to the Cart.
 *
 * @param {string} productId - ID of product to be added or updated
 * @param {dw.util.Collection<dw.order.ProductLineItem>} lineItems - Cart product line items
 * @param {string} [uuid] - When provided, excludes the quantity for the matching line item
 * @param {string} fromStoreId - When provided, excludes the quantity for the matching line item
 * @return {number} - Total quantity of all instances of requested product in the Cart and being
 *     requested
 */
function getQtyAlreadyInCart(productId, lineItems, uuid, fromStoreId) {
    var qtyAlreadyInCart = 0;

    collections.forEach(lineItems, function (item) {
        var itemStoreId = item.custom && 'fromStoreId' in item.custom ? item.custom.fromStoreId : null;

        if (item.bundledProductLineItems.length) {
            collections.forEach(item.bundledProductLineItems, function (bundleItem) {
                if (bundleItem.productID === productId && excludeUuid(uuid, bundleItem.UUID)) {
                    qtyAlreadyInCart += bundleItem.quantityValue;
                }
            });
        } else if (item.productID === productId && fromStoreId === itemStoreId && excludeUuid(uuid, item.UUID)) {
            qtyAlreadyInCart += item.quantityValue;
        }
    });
    return qtyAlreadyInCart;
}


/**
 * Calculate the quantities of products in the cart that belong to the same master product
 *
 * @param {dw.catalog.Product} product - Product to be added or updated
 * @param {dw.util.Collection<dw.order.ProductLineItem>} lineItems - Cart product line items
 * @returns {number} - Total quantity of requested product's master product in the Cart
 */
function getQtyAlreadyInCartWithSameMaster(product, lineItems) {
    var masterQtyInCart = 0;

    collections.forEach(lineItems, function (item) {
        if (product.masterProduct.ID === item.product.masterProduct.ID) {
            masterQtyInCart += item.quantityValue;
        }
    });
    return masterQtyInCart;
}

/**
 * Determines whether a product's current options are the same as those just selected
 *
 * @param {dw.util.Collection} existingOptions - Options currently associated with this product
 * @param {SelectedOption[]} selectedOptions - Product options just selected
 * @return {boolean} - Whether a product's current options are the same as those just selected
 */
function sameOptions(existingOptions, selectedOptions) {
    var selected = {};
    for (var i = 0, j = selectedOptions.length; i < j; i++) {
        selected[selectedOptions[i].optionId] = selectedOptions[i].selectedValueId;
    }
    return collections.every(existingOptions, function (option) {
        return option.optionValueID === selected[option.optionID];
    });
}
/**
 * Determines whether provided Bundle items are in the list of submitted bundle item IDs
 *
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Bundle item IDs
 *     currently in the Cart
 * @param {string[]} childProducts - List of bundle items for the submitted Bundle under
 *     consideration
 * @return {boolean} - Whether provided Bundle items are in the list of submitted bundle item IDs
 */
function bundleItemsSame(productLineItems, childProducts) {
    return collections.every(productLineItems, function (item) {
        return arrayHelper.find(childProducts, function (childProduct) {
            return item.productID === childProduct.pid;
        });
    });
}
/**
 * Find all line items that contain the product specified.  A product can appear in different line
 * items that have different option selections or in product bundles.
 *
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @return {Object} properties includes,
 *                  matchingProducts - collection of matching products
 *                  uuid - string value for the last product line item
 * @return {dw.order.ProductLineItem[]} - Filtered list of product line items matching productId
 */
function getAllMatchingProducts(productId, productLineItems) {
    var matchingProducts = [];
    var uuid;
    collections.forEach(productLineItems, function (item) {
        if (item.productID === productId) {
            matchingProducts.push(item);
            uuid = item.UUID;
        }
    });
    return {
        matchingProducts: matchingProducts,
        uuid: uuid
    };
}
/**
 * Filter all the product line items matching productId and
 * has the same bundled items or options in the cart
 * @param {dw.catalog.Product} product - Product object
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @return {dw.order.ProductLineItem[]} - Filtered all the product line item matching productId and
 *     has the same bundled items or options
 */
function getAllExistingProductLineItemsInCart(product, productId, productLineItems, childProducts, options) {
    var matchingProductsObj = getAllMatchingProducts(productId, productLineItems);
    var matchingProducts = matchingProductsObj.matchingProducts;
    var productLineItemsInCart = matchingProducts.filter(function (matchingProduct) {
        return product.bundle
            ? bundleItemsSame(matchingProduct.bundledProductLineItems, childProducts)
            : sameOptions(matchingProduct.optionProductLineItems, options || []);
    });

    return productLineItemsInCart;
}
/**
 * Filter the product line item matching productId and
 * has the same bundled items or options in the cart
 * @param {dw.catalog.Product} product - Product object
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @return {dw.order.ProductLineItem} - get the first product line item matching productId and
 *     has the same bundled items or options
 */
function getAllExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options) {
    return getAllExistingProductLineItemsInCart(product, productId, productLineItems, childProducts, options);
}
/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @param {string} storeId - store id
 * @param {Object} req - The local instance of the request object
 * @param {boolean} isGiftItem - Update the gift info to product line item
 * @param {string} giftMessage - Update the gift message info to product line item
 * @param {boolean} bypassMAOCheck - set this to true if you are passing in maoItemsArray with all items in the cart (used for merge cart process)
 *  @return {Object} returns an error object
 */

/**
 * Determines whether a product's current instore pickup store setting are
 * the same as the previous selected
 *
 * @param {string} existingStoreId - store id currently associated with this product
 * @param {string} selectedStoreId - store id just selected
 * @return {boolean} - Whether a product's current store setting is the same as
 * the previous selected
 */
function hasSameStore(existingStoreId, selectedStoreId) {
    return existingStoreId === selectedStoreId;
}

/**
 * Get the existing in store pickup shipment in cart by storeId
 * @param {dw.order.Basket} basket - the target Basket object
 * @param {string} storeId - store id
 * @return {dw.order.Shipment} returns Shipment object if the existing shipment has the same storeId
 */
function getInStorePickupShipmentInCartByStoreId(basket, storeId) {
    var existingShipment = null;
    if (basket && storeId) {
        var shipments = basket.getShipments();
        if (shipments.length) {
            existingShipment = arrayHelper.find(shipments, function (shipment) {
                return hasSameStore(shipment.custom.fromStoreId, storeId);
            });
        }
    }
    return existingShipment;
}

/**
 * create a new instore pick shipment if the store shipment
 * is not exist in the basket for adding product line item
 * @param {dw.order.Basket} basket - the target Basket object
 * @param {string} storeId - store id
 * @param {Object} req - The local instance of the request object
 * @return {dw.order.Shipment} returns Shipment object
 */
function createInStorePickupShipmentForLineItem(basket, storeId, req) {
    var shipment = null;
    if (basket && storeId) {
        // check if the instore pickup shipment is already exist.
        shipment = getInStorePickupShipmentInCartByStoreId(basket, storeId);
        if (!shipment) {
            // create a new shipment to put this product line item in
            shipment = basket.createShipment(UUIDUtils.createUUID());
            shipment.custom.fromStoreId = storeId;
            shipment.custom.shipmentType = 'in-store';
            req.session.privacyCache.set(shipment.UUID, 'valid');

            // Find in-store method in shipping methods.
            var shippingMethods =
                ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods();
            var shippingMethod = collections.find(shippingMethods, function (method) {
                return method.custom.storePickupEnabled;
            });
            var store = StoreMgr.getStore(storeId);
            var storeAddress = {
                address: {
                    firstName: store.name,
                    lastName: store.name,
                    address1: store.address1,
                    address2: store.address2,
                    city: store.city,
                    stateCode: store.stateCode,
                    postalCode: store.postalCode,
                    countryCode: store.countryCode.value,
                    phone: store.phone
                },
                shippingMethod: shippingMethod.ID
            };
            COHelpers.copyShippingAddressToShipment(storeAddress, shipment);
        }
    }
    return shipment;
}

/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @param {string} storeId - store id
 * @param {Object} req - The local instance of the request object
 * @param {boolean} isGiftItem - if it is a gift item
 * @param {string} giftMessage - the gift message
 * @param {boolean} bypassMAOCheck - skip product MAO inventory check
 * @return {Object} returns an object
 */
function addProductToCart(currentBasket, productId, quantity, childProducts, options, storeId, req, isGiftItem, giftMessage, bypassMAOCheck) {
    var Site = require('dw/system/Site');
    const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
    // eslint-disable-next-line spellcheck/spell-checker
    var Availability = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailability') : {};
    const AvailabilityHelper = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper') : {};
    var realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
    var bopisEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var availableToSell = 0;
    var shipment = currentBasket.defaultShipment;
    var perpetual;
    var product = ProductMgr.getProduct(productId);
    var productInCart;
    var productsInCart;
    var productLineItems = currentBasket.productLineItems;
    var productLineItem;
    var productQuantityInCart;
    var masterQuantityInCart;
    var remainingQty;
    var remainingATS;
    var qtyLimitReached;
    var outOfStock;
    var masterQtyLimit = product.custom.masterQtyLimit ? product.custom.masterQtyLimit : null;
    var lineItemQuantity = isNaN(quantity) ? base.DEFAULT_LINE_ITEM_QUANTITY : quantity;
    var quantityToSet;
    var optionModel = productHelper.getCurrentOptionModel(product.optionModel, options);
    var result = {
        error: false,
        // eslint-disable-next-line spellcheck/spell-checker
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };
    var isPickupItem = req.form && req.form.isPickupItem === 'true';
    var storeId = isPickupItem && storeId ? storeId : null; // eslint-disable-line

    var totalQtyRequested = 0;
    var canBeAdded = false;
    var maoAvailability = 0;
    let skipMAOCheck = typeof bypassMAOCheck === 'boolean' ? bypassMAOCheck : false;

    if (product.bundle) {
        canBeAdded = base.checkBundledProductCanBeAdded(childProducts, productLineItems, lineItemQuantity);
    } else {
        totalQtyRequested = lineItemQuantity + getQtyAlreadyInCart(productId, productLineItems);
        perpetual = !empty(product.availabilityModel.inventoryRecord) ? product.availabilityModel.inventoryRecord.perpetual : false;
        var items = null;

        if (Object.prototype.hasOwnProperty.call(product.custom, 'sku') && product.custom.sku) {
            items = [product.custom.sku];
        } else {
            Logger.getLogger('mao_availability').info('MAOEmptySKU (cartHelpers.js) : Product {0} has empty sku', product.ID);
        }
        if (isMAOEnabled) {
            var isCheckPointEnabled = AvailabilityHelper.isCheckPointEnabled('AddToCart');
            if (realTimeInventoryCallEnabled && isCheckPointEnabled && !skipMAOCheck && (!('giftCard' in product.custom) || !(product.custom.giftCard.value === eGiftCard))) {
                if (!empty(items)) {
                    maoAvailability = Availability.getMaoAvailability(items);
                }
            }
        }
        availableToSell = validationHelpers.getLineItemInventory(product, true, maoAvailability, storeId);

        canBeAdded = ((perpetual || totalQtyRequested <= availableToSell) || isNaN(totalQtyRequested));
    }
    var messages;
    if (!canBeAdded) {
        result.error = true;
        if (availableToSell > 0) {
            messages = [];
            messages.push(
                Resource.msgf(
                    'label.quantity.in.stock',
                    'common',
                    null,
                    availableToSell
                )
            );
            messages.push(Resource.msg('label.not.available.items', 'common', null));
        } else {
            messages = { outOfStockMsg: Resource.msg('label.not.available', 'common', null), isNotAvailable: true };
        }
        result.message = JSON.stringify(messages);
        return result;
    }
    productsInCart = getAllExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options);
    for (let m = 0; m < productsInCart.length; m++) {
        if (isPickupItem && storeId) {
            productInCart = productsInCart[m].shipment.custom.fromStoreId === storeId ? productsInCart[m] : null;
        } else {
            productInCart = !productsInCart[m].shipment.custom.fromStoreId ? productsInCart[m] : null;
        }
    }

    if (product.custom.giftCard.value === eGiftCard) {
        var giftCardForm = JSON.parse(req.form.eGiftCardData);
        var giftCardValidations = COHelpers.giftCardCharactersValidations(giftCardForm);
        if (giftCardValidations.error) {
            result.error = true;
            messages = { giftCardError: giftCardValidations.giftCardErrors };
            result.message = JSON.stringify(messages);
        } else {
            productLineItem = addNewLineItem(currentBasket, product, lineItemQuantity, childProducts, optionModel, shipment, isGiftItem, giftMessage);
            result.uuid = productLineItem.UUID;
        }
    } else if (productInCart) {
        productQuantityInCart = productInCart.quantity.value;
        quantityToSet = lineItemQuantity ? lineItemQuantity + productQuantityInCart : productQuantityInCart + 1;
        if (!masterQtyLimit) {
            if (availableToSell >= quantityToSet || perpetual) {
                productInCart.setQuantityValue(quantityToSet);
                result.uuid = productInCart.UUID;
            } else {
                result.error = true;
                messages = [];
                messages.push(availableToSell === productQuantityInCart
                    ? Resource.msg('error.alert.max.quantity.in.cart', 'product', null)
                    : Resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null));
                result.message = JSON.stringify(messages);
            }
        } else {
            masterQuantityInCart = getQtyAlreadyInCartWithSameMaster(product, productLineItems);
            remainingQty = Math.max(masterQtyLimit - masterQuantityInCart, 0);
            remainingATS = Math.max(availableToSell - productQuantityInCart, 0);
            outOfStock = remainingATS < lineItemQuantity;
            qtyLimitReached = remainingQty < lineItemQuantity;

            if (!outOfStock && !qtyLimitReached) {
                productInCart.setQuantityValue(quantityToSet);
                result.uuid = productInCart.UUID;
            } else {
                result.error = true;
                messages = [];
                messages.push(qtyLimitReached
                    ? 'masterQtyLimitError'
                    : Resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null));
                result.message = JSON.stringify(messages);
            }
        }
    } else {
        if (masterQtyLimit) {
            masterQuantityInCart = getQtyAlreadyInCartWithSameMaster(product, productLineItems);
            remainingQty = Math.max(masterQtyLimit - masterQuantityInCart, 0);
            outOfStock = availableToSell < lineItemQuantity;
            qtyLimitReached = remainingQty < lineItemQuantity;

            if (outOfStock || qtyLimitReached) {
                result.error = true;
                messages = [];
                messages.push(qtyLimitReached
                    ? 'masterQtyLimitError'
                    : Resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null));
                result.message = JSON.stringify(messages);
                return result;
            }
        }
        if (isPickupItem && storeId) {
            // Create a new instore pickup shipment for product line item
            // shipment if not exist in the basket
            shipment = createInStorePickupShipmentForLineItem(currentBasket, storeId, req);
        } else {
            shipment = currentBasket.defaultShipment;
            var fromStore = shipment.custom.fromStoreId;
            var inStoreShippingMethod = shipment.shippingMethod;
            if (shipment.custom.fromStoreId && shipment.productLineItems.length) {
                var pli = shipment.productLineItems;
                Transaction.wrap(function () {
                    if ('fromStoreId' in shipment.custom && !empty(shipment.custom.fromStoreId)) {
                        delete shipment.custom.fromStoreId;
                    }
                    if ('shipmentType' in shipment.custom && !empty(shipment.custom.shipmentType)) {
                        delete shipment.custom.shipmentType;
                    }
                    var uuid = UUIDUtils.createUUID();
                    shipment = currentBasket.createShipment(uuid);
                    shipment.custom.fromStoreId = fromStore;
                    shipment.custom.shipmentType = 'in-store';
                    shipment.setShippingMethod(inStoreShippingMethod);
                    var storeAddressID = fromStore;
                    var storeObj = StoreMgr.getStore(storeAddressID);
                    var storeAddress = {
                        address: {
                            firstName: storeObj.name,
                            lastName: storeObj.name,
                            address1: storeObj.address1,
                            address2: storeObj.address2,
                            city: storeObj.city,
                            stateCode: storeObj.stateCode,
                            postalCode: storeObj.postalCode,
                            countryCode: storeObj.countryCode.value,
                            phone: storeObj.phone
                        }
                    };
                    COHelpers.copyShippingAddressToShipment(storeAddress, shipment);
                    for (let m = 0; m < pli.length; m++) {
                        pli[m].setShipment(shipment);
                    }
                    currentBasket.defaultShipment.createShippingAddress();
                    var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
                    var shipmentModel = ShippingMgr.getShipmentShippingModel(shipment);
                    var applicableShippingMethods = shipmentModel.applicableShippingMethods;
                    if (collections.find(applicableShippingMethods, function (sMethod) {
                            return sMethod.ID === defaultShippingMethod.ID; // eslint-disable-line
                        })) { // eslint-disable-line
                        currentBasket.defaultShipment.setShippingMethod(defaultShippingMethod);
                    }
                });
            } else {
                if ('fromStoreId' in shipment.custom && !empty(shipment.custom.fromStoreId)) {
                    delete shipment.custom.fromStoreId;
                }
                if ('shipmentType' in shipment.custom && !empty(shipment.custom.shipmentType)) {
                    delete shipment.custom.shipmentType;
                }
            }
            shipment = currentBasket.defaultShipment;
        }
        productLineItem = addLineItem(
            currentBasket,
            product,
            lineItemQuantity,
            childProducts,
            optionModel,
            shipment,
            isGiftItem,
            giftMessage
        );
        // Once the new product line item is added, set the instore pickup fromStoreId for the item
        if (isPickupItem && productLineItem.product.custom.availableForInStorePickup) {
            if (storeId) {
                instorePickupStoreHelper.setStoreInProductLineItem(storeId, productLineItem);
            }
        }

        result.uuid = productLineItem.UUID;
    }
    if (!bopisEnabled) {
        COHelpers.ensureNoEmptyShipments(req);
        COHelpers.updateShipToAsDefaultShipment(req);
    }
    return result;
}

/**
 * This method returns the error messages if the inventory is not available while updating quantity or editing the line Item
 * @param {number} availableToSell - Number of items available to sell
 * @param {string} uuid - uuid of the lineItem
 * @returns {Object} result - error message object
 */
function getInventoryMessages(availableToSell, uuid) {
    var result = { error: false, messages: [], uuid: uuid };
    if (availableToSell > 0) {
        result.messages.push(
            Resource.msgf(
                'label.quantity.in.stock',
                'common',
                null,
                availableToSell
            )
        );
        result.error = false;
        result.messages.push(Resource.msg('label.not.available.items', 'common', null));
    } else {
        result.error = true;
        result.messages.push(Resource.msg('label.not.available.items.instock', 'common', null));
    }
    return result;
}

/**
 * This method returns the error messages if the inventory is not available while updating quantity or editing the line Item in cart page
 * @param {number} availableToSell - Number of items available to sell
 * @param {string} uuid - uuid of the lineItem
 * @param {string} requestedQuantity - requestedQuantity
 * @returns {Object} result - error message object
 */
function getCartInventoryMessages(availableToSell, uuid, requestedQuantity) {
    var result = { error: false, messages: [], uuid: uuid };
    if (availableToSell === 0) {
        result.error = true;
        result.messages.push(Resource.msg('label.not.available.items.instock', 'common', null));
    } else if (availableToSell < requestedQuantity) {
        result.messages.push(
            Resource.msgf(
                'label.quantity.in.stock',
                'common',
                null,
                availableToSell
            )
        );
        result.error = true;
        result.messages.push(Resource.msg('label.not.available.items', 'common', null));
    }
    return result;
}


/**
 * This method removes the in-eligible/not applied coupon codes if they exist from Basket
 * @param {dw.order.Basket} currentBasket - Basket
 * @param {boolean} isEmployee - isEmployee
 * @param {boolean} isVIP - isVIP
 */
function removeCouponLineItems(currentBasket, isEmployee, isVIP) {
    const PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    const isLoyaltyEnable = PreferencesUtil.getValue('isLoyaltyEnable');
    const { LOYALTY_PREFIX } = isLoyaltyEnable ? require('*/cartridge/scripts/LoyaltyConstants') : '';
    if (currentBasket.couponLineItems) {
        collections.forEach(currentBasket.couponLineItems, function (c) {
            if (!isLoyaltyEnable || (isLoyaltyEnable && isVIP) || (isLoyaltyEnable && isEmployee && !c.couponCode.includes(LOYALTY_PREFIX))) {
                currentBasket.removeCouponLineItem(c);
            }
        });
    }
}

/**
 * Removes ineligible coupons from basket that are not related to Loyality
 * @param {dw.order.Basket} basket - Basket
 * @returns {void}
 */
function removeIneligibleCouponsFromBasket(basket) {
    if (basket) {
        const PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        const isLoyaltyEnable = PreferencesUtil.getValue('isLoyaltyEnable');
        const { LOYALTY_PREFIX } = isLoyaltyEnable ? require('*/cartridge/scripts/LoyaltyConstants') : '';
        var couponLineItems = basket.getCouponLineItems();
        collections.forEach(couponLineItems, function (couponLineItem) {
            // Remove coupons that are not related to Loyalty
            // Loyalty related coupons that are not applied to the basket already being removed before placing an order
            // in cartridges/int_loyalty/cartridge/controllers/CheckoutServices.js > PlaceOrder route
            // and cartridges/int_ocapi/cartridge/hooks/shop/order/order_hook_scripts.js > beforePOST
            if (!couponLineItem.applied && couponLineItem.couponCode.indexOf(LOYALTY_PREFIX) === -1) {
                Transaction.wrap(function () {
                    basket.removeCouponLineItem(couponLineItem);
                });
            }
        });
    }
}

/**
 * This method return true if the basket contains pre-order item.
 * @param {dw.order.Basket} currentBasket - Basket
 * @returns {void}
 */
function hasPreOrderItems(currentBasket) {
    let isPreorder = false;
    if (!empty(currentBasket)) {
        collections.forEach(currentBasket.getProductLineItems(), function (item) {
            if (item.product) {
                const pvm = item.product.getVariationModel().getMaster();
                const master = ProductMgr.getProduct(pvm.ID);
                if (master.custom.isPreOrder != null && master.custom.isPreOrder) isPreorder = true;
                if (item.product.custom.isPreOrder != null && item.product.custom.isPreOrder) isPreorder = true;
            }
        });
    }
    return isPreorder;
}

/**
 * This method return maximum 10 wishlist items
 * @param {Object} wishlistItems - Wishlist items
 * @param {number} numberOfItems - number of items
 * @returns {Array} wishlistDisplayItems
 */
function getLimitedWishlistItems(wishlistItems, numberOfItems) {
    var wishlistDisplayItems = [];
    if (typeof wishlistItems === 'object' && wishlistItems.length > 0) {
        wishlistDisplayItems = wishlistItems.slice(0, numberOfItems);
    }
    return wishlistDisplayItems;
}
/**
 * Merge the LineItems
 * @param {dw.order.Basket} currentBasket - the basket object
 */
function mergeLineItems(currentBasket) {
    try {
        var sameProductLineItems = [];
        var obj = {};
        collections.forEach(currentBasket.getProductLineItems(), function (pli) {
            if (!('giftCard' in pli.product.custom) || pli.product.custom.giftCard.value !== eGiftCard) {
                obj.pid = pli.productID;
                obj.shipmentID = pli.shipment.ID;
                sameProductLineItems.push(obj);
            }
        });
        var mergedProductLineItems = [];
        for (let i = 0; i < sameProductLineItems.length; i++) {
            mergedProductLineItems = [];
            collections.forEach(currentBasket.getProductLineItems(), function (pli) { // eslint-disable-line
                if (sameProductLineItems[i].pid === pli.productID && sameProductLineItems[i].shipmentID === pli.shipment.ID) {
                    mergedProductLineItems.push(pli);
                }
            });
        }
        var quantityValue = 0;
        var uuidToRemove;
        var uuidToUpdate;
        for (let i = 0; i < mergedProductLineItems.length; i++) {
            quantityValue = mergedProductLineItems[i].quantityValue + quantityValue;
            if (!uuidToUpdate) {
                uuidToUpdate = mergedProductLineItems[0].UUID;
            } else {
                uuidToRemove = mergedProductLineItems[i].UUID;
            }
        }
        collections.forEach(currentBasket.getProductLineItems(), function (pli) {
            Transaction.wrap(function () {
                if (uuidToUpdate === pli.UUID) {
                    pli.setQuantityValue(quantityValue);
                } else if (uuidToRemove === pli.UUID) {
                    currentBasket.removeProductLineItem(pli);
                }
            });
        });
    } catch (e) {
        Logger.error('cartHelpers.js - Error while MergingLineItems: ' + e.message);
    }
}

/**
 * disables BOPIS for PLI that already exists in BOPIS shipment with max store inventory qty
 * @param {dw.order.Basket} currentBasket - the basket object
 * @param {number} instoreInventory - store inventory
 * @param {Object} PLI - pli
 */
function disableBOPISMatchingProduct(currentBasket, instoreInventory, PLI) {
    var bopisProduct;
    try {
        if (currentBasket && currentBasket.shipments.length > 1) {
            var bopisShipment = collections.find(currentBasket.shipments, function (shipment) {
                return shipment.custom.fromStoreId;
            });
            if (bopisShipment) {
                bopisProduct = collections.find(bopisShipment.productLineItems, function (pli) {
                    return pli.product.ID === PLI.product.ID;
                });
            }
            collections.forEach(currentBasket.shipments, function (shipment) {
                if (shipment && shipment.custom && !shipment.custom.fromStoreId) {
                    collections.forEach(shipment.productLineItems, function (pli) {
                        Transaction.wrap(function () {
                            if (bopisProduct && pli.product.ID === bopisProduct.product.ID && bopisProduct.quantityValue === instoreInventory && 'instoreAvailability' in pli.custom) {
                                pli.custom.instoreAvailability = false; // eslint-disable-line
                            }
                        });
                    });
                }
            });
        }
    } catch (e) {
        Logger.error('cartHelpers.js - Error while disableBOPISMatchingProduct: ' + e.message);
    }
}
/**
 * removes BOPIS shipment as default shipment when currentBasket has more than 1 shipments
 * @param {dw.order.Basket} currentBasket - the basket object
 */
function switchShipmentsBopis(currentBasket) {
    var shipments = currentBasket.shipments;
    if (shipments.length > 1) {
        var shipToAddress = collections.find(currentBasket.shipments, function (item) {
            return item.custom.fromStoreId && item.default;
        });
        var inStoreShipment = collections.find(currentBasket.shipments, function (item) {
            return !item.default && item.shippingMethodID !== 'eGift_Card';
        });
        if (shipToAddress && inStoreShipment) {
            Transaction.wrap(function () {
                // Swapping productLineItems
                var shipToAddressLineItems = shipToAddress.productLineItems;
                for (let index = 0; index < inStoreShipment.productLineItems.length; index++) {
                    inStoreShipment.productLineItems[index].setShipment(currentBasket.defaultShipment);
                }
                for (let index = 0; index < shipToAddressLineItems.length; index++) {
                    if ('custom' in shipToAddressLineItems[index] && shipToAddressLineItems[index].custom.fromStoreId) {
                        shipToAddressLineItems[index].setShipment(inStoreShipment);
                    }
                }

                var storeAddressID = shipToAddress.custom.fromStoreId;
                if (storeAddressID) {
                    delete shipToAddress.custom.fromStoreId;
                }
                var shipmentType = shipToAddress.custom.shipmentType;
                if (shipmentType) {
                    delete shipToAddress.custom.shipmentType;
                }
                var storeObj = StoreMgr.getStore(storeAddressID);
                var storeAddress = {
                    address: {
                        firstName: storeObj.name,
                        lastName: storeObj.name,
                        address1: storeObj.address1,
                        address2: storeObj.address2,
                        city: storeObj.city,
                        stateCode: storeObj.stateCode,
                        postalCode: storeObj.postalCode,
                        countryCode: storeObj.countryCode.value,
                        phone: storeObj.phone
                    }
                };
                var storeShippingMethod = shipToAddress.shippingMethod; // store-pickup
                shipToAddress.createShippingAddress(); // creating shipping address for bopis shipment
                if (inStoreShipment) {
                    var defaultShippingMethod = inStoreShipment.shippingMethod;
                    shipToAddress.setShippingMethod(defaultShippingMethod);
                    if (inStoreShipment.shippingAddress) {
                        // save the ship to home address if it already exist in basket
                        var shipToHomeAddress = inStoreShipment.shippingAddress;
                        var homeAddress = {
                            address: {
                                firstName: shipToHomeAddress.firstName,
                                lastName: shipToHomeAddress.lastName,
                                address1: shipToHomeAddress.address1,
                                address2: shipToHomeAddress.address2,
                                city: shipToHomeAddress.city,
                                stateCode: shipToHomeAddress.stateCode,
                                postalCode: shipToHomeAddress.postalCode,
                                countryCode: shipToHomeAddress.countryCode,
                                phone: shipToHomeAddress.phone
                            }
                        };
                        COHelpers.copyShippingAddressToShipment(homeAddress, shipToAddress);
                    }
                    collections.forEach(shipToAddress.productLineItems, function (PLI) {
                        if (PLI.custom) {
                            if (PLI.custom.fromStoreId) {
                                delete PLI.custom.fromStoreId; // eslint-disable-line
                            }
                            if (PLI.shipment.custom.fromStoreId) {
                                delete PLI.shipment.custom.fromStoreId; // eslint-disable-line
                            }
                            if (PLI.shipment.custom.shipmentType) {
                                delete PLI.shipment.custom.shipmentType; // eslint-disable-line
                            }
                        }
                    });
                    inStoreShipment.custom.fromStoreId = storeAddressID;
                    inStoreShipment.custom.shipmentType = shipmentType;
                    COHelpers.copyShippingAddressToShipment(storeAddress, inStoreShipment);
                    inStoreShipment.setShippingMethod(storeShippingMethod);
                }
            });
        }
    }
}
/**
 * Moves BOPIS item from BOPIS to ShipToAddress or removes from bag if the item is OOS in web and store.
 * @param {dw.order.Basket} currentBasket - the basket object
 * @param {dw.order.ProductLineItem} PLI - lineItem from basket.
 * @param {Object} maoAvailability - MAO availability
 * @returns {Object} - An object holds array of items moved to shipping and fully removed items.
 */
function moveItemFromBopisShipment(currentBasket, PLI, maoAvailability) {
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var results = {
        movedToShipping: false,
        fullyRemoved: false
    };
    try {
        if (currentBasket && currentBasket.shipments) {
            var matchingShipment = collections.find(currentBasket.shipments, function (item) {
                return !item.custom.fromStoreId;
            });
            var lineItemQtyLimit = validationHelpers.getLineItemInventory(PLI.product, true, maoAvailability, '');
            Transaction.wrap(function () {
                if (lineItemQtyLimit > 0) {
                    if (!matchingShipment) {
                        var uuid = UUIDUtils.createUUID(); // eslint-disable-line
                        matchingShipment = currentBasket.createShipment(uuid); // eslint-disable-line
                        var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod(); // eslint-disable-line
                        var shipmentModel = ShippingMgr.getShipmentShippingModel(matchingShipment); // eslint-disable-line
                        var applicableShippingMethods = shipmentModel.applicableShippingMethods; // eslint-disable-line
                        if (collections.find(applicableShippingMethods, function (sMethod) { // eslint-disable-line
                            return sMethod.ID === defaultShippingMethod.ID; // eslint-disable-line
                        })) { // eslint-disable-line
                            matchingShipment.setShippingMethod(defaultShippingMethod); // eslint-disable-line
                        }
                        matchingShipment.createShippingAddress();
                    }
                    if (matchingShipment.custom.fromStoreId) delete matchingShipment.custom.fromStoreId; // eslint-disable-line
                    if (matchingShipment.custom.shipmentType) delete matchingShipment.custom.fromStoreId;
                    PLI.setShipment(matchingShipment);
                    PLI.custom.instoreAvailability = false; // eslint-disable-line
                    if (PLI.custom.fromStoreId) {
                        delete PLI.custom.fromStoreId; // eslint-disable-line
                    }
                    if (PLI.shipment.custom.fromStoreId) {
                        delete PLI.shipment.custom.fromStoreId; // eslint-disable-line
                    }
                    if (PLI.shipment.custom.shipmentType) {
                        delete PLI.shipment.custom.shipmentType; // eslint-disable-line
                    }
                    results.movedToShipping = true;
                    mergeLineItems(currentBasket);
                } else {
                    results.fullyRemoved = true;
                }
                switchShipmentsBopis(currentBasket);
                collections.forEach(currentBasket.shipments, function (shipment) {
                    if (!shipment.default && shipment.productLineItems.empty) {
                        currentBasket.removeShipment(shipment);
                    }
                });
                mergeLineItems(currentBasket);
            });
        }
    } catch (e) {
        Logger.error('error while executing moveItemFromBopisShipment' + e.message);
    }
    return results;
}

/**
 * Splits qty for BOPIS items or removes from bag if the item is OOS in web and store.
 * @param {dw.order.Basket} currentBasket - the basket object
 * @param {dw.order.ProductLineItem} pli - lineItem from basket.
 * @param {string} storeInventory - store inventory qty.
 * @param {Object} maoAvailability - MAO availability
 * @returns {Object} - An object holds array of items those are splitted by qty and partially removed items.
 */
function splitItemFromBopisShipment(currentBasket, pli, storeInventory, maoAvailability) {
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var matchingProducts = [];
    var results = {
        partiallyMovedToShipping: false,
        partiallyRemoved: false
    };
    try {
        if (currentBasket && currentBasket.shipments) {
            Transaction.wrap(function () {
                // get the pli in currentBasket
                collections.forEach(currentBasket.productLineItems, function (item) {
                    if (item.product.ID === pli.productID) {
                        matchingProducts.push(item);
                    }
                });
                // get the same pli if it is present in standard shipment.
                var productInCart = matchingProducts.filter(function (matchingProduct) {
                    return !matchingProduct.shipment.custom.fromStoreId;
                });
                var sortedQuantity = (pli.quantityValue) - (storeInventory);
                pli.setQuantityValue(storeInventory);
                var lineItemQtyLimit = validationHelpers.getLineItemInventory(pli.product, true, maoAvailability, ''); // limit in web inventory
                var calculatedQuantity;
                if (lineItemQtyLimit === 0) {
                    calculatedQuantity = 0;
                } else if (lineItemQtyLimit >= sortedQuantity) {
                    calculatedQuantity = sortedQuantity;
                }
                // below code will execute if the item is in stock at web inventory
                if (calculatedQuantity > 0) {
                    if (productInCart.length) {
                        var productQuantityInCart = productInCart[0].quantity.value;
                        var quantityToSet = calculatedQuantity + productQuantityInCart;
                        productInCart[0].setQuantityValue(quantityToSet);
                    } else {
                        var shipments = currentBasket.shipments;
                        var shipment = currentBasket.defaultShipment;
                        if (shipments.length === 1) {
                            var uuid = UUIDUtils.createUUID(); // eslint-disable-line
                            shipment = currentBasket.createShipment(uuid); // eslint-disable-line
                            var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod(); // eslint-disable-line
                            var shipmentModel = ShippingMgr.getShipmentShippingModel(shipment); // eslint-disable-line
                            var applicableShippingMethods = shipmentModel.applicableShippingMethods; // eslint-disable-line
                            if (collections.find(applicableShippingMethods, function (sMethod) { // eslint-disable-line
                                return sMethod.ID === defaultShippingMethod.ID; // eslint-disable-line
                            })) { // eslint-disable-line
                                shipment.setShippingMethod(defaultShippingMethod); // eslint-disable-line
                            }
                        }
                        var productLineItem = addLineItem(currentBasket, pli.product, sortedQuantity, null, null, shipment, null, null);
                        productLineItem.custom.instoreAvailability = true; // eslint-disable-line
                        productLineItem.custom.storeInventory = storeInventory;
                    }
                    pli.custom.instoreAvailability = true; // eslint-disable-line
                    pli.custom.storeInventory = storeInventory; // eslint-disable-line
                    results.partiallyMovedToShipping = true;
                    switchShipmentsBopis(currentBasket);
                } else {
                    pli.setQuantityValue(storeInventory); // eslint-disable-line
                    results.partiallyRemovedFromCart = true;
                }
            });
        }
    } catch (e) {
        Logger.error('Error while executing splitItemFromBopisShipment()' + e.message);
    }
    return results;
}

/**
 * This method sets Line Item Inventory
 * @param {string} currentBasket - current basket
 * @param {string} changeAllItemsStore - changeAll Items Store
 * @param {string} cartProdPid - pid
 * @param {string} cartProdUUID - UUID
 * @returns {Object} Store Object
 */
function bopisLineItemInventory(currentBasket, changeAllItemsStore, cartProdPid, cartProdUUID) {
    const Site = require('dw/system/Site');
    const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
    var storeObj = {};
    var storesModel;
    changeAllItemsStore = changeAllItemsStore === 'true' ? true : false; // eslint-disable-line
    try {
        var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
        var Availability = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailability') : {};
        var AvailabilityHelper = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper') : {};
        var inStoreShimpent = collections.find(currentBasket.shipments, function (item) {
            return item.custom.fromStoreId;
        });
        storeObj.basketHasStores = false;
        var preSelectedStoreCookie = storeHelpers.getPreSelectedStoreCookie();
        if (preSelectedStoreCookie && preSelectedStoreCookie.ID) {
            storeObj.ID = preSelectedStoreCookie.ID;
            storeObj.name = preSelectedStoreCookie.name;
        } else if (inStoreShimpent && 'custom' in inStoreShimpent && !inStoreShimpent.custom.fromStoreId) {
            var lat = request.geolocation ? request.geolocation.latitude : ''; // eslint-disable-line
            var long = request.geolocation ? request.geolocation.longitude : ''; // eslint-disable-line
            var addressBook = customer && customer.addressBook;
            if (addressBook && addressBook.getPreferredAddress()) {
                var prefferedAddress = addressBook.getPreferredAddress();
                var postalCode = prefferedAddress.postalCode;
                storesModel = storeHelpers.preSelectStoreByLocation(lat, long, postalCode);
            } else {
                storesModel = storeHelpers.preSelectStoreByLocation(lat, long, null);
            }
            var selectedStore = storesModel && storesModel.stores ? storesModel.stores[0] : null;
            storeObj.ID = selectedStore.ID;
            storeObj.name = selectedStore.name;
        } else {
            storeObj.ID = inStoreShimpent.custom.fromStoreId;
            storeObj.name = StoreMgr.getStore(inStoreShimpent.custom.fromStoreId).name;
        }
        // prepare store object to calculate store availability message
        var pickupStore = storeHelpers.findStoreById(storeObj.ID);
        var matchingShipment;
        var items = [];
        var maoAvailability = null;
        var MAOData = null;
        var storeModel;
        // Changes done under PR#15687 causing issues on the SFRA cart page.
        // Adding isOcapiRequest check to fix EPMD-13047
        var isOcapiRequest = !!(request && request.clientId && request.ocapiVersion);
        var productLineItems = isOcapiRequest ? inStoreShimpent.productLineItems : currentBasket.productLineItems;
        var realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
        var isBopisCheckPointEnabled = 'isCheckPointEnabled' in AvailabilityHelper ? AvailabilityHelper.isCheckPointEnabled('BOPIS') : false;
        if (isMAOEnabled && realTimeInventoryCallEnabled && isBopisCheckPointEnabled && storeObj.ID) {
            collections.forEach(productLineItems, function (PLI) {
                if (PLI.product.custom.availableForInStorePickup !== false && ((isOcapiRequest && PLI.custom.fromStoreId) || !isOcapiRequest)) {
                    if (Object.prototype.hasOwnProperty.call(PLI.product.custom, 'sku') && PLI.product.custom.sku) {
                        items.push(PLI.product.custom.sku);
                    } else {
                        Logger.getLogger('mao_availability').info('MAOEmptySKU (cartHelpers) : Product {0} has empty sku', PLI.product.ID);
                    }
                }
            });
            var locations = [storeObj.ID];
            if (!empty(items) && items.length > 0 && !empty(locations)) {
                maoAvailability = Availability.getMaoAvailability(items, locations);
            }
        }
        collections.forEach(productLineItems, function (PLI) {
            if ('giftCard' in PLI.product.custom && PLI.product.custom.giftCard.value === eGiftCard) {
                return;
            }
            var instoreInventory = 0;
            if ((isOcapiRequest && PLI.custom.fromStoreId) || !isOcapiRequest) {
                if (maoAvailability && !empty(maoAvailability[PLI.product.custom.sku])) {
                    MAOData = JSON.parse(maoAvailability[PLI.product.custom.sku]);
                    if (MAOData && MAOData.Quantity) {
                        instoreInventory = MAOData.Quantity;
                    }
                } else {
                    instoreInventory = instorePickupStoreHelper.getStoreInventory(storeObj.ID, PLI.productID);
                }
            }
            Transaction.wrap(function () {
                if (instoreInventory > 0 && ((isOcapiRequest && PLI.custom.fromStoreId) || !isOcapiRequest)) {
                    var productLineItem = null;
                    if (instoreInventory < PLI.quantityValue && PLI.shipment.custom.fromStoreId) {
                        var matchingProducts = [];
                        var sortedQuantity = (PLI.quantityValue) - (instoreInventory);
                        PLI.setQuantityValue(instoreInventory);
                        collections.forEach(currentBasket.productLineItems, function (item) {
                            if (item.productID === cartProdPid) {
                                matchingProducts.push(item);
                            }
                        });
                        var productInCart = matchingProducts.filter(function (matchingProduct) {
                            return !matchingProduct.shipment.custom.fromStoreId;
                        });
                        if (empty(productInCart)) {
                            var duplicateProductInCart = matchingProducts.filter(function (matchingProduct) {
                                return matchingProduct.shipment.custom.fromStoreId;
                            });
                            if (duplicateProductInCart.length > 1) {
                                var productToRemoved = duplicateProductInCart.filter(function (matchingProduct) {
                                    return matchingProduct.UUID === cartProdUUID;
                                });
                                var setQuantity = productToRemoved[0].quantityValue;
                                currentBasket.removeProductLineItem(productToRemoved[0]);
                                sortedQuantity = sortedQuantity + setQuantity; // eslint-disable-line
                            }
                        }
                        if (productInCart.length) {
                            var productQuantityInCart = productInCart[0].quantity.value;
                            var quantityToSet = sortedQuantity + productQuantityInCart;
                            productInCart[0].setQuantityValue(quantityToSet);
                            storeObj[productInCart[0].UUID] = Resource.msgf('label.quantity.in.stock.store', 'common', null, instoreInventory);
                        } else {
                            var curr = currentBasket.shipments;
                            var shipment = currentBasket.defaultShipment;
                            if (curr.length === 1) {
                                var uuid = UUIDUtils.createUUID(); // eslint-disable-line
                                shipment = currentBasket.createShipment(uuid); // eslint-disable-line
                                var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod(); // eslint-disable-line
                                var shipmentModel = ShippingMgr.getShipmentShippingModel(shipment); // eslint-disable-line
                                var applicableShippingMethods = shipmentModel.applicableShippingMethods; // eslint-disable-line
                                if (collections.find(applicableShippingMethods, function (sMethod) { // eslint-disable-line
                                    return sMethod.ID === defaultShippingMethod.ID; // eslint-disable-line
                                })) { // eslint-disable-line
                                    shipment.setShippingMethod(defaultShippingMethod); // eslint-disable-line
                                }
                            }
                            productLineItem = addLineItem(currentBasket, PLI.product, sortedQuantity, null, null, shipment, null, null);
                            productLineItem.custom.instoreAvailability = true; // eslint-disable-line
                            storeObj.basketHasStores = true;
                            pickupStore.productInStoreInventory = true;
                            storeModel = {
                                stores: [pickupStore]
                            };
                            storeModel = storeHelpers.getProductAvailabilityOnStoreHours(storeModel); // updates storeModel with availability message.
                            productLineItem.custom.storeAvailabilityMsg = storeModel.stores[0].availabilityMessage; // eslint-disable-line
                            storeObj[productLineItem.UUID] = Resource.msgf('label.quantity.in.stock.store', 'common', null, instoreInventory);
                        }
                    }
                    PLI.custom.instoreAvailability = true; // eslint-disable-line
                    storeObj.basketHasStores = true;
                    pickupStore.productInStoreInventory = true;
                    storeModel = {
                        stores: [pickupStore]
                    };
                    PLI.custom.storeInventory = instoreInventory; // eslint-disable-line
                    storeModel = storeHelpers.getProductAvailabilityOnStoreHours(storeModel); // updates storeModel with availability message.
                    PLI.custom.storeAvailabilityMsg = storeModel.stores[0].availabilityMessage; // eslint-disable-line
                    switchShipmentsBopis(currentBasket);
                    disableBOPISMatchingProduct(currentBasket, instoreInventory, PLI);
                } else {
                    // matchingShipment needs to be identified as it might get changed in switchShipmentsBopis() function
                    matchingShipment = collections.find(currentBasket.shipments, function (item) {
                        return !item.custom.fromStoreId;
                    });
                    var fromStoresId = PLI.shipment.custom.fromStoreId;
                    if (!matchingShipment) {
                        var uuid = UUIDUtils.createUUID(); // eslint-disable-line
                        matchingShipment = currentBasket.createShipment(uuid); // eslint-disable-line
                        var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod(); // eslint-disable-line
                        var shipmentModel = ShippingMgr.getShipmentShippingModel(matchingShipment); // eslint-disable-line
                        var applicableShippingMethods = shipmentModel.applicableShippingMethods; // eslint-disable-line
                        if (collections.find(applicableShippingMethods, function (sMethod) { // eslint-disable-line
                                return sMethod.ID === defaultShippingMethod.ID; // eslint-disable-line
                            })) { // eslint-disable-line
                            matchingShipment.setShippingMethod(defaultShippingMethod); // eslint-disable-line
                        }
                    }
                    PLI.setShipment(matchingShipment);
                    PLI.custom.instoreAvailability = false; // eslint-disable-line
                    if (PLI.custom.fromStoreId) {
                        delete PLI.custom.fromStoreId; // eslint-disable-line
                    }
                    if (PLI.shipment.custom.fromStoreId) {
                        delete PLI.shipment.custom.fromStoreId; // eslint-disable-line
                    }
                    if (PLI.shipment.custom.shipmentType) {
                        delete PLI.shipment.custom.shipmentType; // eslint-disable-line
                    }
                    if (fromStoresId) {
                        if (changeAllItemsStore) {
                            storeObj[PLI.UUID] = Resource.msg('label.not.available.items.storechanged.oos', 'common', null);
                        } else {
                            storeObj[PLI.UUID] = Resource.msg('label.not.available.items.instore.oos', 'common', null);
                        }
                    }
                    switchShipmentsBopis(currentBasket);
                    mergeLineItems(currentBasket);
                }
            });
        });
        return storeObj;
    } catch (e) {
        Logger.error('cartHelpers.js - Error while bopisLineItemInventory: ' + e.message);
    }
    return storeObj;
}
/**
 * Default ToShip If Any
 * @param {dw.order.Basket} currentBasket - the basket object
 */
function defaultShipToAddressIfAny(currentBasket) {
    try {
        var emptyDefaultShipment = collections.find(currentBasket.shipments, function (item) {
            return item.default && item.productLineItems.length === 0;
        });
        if (emptyDefaultShipment) {
            var updateToDefaultShipment = collections.find(currentBasket.shipments, function (item) {
                return !item.default && item.productLineItems.length > 0 && item.custom.fromStoreId;
            });
            if (updateToDefaultShipment) {
                var pli = updateToDefaultShipment.productLineItems; // eslint-disable-line
                Transaction.wrap(function () {
                    for (let m = 0; m < pli.length; m++) { // eslint-disable-line
                        pli[m].setShipment(emptyDefaultShipment); // eslint-disable-line
                    }
                    emptyDefaultShipment.custom.fromStoreId = updateToDefaultShipment.custom.fromStoreId;
                    emptyDefaultShipment.custom.shipmentType = updateToDefaultShipment.custom.shipmentType;
                    emptyDefaultShipment.setShippingMethod(updateToDefaultShipment.shippingMethod);
                });
                var storeAddress = {
                    address: {
                        firstName: updateToDefaultShipment.shippingAddress.firstName,
                        lastName: updateToDefaultShipment.shippingAddress.lastName,
                        address1: updateToDefaultShipment.shippingAddress.address1,
                        address2: updateToDefaultShipment.shippingAddress.address2,
                        city: updateToDefaultShipment.shippingAddress.city,
                        stateCode: updateToDefaultShipment.shippingAddress.stateCode,
                        postalCode: updateToDefaultShipment.shippingAddress.postalCode,
                        countryCode: updateToDefaultShipment.shippingAddress.countryCode.value,
                        phone: updateToDefaultShipment.shippingAddress.phone
                    }
                };
                COHelpers.copyShippingAddressToShipment(storeAddress, emptyDefaultShipment);
            }
            if (!updateToDefaultShipment) {
                updateToDefaultShipment = collections.find(currentBasket.shipments, function (item) {
                    return !item.default && item.productLineItems.length > 0 && item.shippingMethodID !== 'eGift_Card';
                });
                if (updateToDefaultShipment) {
                    var pli = updateToDefaultShipment.productLineItems; // eslint-disable-line
                    Transaction.wrap(function () {
                        for (let m = 0; m < pli.length; m++) { // eslint-disable-line
                            pli[m].setShipment(emptyDefaultShipment); // eslint-disable-line
                        }
                        emptyDefaultShipment.setShippingMethod(updateToDefaultShipment.shippingMethod);
                        emptyDefaultShipment.createShippingAddress();
                        if ('fromStoreId' in emptyDefaultShipment.custom && !empty(emptyDefaultShipment.custom.fromStoreId)) {
                            delete emptyDefaultShipment.custom.fromStoreId;
                        }
                    });
                } else if (currentBasket.shipments.length === 1) {
                    updateToDefaultShipment = collections.find(currentBasket.shipments, function (item) {
                        return item.default && item.custom && item.custom.fromStoreId && item.productLineItems.length === 0;
                    });
                    if (updateToDefaultShipment) {
                        Transaction.wrap(function () {
                            if ('fromStoreId' in updateToDefaultShipment.custom && !empty(updateToDefaultShipment.custom.fromStoreId)) {
                                delete updateToDefaultShipment.custom.fromStoreId;
                            }
                            if ('shipmentType' in updateToDefaultShipment.custom && !empty(updateToDefaultShipment.custom.shipmentType)) {
                                delete updateToDefaultShipment.custom.shipmentType;
                            }
                            updateToDefaultShipment.createShippingAddress();
                            var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
                            var shipmentModel = ShippingMgr.getShipmentShippingModel(updateToDefaultShipment); // eslint-disable-line
                            var applicableShippingMethods = shipmentModel.applicableShippingMethods; // eslint-disable-line
                            if (collections.find(applicableShippingMethods, function (sMethod) { // eslint-disable-line
                                return sMethod.ID === defaultShippingMethod.ID; // eslint-disable-line
                            })) { // eslint-disable-line
                                updateToDefaultShipment.setShippingMethod(defaultShippingMethod); // eslint-disable-line
                            }
                        });
                    }
                }
            }
        }
        var deleteShipments = collections.find(currentBasket.shipments, function (item) {
            return !item.default && item.productLineItems.length === 0;
        });
        if (deleteShipments) {
            Transaction.wrap(function () {
                currentBasket.removeShipment(deleteShipments);
            });
        }
    } catch (e) {
        Logger.error('cartHelpers.js - Error in func DefaultToShip: ' + e.message);
    }
}
/**
 * Sets Store Address
 * @param {dw.order.Basket} currentBasket - the basket object
 */
function ensureShippingAddressforStore(currentBasket) {
    var storeShimpent = collections.find(currentBasket.shipments, function (item) {
        return item.custom.fromStoreId && item.shippingAddress === null;
    });
    if (!storeShimpent) {
        return;
    }
    var storeAddressID = storeShimpent.custom.fromStoreId;
    var storeObj = StoreMgr.getStore(storeAddressID);
    var storeAddress = {
        address: {
            firstName: storeObj.name,
            lastName: storeObj.name,
            address1: storeObj.address1,
            address2: storeObj.address2,
            city: storeObj.city,
            stateCode: storeObj.stateCode,
            postalCode: storeObj.postalCode,
            countryCode: storeObj.countryCode.value,
            phone: storeObj.phone
        }
    };
    COHelpers.copyShippingAddressToShipment(storeAddress, storeShimpent);
    var shippingMethods = ShippingMgr.getShipmentShippingModel(storeShimpent).getApplicableShippingMethods();
    var storePickUpShippingMethod = collections.find(shippingMethods, function (method) {
        return method.custom.storePickupEnabled;
    });
    if (!storePickUpShippingMethod) {
        storePickUpShippingMethod = currentBasket.defaultShipment.shippingMethod;
    }
    Transaction.wrap(function () {
        storeShimpent.setShippingMethod(storePickUpShippingMethod);
    });
    return;
}
/**
 * Finds if basket has BOPIS shipment
 * @param {dw.order.Basket} currentBasket - the basket object
 * @returns {boolean} hasBopisShipment hasBopisShipment
 */
function basketHasBOPISShipmet(currentBasket) {
    var hasBopisShipment = false;
    if (currentBasket && currentBasket.shipments && currentBasket.shipments.length > 0) {
        collections.forEach(currentBasket.shipments, function (shipment) {
            if (shipment.custom && 'shipmentType' in shipment.custom && shipment.custom.shipmentType === 'in-store') {
                hasBopisShipment = true;
                return;
            }
        });
    }
    return hasBopisShipment;
}

/**
 * Check if user is a border free user
 * @param {Object} req - The local instance of the request object
 * @returns {boolean} borderFreeUser isBorderFreeUser
 */
function isBorderFreeUser(req) {
    var Site = require('dw/system/Site');
    var borderFreeUser = false;
    var borderFreeEnabled = 'bfxIsEnabled' in Site.current.preferences.custom && Site.current.preferences.custom.bfxIsEnabled ? Site.current.preferences.custom.bfxIsEnabled : false;
    if (borderFreeEnabled) {
        var geoLocationCountry = req.geolocation.countryCode;
        var requestedCountry = req.querystring.country ? req.querystring.country : null;
        var currentCountry = 'currentCountry' in session.custom ? session.custom.currentCountry : '';
        if (((!empty(currentCountry) && geoLocationCountry) && (currentCountry !== 'US' && geoLocationCountry !== 'US' && !requestedCountry)) ||
            (requestedCountry && requestedCountry !== 'US')) {
            borderFreeUser = true;
        }
    }
    return borderFreeUser;
}
/**
 * Makes sure BOPIS shipment has correct shipping method
 * @param {dw.order.Basket} currentBasket - the basket object
 */
function ensureBOPISShipment(currentBasket) {
    const inStorePickUpHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
    try {
        if (currentBasket && currentBasket.shipments) {
            var basketHasBopisShipment = inStorePickUpHelpers.basketHasInStorePickUpShipment(currentBasket.shipments);
            if (basketHasBopisShipment) {
                var bopisShipment = inStorePickUpHelpers.getBopisShipment(currentBasket.shipments);
                if (bopisShipment && bopisShipment.getShippingMethod() && bopisShipment.getShippingMethod().ID !== 'store-pickup') {
                    var shippingMethods = ShippingMgr.getShipmentShippingModel(bopisShipment).getApplicableShippingMethods();
                    var storePickUpShippingMethod = collections.find(shippingMethods, function (method) {
                        return method.custom.storePickupEnabled;
                    });
                    Transaction.wrap(function () {
                        if (storePickUpShippingMethod) {
                            bopisShipment.setShippingMethod(storePickUpShippingMethod);
                        }
                    });
                }
            }
        }
    } catch (e) {
        Logger.error('cartHelpers.js - Error in func ensureBOPISShipment: ' + e.message);
    }
}
/**
 * Returns boolean value for showSavingExperience
 * @param {number} SaveTotal - total object
 * @returns {boolean} a boolean value for showSavingExperience function
 */
function savedExperience(SaveTotal) {
    const savingExperience = require('*/cartridge/scripts/helpers/sitePreferencesHelper').showSavingExperience();
    const floorPricing = require('*/cartridge/scripts/helpers/sitePreferencesHelper').getFloorPricing();
    return savingExperience && floorPricing <= SaveTotal;
}

/**
 * Merge storedBasket with customer's basket during the login
 *
 * @param {dw.order.Basket} basket - actual guest basket
 * @param {dw.order.Basket} storedBasket - customer's saved basket
 * @param {dw.system.Request} req - request object from calling program
 */
function mergeBaskets(basket, storedBasket, req) {
    if (!basket || !storedBasket) {
        return;
    }

    var Site = require('dw/system/Site');
    const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
    var Availability = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailability') : {};
    const AvailabilityHelper = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper') : {};
    var realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var maoAvailability = 0;
    let availableToSell = 0;
    let productLineItems = basket.productLineItems;
    let lineItemQuantity = 0;
    let totalQtyRequested = 0;
    let perpetual;

    if (isMAOEnabled) {
        var isCheckPointEnabled = AvailabilityHelper.isCheckPointEnabled('AddToCart');
        // STEP 1: Break out items from storedBasket and prep for MAO call
        //         Get Availability for all items in Stored Basket with 1 call
        if (realTimeInventoryCallEnabled && isCheckPointEnabled) {
            let items = AvailabilityHelper.getSKUS(storedBasket);
            if (!empty(items)) {
                maoAvailability = Availability.getMaoAvailability(items);
            }
        }
    }

    // Step 2: pass 2 additional parameters to addProductToCart
    //         True = bypass MAO Availability
    //         Testing Availiability of item here instead of in addProductToCart

    collections.forEach(storedBasket.getAllProductLineItems(), (pli) => {
        // If we want to add all products add to the current cart
        // Then just remove all of these statements and leave the addProductToCart call with setting of true.
        // This will then require the user when viewing their cart to remove the unavailable items from their cart.
        let canBeAdded = true;
        if (!(pli.product.bundle)) {
            lineItemQuantity = isNaN(pli.quantityValue) ? base.DEFAULT_LINE_ITEM_QUANTITY : pli.quantityValue;
            totalQtyRequested = lineItemQuantity + getQtyAlreadyInCart(pli.productID, productLineItems);
            perpetual = !empty(pli.product.availabilityModel.inventoryRecord) ? pli.product.availabilityModel.inventoryRecord.perpetual : false;
            availableToSell = validationHelpers.getLineItemInventory(pli.product, true, maoAvailability);
            canBeAdded = ((perpetual || totalQtyRequested <= availableToSell) || isNaN(totalQtyRequested));
        }

        if (canBeAdded) {
            // Last Parameter set to true, will skip MAO getAvailability call.
            addProductToCart(basket, pli.productID, pli.quantityValue, [], [], '', req, false, '', true);
        }
    });
}

/**
 * updates ATS value to a custom attribute.
 * @param {dw.order.ProductLineItem} productLineItems - lineItem from basket.
 */
function getATSvalue(productLineItems) {
    try {
        Transaction.wrap(function () {
            collections.forEach(productLineItems, function (pli) {
                var product = ProductMgr.getProduct(pli.productID);
                pli.custom.atsValue = product.availabilityModel.inventoryRecord.ATS.value; // eslint-disable-line
            });
        });
    } catch (e) {
        Logger.error('cartHelpers.js - Error in func getATSvalue: ' + e.message);
    }
}

/**
 * Reset basket to the default state home delivery settings
 *
 * @param {dw.order.Basket} basket - actual basket
 */
function resetBasketToHomeDelivery(basket) {
    if (!basket) return;
    try {
        const shipment = basket.defaultShipment;
        if (!shipment.custom.fromStoreId) {
            return;
        }
        const shippingMethod = ShippingMgr.getDefaultShippingMethod();
        const resetAddress = {
            address: {
                firstName: '',
                lastName: '',
                address1: '',
                address2: '',
                city: '',
                stateCode: '',
                postalCode: '',
                countryCode: '',
                phone: ''
            }
        };
        Transaction.wrap(function () {
            delete shipment.custom.fromStoreId;
            delete shipment.custom.shipmentType;
            shipment.setShippingMethod(shippingMethod);
            COHelpers.copyShippingAddressToShipment(resetAddress, shipment);
        });
        if (shipment.productLineItems.length > 0) {
            Transaction.wrap(function () {
                const shipmentPLI = shipment.productLineItems;
                for (let m = 0; m < shipmentPLI.length; m++) {
                    shipmentPLI[m].setShipment(shipment);
                }
            });
        }
    } catch (e) {
        Logger.error('cartHelpers.js - Error in func resetBasketToHomeDelivery: ' + e.message);
    }
}

/**
 * This method set and return CC value for basket .
 * @param {dw.order.Basket} basket - Basket
 */
function setBasketPurchaseSite(basket) {
    var Site = require('dw/system/Site');
    var siteId = Site.getCurrent().getID();

    if (!basket) return;
    try {
        if (siteId === 'US' || siteId === 'CA' || siteId === 'MX') {
            if (basket && 'custom' in basket && basket.custom.purchaseSite) {
                Transaction.wrap(function () {
                    basket.custom.purchaseSite = 'CC'; // eslint-disable-line
                });
            }
        }
    } catch (e) {
        Logger.error('cartHelpers.js - Error while setBasketPurchaseSite: ' + e.message);
    }
}

/**
 * Remove store info from basket
 * @param {dw.order.Basket} currentBasket - Basket
 */
function removeStoreInfoFromBasket(currentBasket) {
    try {
        var shipments = currentBasket.getShipments();
        if (shipments.length > 0) {
            collections.forEach(shipments, function (shipment) {
                Transaction.wrap(function () {
                    if ('fromStoreId' in shipment.custom && !empty(shipment.custom.fromStoreId)) {
                        delete shipment.custom.fromStoreId; // eslint-disable-line no-param-reassign
                    }
                    if ('shipmentType' in shipment.custom && !empty(shipment.custom.shipmentType)) {
                        delete shipment.custom.shipmentType; // eslint-disable-line no-param-reassign
                    }
                    var productLineItems = shipment.getProductLineItems();
                    if (productLineItems.length > 0) {
                        collections.forEach(productLineItems, function (pli) {
                            if ('fromStoreId' in pli.custom && !empty(pli.custom.fromStoreId)) {
                                delete pli.custom.fromStoreId; // eslint-disable-line no-param-reassign
                            }
                        });
                    }
                });
            });
        }
    } catch (e) {
        Logger.error('cartHelpers.js - Error while removing store info from basket ' + e.message);
    }
}

module.exports = base;
module.exports.addLineItem = addLineItem;
module.exports.addNewLineItem = addNewLineItem;
module.exports.addProductToCart = addProductToCart;
module.exports.getInventoryMessages = getInventoryMessages;
module.exports.getCartInventoryMessages = getCartInventoryMessages;
module.exports.removePLItem = removePLItem;
module.exports.isListItemExistInBasket = isListItemExistInBasket;
module.exports.removeCouponLineItems = removeCouponLineItems;
module.exports.removeIneligibleCouponsFromBasket = removeIneligibleCouponsFromBasket;
module.exports.getQtyAlreadyInCart = getQtyAlreadyInCart;
module.exports.getQtyAlreadyInCartWithSameMaster = getQtyAlreadyInCartWithSameMaster;
module.exports.hasPreOrderItems = hasPreOrderItems;
module.exports.bopisLineItemInventory = bopisLineItemInventory;
module.exports.getLimitedWishlistItems = getLimitedWishlistItems;
module.exports.mergeLineItems = mergeLineItems;
module.exports.basketHasBOPISShipmet = basketHasBOPISShipmet;
module.exports.defaultShipToAddressIfAny = defaultShipToAddressIfAny;
module.exports.ensureShippingAddressforStore = ensureShippingAddressforStore;
module.exports.ensureBOPISShipment = ensureBOPISShipment;
module.exports.isBorderFreeUser = isBorderFreeUser;
module.exports.moveItemFromBopisShipment = moveItemFromBopisShipment;
module.exports.splitItemFromBopisShipment = splitItemFromBopisShipment;
module.exports.mergeBaskets = mergeBaskets;
module.exports.getATSvalue = getATSvalue;
module.exports.savedExperience = savedExperience;
module.exports.resetBasketToHomeDelivery = resetBasketToHomeDelivery;
module.exports.setBasketPurchaseSite = setBasketPurchaseSite;
module.exports.removeStoreInfoFromBasket = removeStoreInfoFromBasket;
