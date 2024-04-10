'use strict';

const velocity = require('dw/template/Velocity');

/**
 * @param {Object} pdict - page dictionary object
 */
function gaEvent(pdict) {
    const gaHelpers = require('*/cartridge/scripts/analytics/gaHelpers');

    if (gaHelpers.isEnabled) {
        let dataLayer = gaHelpers.getDataLayer(pdict);

        if (dataLayer) {
            velocity.render(
                "$velocity.remoteInclude('Google-BeforeHeader', 'action', $action, 'datalayer', $datalayer)", {
                    velocity: velocity,
                    action: pdict.action,
                    datalayer: dataLayer ? JSON.stringify(dataLayer) : '{}'
                }
            );
        }
    }
}

module.exports = {
    gaEvent: gaEvent
};

