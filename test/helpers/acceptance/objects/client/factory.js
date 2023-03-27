// Factory object.
var factory = {};
// Global container object
var container = {};

/**
 * Add factory object to window with a given key.
 * @param {string} key
 */
var addFactoryToWindow = function (key) {
    window[key] = factory;
};

/**
 * Add testing instance into global container.
 */
var setContainerInstance = function () {
    container[this.type] = container[this.type] || {};
    if (container[this.type][this.key]) {
        throw new Error('Component with given name is already exists in factory container');
    }
    container[this.type][this.key] = this;
};

/**
 * Extend test factory by adding testing instance.
 */
factory.extend = function (testInstance) {
    setContainerInstance.call(testInstance);
};

/**
 * Run test with given data.
 * @param {string} testType - Testing instance type (f.e. component, etc...).
 * @param {string} objectKey - The key of testing object.
 * @param {string} testKey - The key of test, we want to run.
 * @param {any} testKey - The serializable data, received from back-end testing environment.
 */
factory.run = function (testType, objectKey, testKey, data) {
    var testContainer = container[testType];
    if (!testContainer) {
        throw new Error('Invalid test type');
    }
    var instance = testContainer[objectKey];
    if (!instance) {
        throw new Error('Invalid object key');
    }
    return instance.run(testKey, data);
};

/**
 * Wait for testing component is available on the page.
 * @param {string} testType - Testing instance type (f.e. component, etc...).
 * @param {string} objectKey - The key of testing object.
 */
factory.waitForAvailable = function (testType, objectKey) {
    var testContainer = container[testType];
    if (!testContainer) {
        throw new Error('Invalid test type');
    }
    var instance = testContainer[objectKey];
    if (!instance) {
        throw new Error('Invalid object key');
    }
    return instance.availabilityChecker.call(instance);
};

/**
 * Check if testing component is available on the page.
 * @param {string} testType - Testing instance type (f.e. component, etc...).
 * @param {string} objectKey - The key of testing object.
 */
factory.isAvailable = function (testType, objectKey) {
    var testContainer = container[testType];
    if (!testContainer) {
        throw new Error('Invalid test type');
    }
    var instance = testContainer[objectKey];
    if (!instance) {
        throw new Error('Invalid object key');
    }
    return instance.isAvailable.call(instance);
};

addFactoryToWindow('test');
