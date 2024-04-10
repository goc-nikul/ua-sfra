'use strict';
/**
 * Popup a centered window
 * @param {string} url url to popup
 * @param {string} title popup title
 * @param {number} w width
 * @param {number} h height
 * @returns {Window} popup window
 */
function openPopUp(url, title, w, h) {
    // Fixes dual-screen position
    const dualScreenLeft =
        window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const dualScreenTop =
        window.screenTop !== undefined ? window.screenTop : window.screenY;

    // eslint-disable-next-line no-nested-ternary
    const width = window.innerWidth
        ? window.innerWidth
        : document.documentElement.clientWidth
        ? document.documentElement.clientWidth
        : screen.width;
    // eslint-disable-next-line no-nested-ternary
    const height = window.innerHeight
        ? window.innerHeight
        : document.documentElement.clientHeight
        ? document.documentElement.clientHeight
        : screen.height;

    const systemZoom = width / window.screen.availWidth;
    const left = ((width - w) / 2 / systemZoom) + dualScreenLeft;
    const top = ((height - h) / 2 / systemZoom) + dualScreenTop;
    const newWindow = window.open(
        url,
        title,
        `
      scrollbars=yes,
      width=${w / systemZoom},
      height=${h / systemZoom},
      top=${top},
      left=${left}
      `
    );

    if (window.focus) newWindow.focus();

    return newWindow;
}

module.exports = {
    openPopUp: openPopUp
};
