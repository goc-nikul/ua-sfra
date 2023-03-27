'use strict';

var Site = require('dw/system/Site');
var preferences = Site.current.preferences.custom;

module.exports = {
    isPersonalizationEnable: 'enablePersonalization' in preferences ? preferences.enablePersonalization : false,
    personalizationMaxName: 'personalizationMaxName' in preferences ? preferences.personalizationMaxName : 10,
    personalizationMaxNumber: 'personalizationMaxNumber' in preferences ? preferences.personalizationMaxNumber : 2,
    personalizationNegativeWordList: 'personalizationNegativeWordList' in preferences ? preferences.personalizationNegativeWordList : '',
    scene7BaseURL: 'scene7BaseURL' in preferences ? preferences.scene7BaseURL : 'https://underarmour.scene7.com/is/image/'
};
