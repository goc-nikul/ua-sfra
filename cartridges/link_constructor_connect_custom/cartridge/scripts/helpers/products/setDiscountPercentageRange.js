/**
 * Sets the discount percentage range based on the provided data.
 *
 * @param {number} data - The input data to determine the discount percentage range
 * @return {string} The label of the matched discount range
 */
module.exports = function setDiscountPercentageRange(data) {
  var discountRange = [
    { rstart: 1, rend: 20, label: '20' },
    { rstart: 21, rend: 30, label: '30' },
    { rstart: 31, rend: 40, label: '40' },
    { rstart: 41, rend: 50, label: '50' },
    { rstart: 51, rend: 60, label: '51' }
  ];

  var matchedRange = discountRange.find((range) => {
    return data >= range.rstart && data <= range.rend;
  });

  return matchedRange ? matchedRange.label : null;
};
