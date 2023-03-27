'use strict';

const Site = require('dw/system/Site');
const exclusions = Site.current.getCustomPreferenceValue('SEORefinementExclusions');

/**
 * Build CoreMedia compatible stringified json tags from refinements
 * @param {Object} refinements - productSearch.refinements
 * @returns {string} CMRefinementsJSON
 */
function buildRefinementsCM(refinements) {
    const selectedRefinements = refinements.filter(function (ref) {
        return !ref.isCategoryRefinement;
    }).reduce(function (selectedRefs, ref) {
        ref.values.map(function (elem) {
            var displayValue = elem.displayValue.replace(/ /g, '_').toLowerCase();
            if (elem.selected && exclusions.indexOf(displayValue) === -1) {
                selectedRefs.push(displayValue);
            }
            return elem;
        });
        return selectedRefs;
    }, []);

    return selectedRefinements.join(',');
}

module.exports = {
    buildRefinementsCM: buildRefinementsCM
};
