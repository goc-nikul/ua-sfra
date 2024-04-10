/* eslint-disable no-empty-function, no-unused-vars */
var XMLStreamWriter = require('./dw_io_XMLStreamWriter');

class XMLIndentingStreamWriter extends XMLStreamWriter {
    constructor() {
        super();
    }
}

module.exports = XMLIndentingStreamWriter;
