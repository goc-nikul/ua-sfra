'use strict';

/** */
function Class() {}

(function () {
    var initializing = false;
    var fnTest = /xyz/.test(function () {}) ? /\bmain\b/ : /.*/;

    /**
    * Create a new sub class
    * @param  {Object} prop An object defining the members of the sub class
    * @return {Object}      The sub class
    * @instance
    */
    Class.extend = function (prop) {
        var main = this.prototype;

        initializing = true;
        var prototype = new this();
        initializing = false;

        var callback = function (name, fn) {
            // istanbul ignore next
            return function () { // It's really difficult to unit test this callback
                var tmp = this.main;

                this.main = main[name];

                var ret = fn.apply(this, arguments);
                this.main = tmp;

                return ret;
            };
        };

        Object.keys(prop).forEach(function (name) {
            prototype[name] =
                typeof prop[name] === 'function' && typeof main[name] === 'function' && fnTest.test(prop[name]) ? callback(name, prop[name]) : prop[name];
        });

        /** */
        function ExtendedClass() {
            if (!initializing && this.init) {
                this.init.apply(this, arguments);
            }
        }

        Object.keys(this).forEach(function (method) {
            if (this[method] instanceof Function) {
                ExtendedClass[method] = this[method];
            }
        }.bind(this));

        ExtendedClass.prototype = prototype;

        ExtendedClass.constructor = ExtendedClass;

        return ExtendedClass;
    };
}());

exports.Class = Class;
