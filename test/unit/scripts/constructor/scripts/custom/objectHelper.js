const expect = require('chai').expect;

var objectHelper = require('../../../../../mocks/constructor/custom/objectHelper');

describe('buildSimpleProductAttributeList', () => {
    it('should build simple product attribute list correctly', () => {
        const attributeList = objectHelper.buildSimpleProductAttributeList();

        expect(attributeList).to.have.lengthOf(2);

        expect(attributeList[0]).to.deep.equal({
            cioKey: 'season',
            sfccKey: 'custom.season',
            feedType: [
                {
                    displayValue: 'Master (parent product or stand-alone) feed',
                    value: 'master'
                },
                {
                    displayValue: 'Variation product feed',
                    value: 'variation'
                }
            ],
            dataType: [
                {
                    displayValue: 'Metadata',
                    value: 'metadata'
                }
            ]
        });

        expect(attributeList[1]).to.deep.equal({
            cioKey: 'alphaTechnology',
            sfccKey: 'custom.alphaTechnology',
            feedType: [
                {
                    displayValue: 'Variation product feed',
                    value: 'variation'
                }
            ],
            dataType: [
                {
                    displayValue: 'Facet',
                    value: 'facet'
                }
            ]
        });
    });
});
