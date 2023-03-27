/* global jQuery $ */

/**
 * Class to create a new component testing instance on the front-end.
 */
class Component extends test.AbstractTest {
    constructor(key) {
        super();
        this.init(key);
    }

    /**
     * Init the component. Set all needed data to component.
     */
    init(name) {
        this.setType('component');
        this.setKey(name);
        this.setObject(
            this.getInstance()
        );
    }

    /**
     * Return a new instance (front-end object to test) by defined key.
     */
    getInstance() {
        return $(`.js-cmp-${this.key}`).data('cmp-instance');
    }

    /**
     * Check if object with given key is available to test.
     */
    isAvailable() {
        return $(`.js-cmp-${this.key}`).length > 0;
    }
}

test.Component = Component;
