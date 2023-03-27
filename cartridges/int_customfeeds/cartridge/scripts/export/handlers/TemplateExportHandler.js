'use strict';

let CSVStreamWriter = require('dw/io/CSVStreamWriter'),
    FileWriter = require('dw/io/FileWriter');
var _that;

/* Script Modules */
let AbstractExportHandler = require('int_customfeeds/cartridge/scripts/export/handlers/AbstractExportHandler').getAbstractExportHandler(),
    FieldMapper = require('int_customfeeds/cartridge/scripts/export/FieldMapper').FieldMapper;

// Hack, because vars cannot be imported in DW, only functions
module.exports.getTemplateExportHandler = function() {
    return TemplateExportHandler;
}

/**
 * @augments AbstractExportHandler
 */
var TemplateExportHandler = AbstractExportHandler.extend(
/** @lends TemplateExportHandler.prototype */
{
    /**
     * Creates a new template handler instance. The template must define a block of type product and within
     * that block certain variables can be used to access product attributes
     *
     * <pre>
     * &lt;?xml version="1.0"?&gt;
     * &lt;rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"&gt;
     *     &lt;channel&gt;
     *         &lt;title&gt;&lt;![CDATA[My Store]]&gt;&lt;/title&gt;
     *         &lt;link href="http://www.mystore.com/" rel="alternate" type="text/html"/&gt;
     *         &lt;updated&gt;2013-06-01T00:30:02Z&lt;/updated&gt;
     *         &lt;author&gt;
     *             &lt;name&gt;&lt;![CDATA[My Store]]&gt;&lt;/name&gt;
     *         &lt;/author&gt;
     * {{block type="product"}}
     *             &lt;item&gt;
     *                 &lt;g:id&gt;{{var:ID}}&lt;/g:id&gt;
     *                 &lt;g:brand&gt;&lt;![CDATA[{{var:custom:brand}}]]&gt;&lt;/g:brand&gt;
     *                 &lt;title&gt;&lt;![CDATA[{{var:name}} - {{var:custom:color}} - {{var:custom:size}}]]&gt;&lt;/title&gt;
     *                 &lt;g:age_group&gt;{{var:custom:age}}&lt;/g:age_group&gt;
     *                 &lt;g:gender&gt;{{var:custom:gender}}&lt;/g:gender&gt;
     *                 &lt;g:product_type&gt;&lt;![CDATA[{{var:custom:productGroup}}]]&gt;&lt;/g:product_type&gt;
     *                 &lt;g:google_product_category&gt;&lt;![CDATA[{{var:custom:googleproductcategories}}]]&gt;&lt;/g:google_product_category&gt;
     *                 &lt;description&gt;&lt;![CDATA[{{var:shortDescription}}]]&gt; &lt;/description&gt;
     *                 &lt;g:color&gt;{{var:custom:color}}&lt;/g:color&gt;
     *                 &lt;g:size&gt;{{var:custom:size}}&lt;/g:size&gt;
     *                 &lt;link&gt;{{var:url}}&lt;/link&gt;
     *                 &lt;g:image_link&gt;{{var:image}}&lt;/g:image_link&gt;
     *                 &lt;g:condition&gt;new&lt;/g:condition&gt;
     *                 &lt;g:price&gt;{{var:pricevalue}} USD&lt;/g:price&gt;
     *                 &lt;g:availability&gt;in stock&lt;/g:availability&gt;
     *                 &lt;g:shipping&gt;
     *                     &lt;g:country&gt;US&lt;/g:country&gt;
     *                     &lt;g:service&gt;Standard&lt;/g:service&gt;
     *                     &lt;g:price&gt;0.00 USD&lt;/g:price&gt;
     *                 &lt;/g:shipping&gt;
     *                 &lt;g:mpn&gt;{{var:EAN}}&lt;/g:mpn&gt;
     *                 &lt;g:gtin&gt;{{var:EAN}}&lt;/g:gtin&gt;
     *                 &lt;g:adwords_grouping&gt;&lt;![CDATA[{{var:custom:garmentType}}]]&gt;&lt;/g:adwords_grouping&gt;
     *                 &lt;g:adwords_labels&gt;apparel&lt;/g:adwords_labels&gt;
     *                 &lt;g:adwords_labels&gt;&lt;![CDATA[{{var:custom:productGroup}}]]&gt;&lt;/g:adwords_labels&gt;
     *             &lt;/item&gt;
     * {{/block}}
     *     &lt;/channel&gt;
     * &lt;/rss&gt;
     * </pre>
     *
     * @constructs
     * @augments AbstractExportHandler
     * @param {dw.io.File} file The file to export to
     * @param {String} encoding The file encoding
     * @param {String} template The template as explained in the description
     */
    init: function(writer, template, FeedConfig){
        this.handlesProducts = true;
        this.handlesMasters = true;
        this.variationsOnly = FeedConfig.variationsOnly;
        this.writer = writer;
        this.template = template;
        this.feedConfig = FeedConfig;
        this.currency = FeedConfig['currency'];
        //throw new Error("Invalid template providedddd:" + this.currency);

        if(template.indexOf('{{block type="product"}}') < 0 || template.indexOf('{{/block}}') < 0){
            throw new Error("Invalid template provided, a block of type 'product' is mandatory!");
        }

        this.header = template.split('{{block type="product"}}')[0];
        this.footer = template.split('{{/block}}')[1];
        this.productTemplate = template.split('{{block type="product"}}')[1].split('{{/block}}')[0];
        this.initFieldCache();
    },
    /**
     * Initialize the a field cache to avoid parsing the expressions for every product
     *
     * @param {dw.catalog.Product} product A product to get the attribute model (can be any product)
     */
    initFieldCache: function(product) {
        this.fieldCache = {};
        // parse the template and populate the field cache once to avoid parsing the template for each product
        _that = this;
        this.productTemplate.replace(/\{\{[^}]*\}\}/g, function(a) {
            _that.fieldCache[a] = FieldMapper.parseField(a);
            return "";
        });
    },
    exportProduct: function(product) {
        _that = this;
        this.writer.write(this.productTemplate.replace(/\{\{[^}]*\}\}/g, function(a) {
        //throw new Error("QBERT9:" + _that.currency);
            return FieldMapper.getField(product, _that.fieldCache[a].attribute, _that.fieldCache[a].format, _that.currency) || ''; //('Unknown attribute: '+field);
        }) + '\n');
    },
    exportMaster: function(product) {
        _that = this;
        this.writer.write(this.productTemplate.replace(/\{\{[^}]*\}\}/g, function(a) {
        //throw new Error("QBERT9:" + _that.currency);
            return FieldMapper.getField(product, _that.fieldCache[a].attribute, _that.fieldCache[a].format, _that.currency) || ''; //('Unknown attribute: '+field);
        }) + '\n');
    },
    beginExport: function() {
        this.writer.write(this.header + '\n');
    },
    endExport: function () {
        this.writer.write(this.footer + '\n');
        this.writer.close();
    }
});