/**
 * Returns the number padded with a 0 if number < 10
 *
 * @param {*} number The number.
 * @returns {Object} the padded number
 */
function pad(number) {
  return number < 10 ? '0' + number : number;
}

/**
 * Returns the date/time product is to be released(displayed) on the front-end clients
 *
 * @param {*} product The product.
 * @returns {Object} the release date/time
 */
module.exports = function getReleaseDate(product) {
  if (!empty(product) && 'releaseDate' in product.custom && !empty(product.custom.releaseDate)) {
    // convert UTC date/time to local server date/time
    var releaseDate = new Date();
    var offset = dw.system.Site.getCurrent().timezoneOffset;
    releaseDate.setTime(product.custom.releaseDate.valueOf() + offset);

    // set minutes and seconds to zero
    releaseDate.setMinutes(0, 0, 0);

    // add one hour to round up to the next hour
    releaseDate.setHours(releaseDate.getHours() + 1);

    // format date
    var offsetSign = offset >= 0 ? '-' : '+';
    offset = offset < 0 ? offset * -1 : offset;
    var offsetHours = (((offset / 1000) / 60) / 60);

    return (
      releaseDate.getFullYear() +
      '-' + pad(releaseDate.getMonth() + 1) +
      '-' + pad(releaseDate.getDate()) +
      ' ' + pad(releaseDate.getHours()) +
      ':00:00.000' +
      offsetSign + pad(offsetHours) +
      ':00'
    );
  }

  return null;
};
