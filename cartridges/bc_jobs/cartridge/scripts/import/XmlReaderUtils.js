/**
* Helper component to aid in forward-parsing XML files.
* 1) Call makeXmlReaderUtil(...) passing in a File to initialize.
* 2) Call instance.readElement(...) passing in a filter function to match an element by name,
*     and a handler function that will receive an in-memory XML object of the match.
* 3) Call instance.close(...) to tidy up.
*/
let FileReader = require('dw/io/FileReader'),
    XMLStreamReader = require('dw/io/XMLStreamReader'),
    XMLStreamConstants = require('dw/io/XMLStreamConstants');

function makeXmlReaderUtil(file)
{
    let fileReader = new FileReader(file, 'UTF-8'),
        xmlStreamReader = new XMLStreamReader(fileReader);

    let readElement = function (elementFilter, elementHandler, writer) {
        while (xmlStreamReader.hasNext()) {
            xmlStreamReader.next();

            if (xmlStreamReader.getEventType() === XMLStreamConstants.START_ELEMENT && elementFilter(xmlStreamReader) === true) {
                let xmlObj = xmlStreamReader.getXMLObject();
                if (arguments.length < 3) {
                	elementHandler(xmlObj);
            	} else {
                	elementHandler(xmlObj, writer);
            	}
            }
        }
    }

    let close = function () {
        xmlStreamReader.close();
        fileReader.close();
    }

    let reader = new Object();
    reader.readElement = readElement;
    reader.close = close;

    return reader;
}

module.exports = {
    makeXmlReaderUtil: makeXmlReaderUtil
}
