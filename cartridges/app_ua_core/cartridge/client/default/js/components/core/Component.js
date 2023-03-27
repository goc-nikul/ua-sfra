'use strict';

import EventEmitter from 'events';
import eventMgr from './eventMgr';
var layout = require('../../layout').init();

const tryFn = (fn, failFn) => {
    var result = null;
    try {
        result = fn();
    } catch (e) {
        if (failFn) {
            result = failFn(e);
        }
    }

    return result;
};

export default class Component {
    /**
     * By default components will be selected by selector `[data-cmp="${cmpName}"]`
     * @see js/components.js method selectAndCreateComponents
     *
     * if need use some custom selector, it can be redefined in child classes by re-declaring
     * static "selector" method
     * @example
     * <pre><code>
     * static selector() {
     *     return '.js-component-selector';
     * }
     * </code></pre>
     */
    static get selector() {
        return null;
    }
    /**
     * For correct operation, the `configDefault` method must be re-declared for all extended components. (Only if default code level config is required.)
     *
     * @example
     *
     * <pre><code>
     * get configDefault() {
     *     return {
     *         'attr1' : 'val1',
     *         'attrN' : 'valN'
     *     };
     * }
     * </code></pre>
     */
    get configDefault() {
        return {
            initOnDevice: ['extraSmall', 'small', 'medium', 'large', 'extra-large']
        };
    }
    constructor(el, config = {}) {
        this.$el = el instanceof $ ? el : $(el);
        this.initConfig(config);
        this.listeners = [];
        this.eventMgrListeners = [];
        this.emitter = new EventEmitter();
        this.items = [];
        if (this.config.cmpId) {
            this.id = this.config.cmpId;
        } else {
            let idAttr = this.$el.attr('id');
            if (idAttr) {
                this.id = idAttr;
            }
            if (!this.id && this.config.id) {
                this.id = this.config.id;
            }
        }
    }
    initConfig(config = {}) {
        var jsonConfigAttr = this.$el.attr('data-json-config');
        var jsonConfig = {};

        if (jsonConfigAttr) {
            tryFn(() => {
                jsonConfig = $.parseJSON(jsonConfigAttr);
                jsonConfig = jsonConfig[layout.getMode()] ? $.extend(true, {}, jsonConfig, jsonConfig[layout.getMode()]) : jsonConfig;
            });
        }
        this.config = $.extend(true, {}, this.configDefault, config, jsonConfig, this.$el.data());
    }
    init() {}
    destroy() {
        var i;
        var item;
        var event;
        var $element;

        while (event) {
            $element = event.shift();
            $element.off.apply($element, event);
            event = this.listeners.pop();
        }
        while (event) {
            eventMgr.off.apply(eventMgr, event);
            event = this.eventMgrListeners.pop();
        }
        for (i = 0; i < this.items.length; ++i) {
            item = this.items[i];
            if (item) {
                if (typeof item.destroy === 'function') {
                    item.destroy();
                }
                delete this.items[i];
            }
        }

        delete this.$el;
        this.emitter.removeAllListeners();
    }

    initializationDeclined() {
        this.$el.removeClass('js-cmp-inited')
                .removeClass('js-cmp-carousel')
                .removeData('cmp-instance');
    }
    // eslint-disable-next-line
    isBindedToDom() {
        // eslint-disable-next-line
        console.warn("The `isBindedToDom` method is deprecated. Use `isBoundToDom` instead.");
        return this.isBoundToDom();
    }
    isBoundToDom() {
        return this.$el && ((this.$el.parents('html').length > 0) || this.$el.is('html'));
    }
    eligibleOnDevice() {
        return this.config.initOnDevice.indexOf(layout.getMode()) > -1;
    }
    event(eventName, cb, $target) {
        var self = this;

        var $elementForEvent = ($target || this.$el);
        $elementForEvent.on(eventName, cb);
        self.listeners.push([$elementForEvent, eventName, cb]);

        return self;
    }
    eventDelegate(eventName, selector, cb, $element) {
        var self = this;

        var $elementForEvent = ($element || self.$el);
        $elementForEvent.on(eventName, selector, cb);
        self.listeners.push([$elementForEvent, eventName, selector, cb]);

        return self;
    }
    on(eventName, cb) {
        return this.emitter.on(eventName, cb);
    }
    off(eventName, cb) {
        return this.emitter.off(eventName, cb);
    }
    once(eventName, cb) {
        return this.emitter.once(eventName, cb);
    }
    eventMgr(event, handler) {
        handler.bind(this);
        eventMgr.on(event, handler);
        this.eventMgrListeners.push([event, handler]);
    }
    callFnForId(id, name, ...args) {
        this.getById(id, (cmp) => {
            cmp[name](...args);
        });
    }
    getById(id, cb) {
        for (var c = 0; c < this.items.length; ++c) {
            if (this.items[c]) {
                if (this.items[c].id === id) {
                    cb.call(this, this.items[c]);
                } else {
                    this.items[c].getById(id, cb);
                }
            }
        }
    }
}
