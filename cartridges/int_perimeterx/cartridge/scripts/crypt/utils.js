/**
 * Transforms binary string to byte array
 * @param  {string} str input string
 * @return {array}     input string as a byte array
 */
function binaryStringToBytes(str) {
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i) & 0xFF);
    }
    return bytes;
}

/**
 * Returns an input string as byte array
 * @param  {string} str input string
 * @return {array}     input string as byte array
 */
function stringToBytes(str) {
    return binaryStringToBytes(str);
}

/**
 * Returns transforms byte array to string
 * @param  {array} byte input bytes array
 * @return {string}       byte array as string
 */
function binaryBytesToString(bytes) {
    var str = [];
    for (var i = 0; i < bytes.length; i++) {
        str.push(String.fromCharCode(bytes[i]));
    }
    return str.join('');
}

/**
 * Returns byte array as string
 * @param  {bytes} bytes input byte array
 * @return {string}       byte array as string
 */
function bytesToString(bytes) {
    return decodeURIComponent(escape(binaryBytesToString(bytes)));
}

/**
 * Returns byte array representation of input words
 * @param  {array} words words array
 * @return {array}       byte array
 */
function wordsToBytes(words) {
    var bytes = [];
    for (var b = 0; b < words.length * 32; b += 8) {
        bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
    }
    return bytes;
}

/**
 * Returns conversion of byte array to hexa string
 * @param  {array} bytes input byte array
 * @return {string}       conversion of byte array to hexa string
 */
function bytesToHex(bytes) {
    var hex = [];
    for (var i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
    }
    return hex.join('');
}

/**
 * Returns byte array conversion of a hexa string
 * @param  {string} hex input hexa string
 * @return {array}     byte array conversion of a hexa string
 */
function hexToBytes(hex) {
    var bytes = [];
    for (var c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
}

/**
 * Returns conversion of byte array to words
 * @param  {array} bytes input byte array
 * @return {array}       conversion of byte array to words
 */
function bytesToWords(bytes) {
    var words = [];
    for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
        words[b >>> 5] |= (bytes[i] & 0xFF) << (24 - b % 32);
    }
    return words;
}

/**
 * Returns an array from Bytes object
 * @param  {array} bytes input Bytes object
 * @return {array}       conversion of the Bytes object to an array
 */
function bytesToArray(bytes) {
    var result = [];
    for (var i = 0; i < bytes.getLength(); i++) {
        result.push(bytes.byteAt(i) & 0xFF);
    }
    return result;
}

module.exports = {
    stringToBytes: stringToBytes,
    bytesToString: bytesToString,
    wordsToBytes: wordsToBytes,
    bytesToHex: bytesToHex,
    bytesToWords: bytesToWords,
    hexToBytes: hexToBytes,
    bytesToArray: bytesToArray
};
