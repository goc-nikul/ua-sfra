/*global UA, $, jQuery, Backbone */
/*jslint browser: true, maxerr: 50, indent: 4, plusplus: true, nomen: true */
UA.S7RM = function () {
    'use strict';

    // Initialize local variables
    var api = {},

    // Initialize the jQuery object cache
    $cache = {},

    // Seed the Akamai base / root url constants (used to render Scene 7 Preview Images)
    akamaiUrl = 'https://underarmour.scene7.com/is/image/Underarmour/',
    originUrl = 'https://origin-d4.scene7.com/is/image/Underarmour/',

    // Capture the current query string structure
    queryStruct = UA.URL.getQueryStringAsStruct(),

    // Initialize the current / default properties
    currentImageName = "V5-1240654-003_HTF",
    currentFormat = "jpg",
    currentResMode = "sharp2",

    // Default the constants collection
    appConstants,

    // Default the collection of labels / messages used by the application
    labels = {

        // Default the images shown / actual size message
        "IMAGES_SHOWN_ACTUAL_SIZE_MESSAGE": "image shown at actual size"

    },

    // Default that the css width is not enabled
    cssWidthEnabled = false,

    // Default that the recipe manager was initialized
    recipeManagerInitialized = false,

    // Default the changed-state status
    recipeObjectHasChanged = false,

    // Default the recipe object-is-loaded status
    recipeObjectIsLoaded = false,

    // Default the recipe object-is-loading status
    recipeObjectIsLoading = false,

    // Default the recipe object render preview image status
    recipeObjectRenderPreviewImage = true,

    // Initialize the recipeCategories cache
    recipeCategories,
    viewTypes,

    // Default the original recipe definition that was loaded
    originalRecipeDefinition = {},

    // Default the variable used to store references to the last selected recipe-advancement control
    lastSelectedRecipeControl,

    // Initialize the recipeDefault
    recipeDefaults = {

        // Initialize the default set of recipe constants
        scale: 1,
        sizeX: 0,
        sizeY: 1050,
        rectX: 0,
        rectY: 0,
        height: 525,
        width: 545,
        backgroundColor: "f0f0f0",
        resMode: "sharp2",
        format: "jpg",
        quality: 85,
        positionX: 0,
        positionY: 0,
        cache: "on,on",
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        horizontalZoom: 0,
        verticalZoom: 0,
        topOrientation: "",
        midOrientation: "",
        bottomOrientation: ""

    };

    // Disable asynchronous ajax
    jQuery.ajaxSetup({
        async: false
    });

    //////////////////////////////////////////////////
    // Private Methods
    //////////////////////////////////////////////////

    // This function is used to calculate the vertical orientation of the image
    api.calculateOrientation = function (currentOrientationType) {

        // Initialize local variables
        var recipeProperties, baseSizeY, basePosY, currentOrientationValue, viewportOrientationValue, zoomOrientationValue;

        // Prevent the rendering of the preview image
        api.setRecipeRenderPreviewImageState(false);

        // Retrieve the current set of recipe properties
        recipeProperties = api.getRecipeProperties();

        // Should this be oriented to the bottom-up?
        if (currentOrientationType === "bottom") {

            // Derive the current orientation value from the slider control
            currentOrientationValue = parseFloat(jQuery("#recipe-bottomOrientation").val()/100);

            // Calculate the base height for this specific orientation
            baseSizeY = parseInt(recipeProperties["height"]) + parseInt(recipeProperties["height"] * currentOrientationValue);
            
            // Add 1% padding to the top of the image
            var bottomPadding = parseInt(recipeProperties["height"] * .01);            
            
            // Use the offset and bottom padding to calculate the display viewport
            basePosY = parseInt((1-currentOrientationValue) * parseFloat(recipeProperties["height"])/2 - bottomPadding);

        }

        // Should this be oriented to the top?
        if (currentOrientationType === "top") {

            // Derive the current orientation value from the slider control
            currentOrientationValue = parseFloat(jQuery("#recipe-topOrientation").val()/100);

            // Calculate the base height for this specific orientation
            baseSizeY = parseInt(recipeProperties["height"]*2) - parseInt(recipeProperties["height"] * (1-currentOrientationValue));
            
            // Calculate what the offset is based on the recipe value
            var posYOffset = parseInt((1-currentOrientationValue) * parseFloat(recipeProperties["height"]));
            
            // Add 1% padding to the top of the image
            var topPadding = parseInt(recipeProperties["height"] * .01);
            
            // Use the offset and top-padding to calculate the display viewport      
            basePosY = parseInt(topPadding + parseFloat(recipeProperties["height"]) - ( (posYOffset) / 2 ) );
            
        }

        // Should this be oriented to the mid?
        if (currentOrientationType === "mid") {

            // Derive the current orientation value from the slider control
            currentOrientationValue = parseFloat(jQuery("#recipe-" + currentOrientationType + "Orientation").val()/100);
            
            // Calculate the base height for this specific orientation
            baseSizeY = parseInt(recipeProperties["height"]*2) - parseInt(recipeProperties["height"] * (1-currentOrientationValue));
            basePosY = parseInt(parseFloat(recipeProperties["height"]) / 2 - (recipeProperties["height"] / 2) * currentOrientationValue * .15 );

        }
        
        // Are either the view-port / zoom sliders being invoked?
        if (currentOrientationType === "viewport" || currentOrientationType === "zoom") {

            // Derive the zoom and viewport orientation values
            viewportOrientationValue = parseFloat(jQuery("#recipe-viewportOrientation").val()/100);
            zoomOrientationValue = parseFloat(jQuery("#recipe-zoomOrientation").val()/100);

            // Derrive the zoom level and position for the current display
            baseSizeY = parseInt(recipeProperties["height"]*2) - parseInt(recipeProperties["height"] * ((1-zoomOrientationValue) * 2));

            // Calculate the minimum / maximum thresholds (for reference)
            var minPosY = baseSizeY / 2;
            var maxPosY = -1 * minPosY + parseInt(recipeProperties["height"]);

            // Calculate the current yPosition so that we can snap the display between the head and feet for HT shots
            basePosY = parseInt(minPosY - (viewportOrientationValue * (baseSizeY - parseInt(recipeProperties["height"]))));          
            
        }

        // Set the recipe size / scale properties for the current orientation
        api.setRecipeSizeAndScaleProperties(1, basePosY, Math.ceil(recipeProperties["width"] / 2), Math.ceil(baseSizeY), 0);
        
        // Enable the rendering of the preview image
        api.setRecipeRenderPreviewImageState(true);

        // Update the image display
        api.updateRecipeImage();

    };

    // This method is used to calculate a slider value based on a user-input value
    api.calculateSliderValue = function(startValue, sliderId) {

        // Initialize local variables
        var sliderValue, startValueFloat, thresholdMax;

        // Create a float representation of the start value
        startValueFloat = parseFloat(startValue);

        switch(sliderId) {

            // Calculate the top / bottom orientation values
            case "recipe-topOrientation":
            case "recipe-bottomOrientation":
            case "recipe-midOrientation":
            case "recipe-zoomOrientation":

                // Default the threshold max for this slider
                thresholdMax = 250;

                break;

            case "recipe-widthOrientation":

                // Default the threshold max for this slider
                thresholdMax = 100;

                // If a value lte 1 is provided, then return 1
                if( startValue <= 1 ) return 1;

                break;

            case "recipe-viewportOrientation":

                // Default the threshold max for this slider
                thresholdMax = 100;

                break;

        }

        // Calculate the slider value using the slider-specific thresholds
        sliderValue = (startValueFloat * thresholdMax / 100).toFixed(2);

        // Return the calculated slider value
        return sliderValue;

    };

    // This method is used to default the image magnification control
    api.defaultImageMagnificationControl = function () {

        // Disable the Image Magnification Property
        api.disableImageMagnification();

        // Default the CSS Width property back to its original / default value
        api.setImageMagnificationDefault();

    };

    // This method is used to default the image orientation controls
    api.defaultImageOrientationControls = function () {

        // Disable the Image Orientation Controls
        api.disableImageOrientationControls();

        // Default the image orientation control values
        api.setImageOrientationDefaults();

    };
           
    // This method is used to disable the image magnification display
    api.disableImageMagnification = function () {

        // Default local variables
        var $checkbox, $previewImage, labelClass;

        // Create a reference to the toggle control
        $checkbox = jQuery("#toggle-css-width");

        // Enable / check the control toggle
        $checkbox.prop("checked", false);

        // Create a reference to the preview-image
        $previewImage = jQuery(".recipe-image-preview");

        // Create a reference to the associated data label
        labelClass = "." + $checkbox.data("label");

        // Disable the image-magnification editable control
        jQuery(".slider-width-value").editable("disable");

        // Disable the slider increment / decrement icons
        $cache["css-width-decrement"].attr('disabled', 'disabled');
        $cache["css-width-increment"].attr('disabled', 'disabled');

        // Remove the enabled style from the increment / decrement icons
        $cache["css-width-decrement"].removeClass("slider-control-icon-enabled");
        $cache["css-width-increment"].removeClass("slider-control-icon-enabled");

        // Re-enable the css toggle / display slider
        $cache["recipe-widthOrientation"].attr('disabled', 'disabled');

        // Show this specific slider as not enabled
        $cache["recipe-widthOrientation"].removeClass("enabled-slider");

        // Disable the reset button for the slider
        $cache["reset-css-width"].addClass("disabled");
        $cache["reset-css-width"].removeClass("reset-button-xs-enabled");

        // Disable the CSS width flag
        cssWidthEnabled = false;

        // Hide the display image
        $previewImage.hide().delay(200);

        // Remove / reset the width property
        $previewImage.css("width", "");

        // Transition the show of the image
        $previewImage.fadeIn(300);

        // Clear the display percentage display
        api.setImageDisplayPercentageLabel();

        // De-emphasize the label to show it's not selected
        jQuery(labelClass).removeClass("bold-label");

        // Re-initialize the json-recipe display
        api.initJSONDisplay();

        // Enable the save button display
        api.toggleSaveButton();

    };

    // This method is used to disable the orientation controls if a scale and positioning change is made
    api.disableImageOrientationControls = function () {

        // Disable and each orientation slider
        jQuery(".image-orientation-checkbox").each(function(checkboxIndex, thisCheckbox) {

            // Disable each of the image-orientation controls
            api.disableCheckboxElements(thisCheckbox);

        });

        // Disable and each orientation slider
        jQuery(".image-control-checkbox").each(function(checkboxIndex, thisCheckbox) {

            // Disable the zoom / viewport image-orientation controls
            api.disableCheckboxElements(thisCheckbox);

        });

    };

    // This method is used to check if a recipe with unsaved changes exists
    api.doesRecipeObjectHaveUnsavedChanges = function () {

        // Has a recipe been loaded, and is it equal to the current recipe definition?
        if ( recipeObjectIsLoaded === true && api.hasRecipeObjectChanged() === true ) {
            return true;
        }

        // Default that no unsaved changes exist
        return false;

    };

    // Debugging function to dump recipe preview statuses
    api.dumpRecipePreviewImageStatuses = function () {

        // Debugging: Dump out the object preview statuses
        console.log("recipeObjectHasChanged: " + recipeObjectHasChanged);
        console.log("recipeObjectIsLoading: " + recipeObjectIsLoading);
        console.log("recipeObjectRenderPreviewImage: " + recipeObjectRenderPreviewImage);

    };

    // This method is used to trigger / enable the image magnification display
    api.enableImageMagnification = function() {

        // Default local variables
        var $checkbox, $previewImage, labelClass;

        // Create a reference to the toggle control
        $checkbox = jQuery("#toggle-css-width");

        // Enable / check the control toggle
        $checkbox.prop("checked", true);

        // Create a reference to the preview-image
        $previewImage = jQuery(".recipe-image-preview");

        // Create a reference to the associated data label
        labelClass = "." + $checkbox.data("label");

        // Enable the image-magnification editable control
        jQuery(".slider-width-value").editable("enable");

        // Enable the slider increment / decrement icons
        $cache["css-width-decrement"].removeAttr("disabled");
        $cache["css-width-increment"].removeAttr("disabled");

        // Apply the enabled style to the increment / decrement icons
        $cache["css-width-decrement"].addClass("slider-control-icon-enabled");
        $cache["css-width-increment"].addClass("slider-control-icon-enabled");

        // Disable the css toggle / display slider
        $cache["recipe-widthOrientation"].removeAttr('disabled');

        // Enabled the CSS width flag
        cssWidthEnabled = true;

        // Show this specific slider as enabled
        $cache["recipe-widthOrientation"].addClass("enabled-slider");

        // Enable the reset-button for this slider
        $cache["reset-css-width"].removeClass("disabled");
        $cache["reset-css-width"].addClass("reset-button-xs-enabled");

        // Hide the display image
        $previewImage.hide().delay(200);

        // Set the width based on the slider percentage
        api.setImagePreviewImageWidthPercentage();

        // Transition the show of the image
        $previewImage.fadeIn(300);

        // Emphasize the label to show it's selected
        jQuery(labelClass).addClass("bold-label");

        // Re-initialize the json-recipe display
        api.initJSONDisplay();

    };

    // TODO: Consolidate the logic used to disable / enable image orientation controls so that there is more code re-use
    // This method is used to enable a given orientation control and pre-seed its value
    api.enableOrientationControl = function (controlType, controlValue) {

        // Initialize local variables
        var $thisCheckbox, sliderId, sliderLabelClass, sliderValueClass, resetSliderClass, labelClass, $previewImage;

        // Create a reference to the toggle control
        $thisCheckbox = jQuery("#slider-" + controlType + "-enabled");

        // Enable / check the control toggle
        $thisCheckbox.prop("checked", true);

        // Create a reference to the preview-image
        $previewImage = jQuery(".recipe-image-preview");

        // Create a reference to the associated data label
        labelClass = "." + $thisCheckbox.data("label");

        // Create a reference to the slider associated with this checkbox
        sliderId = "#recipe-" + controlType + "Orientation";
        sliderLabelClass = ".slider-" + controlType + "-label";
        sliderValueClass = ".slider-" + controlType + "-value";
        resetSliderClass = ".reset-slider-" + controlType;

        // If not, then go ahead and un-check the checkbox
        $thisCheckbox.prop("checked", true);

        // Disable the slider associated to this checkbox
        jQuery(sliderId).removeAttr('disabled');

        // Render the slider as disabled
        jQuery(sliderId).addClass("enabled-slider");

        // Add the bold class to the slider title
        jQuery(sliderLabelClass).addClass("bold-label");

        // Enable the slider if it's pre-selected
        jQuery(sliderValueClass).editable("enable");

        // Disable the reset button
        jQuery(resetSliderClass).removeClass("disabled");
        jQuery(resetSliderClass).addClass("reset-button-xs-enabled");

        // Hide the display image
        $previewImage.hide().delay(200);

        // Set the width based on the slider percentage
        jQuery(sliderId).val(controlValue, {set: true});

        // Transition the show of the image
        $previewImage.fadeIn(300);

        // Emphasize the label to show it's selected
        jQuery(labelClass).addClass("bold-label");

    };

    // This method is used to derive a full recipe definition
    api.getFullRecipeObjectDefinition = function () {

        // Initialize local variables
        var recipeObj, orientationProperties, recipeProperties;

        // Capture the orientation properties for this image
        orientationProperties = api.getOrientationProperties();

        // Capture the recipe properties from the current configuration settings
        recipeProperties = api.getRecipeProperties();

        // Construct the new recipe object
        recipeObj = {

            "VIEWTYPE" : jQuery("#view-type").val(),
            "CATEGORYNAME" : jQuery("#recipe-category").val(),
            "DEF" : recipeProperties,
            "ORIENTATION" : orientationProperties,
            "RECIPE" : api.getRecipePropertiesUrl(recipeProperties, false),
            "SAMPLEURL" : api.getScene7Url(recipeProperties)

        };

        // If an id exists -- then let's append it to the recipe object
        if( originalRecipeDefinition.hasOwnProperty("UUID") ) {
            recipeObj["UUID"] = originalRecipeDefinition["UUID"];
        }

        // Return the recipe object
        return recipeObj;

    };

    // This method is used to create a label / string describing the current image's dimensions
    api.getImageDimensionsLabel = function () {

        // Initialize local variables
        var output, thisRecipe;

        // Was a recipe definition passed to this display?
        if( arguments.length === 0 ) {

            // Retrieve a copy of the current recipe make-up
            thisRecipe = api.getRecipeProperties();

        } else {

            // Otherwise, use the definition passed
            thisRecipe = arguments[0];

        }

        // Build out the output string / label
        output = thisRecipe["width"] + "px by " + thisRecipe["height"] + "px";

        // Return the output string
        return output;

    };

    // This method is used to retrieve the orientation properties for a given recipe
    api.getOrientationProperties = function () {

        // Initialize local variables
        var output;

        // Seed the output properties
        output = {

            // Capture which center settings are enabled
            centerXEnabled: jQuery("#lock-x-axis-enabled").prop("checked"),
            centerYEnabled: jQuery("#lock-y-axis-enabled").prop("checked"),

            // Capture the CSS width / image magnification settings
            cssWidthEnabled: jQuery("#toggle-css-width").prop("checked"),
            cssWidthValue: parseFloat(jQuery("#recipe-widthOrientation").val()).toFixed(2),

            // Capture the image orientation settings
            topOrientationEnabled: jQuery("#slider-top-enabled").prop("checked"),
            topOrientationValue: parseFloat(jQuery("#recipe-topOrientation").val()).toFixed(2),
            midOrientationEnabled: jQuery("#slider-mid-enabled").prop("checked"),
            midOrientationValue: parseFloat(jQuery("#recipe-midOrientation").val()).toFixed(2),
            bottomOrientationEnabled: jQuery("#slider-bottom-enabled").prop("checked"),
            bottomOrientationValue: parseFloat(jQuery("#recipe-bottomOrientation").val()).toFixed(2),

            // Capture the zoom / viewport image orientation settings
            zoomOrientationEnabled: jQuery("#slider-zoom-enabled").prop("checked"),
            zoomOrientationValue: parseFloat(jQuery("#recipe-zoomOrientation").val()).toFixed(2),
            viewportOrientationEnabled: jQuery("#slider-viewport-enabled").prop("checked"),
            viewportOrientationValue: parseFloat(jQuery("#recipe-viewportOrientation").val()).toFixed(2)

        };

        // Return the output properties
        return output;

    };

    // This method is a wrapper to retrieve the current recipe object for a given recipe code / view-type combination
    api.loadSelectedRecipe = function () {

        // Initialize local variables
        var selectedRecipeCategory, selectedViewType;

        // Retrieve the field values
        selectedRecipeCategory = $cache["recipe-category"].val();
        selectedViewType = $cache["view-type"].val();

        // Otherwise, retrieve the current recipe object
        api.getSelectedRecipeDefinition(selectedRecipeCategory, selectedViewType);

    };

    // This method is used to retrieve the recipe properties from the current controls form
    api.getRecipeProperties = function () {

        // Initialize local variables
        var output;

        // Set the output properties
        output = {

            // Seed the scale properties
            scale: $cache["recipe-scale"].val(),
            sizeX: parseInt($cache["recipe-sizeX"].val()),
            sizeY: parseInt($cache["recipe-sizeY"].val()),

            // Seed the height / width properties
            rectX: jQuery("#recipe-rectX").val(),
            rectY: jQuery("#recipe-rectY").val(),
            height: jQuery("#recipe-height").val(),
            width: jQuery("#recipe-width").val(),

            // Set the background color
            backgroundColor: jQuery("#background-color-element").val().replace("#",""),

            // Set the image format and quality properties
            format: currentFormat,
            resMode: currentResMode,
            quality: jQuery("#recipe-quality").val(),

            // Set the positioning properties
            positionX: $cache["recipe-posX"].val(),
            positionY: $cache["recipe-posY"].val(),

            // Set the image padding properties
            paddingTop: jQuery("#recipe-paddingTop").val(),
            paddingRight: jQuery("#recipe-paddingRight").val(),
            paddingBottom: jQuery("#recipe-paddingBottom").val(),
            paddingLeft: jQuery("#recipe-paddingLeft").val(),

            // Default the cache settings
            cache: "on,on"

        };

        // return the output properties
        return output;

    };

    // TODO: Add the current / selected recipe category and view type to the properties url
    // This method is used to construct the default Scene 7 Url properties for a given image
    api.getRecipePropertiesUrl = function (rp, includeImageReference) {

        // Initialize local variables
        var output, selectedRecipeCategory, selectedViewType;

        // Default the output variable
        //output = "V5ProdWithBadge?";

        // Retrieve the field values
        selectedRecipeCategory = $cache["recipe-category"].val();
        selectedViewType = $cache["view-type"].val();

        // Default the image reference property
        if ( arguments.length !== 2 ) includeImageReference = true;

        // Only include the image reference if it's defined
        if ( includeImageReference === true ) {
            //output += "$p_src=is{Underarmour/" + currentImageName + "}"
            output = currentImageName
            
        } else
        {
            output = '';
        }

        // ensure that the selected view-type and recipe category
        //output = output + "&rp=" + selectedRecipeCategory + "|" + selectedViewType;
        output += "?rp=" + selectedRecipeCategory + "|" + selectedViewType;

        // Append the scale, format, quality, and resolution properties
        output += "&scl=" + rp["scale"];
        output += "&fmt=" + rp["format"];
        output += "&qlt=" + rp["quality"];
        output += "&resMode=" + rp["resMode"];
        output += "&cache=" + rp["cache"];

        // Only include a background color if the image is not transparent
        if ( rp["format"] !== "png-alpha" ) {
            output += "&bgc=" + rp["backgroundColor"];
        }

        // Build out the image rectangle using the default height / width specified
        output += "&rect=" + rp["rectX"] + "," + rp["rectY"] + "," + rp["width"] + "," + rp["height"];

        // Append the position of the image
        //output += "&$p_pos=" + rp["positionX"] + "," + rp["positionY"];

        // Append the scale / size of the image
        //output += "&$p_size=" + rp["sizeX"] + "," + rp["sizeY"];
        output += "&size=" + rp["sizeX"] + "," + rp["sizeY"];

        // Append the padding applied to the image
        output += "&extendN=" + rp["paddingLeft"] + "," + rp["paddingTop"]  + "," + rp["paddingRight"] + "," + rp["paddingBottom"]

        // Return the recipe string
        return output;

    };

    // This method is used to render / build out the Scene 7 url for a given product
    api.getScene7Url = function (recipeProperties) {

        // Initialize local variables
        var output, imageRecipe;

        // Get the recipe contents for the current recipe
        imageRecipe = api.getRecipePropertiesUrl(recipeProperties);

        // Build out the url by concatenating the baseUrl, recipe contents, and recipe suffix
        output = originUrl + imageRecipe;

        // Return the output variable
        return output;

    };

    // This method is used to check if a recipe object has changed
    api.hasRecipeObjectChanged = function () {

        // Initialize local variables
        var originalRecipeObj, currentRecipeObj;

        // Retrieve the current and original recipe object definitions
        originalRecipeObj = originalRecipeDefinition;
        currentRecipeObj = api.getFullRecipeObjectDefinition();

        // Remove the sample-urls from the recipe objects
        delete originalRecipeObj["SAMPLEURL"];
        delete currentRecipeObj["SAMPLEURL"];

        // Is the original object representation equal to the current one?
        if ( !_.isEqual(originalRecipeObj, currentRecipeObj) ) {
            return true;
        }

        // Otherwise, it has not
        return false;

    };

    // TODO: Determine which other jQuery selectors should be cached globally
    // This method is used to initialize the jQuery object cache (to prevent repeat selector references)
    api.initJQueryCache = function () {

        // Create a reference to the recipe scale objects
        // Reference Point: api.calculateOrientation()
        $cache["recipe-scale"] = jQuery("#recipe-scale");
        $cache["recipe-posY"] = jQuery("#recipe-posY");
        $cache["recipe-posX"] = jQuery("#recipe-posX");
        $cache["recipe-sizeY"] = jQuery("#recipe-sizeY");
        $cache["recipe-sizeX"] = jQuery("#recipe-sizeX");

        // Create a reference to the CSS width objects
        // Reference Point: api.disableImageMagnification()
        $cache["css-width-decrement"] = jQuery(".css-width-decrement");
        $cache["css-width-increment"] = jQuery(".css-width-increment");
        $cache["recipe-widthOrientation"] = jQuery('#recipe-widthOrientation');
        $cache["reset-css-width"] = jQuery(".reset-css-width");
        
        // Create a reference to the save / reset buttons
        $cache["btn-save"] = jQuery(".btn-save");
        $cache["btn-reset"] = jQuery(".btn-reset");
        
        // Create a reference to the recipe category and view-type select controls
        $cache["recipe-category"] = jQuery("#recipe-category");
        $cache["view-type"] = jQuery("#view-type");
        
        
    };

    // This method is used to initialize the json display via the UI
    api.initJSONDisplay = function () {
    	    	
        // Initialize local variables
        var recipeObjectJSON, jp, panelContentSpaceWidth;

        // Exit early if preview-image rendering isn't currently enabled
        if( !api.renderPreviewImage() ) return;

        // Clear the contents of the json container element
        jQuery("#json-container").html("");
        jQuery("#image-preview-container").html("");

        // Calculate the panel workspace width
        panelContentSpaceWidth = jQuery("#panel-contentspace").width();

        // Retrieve an instance of the recipe properties
        recipeObjectJSON = api.getFullRecipeObjectDefinition();

        // Display the recipe definitions within the JSON viewer
        jp = new JSONPane(JSONViewer.quickBuild(recipeObjectJSON, "json-container", {theme:"textonly"}), { width:panelContentSpaceWidth, height: "618"});

        // Listen for clicks on the json viewer click button
        jQuery(".full-size").on("click", function (e) {

            // Hide the panel workspace
            jQuery(".json-pane").css("z-index", "1000");

        });

    };

    // This method is used to initialize the recipe manager display
    api.initRecipeManager = function () {
       
        // Generate the preview of the image using the current recipe definition
        api.previewRecipeImage(api.getRecipeProperties());

        // Initialize the recipe-control UI events
        api.initRecipeControlEvents();

        // Flag that the UI was initialized
        recipeManagerInitialized = true;

        // Initialize and update the recipe image display
        api.updateRecipeImage();        
        
    };
    
    // This method is used to initialize the UI Button Controls
    api.initUIButtonControls = function () {

        // Listen for recipe save clicks
        $cache["btn-save"].on("click", function() {

            // Initialize local variables
            var recipeObj;

            // Retrieve the full definition of the recipe object
            recipeObj = api.getFullRecipeObjectDefinition();

            // Save the recipe definition
            api.saveRecipeDefinition(recipeObj);

        });

        // Listen for reset clicks
        $cache["btn-reset"].on("click", function() {

            // Is the current recipe isn't consistent with the original recipe definition?
            if (api.hasRecipeObjectChanged() ) {

                // Show the unsaved-changes modal
                jQuery("#unsaved-changes-reset-modal").modal("show");
                
                // Prevent the "scroll-bar" shifting when modals are shown
                jQuery("body").css("overflow-y", "scroll");
                
            } else {

                // Launch the reset of the recipe display
                api.loadSelectedRecipe();

            }

        });

        // Force a re-load of the current recipe
        jQuery(".btn-discard-changes").on("click", function(e) {

            // Launch the reset of the recipe display
            api.loadSelectedRecipe();

        });

        // Load the next recipe that is available
        jQuery(".btn-discard-advance-changes").on("click", function(e) {

            // Create a reference to the recipe-category / view-type select controls
            api.showNextRecipe(lastSelectedRecipeControl);

        });

        // Listen for clicks on the "go" button, and use this to paint the recipe creator
        jQuery(".btn-image-submit").on("click", function(e) {

            // Prevent clicks to the top
            e.preventDefault();

            // Set and record the current image name
            currentImageName = jQuery("#image-file-name").val();

            // Show the recipe creator
            api.showRecipeManager();

        });

        // Listen to "enter" submits from the form field, and use this to paint the recipe creator
        jQuery('#image-file-name').on('keypress', function (event) {

            // Was the enter key pressed?
            if(event.which == '13'){

                // Set and record the current image name
                currentImageName = jQuery("#image-file-name").val();

                // Show the recipe creator
                api.showRecipeManager();
            }
            
        });

        // Listen for clicks on the reset image width button
        $cache["reset-css-width"].on("click", function() {

            // Reset the slider default value
            api.setImageMagnificationDefault();

        });

        // Listen for clicks on slider / bottom orientation button
        jQuery(".reset-slider-bottom").on("click", function() {

            // Reset the slider default value
            jQuery("#recipe-bottomOrientation").val(appConstants["defaults"]["bottomOrientation"], { set: true });

        });

        // Listen for clicks on slider / mid orientation button
        jQuery(".reset-slider-mid").on("click", function() {

            // Reset the slider default value
            jQuery("#recipe-midOrientation").val(appConstants["defaults"]["midOrientation"], { set: true });

        });

        // Listen for clicks on slider / top orientation button
        jQuery(".reset-slider-top").on("click", function() {

            // Reset the slider default value
            jQuery("#recipe-topOrientation").val(appConstants["defaults"]["topOrientation"], { set: true });

        });

    	// Let's hide the "save" button if the ds parameter exists
    	if ( queryStruct.hasOwnProperty("ds") ) {
    		
    		// Remove the save button from the document
    		$cache["btn-save"].remove();

    	}
    	                
    };

    // This method is used to disable the label / display elements associated to a checkbox
    api.disableCheckboxElements = function(thisCheckbox) {
    	
        // Default local variables
        var $thisCheckbox, sliderId, sliderLabelClass, sliderValueClass, resetSliderClass;
    	    	
        // jQuery-ify the current checkbox
        $thisCheckbox = jQuery(thisCheckbox);

        // Create a reference to the slider associated with this checkbox
        sliderId = "#recipe-" + $thisCheckbox.data("slider") + "Orientation";
        sliderLabelClass = ".slider-" + $thisCheckbox.data("slider") + "-label";
        sliderValueClass = ".slider-" + $thisCheckbox.data("slider") + "-value";
        resetSliderClass = ".reset-slider-" + $thisCheckbox.data("slider");            	
    	
        // Go ahead and un-check the checkbox
        $thisCheckbox.removeAttr("checked");

        // Disable the slider associated to this checkbox
        jQuery(sliderId).attr('disabled', 'disabled');

        // Render the slider as disabled
        jQuery(sliderId).removeClass("enabled-slider");

        // Add the bold class to the slider title
        jQuery(sliderLabelClass).removeClass("bold-label");

        // Disable the reset button
        jQuery(resetSliderClass).addClass("disabled");
        jQuery(resetSliderClass).removeClass("reset-button-xs-enabled");

        // Disable the slider value / editable field
        jQuery(sliderValueClass).editable("disable");    	
    	
    }
    
    // This method is used to initialize the UI Checkbox controls
    api.initUICheckboxControls = function () {

        //////////////////////////////////////
        // Center-X Checkbox Control
        //////////////////////////////////////

        // Allow label clicks to trigger checkbox clicks
        jQuery(".center-x-label").on("click", function () {
            jQuery("#lock-x-axis-enabled").click();
        });

        // Check and determine if the x-axis should be locked
        jQuery("#lock-x-axis-enabled").on("click", function () {

            // Default local variables
            var $checkbox;

            // Create a reference to the current button
            $checkbox = jQuery(this);

            // Was the checkbox checked?
            if( $checkbox.prop("checked") ){

                // If so, then lock the xAxis
                api.lockXAxis();

            } else {

                // Otherwise, unlock the X Axis
                api.unlockXAxis();

            }

            // Trigger an update of the recipe image
            api.updateRecipeImage();

        });

        //////////////////////////////////////
        // Center-Y Checkbox Control
        //////////////////////////////////////

        // Allow label clicks to trigger checkbox clicks
        jQuery(".center-y-label").on("click", function () {
            jQuery("#lock-y-axis-enabled").click();
        });

        // Check and determine if the y-axis should be locked
        jQuery("#lock-y-axis-enabled").on("click", function () {

            // Default local variables
            var $checkbox;

            // Create a reference to the current button
            $checkbox = jQuery(this);

            // Was the checkbox checked?
            if( $checkbox.prop("checked") ){

                // Lock the Y Axis
                api.lockYAxis();

            } else {

                // Otherwise, unlock the Y Axis
                api.unlockYAxis();

            }

            // Trigger an update of the recipe image
            api.updateRecipeImage();

        });

        //////////////////////////////////////
        // CSS / Percentage Width Slider Control
        //////////////////////////////////////

        // Allow label clicks to trigger checkbox clicks
        jQuery(".css-slider-label").on("click", function () {
            jQuery("#toggle-css-width").click();
        });

        // Check and determine if css width should be enabled
        jQuery("#toggle-css-width").on("click", function () {

            // Default local variables
            var $checkbox;

            // Create a reference to the current button
            $checkbox = jQuery(this);

            // Has the toggle been enabled?
            if ($checkbox.prop("checked")) {

                // If so, then enable image magnification for this image
                api.enableImageMagnification();

            } else {

                // Otherwise, disable image magnification and show images at actual size
                api.disableImageMagnification();

            }

        });

        //////////////////////////////////////
        // Image Orientation Slider Controls
        //////////////////////////////////////

        // Top Zoom Slider: Allow label clicks to trigger checkbox clicks
        jQuery(".slider-top-label").on("click", function () {

            // Toggle the checkbox display
            jQuery("#slider-top-enabled").click();

            // Re-calculate the image orientation
            api.calculateOrientation('top');

        });

        // Mid Zoom Slider: Allow label clicks to trigger checkbox clicks
        jQuery(".slider-mid-label").on("click", function () {

            // Toggle the checkbox display
            jQuery("#slider-mid-enabled").click();

            // Re-calculate the image orientation
            api.calculateOrientation('mid');

        });

        // Allow label clicks to trigger checkbox clicks
        jQuery(".slider-bottom-label").on("click", function () {

            // Toggle the checkbox display
            jQuery("#slider-bottom-enabled").click();

            // Re-calculate the image orientation
            api.calculateOrientation('bottom');

        });

        // Allow label clicks to trigger checkbox clicks
        jQuery(".slider-zoom-label").on("click", function () {

            // Toggle the checkbox display
            jQuery("#slider-zoom-enabled").click();

            // Re-calculate the image orientation
            api.calculateOrientation('zoom');

        });
        
        // Allow label clicks to trigger checkbox clicks
        jQuery(".slider-viewport-label").on("click", function () {

            // Toggle the checkbox display
            jQuery("#slider-viewport-enabled").click();

            // Re-calculate the image orientation
            api.calculateOrientation('zoom');

        });        
        
        // Check and determine if any of the orientation checkboxes have been selected
        jQuery(".image-control-checkbox").on("click", function () {        

            // Default local variables
            var $checkbox, $checkboxes, $thisCheckbox, sliderId, sliderLabelClass, sliderValueClass, resetSliderClass;
        	
            // Create a reference to the preview-image
            $checkbox = jQuery(this);
            
            // Create a reference to all of the checkboxes
            $checkboxes = jQuery(".image-orientation-checkbox");

            // Loop over each checkbox and determine what should be checked
            $checkboxes.each(function(checkboxIndex, thisCheckbox) {

            	// Disable the checkbox-related form elements
            	api.disableCheckboxElements(thisCheckbox);

            });            
            
            // Create a reference to all of the checkboxes
            $checkboxes = jQuery(".image-control-checkbox");
            
            // Loop over each checkbox and determine what should be checked
            $checkboxes.each(function(checkboxIndex, thisCheckbox) {

                // jQuery-ify the current checkbox
                $thisCheckbox = jQuery(thisCheckbox);

                // Create a reference to the slider associated with this checkbox
                sliderId = "#recipe-" + $thisCheckbox.data("slider") + "Orientation";
                sliderLabelClass = ".slider-" + $thisCheckbox.data("slider") + "-label";
                sliderValueClass = ".slider-" + $thisCheckbox.data("slider") + "-value";
                resetSliderClass = ".reset-slider-" + $thisCheckbox.data("slider");            	
            	
                // Add the bold class to the slider title
                jQuery(sliderLabelClass).addClass("bold-label");

                // Color the slider, and show it as enabled
                jQuery(sliderId).addClass("enabled-slider");

                // Enable the slider associated to the checked checkbox
                jQuery(sliderId).removeAttr('disabled');

                // Enable the reset button
                jQuery(resetSliderClass).removeClass("disabled");
                jQuery(resetSliderClass).addClass("reset-button-xs-enabled");

                // Enable the slider value / editable field
                jQuery(sliderValueClass).editable("enable");

            });             
            
        });
        
        // Check and determine if any of the orientation checkboxes have been selected
        jQuery(".image-orientation-checkbox").on("click", function () {

            // Default local variables
            var $checkbox, $checkboxes, $thisCheckbox, checkboxLabelClass, sliderId, sliderLabelClass, sliderValueClass, resetSliderClass;

            // Create a reference to the preview-image
            $checkbox = jQuery(this);

            // Set the active checkbox slider label
            checkboxLabelClass = ".slider-" + $checkbox.data("slider") + "-label";

            // Is the current checkbox checked?
            if( $checkbox.prop("checked") ){

                // Create a reference to all of the checkboxes
                $checkboxes = jQuery(".image-control-checkbox");
                
                // Disable the zoom / viewport orientation controls
                $checkboxes.each(function(checkboxIndex, thisCheckbox) {

                	// Disable the checkbox-related form elements
                	api.disableCheckboxElements(thisCheckbox);

                });               	
            	
                // Create a reference to all of the checkboxes
                $checkboxes = jQuery(".image-orientation-checkbox");

                // Loop over each checkbox and determine what should be checked
                $checkboxes.each(function(checkboxIndex, thisCheckbox) {

                    // jQuery-ify the current checkbox
                    $thisCheckbox = jQuery(thisCheckbox);

                    // Create a reference to the slider associated with this checkbox
                    sliderId = "#recipe-" + $thisCheckbox.data("slider") + "Orientation";
                    sliderLabelClass = ".slider-" + $thisCheckbox.data("slider") + "-label";
                    sliderValueClass = ".slider-" + $thisCheckbox.data("slider") + "-value";
                    resetSliderClass = ".reset-slider-" + $thisCheckbox.data("slider");

                    // Is this checkbox not the original / first / checked checkbox?
                    if( $thisCheckbox.prop("id") !== $checkbox.prop("id") ){

                        // If not, then go ahead and un-check the checkbox
                        $thisCheckbox.removeAttr("checked");

                        // Disable the slider associated to this checkbox
                        jQuery(sliderId).attr('disabled', 'disabled');

                        // Render the slider as disabled
                        jQuery(sliderId).removeClass("enabled-slider");

                        // Add the bold class to the slider title
                        jQuery(sliderLabelClass).removeClass("bold-label");

                        // Disable the reset button
                        jQuery(resetSliderClass).addClass("disabled");
                        jQuery(resetSliderClass).removeClass("reset-button-xs-enabled");

                        // Disable the slider value / editable field
                        jQuery(sliderValueClass).editable("disable");

                    } else {

                        // Add the bold class to the slider title
                        jQuery(sliderLabelClass).addClass("bold-label");

                        // Color the slider, and show it as enabled
                        jQuery(sliderId).addClass("enabled-slider");

                        // Enable the slider associated to the checked checkbox
                        jQuery(sliderId).removeAttr('disabled');

                        // Enable the reset button
                        jQuery(resetSliderClass).removeClass("disabled");
                        jQuery(resetSliderClass).addClass("reset-button-xs-enabled");

                        // Enable the slider value / editable field
                        jQuery(sliderValueClass).editable("enable");

                    }

                });

            } else {

                // Remove the bold class from the slider title
                jQuery(checkboxLabelClass).removeClass("bold-label");

                // Create a reference to the slider associated with this checkbox
                sliderId = "#recipe-" + $checkbox.data("slider") + "Orientation";

                // Render the slider as disabled
                jQuery(sliderId).removeClass("enabled-slider");

                // Disable the slider associated to this checkbox
                jQuery(sliderId).attr('disabled', 'disabled');

                // Build out the reset-slider class name
                resetSliderClass = ".reset-slider-" + $checkbox.data("slider");
                sliderValueClass = ".slider-" + $checkbox.data("slider") + "-value";

                // Remove the enabled class off the current element
                jQuery(resetSliderClass).addClass("disabled");
                jQuery(resetSliderClass).removeClass("reset-button-xs-enabled");

                // Disable the slider value / editable field
                jQuery(sliderValueClass).editable("disable");

            }

        });

    };

    // This method is sued to initialize editable controls
    api.initUIEditableControls = function () {

        // Initialize local variables;
        var defaultConfig, displayFunction, urlFunction;

        // Initialize the function used to update the label display
        displayFunction = function(value) {

            // Ensure the displayed value has two decimals
            jQuery(this).text(parseFloat(value).toFixed(2));

        };

        // Initialize the call-back function used to update the corresponding slider value
        urlFunction = function(params) {

            // Initialize local variables
            var $this, $slider, sliderId, sliderValue;

            // Create a jQuery reference to the current label
            $this = jQuery(this);

            // Create a reference to the slider-id for this label
            sliderId = $this.data("sliderid");

            // Create a reference to the jQuery slider
            $slider = jQuery("#" + sliderId);

            // Calculate the slider value for the current slider
            sliderValue = api.calculateSliderValue(params["value"], sliderId);

            // Set the slider value, and trigger the "set" call-back
            $slider.val( sliderValue, { set: true } );

        };

        // Initialize the default configuration
        defaultConfig = {

            // Default the slider properties
            type: "number",
            min: 1,
            max: 100,
            step:.01,
            send: "never",
            placement: "right",

            // Set the initial disabled status
            disabled: true,
            title: "Please Enter a Zoom % (1-100)",

            // Default the slider controls
            emptytext: "0.00",
            emptyclass: "",

            // Define the function used to drive the value display
            display: displayFunction,

            // Define the processing callback
            url: urlFunction

        };

        // Make the slider / image-width field editable
        jQuery(".slider-width-value").editable(defaultConfig);

        // Reset the minimum for the image / pc slider
        defaultConfig["min"] = 0;
        defaultConfig["title"] = "Please Enter a Zoom % (0-100)";            

        // Make all of the "slider-value" fields (top, medium, bottom) editable
        jQuery(".slider-orientation-value").editable(defaultConfig);

    };

    // This method is used to initialize the UI Select Control / Listeners
    api.initUISelectControls = function () {

        // Initialize the select controls
        jQuery(".selectpicker").selectpicker();

        // Listen for / examine change events
        jQuery(".select-control-group").on("change", function(e) {

            // Prevent double-click nonsense
            e.preventDefault();

            // Retrieve the recipe object for the category / view type combination
            api.loadSelectedRecipe();                    
                              
        	// HACK: Force the show of elements being hidden by prototype
            api.showPrototypeSuppressedControls();
            
        });       

        // Listen for clicks to the recipe item next / previous elements
        jQuery(".recipe-control").on("click", function(e) {

            // Prevent double-click nonsense
            e.preventDefault();

            // Check if the current recipe has un-saved changes
            if ( api.doesRecipeObjectHaveUnsavedChanges() ){

                // Record the last selected recipe control
                lastSelectedRecipeControl = this;

                // If un-saved changes exist, then show the advance modal
                jQuery("#unsaved-changes-advance-modal").modal("show");
                
                // Prevent the "scroll-bar" shifting when modals are shown
                jQuery("body").css("overflow-y", "scroll");
                
            } else {

                // Trigger the method to select the next recipe
                api.showNextRecipe(this);

            }

        });

        // HACK: Any click on the main / table will trigger the display of the bootstrap-select controls
        jQuery(".main, button.editable-submit, button.editable-cancel").on("click", function(e) {

            // Show the prototype-suppressed controls
            api.showPrototypeSuppressedControls();
                       
        });
        
    };

    // This method is used to initialize the UI Slider Controls
    api.initUISliderControls = function () {

        //////////////////////////////////////
        // Image Orientation Slider Controls
        //////////////////////////////////////

        // Initialize the top orientation slider control
        jQuery("#recipe-topOrientation").noUiSlider({
            start: [appConstants["defaults"]["topOrientation"]],
            step:.01,
            range: {
                'min': 0,
                'max': 250
            },
            serialization: {
                lower: [
                    jQuery.Link({
                        target: jQuery(".slider-top-value"),
                        method: "text"
                    }),
                    jQuery.Link({
                        target: function(){
                            api.calculateOrientation('top');
                            api.setOrientationValueDisplay('top');
                        }
                    })
                ]
            }
        });

        // Default the top orientation percentage display with it's initial value
        api.setOrientationValueDisplay('top');

        // Disable the top orientation slider by default
        jQuery("#recipe-topOrientation").attr('disabled', 'disabled');

        // Initialize the mid orientation slider control
        jQuery("#recipe-midOrientation").noUiSlider({
            start: [appConstants["defaults"]["midOrientation"]],
            step: 0.01,
            range: {
                'min': 0,
                'max': 250
            },
            serialization: {
                lower: [
                    jQuery.Link({
                        target: jQuery(".slider-mid-value"),
                        method: "text"
                    }),
                    jQuery.Link({
                        target: function(){
                            api.calculateOrientation('mid');
                            api.setOrientationValueDisplay('mid');
                        }
                    })
                ]
            }
        });

        // Disable the mid orientation slider by default
        jQuery("#recipe-midOrientation").attr('disabled', 'disabled');

        // Default the mid orientation percentage display with it's initial value
        api.setOrientationValueDisplay('mid');

        // Initialize the bottom orientation slider control
        jQuery("#recipe-bottomOrientation").noUiSlider({
            start: [appConstants["defaults"]["bottomOrientation"]],
            step: .01,
            range: {
                'min': 0,
                'max': 250
            },
            serialization: {
                lower: [
                    jQuery.Link({
                        target: jQuery(".slider-bottom-value"),
                        method: "text"
                    }),
                    jQuery.Link({
                        target: function(){
                            api.calculateOrientation('bottom');
                            api.setOrientationValueDisplay('bottom');
                        }
                    })
                ]
            }
        });

        // Disable the bottom orientation slider by default
        jQuery("#recipe-bottomOrientation").attr('disabled', 'disabled');

        // Default the bottom orientation percentage display with it's initial value
        api.setOrientationValueDisplay('bottom');

        //////////////////////////////////////
        // CSS / Percentage Width Slider Control
        //////////////////////////////////////

        // Initialize the mid orientation slider control
        jQuery("#recipe-widthOrientation").noUiSlider({
            start: [appConstants["defaults"]["CSSWidth"]],
            step: 0.01,
            range: {
                'min':1,
                'max': 100
            },
            serialization: {
                lower: [
                    jQuery.Link({
                        target: jQuery(".slider-width-value"),
                        method: "text"
                    }),
                    jQuery.Link({
                        target: function() {
                            api.setOrientationValueDisplay('width');
                            api.setImagePreviewImageWidthPercentage(true);
                        }
                    })
                ]
            }
        });

        // Disable the image magnification percentage
        jQuery("#recipe-widthOrientation").attr('disabled', 'disabled');

        //////////////////////////////////////
        // Zoom Percentage Control
        //////////////////////////////////////

        // Initialize the zoom orientation slider control
        jQuery("#recipe-zoomOrientation").noUiSlider({
            start: [appConstants["defaults"]["zoomOrientation"]],
            step: 0.01,
            range: {
                'min':1,
                'max': 250
            },
            serialization: {
                lower: [
                    jQuery.Link({
                        target: jQuery(".slider-zoom-value"),
                        method: "text"
                    }),
                    jQuery.Link({
                        target: function() {
                            api.calculateOrientation('zoom');
                            api.setOrientationValueDisplay('zoom');
                        }
                    })
                ]
            }
        });

        // Disable the zoom percentage magnification
        jQuery("#recipe-zoomOrientation").attr('disabled', 'disabled');        
       
        //////////////////////////////////////
        // Viewport Percentage Control
        //////////////////////////////////////

        // Initialize the zoom orientation slider control
        jQuery("#recipe-viewportOrientation").noUiSlider({
            start: [appConstants["defaults"]["viewportOrientation"]],
            step: 0.01,
            range: {
                'min':0,
                'max': 100
            },
            serialization: {
                lower: [
                    jQuery.Link({
                        target: jQuery(".slider-viewport-value"),
                        method: "text"
                    }),
                    jQuery.Link({
                        target: function() {
                            api.calculateOrientation('viewport');
                            api.setOrientationValueDisplay('viewport');
                        }
                    })
                ]
            }
        });

        // Disable the zoom percentage magnification
        jQuery("#recipe-viewportOrientation").attr('disabled', 'disabled');          
        
    };

    // This method is used to initialize the UI Touchspin Controls
    api.initUITouchSpinControls = function () {

        // Initialize local variables
        var baseTouchspinConfig, baseTouchspinPaddingConfig, basePosYTouchspinConfig;

        // Default the base touchSpin configuration
        baseTouchspinConfig = {
            min: 0,
            max: 3000,
            step: 1,
            boostat: 10,
            booster: true
        };

        // Default the base touchSpin configuration
        basePosYTouchspinConfig = {
            min: -3000,
            max: 3000,
            step: 1,
            boostat: 10,
            booster: true
        };

        // Default the base touchSpin padding configuration
        baseTouchspinPaddingConfig = {
            min: -0.999,
            max: 1.1,
            initval: 0,
            step:.001,
            decimals: 3,
            boostat:.5,
            booster: false,
            postfix: '%'
        };

        // Build out custom properties for the scale control
        jQuery("input[name='recipe-scale']").TouchSpin({
            min: 0,
            max: 2,
            step: 0.01,
            decimals: 2,
            boostat: 10,
            booster: true,
            postfix: '%'
        });

        // Initialize the generic touchspin controls
        jQuery("input[name='recipe-sizeX']").TouchSpin(baseTouchspinConfig);
        jQuery("input[name='recipe-sizeY']").TouchSpin(baseTouchspinConfig);
        jQuery("input[name='recipe-rectX']").TouchSpin(baseTouchspinConfig);
        jQuery("input[name='recipe-rectY']").TouchSpin(baseTouchspinConfig);
        jQuery("input[name='recipe-width']").TouchSpin(baseTouchspinConfig);
        jQuery("input[name='recipe-height']").TouchSpin(baseTouchspinConfig);
        jQuery("input[name='recipe-posX']").TouchSpin(baseTouchspinConfig);
        jQuery("input[name='recipe-posY']").TouchSpin(basePosYTouchspinConfig);

        // Enforce limits on quality properties
        jQuery("input[name='recipe-quality']").TouchSpin({
            min: 1,
            max: 100,
            step: 1,
            boostat: 10,
            booster: true
        });

        // Initialize the percentage padding properties
        jQuery("input[name='recipe-paddingTop']").TouchSpin(baseTouchspinPaddingConfig);
        jQuery("input[name='recipe-paddingRight']").TouchSpin(baseTouchspinPaddingConfig);
        jQuery("input[name='recipe-paddingBottom']").TouchSpin(baseTouchspinPaddingConfig);
        jQuery("input[name='recipe-paddingLeft']").TouchSpin(baseTouchspinPaddingConfig);

    };

    // TODO: Consolidate the LockX / LockY Axis functions into a lockAxis function that accepts the axis to work with as an argument
    // This method is used to lock the xAxis display
    api.lockXAxis = function () {

        // Default local variables
        var centerWidth, $parentElement, $posX, $checkbox, labelClass;

        // Initialize the object references
        $checkbox = jQuery("#lock-x-axis-enabled");
        $posX = jQuery("input[name='recipe-posX']");
        $parentElement = jQuery(".posX-control");

        // Show the checkbox as checked
        $checkbox.prop("checked", true);

        // Create a reference to the associated data label
        labelClass = "." + $checkbox.data("label");

        // Disable the positionX form field
        $posX.attr("disabled", "disabled");

        // Disable the up / down touchspin buttons
        $parentElement.find(".bootstrap-touchspin-up").addClass("disabled");
        $parentElement.find(".bootstrap-touchspin-down").addClass("disabled");

        // Calculate the center width for the current image
        centerWidth = jQuery("input[name='recipe-width']").val() / 2;

        // Center the image based on the width of the image container
        $posX.val(Math.ceil(centerWidth));

        // Update the toggle message
        jQuery(".lock-x-axis-message").html("X-Axis Centered and Locked");

        // Emphasize the label to show it's selected
        jQuery(labelClass).addClass("bold-label");

    };

    // TODO: Consolidate the LockX / LockY Axis functions into a lockAxis function that accepts the axis to work with as an argument
    // This method is used to lock the yAxis display
    api.lockYAxis = function () {

        // Default local variables
        var centerWidth, $parentElement, $posY, $checkbox, labelClass;

        // Initialize the object references
        $checkbox = jQuery("#lock-y-axis-enabled");
        $posY = jQuery("input[name='recipe-posY']");
        $parentElement = jQuery(".posY-control");

        // Show the checkbox as checked
        $checkbox.prop("checked", true);

        // Create a reference to the associated data label
        labelClass = "." + $checkbox.data("label");

        // Disable the positionX form field
        $posY.attr("disabled", "disabled");

        // Disable the up / down touchspin buttons
        $parentElement.find(".bootstrap-touchspin-up").addClass("disabled");
        $parentElement.find(".bootstrap-touchspin-down").addClass("disabled");

        // Calculate the center width for the current image
        centerWidth = jQuery("input[name='recipe-width']").val() / 2;

        // Center the image based on the width of the image container
        $posY.val(Math.ceil(centerWidth));

        // Update the toggle message
        jQuery(".lock-y-axis-message").html("Y-Axis Centered and Locked");

        // Emphasize the label to show it's selected
        jQuery(labelClass).addClass("bold-label");

    };

    // This method is used to preview an image
    api.previewRecipeImage = function () {

        // Initialize local variables
        var origScene7ImageUrl, outputUrl, recipeProperties;

        // Retrieve the active set of recipe properties
        recipeProperties = api.getRecipeProperties();       

        // Don't render a preview image if the render-preview is disabled
        if( !api.renderPreviewImage() ) return;

        // Create a reference to the scene7 Url for this image
        origScene7ImageUrl = api.getScene7Url(recipeProperties);
        outputUrl = origScene7ImageUrl;

        // Determine if the preview image should be rendered over https://
        if ( constants["enableHttpsImageDisplay"] === true ) {
        	outputUrl = outputUrl.replace("http://", "https://");
        }

        // Load the current image using the recipe properties provided
        jQuery(".recipe-image-preview").attr("src", outputUrl);

        // Display the recipe image preview
        jQuery(".recipe-image-preview").removeClass("hide");

        // Update the title of the current image
        jQuery(".image-title").html(currentImageName);

        try {

            // Listen for clipboard-copy commands
            jQuery("a#full-clipboard-url").zclip({
                path: constants["zeroClipboardPath"],
                copy: function() { return origScene7ImageUrl; },
                afterCopy: function() { return false; }
            });

            // Listen for clipboard-copy commands
            jQuery("a#partial-clipboard-url").zclip({
                path: constants["zeroClipboardPath"],
                copy: function() { return origScene7ImageUrl.replace(originUrl, ""); },
                afterCopy: function() { return false; }
            });

            // Listen for clipboard-copy commands
            jQuery("a#raw-clipboard-url").zclip({
                path: constants["zeroClipboardPath"],
                copy: function() { return originUrl + jQuery("#image-file-name").val(); },
                afterCopy: function() { return false; }
            });

        } catch (e) {

        	// In an error was caught, then log it
        	console.log(e);

        }

        // Update the dimensions of the image
        jQuery(".image-dimensions").html(api.getImageDimensionsLabel(recipeProperties));

        // Re-initialize the json-recipe display
        api.initJSONDisplay();

        // Enable the save button display
        api.toggleSaveButton();

        // Only show this title if CSS width isn't enabled
        if( cssWidthEnabled === false ){

            // Update the image display label
            api.setImageDisplayPercentageLabel();

        }          

    };

    // This function is used to determine if a preview image should be rendered
    api.renderPreviewImage = function () {

        // If the recipe object is currently being loaded, then don't render the preview image
        if ( recipeObjectIsLoading === true ) return false;

        // If the render-preview image is disabled, then don't render the preview image
        if( recipeObjectRenderPreviewImage === true && recipeObjectIsLoading === false ) return true;

        // Otherwise, don't render anything
        return false;

    };

    // This method is used to display the image percentage label
    api.setImageDisplayPercentageLabel = function (displayString) {

        // Exit early if the recipe creator hasn't been initialized
        if( !api.renderPreviewImage() ) return;

        // Exit early if the recipe image hasn't been rendered yet
        if( jQuery(".recipe-image-preview").hasClass("hide") === true ) return;

        // Default the display string if one isn't provided
        if( arguments.length === 0 ) {
            displayString = labels["IMAGES_SHOWN_ACTUAL_SIZE_MESSAGE"];
        }

        // Show the image width label (describing the % offset)
        jQuery(".image-display-percentage").html(displayString);

        // Otherwise, show the image display label
        jQuery(".image-display-percentage").removeClass("hide");

    };

    // This method is used to seed the image magnification control default value
    api.setImageMagnificationDefault = function () {

        // Set and seed the default value for the image magnification control
        jQuery("#recipe-widthOrientation").val(appConstants["defaults"]["CSSWidth"], { set: true });

    };

    // Default and set the image orientation control defaults
    api.setImageOrientationDefaults = function() {

        // Set and seed the default value for the top, mid, and bottom orientation controls
        jQuery("#recipe-topOrientation").val(appConstants["defaults"]["topOrientation"], { set: true });
        jQuery("#recipe-midOrientation").val(appConstants["defaults"]["midOrientation"], { set: true });
        jQuery("#recipe-bottomOrientation").val(appConstants["defaults"]["bottomOrientation"], { set: true });

        // Seed the default values for the zoom / viewport orientation controls
        jQuery("#recipe-zoomOrientation").val(appConstants["defaults"]["zoomOrientation"], { set: true });
        jQuery("#recipe-viewportOrientation").val(appConstants["defaults"]["viewportOrientation"], { set: true });
    };

    // This image is used to set the image width % using CSS (to scale an image size up and down)
    api.setImagePreviewImageWidthPercentage = function (resetJSONPane) {

    	// Default the jsonPane argument definition
    	if ( arguments.length === 0 ) resetJSONPane = false;
    	
        // Enable the save button display
        api.toggleSaveButton();

        // Don't render the image width percentage if the preview is disabled
        if( !api.renderPreviewImage() ) return;

        // Initialize local variables
        var imageWidth;

        // If the css-width flag isn't enabled, then exist
        if (!cssWidthEnabled) {

            // Clear the display percentage display
            api.setImageDisplayPercentageLabel();

            // Exit the display function
            return;

        }

        // Capture the image width specified
        imageWidth = parseFloat(jQuery("#recipe-widthOrientation").val()).toFixed(2);

        // Manually set the image width, using the PC value from the slider
        jQuery(".recipe-image-preview").css("width", imageWidth + "%");

        // Set and display the image percentage label
        api.setImageDisplayPercentageLabel("image width " + imageWidth + "%" + " of display");

        // Only initialize the JSONPane if explicitly told to do so
        if ( resetJSONPane ) api.initJSONDisplay();
        
    };

    // This method is used to set the controls enabled on the orientation tab
    api.setOrientationControls = function (orientationProperties) {

        //////////////////////////////////////
        // X / Y Axis Controls
        //////////////////////////////////////

        // Check if the x-axis needs to be locked or unlocked -- based on the orientation property
        if( orientationProperties["centerXEnabled"] === true ) {

            // Lock the X Axis
            api.lockXAxis();

        } else {

            // Unlock the X Axis
            api.unlockXAxis();

        }

        // Check if the y-axis needs to be locked or unlocked -- based on the orientation property
        if( orientationProperties["centerYEnabled"] === true ) {

            // Lock the Y Axis
            api.lockYAxis();

        } else {

            // Unlock the Y Axis
            api.unlockYAxis();

        }

        //////////////////////////////////////
        // Image Magnification Control
        //////////////////////////////////////

        // Set the CSS Width property value saved with this recipe
        jQuery("#recipe-widthOrientation").val(orientationProperties["cssWidthValue"], {set: true});

        // Check if CSS Width toggle checkbox needs to be enabled or disabled
        if( orientationProperties["cssWidthEnabled"] === true ) {

            // Enable image magnification
            api.enableImageMagnification();

        } else {

            // Otherwise, disable it
            api.disableImageMagnification();

        }

        //////////////////////////////////////
        // Image Orientation Controls
        //////////////////////////////////////

        // Disable each of the image orientation controls
        api.disableImageOrientationControls();

        // Set the orientation values that were recorded as part of the current recipe
        jQuery("#recipe-topOrientation").val(orientationProperties["topOrientationValue"]);
        jQuery("#recipe-midOrientation").val(orientationProperties["midOrientationValue"]);
        jQuery("#recipe-bottomOrientation").val(orientationProperties["bottomOrientationValue"]);

        // Check if the mid orientation control is enabled?
        if( orientationProperties["midOrientationEnabled"] === true ) {

            // If so, then enable the mid-orientation control and pre-select its value
            api.enableOrientationControl("mid", orientationProperties["midOrientationValue"]);

            // Check if the top orientation control is enabled?
        } else if ( orientationProperties["topOrientationEnabled"] === true ) {

            // If so, then enable the top-orientation control and pre-select its value
            api.enableOrientationControl("top", orientationProperties["topOrientationValue"]);

            // Check if the bottom orientation control is enabled?
        } else if ( orientationProperties["bottomOrientationEnabled"] === true ) {

            // If so, then enable the bottom-orientation control and pre-select its value
            api.enableOrientationControl("bottom", orientationProperties["bottomOrientationValue"]);

        }

        //Check if a recipe-specific zoom / viewport orientation property has been defined
        if ( !orientationProperties.hasOwnProperty("zoomOrientationValue") ) {

            // Default the zoom / viewport orientation values
            jQuery("#recipe-zoomOrientation").val(appConstants["defaults"]["zoomOrientation"]);
            jQuery("#recipe-viewportOrientation").val(appConstants["defaults"]["viewportOrientation"]);

        } else {

            // Set the zoom / viewport image orientation values
            jQuery("#recipe-zoomOrientation").val(orientationProperties["zoomOrientationValue"]);
            jQuery("#recipe-viewportOrientation").val(orientationProperties["viewportOrientationValue"]);

        }

        // Check if the zoom orientation controls are enabled?
        if( orientationProperties["zoomOrientationEnabled"] === true ) {

            // If so, then enable the zoom and viewport orientations control and pre-select their value
            api.enableOrientationControl("zoom", orientationProperties["zoomOrientationValue"]);
            api.enableOrientationControl("viewport", orientationProperties["viewportOrientationValue"]);

        }

    };

    // This method is used to store the newly-loaded recipe definition
    api.setOriginalRecipeDefinition = function (recipeObject) {

        // Make a deep copy of the current recipe definition
        originalRecipeDefinition = _.clone(recipeObject, true);

    };

    // This method is used to set the orientation value display for a given slider
    api.setOrientationValueDisplay = function (orientationString) {

        // Initialize local variables
        var $slider, $sliderLabel, sliderValue, sliderValueFixed;

        // Create references to the slider and slider label
        $slider = jQuery("#recipe-" + orientationString + "Orientation");
        $sliderLabel = jQuery(".slider-" + orientationString + "-value");

        // Get the value associated with the current slider
        sliderValue = parseFloat($slider.val());

        // Check if the width orientationString was specified
        if ( orientationString === 'width' || orientationString === 'viewport' ) {
        	
            // Use the image width threshold constraint
            sliderValue = (sliderValue / 100) * 100;

        }else {
        	
            // Use the top / bottom / mid threshold constraint
            sliderValue = (sliderValue / 250) * 100;
                	
        }
        
        // Set the fixed slider value (limit to two decimals)
        sliderValueFixed = sliderValue.toFixed(2);

        // Display the updated value in the slider label
        $sliderLabel.html(sliderValueFixed);

        // Set the slider value for the editable control
        api.initUIEditableControls();

        // Update the slider label with the slider-specific value
        $sliderLabel.editable("option", "value", sliderValueFixed);

    };

    // This method is used to seed the recipe controls for a given image
    api.setRecipeControls = function (recipeProperties) {

        // Seed the scale values
        $cache["recipe-scale"].val(recipeProperties["scale"]);
        $cache["recipe-sizeX"].val(recipeProperties["sizeX"]);
        $cache["recipe-sizeY"].val(recipeProperties["sizeY"]);

        // Seed the position values
        jQuery("#recipe-rectX").val(recipeProperties["rectX"]);
        jQuery("#recipe-rectY").val(recipeProperties["rectY"]);
        jQuery("#recipe-width").val(recipeProperties["width"]);
        jQuery("#recipe-height").val(recipeProperties["height"]);
        $cache["recipe-posX"].val(recipeProperties["positionX"]);
        $cache["recipe-posY"].val(recipeProperties["positionY"]);

        // Set the format, resolution, and image quality
        if (recipeProperties["format"] === 'jpg') jQuery("#format-option-1").click();
        if (recipeProperties["format"] === 'png') jQuery("#format-option-2").click();
        if (recipeProperties["format"] === 'png-alpha') jQuery("#format-option-3").click();

        // Set the resolution mode for the image
        if (recipeProperties["resMode"] === 'bilin') jQuery("#resmode-option-1").click();
        if (recipeProperties["resMode"] === 'bicub') jQuery("#resmode-option-2").click();
        if (recipeProperties["resMode"] === 'sharp2') jQuery("#resmode-option-3").click();
        if (recipeProperties["resMode"] === 'trilin') jQuery("#resmode-option-4").click();

        // Seed the padding values
        jQuery("#recipe-paddingTop").val(recipeProperties["paddingTop"]);
        jQuery("#recipe-paddingRight").val(recipeProperties["paddingRight"]);
        jQuery("#recipe-paddingBottom").val(recipeProperties["paddingBottom"]);
        jQuery("#recipe-paddingLeft").val(recipeProperties["paddingLeft"]);

        // Set the recipe quality property
        jQuery("#recipe-quality").val(recipeProperties["quality"]);

        // Set the background color (add the hash before setting the value)
        jQuery(".recipe-background-color").colorpicker('setValue', '#' + recipeProperties["backgroundColor"]);

        // Set the visual name of the color picker element
        jQuery("#background-color-element").val('#' + recipeProperties["backgroundColor"].toUpperCase());

    };

    // This method is used to reset the "has-changed" flag (used to track whether a recipe definition has changed)
    api.setRecipeHasChangedState = function (result) {

        // Default the has-changed flag
        recipeObjectHasChanged = result;

        // Enable the "saveButton" display
        api.toggleSaveButton();

    };

    // This method is used to flag whether a recipe has been loaded
    api.setRecipeHasLoadedState = function (result) {

        // Default the recipe object-is-loaded flag
        recipeObjectIsLoaded = result;

    };

    // This method is used to flag whether a recipe has been loaded
    api.setRecipeIsLoadingState = function (result) {

        // Default the recipe object-is-loaded flag
        recipeObjectIsLoading = result;

    };

    // This method is used to flag whether a recipe preview image can be rendered
    api.setRecipeRenderPreviewImageState = function (result) {

        // Initialize the recipeCategories cache
        recipeObjectRenderPreviewImage = result;

        // Can the current image be shown?
        if ( result === true ) {

            // Check if the recipe object has changed
            if ( api.hasRecipeObjectChanged() ) {

                // If so, then enable the save button
                api.setRecipeHasChangedState(true);

            }

        }

    };

    // This method is used to set the recipe size / scale properties
    api.setRecipeSizeAndScaleProperties = function (scale, posY, posX, sizeY, sizeX) {

        // Default the recipe scale
        $cache["recipe-scale"].val(scale);

        // Move the image to the bottom
        $cache["recipe-posY"].val(posY);

        // Seed the position and size properties
        $cache["recipe-posX"].val(posX);
        $cache["recipe-sizeY"].val(sizeY);
        $cache["recipe-sizeX"].val(sizeX);

    };

    // This method is used to retrieve the next recipe category as requested by the user via the next / previous controls
    api.showNextRecipe = function (directionControl) {

        // Initialize local variables
        var $selectControl, selectDirection, currentOption, totalOptions,

        // Capture the direction of the control
        selectDirection = jQuery(directionControl).data("direction");

        // Create a reference to the current select control
        $selectControl = jQuery("#" + jQuery(directionControl).data("selectid"));

        // Capture the current / total option counts
        currentOption = $selectControl.prop("selectedIndex");
        totalOptions = $selectControl.find("option").length;

        // Check what direction should be processed
        if( selectDirection === "next" ){

            // Increment the current option
            currentOption = currentOption + 1;

            // If the total option count is exceeded, then start over at the first option
            if( currentOption > totalOptions ) currentOption = 0;

        } else {

            // Increment the current option
            currentOption = currentOption - 1;

            // If the total option count is less than zero, then start over at the last option
            if( currentOption < 0 ) currentOption = totalOptions - 1;

        }

        // Set the selected index for the current item
        $selectControl.prop("selectedIndex", currentOption);

        // Re-render the select control
        $selectControl.selectpicker('refresh');
        
        // Force the re-display of the boostrap-select elements
        jQuery(".bootstrap-select").show();

        // Retrieve the recipe object for the category / view type combination
        api.loadSelectedRecipe();

    };    
    
    // This method is used to show / display the Scene 7 Recipe Creator UI
    api.showRecipeManager = function () {

        // Has the recipe UI been initialized?
        if( recipeManagerInitialized === false ){

            // If not, then initialize the recipe manager
            api.initRecipeManager();

        } else {

            // If so, then just update the recipe image display
            api.updateRecipeImage();

        }

    };

    // HACK: This function is used to render the prototype-suppressed controls
    api.showPrototypeSuppressedControls = function () {

        setTimeout(function(){

            // HACK: Force the display of the bootstrap select control
            jQuery("div.bootstrap-select").fadeIn(100);
            
            // Show the slider orientation / editable field labels
            jQuery(".slider-orientation-value").show();
            jQuery(".slider-width-value").show();  

        }, 0);

    };

    // This method is used to show a success "growl" notification
    api.showGrowlNotification = function (alertType, messageTitle, messageContent, iconClass) {

        // Default the alert-type
        if( typeof alertType === 'undefined' ) {
            alertType = 'success';
        }

        // Default the message title
        if( typeof messageTitle === 'undefined' ) {
            messageTitle = ' Success! ';
        }

        // Default the message-content
        if( typeof messageContent === 'undefined' ) {
            messageContent = 'I think you need to provide a message.';
        }

        // Default the icon-class
        if( typeof iconClass === 'undefined' ) {
            iconClass = 'glyphicon glyphicon-thumbs-up';
        }

        // Render the growl notification
        jQuery.growl({
                icon: iconClass,
                title: messageTitle,
                message: messageContent
            },{
                element: 'body',
                type: alertType,
                allow_dismiss: true,
                placement: {
                    from: "bottom",
                    align: "right"
                    },
                offset: 20,
                spacing: 10,
                z_index: 1031,
                delay: 3000,
                timer: 2000,
                url_target: '_blank',
                mouse_over: false,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOut'
                    },
                icon_type: 'class',
                template:   '<div data-growl="container" class="alert" role="alert">' +
                            '<button type="button" class="close" data-growl="dismiss">' +
                                '<span aria-hidden="true">×</span>' +
                                '<span class="sr-only">Close</span>' +
                            '</button>' +
                                '<span data-growl="icon"></span>' +
                                '<span data-growl="title" class="pt-sans bold-label"></span>' +
                                '<span data-growl="message" class="pt-sans"></span>' +
                            '</div>'

        });

    };

    // This function checks if the save button can be enabled based on edit state of the current recipe
    api.toggleSaveButton = function () {

        // If the recipe object has changed, check if a recipe has been loaded
        if ( !api.hasRecipeObjectChanged()  ) {

            // Otherwise, disable the save button
            $cache["btn-save"].addClass("disabled");

            // Remove the enabled coloring from the save button
            $cache["btn-save"].find(".glyphicon-floppy-saved").removeClass("enabled-recipe-buttons");

        } else if ( recipeObjectHasChanged === true && recipeObjectIsLoaded === true ) {

            // If so, then force the enabled state for the save button
            // Removed the disabled state from the save button
            $cache["btn-save"].removeClass("disabled");

            // Give the save button the enabled coloring
            $cache["btn-save"].find(".glyphicon-floppy-saved").addClass("enabled-recipe-buttons");

        }

    };

    // TODO: Consolidate the Unlock X / Y Axis Functions to a Shared UnlockAxis method that takes an axis as an argument
    // This method is used to unlock the X Axis display and re-enable the X Axis controls
    api.unlockXAxis = function() {

        // Default local variables
        var $parentElement, $posX, $checkbox, labelClass;

        // Initialize the object references
        $checkbox = jQuery("#lock-x-axis-enabled");
        $posX = jQuery("input[name='recipe-posX']");
        $parentElement = jQuery(".posX-control");

        // Create a reference to the associated data label
        labelClass = "." + $checkbox.data("label");

        // Un-check the checkbox
        $checkbox.prop("checked", false);

        // Remove the disabled property from the form field
        $posX.removeAttr("disabled");

        // Disable the up / down touchspin buttons
        $parentElement.find(".bootstrap-touchspin-up").removeClass("disabled");
        $parentElement.find(".bootstrap-touchspin-down").removeClass("disabled");

        // Update the toggle message
        jQuery(".lock-x-axis-message").html("X-Axis Unlocked");

        // De-emphasize the label to show it's not selected
        jQuery(labelClass).removeClass("bold-label");

    };

    // TODO: Consolidate the Unlock X / Y Axis Functions to a Shared UnlockAxis method that takes an axis as an argument
    // This method is used to unlock the Y Axis display and re-enable the Y Axis controls
    api.unlockYAxis = function() {

        // Default local variables
        var $checkbox, $parentElement, $posY, labelClass;

        // Initialize the object references
        $checkbox = jQuery("#lock-y-axis-enabled");
        $posY = jQuery("input[name='recipe-posY']");
        $parentElement = jQuery(".posY-control");

        // Create a reference to the associated data label
        labelClass = "." + $checkbox.data("label");

        // Un-check the checkbox
        $checkbox.prop("checked", false);

        // Remove the disabled property from the form field
        $posY.removeAttr("disabled");

        // Disable the up / down touchspin buttons
        $parentElement.find(".bootstrap-touchspin-up").removeClass("disabled");
        $parentElement.find(".bootstrap-touchspin-down").removeClass("disabled");

        // Update the toggle message
        jQuery(".lock-y-axis-message").html("Y-Axis Unlocked");

        // De-emphasize the label to show it's not selected
        jQuery(labelClass).removeClass("bold-label");

    };

    // This method is used to update the recipe image currently displayed
    api.updateRecipeImage = function() {

        // Don't render a preview image if the render-preview is disabled
        if( !api.renderPreviewImage() ) return;

        // Exit the function if the display image does not have a valid file name
        if (jQuery(".recipe-image-preview").attr("src").length === 0) return;

        // Preview and Render the current recipe image
        api.previewRecipeImage();
        
    	// HACK: Force the show of elements being hidden by prototype
        api.showPrototypeSuppressedControls();
 
    };

    //////////////////////////////////////////////////
    // Public Methods
    //////////////////////////////////////////////////

    // Build out the initialization function
    api.init = function (constants) {

        // Retrieve the collection of recipe categories
        api.getRecipeCategories();

        // Retrieve the collection of recipe view types
        api.getViewTypes();

        // Seed / default the constants
        appConstants = constants;

    };

    // This function is used to initialize all recipe control events
    api.initRecipeControlEvents = function () {

        // Initialize local variables
        var $recipeElements;

        // Initialize the recipe elements
        $recipeElements = jQuery(".recipe-element");

        // Evaluate the in every touchspin control
        $recipeElements.on("change", function () {

            // If a recipe element has been changed, then disable the image orientation controls
            api.disableImageOrientationControls();

            // Update the image display
            api.updateRecipeImage();

        });

        // Trigger an update when a format change occurs
        jQuery(".recipe-format-element").on("click", function (e) {

            // Initialize local variables
            var $formControl;

            // Prevent click throughs
            e.preventDefault();

            // Create a reference to the current form control
            $formControl = jQuery(this).find(".image-format-button");

            // Set the current format
            currentFormat = $formControl.data("format");

            // Update the recipe image display
            api.updateRecipeImage();

        });

        // Trigger an update when a resmode change occurs
        jQuery(".recipe-resmode-element").on("click", function (e) {

            // Initialize local variables
            var $formControl;

            // Prevent click throughs
            e.preventDefault();

            // Create a reference to the current form control
            $formControl = jQuery(this).find(".image-format-button");

            // Set the current resolution mode
            currentResMode = $formControl.data("format");

            // Update the recipe image display
            api.updateRecipeImage();

        });

        // Set the background color when it changes
        jQuery(".recipe-background-color").colorpicker().on('changeColor', function (e) {

            // Prevent click throughs
            e.preventDefault();

            // Update the recipe image display
            api.updateRecipeImage();

        });

    };

    // This function is used to initialize all UI events
    api.initUIEvents = function () {

        // Initialize the cache of jQuery objects
        api.initJQueryCache();

        // Initialize all buttons
        jQuery(".btn").button();

        // Initialize the color picker
        jQuery('.recipe-background-color').colorpicker();

        // Initialize the touchspin slider controls
        api.initUITouchSpinControls();

        // Initialize the UI Slider Controls
        api.initUISliderControls();

        // Initialize the editable labels / controls
        api.initUIEditableControls();

        // Initialize the complex button controls
        api.initUIButtonControls();

        // Initialize the select box listeners
        api.initUISelectControls();

        // Initialize the checkbox controls
        api.initUICheckboxControls();

        // Seed the recipe control values
        api.setRecipeControls(recipeDefaults);

        // Initialize the JSON Display
        api.initJSONDisplay();

        // If the window resizes -- then re-init the JSON display
        jQuery(window).resize(api.initJSONDisplay);

    };

    // Specify in the product code input field whatever the current product code value is
    api.setImageFileName = function () {

        // Initialize local variables
        var defaultImageName;

        // Capture a reference to the default image name
        defaultImageName = constants["defaultImageName"];

        // Check if a imageName was specified
        if (queryStruct.hasOwnProperty("image")) {

            // If so, see if it's different from the default
            if (queryStruct["image"] !== defaultImageName ){

                // If so, then update the output variable to represent the query string property
                defaultImageName = queryStruct["image"];

            }

        }

        // If so, then include it in the image name field
        api.updateImageFilenameDisplay(defaultImageName);

        // Set and record the current image name
        currentImageName = defaultImageName;

    };

    // This function is used to initialize the recipe selection controls
    api.setRecipeSelectionControls = function () {

        // Initialize local variables
        var defaultRecipeCode, defaultViewType;

        // Capture a reference to the default image name
        defaultRecipeCode = constants["defaultRecipeCode"];
        defaultViewType = constants["defaultViewType"];

        // Check if a imageName was specified
        if (queryStruct.hasOwnProperty("rc")) {

            // If so, see if it's different from the default
            if (queryStruct["rc"] !== defaultRecipeCode ){

                // If so, then over-ride the default
                defaultRecipeCode = queryStruct["rc"];
                
            }

        }

        // Check if a imageName was specified
        if (queryStruct.hasOwnProperty("vt")) {

            // If so, see if it's different from the default
            if (queryStruct["vt"] !== defaultViewType ){

                // If so, then over-ride the default
                defaultViewType = queryStruct["vt"];

            }

        }

        // Seed the default recipe category and view type
        $cache["recipe-category"].val(defaultRecipeCode);
        $cache["view-type"].val(defaultViewType);
        
        // Refresh the recipe-select controls
        $cache["view-type"].selectpicker("refresh");
        $cache["recipe-category"].selectpicker("refresh");

    };

    // Update the image filename display based on a value being passed in
    api.updateImageFilenameDisplay = function (imageFileName) {

        // Set the image to use in the recipe creator
        jQuery("#image-file-name").val(imageFileName);

    };

    // TODO: Migrate the getRecipeCategories function to a UA.S7API function
    // This function retrieves the unique list of recipe categories
    // from the uaS7Recipes service; the categories will be used
    // to allow users to select recipes to preview
    api.getRecipeCategories = function () {

        // Initialize local variables
        var result, jsonUrl;

        // Build out the URL where the recipe json is stored
        jsonUrl = constants["ajaxGetRecipeCategoriesUrl"];

        // Retrieve the recipe JSON using the jsonUrl
        jQuery.getJSON(jsonUrl, function (data) {

            // Loop over the results
            data.forEach(function (thisObj){

                // Attach / append the recipe category to the current select box
                jQuery("#recipe-category").append(new Option(thisObj["CATEGORYNAME"],thisObj["CATEGORYNAME"]));

            });

            // Cache the recipe categories
            recipeCategories = data;

        }).done(function() {

        	// Audit that the method has completed
            console.log("api.getRecipeCategories(): Completed.");

        }).fail(function(e) {

        	// Audit any errors
        	console.log(e);

        });

        // Return the json data
        //noinspection JSUnusedAssignment
        return result;

    };

    // TODO: Migrate the api.loadSelectedRecipe function to a UA.S7API function
    // This function retrieves the recipe definition for a given category and
    // view type combination; this recipe object will be used to seed the controls
    api.getSelectedRecipeDefinition = function (recipeCategory, viewType) {

        // Initialize local variables
        var jsonUrl, notificationMessage;

        // Flag that a recipe is being loaded
        api.setRecipeIsLoadingState(true);

        // Build out the URL where the view-type json is stored
        jsonUrl = constants["ajaxGetRecipeObjectUrl"];

        // Build out the URL where the recipe json is stored
        jsonUrl = jsonUrl + "?recipeCategory=" + recipeCategory + '&viewType=' + viewType;
        
        // Retrieve the recipe JSON using the jsonUrl
        jQuery.getJSON(jsonUrl, function (data) {

            // Set the global render image flag (prevent updates from occurring)
            api.setRecipeRenderPreviewImageState(false);

            // Check if this not has saved orientation controls
            if ( data.hasOwnProperty("ORIENTATION") ) {

                // If so, then set the control values
                api.setOrientationControls(data["ORIENTATION"]);

                // Seed the recipe controls
                api.setRecipeControls(data["DEF"]);

            } else {

                // Default the image magnification display
                api.defaultImageMagnificationControl();

                // Default the image orientation controls
                api.defaultImageOrientationControls();

                // Seed the recipe controls
                api.setRecipeControls(data["DEF"]);

                // Otherwise, default the orientation controls
                api.setOrientationControls();

            }

            // Reset the original recipe definition as the newly saved object
            api.setOriginalRecipeDefinition(data);

            // Enable the save / reload class
            $cache["btn-save"].addClass("disabled");
            $cache["btn-reset"].removeClass("disabled");

            // Show the save / reset as an actionable color
            $cache["btn-save"].find(".glyphicon").removeClass("enabled-recipe-buttons");
            $cache["btn-reset"].find(".glyphicon").addClass("enabled-recipe-buttons");

            // Re-initialize that a recipe has been loaded
            api.setRecipeHasLoadedState(true);

            // Flag that the recipe has been loaded
            api.setRecipeIsLoadingState(false);

            // Allow preview images to be rendered
            api.setRecipeRenderPreviewImageState(true);

            // Update the recipe image
            api.updateRecipeImage();

            // Set the image preview width value
            api.setImagePreviewImageWidthPercentage();

            // With the recipe loaded, show the preview image
            jQuery(".recipe-image-preview").fadeIn(300);

        }).done(function () {

            // Record that the method is completed
            console.log("api.getSelectedRecipeDefinition(): Completed.");

        }).fail(function (e) {

            // Re-initialize the recipe manager change-flag
            api.setRecipeHasChangedState(false);

            // Re-initialize that a recipe has been loaded
            api.setRecipeHasLoadedState(false);

            // Default the growl / notification message
            notificationMessage = "Unable to load the " + recipeCategory + " / " + viewType + " recipe.&nbsp;&nbsp;&nbsp;";

            // Since the recipe was loaded, show the success notification
            api.showGrowlNotification("danger", " Whoops! ", notificationMessage, "glyphicon glyphicon-exclamation-sign");

            // Log the error to the console
            console.log(e);

        });

    };

    // This method is used to retrieve the Scene 7 url for the current image
    api.getScene7UrlForClipboard = function () {

        // Build out and return the Scene 7 url
        return api.getScene7Url(api.getRecipeProperties());

    };

    // TODO: Migrate the getViewTypes function to a UA.S7API function
    // This function retrieves the unique list of distinct view-types
    // from the uaS7Recipes service; the categories will be used
    // to allow users to select view-types to preview
    api.getViewTypes = function () {

        // Initialize local variables
        var result, jsonUrl;

        // Build out the URL where the view-type json is stored
        jsonUrl = constants["ajaxGetViewTypesUrl"];
        
        // Retrieve the recipe JSON using the jsonUrl
        jQuery.getJSON(jsonUrl, function (data) {

            // Loop over the results
            data.forEach(function (thisObj){

                // Attach / append the recipe category to the current select box
                jQuery("#view-type").append(new Option(thisObj["VIEWTYPE"],thisObj["VIEWTYPE"]));

            });

            // Cache the view types
            viewTypes = data;

        }).done(function() {
        	
        	// Record that the method has completed
            console.log("api.getViewTypes(): Completed.");

        }).fail(function(e) {
        
        	// Audit any errors
        	console.log(e);
        
        });

        // Return the json data
        //noinspection JSUnusedAssignment
        return result;

    };    

    // TODO: Migrate the saveRecipeDefinition function to a UA.S7API function
    // This function is used to write a recipe definition to the application database
    api.saveRecipeDefinition = function (recipeObject) {

        // Initialize local variables
        var jsonUrl, notificationMessage;

        // Don't save changes to an object that hasn't changed
        if (!api.hasRecipeObjectChanged()) return;

        // Build out the URL where the recipe json is stored
        jsonUrl = constants["ajaxSaveRecipDefinitionUrl"];

        // Post the save operation
        jQuery.ajax({
            type: "POST",
            url: jsonUrl,
            data: { recipeDefinition: JSON.stringify(recipeObject) },
            dataType: "json"
        }).success(function (response) {
        	
        	// Was the save processed successfully?
        	if( response["RESULT"] === true ) {
        		
                // Since the recipe was saved / show the success notification
                api.showGrowlNotification("success", " Success! ", "Your recipe definition was saved.&nbsp;&nbsp;&nbsp;", "glyphicon glyphicon-ok-circle");

                // Reset the original recipe definition as the newly saved object
                api.setOriginalRecipeDefinition(recipeObject);

                // Reset the changed / loaded flags
                api.setRecipeHasChangedState(false);
                api.setRecipeHasLoadedState(true);
        	        		
        	} else {
        		
                // Default the growl / notification message
                notificationMessage = response["ERRORMESSAGE"] + "&nbsp;&nbsp;&nbsp;";

                // Since the an error occurred, throw the error notification
                api.showGrowlNotification("danger", " Whoops! ", notificationMessage, "glyphicon glyphicon-exclamation-sign");        		
        		
        	}
        	
        }).done(function() {

            // Record that the method has completed
            console.log("api.saveRecipeDefinition(): Completed.");

        }).fail(function (e) {

            // Default the growl / notification message
            notificationMessage = "Unable to save the current recipe.&nbsp;&nbsp;&nbsp;";

            // Since the an error occurred, throw the error notification
            api.showGrowlNotification("danger", " Error! ", notificationMessage, "glyphicon glyphicon-exclamation-sign");

            // Log the error to the console
            console.log(e);

        });

    };    
    
    // Return the API contents
    return api;

}();

//////////////////////////////////////////////
// Open To-Do's / Refactoring Tasks
//////////////////////////////////////////////
// TODO: Remove all AJAX service calls to a UA.S7AJAX class.
// TODO: Confirm that changes to a recipe trigger the "save" button to enable.
