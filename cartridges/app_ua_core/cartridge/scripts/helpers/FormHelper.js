'use strict';

const Resource = require('dw/web/Resource');

/**
 * @param {string} string string with emoji
 * @returns {string} string without emoji
 */
function removeEmoji(string) {
    const regexString = Resource.msg('emoji.regex', 'checkout', null);
    return string.replace(new RegExp(regexString, 'g'), '').trim();
}

module.exports = {
    removeEmoji: removeEmoji
};
