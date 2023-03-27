var rvbEnabled = $('.product-detail').data('rvbenabled');

/**
 * sets a cookie
 * @param {string} cname - name of cookie
 * @param {string} cvalue - cookie value
 * @param {string} exdays - expiration date for cookie
 * @param {string} secure - on or off
 */
function setPIDCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = 'expires=' + d.toGMTString();

    document.cookie = `${cname} = ${cvalue}; ${expires}; secure='on'; path=/;`;
}

/**
 * gets a cookie
 * @param {string} cname - name of cookie
 * @return {undefined}
 */
function getCookie(cname) {
    var name = cname + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}
/**
 * Init for cookie function
 */
function init() {
    if (rvbEnabled) {
        var rvbExpireDate = $('.product-detail').data('rvbexpire');
        var pidCookie = [getCookie('pvpIDs')];
        var productId = [$('button.product').data('analytics-style')];
        var productIds = JSON.stringify(pidCookie);

        if (pidCookie[0] === '') {
            // if pvpIDs cookie doesn't exist, set it using the product ID
            setPIDCookie('pvpIDs', productId, rvbExpireDate);
        } else if (productIds.indexOf(productId) === -1) {
            // if cookie already exists, see if this product ID exists
            // if it does not exist, add it to the cookie
            var newValues = pidCookie.concat(productId);
            setPIDCookie('pvpIDs', newValues, rvbExpireDate);
        }
    }
}
module.exports = {
    getCookie: getCookie,
    init: init
};
