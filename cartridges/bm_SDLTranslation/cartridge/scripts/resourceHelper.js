'use strict';

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

/**
 * @description Get the resources
 * @returns {Object} An objects key key-value pairs holding the resources
 */
function getResources() {
    return {
        resources: {
            SDL_BASE_URL_REQUIRED: Resource.msg('sdlTranslation.requiredConfig.baseurl.label', 'SDLTranslation', null),
            SDL_SITE_CATALOG_REQUIRED: Resource.msg('sdlTranslation.requiredConfig.catalog.label', 'SDLTranslation', null),
            SDL_SITE_LIB_REQUIRED: Resource.msg('sdlTranslation.requiredConfig.library.label', 'SDLTranslation', null),
            SDL_PASSWORD_REQUIRED: Resource.msg('sdlTranslation.requiredConfig.password.label', 'SDLTranslation', null),
            SDL_USER_NAME_REQUIRED: Resource.msg('sdlTranslation.requiredConfig.username.label', 'SDLTranslation', null),
            SDL_CLIENT_ID_REQUIRED: Resource.msg('sdlTranslation.requiredConfig.clientID.label', 'SDLTranslation', null),
            SDL_CLIENT_SECRET_REQUIRED: Resource.msg('sdlTranslation.requiredConfig.clientSecret.label', 'SDLTranslation', null),
            SDL_PRODUCT_REQUIRED: Resource.msg('sdlTranslation.product.requiredtranslatable.label', 'SDLTranslation', null),
            SDL_CONTENT_REQUIRED: Resource.msg('sdlTranslation.serverError.label', 'SDLTranslation', null),
            SDL_PROMOTION_REQUIRED: Resource.msg('sdlTranslation.serverError.label', 'SDLTranslation', null),
            SDL_CONFIG_SUCCESS: Resource.msg('sdlTranslation.saveConfigSuccess.label', 'SDLTranslation', null),
            SDL_CONFIG_ERROR: Resource.msg('sdlTranslation.serverError.label', 'SDLTranslation', null),
            SDL_CATEGORY_ERROR_SELECT_CAT: Resource.msg('msg.error.sdl.requiredTransMatrixCategoryProduct.label', 'SDLTranslation', null),
            SDL_PROJECT_NAME_REQUIRED: Resource.msg('error.sdl.requiredProjName.label', 'SDLTranslation', null),
            SDL_TARGET_LANG_REQUIRED: Resource.msg('error.sdl.requiredProjTargetLang.label', 'SDLTranslation', null),
            SDL_PROJECT_SUCCESS: Resource.msg('msg.sdl.sendTransSuccess.label', 'SDLTranslation', null),
            SDL_PROJECT_SERVER_ERROR: Resource.msg('error.sdl.translation.serverError.label', 'SDLTranslation', null),
            SDL_PROJECT_DELETE_WARNING: Resource.msg('warning.sdl.translation.deleteConfirm.label', 'SDLTranslation', null),
            SDL_ERROR_SELECT_PRODUCT: Resource.msg('sdl.error.requiredTransMatrixProduct.label', 'SDLTranslation', null),
            SDL_ERROR_SELECT_CONTENT: Resource.msg('sdl.error.requiredTransMatrixContentAsset.label', 'SDLTranslation', null),

            SDL_ERROR_REQUIRED_WEBDAV: Resource.msg('sdl.dictionary.requireWebDAVURL.label', 'SDLTranslation', null),
            SDL_ERROR_REQUIRED_CODEVERSION: Resource.msg('sdl.dictionary.requiredCodeVersion.label', 'SDLTranslation', null),
            SDL_ERROR_REQUIRED_CARTRIDGENAME: Resource.msg('sdl.dictionary.requiredCartridgeName.label', 'SDLTranslation', null),
            SDL_ERROR_REQUIRED_USERNAME: Resource.msg('sdl.dictionary.requireUserName.label', 'SDLTranslation', null),
            SDL_ERROR_REQUIRED_PASSWORD: Resource.msg('sdl.dictionary.requirePassword.label', 'SDLTranslation', null),
            SDL_ERROR_SELECT_DICTIONARY: Resource.msg('msg.sdl.error.requiredTransMatrixDictioanry.label', 'SDLTranslation', null),
            SDL_ERROR_SELECT_PROMOTIONS: Resource.msg('sdlTranslation.requiredTransMatrixPromotion.label', 'SDLTranslation', null),
            SDL_ERROR_SELECT_CAMPAIGN: Resource.msg('sdlTranslation.requiredTransMatrixCampaign.label', 'SDLTranslation', null),
            URL: {
                SDL_ALL_PROJECT_URL: URLUtils.url('SDLTranslation-AllProjects').toString()
            }
        }
    };
}


module.exports = {
    getResources: getResources
};
