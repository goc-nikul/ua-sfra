'use strict';

var moduleName = 'xmlFileIterator.js';

/**
 * Builds a new xml file iterator.
 */
var XmlFileIterator = function build() {
  this.fileReader = null;
  this.xmlReader = null;
  this.nodeName = null;
  this.buffer = null;
  this.size = null;
  this.file = null;
};

/**
 * Reads a new XML object from the current xml stream reader.
 * @param {*} xmlStreamReader The XML stream reader.
 * @param {*} nodeName The name of the node to read.
 * @returns The XML object read from the stream.
 */
function readXMLObjectFromStream(xmlStreamReader, nodeName) {
  var XMLStreamConstants = require('dw/io/XMLStreamConstants');
  var localElementName = null;
  var result = null;

  while (xmlStreamReader.hasNext()) {
    if (xmlStreamReader.next() === XMLStreamConstants.START_ELEMENT) {
      localElementName = xmlStreamReader.getLocalName();

      if (localElementName === nodeName) {
        result = xmlStreamReader.readXMLObject();
        break;
      }
    }
  }

  return result;
}

/**
 * Reads one object from the xml stream.
 * @param {*} xmlReader The xml stream reader.
 * @param {*} nodeName The name of the node to read.
 * @returns The object read from the stream, or null.
 */
function loadObject(xmlStreamReader, nodeName) {
  var xmlObject = readXMLObjectFromStream(xmlStreamReader, nodeName);

  return xmlObject || null;
}

/**
 * Opens the iterator.
 * @param {*} fileName The name of the file to open.
 * @param {*} nodeName The name of the node to read.
 * @returns The file iterator.
 */
XmlFileIterator.create = function create(fileName, nodeName) {
  var XMLStreamConstants = require('dw/io/XMLStreamConstants');
  var XMLStreamReader = require('dw/io/XMLStreamReader');
  var FileReader = require('dw/io/FileReader');
  var File = require('dw/io/File');
  var logger = require('./logger');

  var localElementName = null;
  var xmlStreamReader = null;
  var fileReader = null;
  var objectCount = 0;

  var newXmlFileIterator = new XmlFileIterator();
  newXmlFileIterator.file = new File(fileName);
  newXmlFileIterator.nodeName = nodeName;

  // Scan the file to get the number of objects.
  try {
    fileReader = new FileReader(newXmlFileIterator.file, 'UTF-8');
    xmlStreamReader = new XMLStreamReader(fileReader);

    logger.log(moduleName, 'info', 'Scanning XML file ' + fileName + ' for node "' + nodeName + '"');

    while (xmlStreamReader.hasNext()) {
      if (xmlStreamReader.next() === XMLStreamConstants.START_ELEMENT) {
        localElementName = xmlStreamReader.getLocalName();

        if (localElementName === nodeName) {
          objectCount += 1;
        }
      }
    }

    logger.log(moduleName, 'info', 'Found ' + objectCount + ' XML objects');

    xmlStreamReader.close();
  } catch (error) {
    logger.log(moduleName, 'error', 'Error while scanning file ' + fileName + ': ' + error);

    newXmlFileIterator.close();
    return null;
  }

  // Make sure XML file is reopened to be able to be read later
  newXmlFileIterator.size = objectCount;
  newXmlFileIterator.fileReader = new FileReader(newXmlFileIterator.file, 'UTF-8');
  newXmlFileIterator.xmlReader = new XMLStreamReader(newXmlFileIterator.fileReader);

  // Load first object to buffer
  if (objectCount > 0) {
    newXmlFileIterator.buffer = loadObject(newXmlFileIterator.xmlReader, nodeName);
  }

  return newXmlFileIterator;
};

/**
 * Closes the iterator.
 */
XmlFileIterator.prototype.close = function close() {
  if (empty(this.xmlReader)) {
    return false;
  }

  this.xmlReader.close();
  this.fileReader.close();

  this.fileReader = null;
  this.xmlReader = null;
  this.nodeName = null;
  this.buffer = null;
  this.size = null;

  return true;
};

/**
 * Returns the next object from the file, if any.
 */
XmlFileIterator.prototype.next = function next() {
  var result = null;

  if (empty(this.xmlReader) || empty(this.buffer)) {
    return result;
  }

  result = this.buffer;

  try {
    this.buffer = loadObject(this.xmlReader, this.nodeName);
  } catch (_error) {
    this.close();
    return null;
  }

  return result;
};

/**
 * Returns a boolean indicating whether the iterator has more objects.
 */
XmlFileIterator.prototype.hasNext = function hasNext() {
  return !empty(this.buffer);
};

/**
 * Returns the number of objects in the file.
 */
XmlFileIterator.prototype.getSize = function getSize() {
  return this.size;
};

/**
 * Returns the number of objects that have been read.
 */
XmlFileIterator.prototype.getRecordSize = function getRecordSize() {
  if (!this.buffer) {
    return 0;
  }

  try {
    return JSON.stringify(this.buffer).length;
  } catch (_error) {
    return 0;
  }
};

module.exports = XmlFileIterator;
