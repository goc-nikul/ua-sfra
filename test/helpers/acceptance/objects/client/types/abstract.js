/**
 * Class to create a new testing instance on the front-end.
 */
class AbstractTest {
    /**
     * Abstract test constructor.
     */
    constructor() {
        this.type = null;
        this.key = null;
        this.obj = {};
        this.tests = {};
        this.availabilityChecker = null;
        this.setAvailabilityChecker();
    }

    /**
     * Set testing object key.
     * @param {object} key
     */
    setKey(key) {
        this.key = key;
    }

    /**
     * Set testing object type.
     * @param {object} type
     */
    setType(type) {
        this.type = type;
    }

    /**
     * Set testing object instance.
     * @param {object} object
     */
    setObject(object) {
        this.obj = object;
    }

    /**
     * Set callback to future checking object availability.
     */
    setAvailabilityChecker() {
        this.availabilityChecker = this.isAvailable;
    }

    /**
     * Check if component is available on the page.
     * You can override it in children classes by your custom checking.
     */
    isAvailable() {
        return true;
    }


    /**
     * Add test rule with custom key.
     * @param {string} key - The key of test task. Will be called from back-end using puppeteer.
     * @param {Function} testCallback - Callback with all testing logic to call from back-end.
     */
    add(key, testCallback) {
        this.tests[key] = testCallback;
    }

    /**
     * Run test with given key and data from back-end test.
     * @param {string} key - Key of the test to run.
     * @param {any} data - Serializable data from back-end.
     */
    run(key, data) {
        if (!this.tests[key]) {
            throw new Error('Not found tests with given key');
        }
        return this.tests[key].call(this.obj,
            data
        );
    }
}

test.AbstractTest = AbstractTest;
