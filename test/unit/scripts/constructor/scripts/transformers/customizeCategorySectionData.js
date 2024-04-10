var sinon = require('sinon');
const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var customizeCategorySectionData = require('../../../../../mocks/constructor/transformers/customizeCategorySectionData');

describe('getCategorySectionData', function() {
    it('should transform category data correctly', function() {
      const category = {
        UUID: '1234',
        ID: 'men',
        displayName: 'Category Name',
        parent: {
            ID: 'root',
            displayName: 'Storefront'
        }
      };
  
      const transformedCategory = customizeCategorySectionData.getCategorySectionData(category);

      expect(transformedCategory).to.deep.equal({
        uuid: '1234',
        id: 'men',
        name: 'Category Name',
        parentId: null,
        metadata: [
          {
            key: 'data',
            value: {
              categoryUrl: '/en-us/c/men/',
              categoryDisplayName: 'Category Name',
              categoryParentId: 'root',
              categoryParentName: 'Storefront',
              categoryAltUrl: '/en-us/c/men/'
            }
          }
        ]
      });
    });
  });
