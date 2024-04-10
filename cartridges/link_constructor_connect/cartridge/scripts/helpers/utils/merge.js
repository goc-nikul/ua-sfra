/**
 * Merges two objects together, without using spread or `Object.assign`.
 * @param {*} a Object to merge into
 * @param {*} b Object to merge from
 */
module.exports = function merge(a, b) {
  var keys = Object.keys(b);

  for (var i = 0; i < keys.length; i += 1) {
    var key = keys[i];
    a[key] = b[key];
  }

  return a;
};
