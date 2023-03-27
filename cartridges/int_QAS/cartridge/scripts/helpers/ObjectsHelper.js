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

module.exports = {
    assign: assign,
    setProperty: setProperty
};
