var assign = function (target, source) {
    var assigned = target;
    Object.keys(source).forEach(function (key) {
        assigned[key] = source[key];
    });
    return assigned;
};

var setProperty = function (obj, key, value) {
    Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        writable: true
    });
    return obj;
};

/**
 * Checks for the existence of a deeply nested property in an object.
 * For example:  hasProp(mockObj, 'props', 'items', 'subItem3', 'subItem4', 'subItem5', 'subItem6', 'subItem7');
 * @param {Object} obj to check
 * @param {string} prop one or more properties to look up
 * @returns {boolean} true or false
 */
var hasProp = function (obj, prop) {
    var len = arguments.length;
    var restProps = Array(len > 2 ? len - 2 : 0);
    for (var key = 2; key < len; key++) {
        restProps[key - 2] = arguments[key];
    }

    if (obj === undefined) {
        return false;
    }
    if (restProps.length === 0 && Object.prototype.hasOwnProperty.call(obj, prop)) {
        return true;
    }
    return hasProp.apply(undefined, [obj[prop]].concat(restProps));
};


module.exports = {
    assign: assign,
    setProperty: setProperty,
    hasProp: hasProp
};
