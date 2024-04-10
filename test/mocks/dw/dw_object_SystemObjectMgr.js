'use strict';

function describe(type) {
    return {
        getCustomAttributeDefinition(attributeID) {
            return { ID: attributeID }
        }
    };
}

module.exports = {
    describe: describe
};
