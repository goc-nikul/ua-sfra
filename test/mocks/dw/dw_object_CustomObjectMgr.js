'use strict';

var objects = {
    AccertifyNotify: function (orderNo) {
        return {
            id: orderNo,
            custom: {
                orderNo: orderNo,
                notifyData: '[{"test": "test"}]',
                isProcessed: false
            }
        };
    }
};

function createCustomObject(type, key) {
    var creator = objects[type];
    var newObject = creator(key);

    return newObject;
}

function getCustomObject(type, key) {
    return createCustomObject(type, key);
}

function queryCustomObjects(type) {
    var obj = createCustomObject(type, 'test');
    var items = [obj];

    var index = 0;
    return {
        items: items,
        iterator: function () {
            return {
                items: items,
                hasNext: function () {
                    return index < items.length;
                },
                next: function () {
                    return items[index++];
                }
            };
        },
        toArray: function () {
            return items;
        },
        next: function () {
            return items[index++];
        },
        hasNext: function () {
            return index < items.length;
        }
    };
}

function remove() {
    return true;
}

module.exports = {
    createCustomObject: createCustomObject,
    getCustomObject: getCustomObject,
    queryCustomObjects: queryCustomObjects,
    getAllCustomObjects: queryCustomObjects,
    remove: remove
};
