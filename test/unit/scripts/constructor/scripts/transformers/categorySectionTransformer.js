var sinon = require('sinon');
const assert = require('chai').assert;
const expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var categorySectionTransformer = require('../../../../../mocks/constructor/transformers/categorySectionTransformer');

describe('transformCategorySection', function() {
    it('should transform category data correctly', function() {
      const category = {
        UUID: '1234',
        ID: 'women',
        displayName: 'Category Name',
        parent: {
            ID: 'root',
            displayName: 'Storefront'
        }
      };
  
      const transformedCategory = categorySectionTransformer.transformCategorySection(category);

      expect(transformedCategory).to.deep.equal({
        uuid: '1234',
        id: 'women',
        name: 'Category Name',
        parentId: null,
        metadata: [
          {
            key: 'data',
            value: {
              categoryUrl: '/en-us/c/women/',
              categoryDisplayName: 'Category Name',
              categoryParentId: 'root',
              categoryParentName: 'Storefront',
              categoryAltUrl: '/en-us/c/women/'
            }
          }
        ]
      });
    });
  });
