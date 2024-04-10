// eslint-disable-next-line no-underscore-dangle
var _super = require('./ExtensibleObject');

var loyaltyCatalog = function () {};

loyaltyCatalog.prototype = new _super();

loyaltyCatalog.prototype.getDisplayName = function () {};
loyaltyCatalog.prototype.getID = function () {};
loyaltyCatalog.prototype.getDescription = function () {};
loyaltyCatalog.prototype.getRoot = function () {};
loyaltyCatalog.prototype.displayName = null;
loyaltyCatalog.prototype.ID = null;
loyaltyCatalog.prototype.description = null;
loyaltyCatalog.prototype.root = null;

module.exports = loyaltyCatalog;
