'use strict';
const xml2js = require('xml2js');

// TODO: Add XML to JSON logic

class XML {
    constructor(xmlString) {
        this.xml = xmlString;
        // parseString is really synchronous... it just uses an async-like API
        xml2js.parseString(xmlString, (err, result) => {
            this.parsedXml = result;
            if (result.root) {
                this.parsedXml = result.root;
            }
        });
    }

    toString() {
        return this.xml;
    }

    appendChild(xmlString) {
        return xmlString;
    }

    descendants(xmlObj) {
        return xmlObj;
    }

    split() {
        if (typeof this.parsedXml === 'string') {
            return this.parsedXml.split(...arguments);
        }
    }

    text() {
        if (typeof this.parsedXml === 'string') {
            return this.parsedXml;
        } else if (Array.isArray(this.parsedXml)) {
            if (this.parsedXml.length === 1 && typeof this.parsedXml[0] === 'string') {
                return this.parsedXml[0];
            }
        } else {
            if (typeof this.parsedXml === 'object' && typeof this.parsedXml.root === 'string') {
                return this.parsedXml.root;
            }
            console.log(typeof (this.parsedXml) + ' => ' + JSON.stringify(this.parsedXml));
        }
    }

    child(child) {
        const builder = new xml2js.Builder();
        const thisChild = this.parsedXml[child];
        if (Array.isArray(thisChild) && (typeof thisChild[0] === 'string')) {
            return new XML(builder.buildObject({ root: thisChild[0] }));
        }
        return new XML(builder.buildObject(thisChild));
    }
}

module.exports = XML;
