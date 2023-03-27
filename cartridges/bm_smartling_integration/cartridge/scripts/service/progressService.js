'use strict';

/**
    Calculate translation progress
*/
function calculateProgress(completedStringsCount, authorizedStringsCount, excludedStringsCount, totalStringsCount) {
    var totalTranslatableStringsCount = completedStringsCount + authorizedStringsCount;
    if (totalTranslatableStringsCount === 0) {
        if (excludedStringsCount === totalStringsCount) {
            return 100;
        } else {
            return 0;
        }
    } else {
        return 100 * completedStringsCount / totalTranslatableStringsCount;
    }
}

exports.calculateProgress = calculateProgress;
