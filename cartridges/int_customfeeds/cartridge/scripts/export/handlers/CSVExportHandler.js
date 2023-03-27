'use strict';

let CSVStreamWriter = require('dw/io/CSVStreamWriter'),
    FileWriter = require('dw/io/FileWriter');

/* Script Modules */
let AbstractExportHandler = require('int_customfeeds/cartridge/scripts/export/handlers/AbstractExportHandler').getAbstractExportHandler(),
    FieldMapper = require('int_customfeeds/cartridge/scripts/export/FieldMapper').FieldMapper;

// Hack, because vars cannot be imported in DW, only functions
module.exports.getCSVExportHandler = function() {
    return CSVExportHandler;
}

var CSVExportHandler = AbstractExportHandler.extend(
/** @lends CSVExportHandler.prototype */
{
    /**
     * Creates a new CSV export handler instance 
     *
     * @constructs
     * @augments AbstractExportHandler
     * @param {dw.io.File} file The file to export to
     * @param {String} encoding The file encoding
     * @param {String} separator The separator to use
     * @param {Array} fields An array with the fields to use
     * @param {Array} header An array with the header to use
     */
    init: function(writer, separator, fields, header) {
        this.handlesProducts = true;
        this.fileWriter = writer;
        this.writer = new CSVStreamWriter(this.fileWriter, separator);
        this.header = header || fields;
        this.fields = fields;
        this.initFieldCache();
    },
    /**
     * Initialize the a field cache to avoid parsing the expressions for every product
     *
     * @param {dw.catalog.Product} product A product to get the attribute model (can be any product)
     */
    initFieldCache: function(product) {
        this.fieldCache = {};
        for each(let field in this.fields) {
            this.fieldCache[field] = FieldMapper.parseField(field, product);
        }
    },
    /**
     * Get the values for all field as an array
     *
     * @param {dw.catalog.Product} product The product to export
     * @returns {Array} An array with the defined values
     */
    getFields: function(product) {
        result = [];
        for each(let field in this.fields) {
            let f = this.fieldCache[field];
            result.push(FieldMapper.getField(product, f.attribute, f.format));
        }
        return result;
    },
    exportProduct: function(product) {
        this.writer.writeNext(this.getFields(product));
    },
    beginExport: function() {
        this.writer.writeNext(this.header);
    },
    endExport: function() {
        this.writer.close();
        this.fileWriter.close();
    }
});