function callShoplinkerService() {
    return true;
}

function getCallbackURL() {
    return true;
}

module.exports = {
    callG2: function (variationID) {
        return callShoplinkerService('G2', {
            iteminfoURL: getCallbackURL('G2', 'vid', variationID),
            endpointURL: '/attribute_insert.php'
        });
    },
    callG3: function (materialItemsIDList) {
        return callShoplinkerService('G3', {
            iteminfoURL: getCallbackURL('G3', 'materialItemsIDList', materialItemsIDList.join(',')),
            endpointURL: '/attribute_prod_insert.php'
        });
    },
    callG4: function (materialID) {
        return callShoplinkerService('G4', {
            iteminfoURL: getCallbackURL('G4', 'mid', materialID),
            endpointURL: '/attribute_modify.php'
        });
    },
    callG5: function (materialID) {
        return callShoplinkerService('G5', {
            iteminfoURL: getCallbackURL('G5', 'mid', materialID),
            endpointURL: '/product_image_register.php'
        });
    },
    callG6: function (materialID) {
        return callShoplinkerService('G6', {
            iteminfoURL: getCallbackURL('G6', 'mid', materialID),
            endpointURL: '/goods_info_reg.php'
        });
    },
    callG7: function (productID) {
        return callShoplinkerService('G7', {
            iteminfoURL: getCallbackURL('G7', 'pid', productID),
            endpointURL: '/product_list.php'
        });
    }
};
