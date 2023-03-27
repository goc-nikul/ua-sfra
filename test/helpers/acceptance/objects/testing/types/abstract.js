/**
 * Abstract type of testing object instance.
 * @param {object} param0
 * @param {object} param0.factory - Main testing factory
 * @param {string} param0.key - Testing instance key.
 * @param {number} param0.timeout - Max waiting timeout.
 */
class AbstractType {
    constructor({ factory, key, timeout }) {
        this.type = null;
        this.factory = factory;
        this.instanceKey = key;
        this.available = false;
        this.timeout = timeout;
    }

    /**
     * Run test wit given key, and data.
     * @param {string} key - Test key.
     * @param {any} data - Any serializable data from testing script. Will be available on the client side.
     */
    async run(key, data) {
        var dataToSend = {
            type: this.type,
            instanceKey: this.instanceKey,
            testKey: key,
            data
        };
        await this.waitAvailability();
        return await this.factory.page.evaluate(
            async function (receivedData) {
                return test.run(
                    receivedData.type,
                    receivedData.instanceKey,
                    receivedData.testKey,
                    receivedData.data
                );
            },
            dataToSend
        );
    }

    /**
     * Wait for component availability. Max time is defined in constructor.
     */
    async waitAvailability() {
        if (!this.available) {
            var dataToSend = {
                type: this.type,
                instanceKey: this.instanceKey
            };
            this.available = await this.factory.page.waitFor(
                function (receivedData) {
                    return test.waitForAvailable(
                        receivedData.type,
                        receivedData.instanceKey
                    );
                },
                {
                    timeout: this.timeout
                },
                dataToSend
            );
        }
        return this.available;
    }

    /**
     * Check if component is available on the page.
     */
    async isAvailable() {
        if (!this.available) {
            var dataToSend = {
                type: this.type,
                instanceKey: this.instanceKey
            };
            this.available = await this.factory.page.evaluate(
                function (receivedData) {
                    return test.isAvailable(
                        receivedData.type,
                        receivedData.instanceKey
                    );
                },
                dataToSend
            );
        }
        return this.available;
    }
}

module.exports = AbstractType;
