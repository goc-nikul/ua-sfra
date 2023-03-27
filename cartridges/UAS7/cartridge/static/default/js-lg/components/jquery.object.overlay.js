/**
 *	jQuery Fail - Outer Html Polyfill
 */
(function($){
	$.fn.outerHTML = function(){
		return this.get(0).outerHTML || $("<i/>").append(this.clone(true)).html();
	};
})(jQuery || {});

 
/**
 *	Object Overlay
 *	This will take an object and apply an overlay
 *
 *	@author William George <code@williamgeorge.co.uk>
 *	@copyright (c) 2012 William George
 *	@license CodeCanyon Regular 
 *	@version 1.2
 *	@link Http://williamgeorge.co.uk/demos/objectoverlay
 */
;(function($, window, document, undefined){

	var ObjectOverlay = function(element, options){
		/**
		 *	Plugin Options
		 *	@var (String | Array | Boolean) overlayEffect - Css Filter Type (blur, greyscale, sepia, brightness, contrast, invert, saturate, opacity, false)
		 *	@var (String | Array)  overlayEffectValue - The value corrosponding to the type
		 *	@var String overlayText - Text to position on top of the overlay
		 *	@var String overlayImage - Image to position next to the overlay text
		 *	@var Boolean animate - Animate the overlay
		 *	@var Boolean showOnInit - Show overlay as soon as we initialise
		 *	@var String containerClass - Classname of the the Container
		 *	@var String overlayClass - Classname of the the Background Overlay
		 *	@var Object overlayCss - An object containing css values to be applied to the overlay
		 *	@var Object overlayTextCss - An object containing css values to be applied to the text on the overlay
		 *	@var String overlayCssAsFallback - True to only show overlay background when effects are not supported in the browser, false to always show
		 */
		var options = $.extend({},{
			overlayEffect: "blur", //Experimental and will currently only work properly in webkit. ( But Worth it ;P )
			overlayEffectValue: "3px",
			overlayText: "Processing...",
			overlayImage: null,
			animate: true,
			animationTime: 1000,
			showOnInit: true,
			containerClass: "ObjectOverlayContainer",
			overlayClass: "ObjectOverlay",
			overlayCss: {
				backgroundColor: "#fff",
				opacity: 0.8
			},
			overlayTextCss: {},
			overlayCssAsFallback: true
		}, $.ObjectOverlay, options);
		
		/**
		 *	Internal Vars
		 */
		var $matchedObject = $(element), that = this, $OverlayContainer, overlayImageDimensions = {},
			vendorPrefix = 	(/webkit/i).test(navigator.appVersion) ? '-webkit-' :
							(/firefox/i).test(navigator.userAgent) ? '-moz-' :
							(/trident/i).test(navigator.userAgent) ? '-ms-' :
							'opera' in window ? '-o-' : '',
			hasFilterCache = null,
			hasFilter = function(){
				if(hasFilterCache){
					return hasFilterCache;
				}
				var el = document.createElement('div');
				el.style.cssText = [vendorPrefix, ""].join('filter' + ':blur(2px);');
				
				//If we have filter, send css prefix
				if(!!el.style.length && ((document.documentMode === undefined || document.documentMode > 9))){
					return hasFilterCache = el.style[0];
				}
				
				return false;
			};
		
		/**
		 *	Constructor
		 */
		this.init = function(){
			//Bind Handlers
			_.bindHandlers();
		
			//Do we support filter?
			_.makeCssHook();
			
			//Load image if needed
			if(options.overlayImage){
				var imgPreloader = new Image();
				
				//Image loaded, lets continue
				imgPreloader.onload = allLoaded;
				
				//Image failed to load
				imgPreloader.onerror = function(){
					//Reset to nothing
					options.overlayImage = null;
					
					//Load anyway :)
					this.onload();
				};
				
				//Let add image source
				imgPreloader.src = options.overlayImage;
			} else {
				//No image loading so all good
				allLoaded();
			}
			
			function allLoaded(){
				//Grab Image Dimensions
				if(this.width && this.height){
					overlayImageDimensions = {
						width: this.width,
						height: this.height
					};
				}
				
				//Make Overlay
				_.makeOverlay();
				
				//Show overlay
				if(options.showOnInit){
					that.show();
				}
			}
		};
		
		/**
		 *	Show Overlay
		 */
		this.show = function(callbk){
			$matchedObject.trigger("overlay.beforeShow");
			
			_.makeEffect();
			
			//Show Container
			if(options.animate){
				$OverlayContainer.hide().fadeIn(options.animationTime, function(){
					$matchedObject.trigger("overlay.show");
					_.callback(callbk);
				});
			} else {
				$OverlayContainer.show();
				$matchedObject.trigger("overlay.show");
				_.callback(callbk);
			}
		};
		
		/**
		 *	Hide Overlay
		 */
		this.hide = function(callbk){
			$matchedObject.trigger("overlay.beforeHide");
			
			_.removeEffect();
			
			//Hide Container
			if(options.animate){
				$OverlayContainer.show().fadeOut(options.animationTime, function(){
					$matchedObject.trigger("overlay.hide");
					_.callback(callbk);
				});
			} else {	
				$OverlayContainer.hide();
				$matchedObject.trigger("overlay.hide");
				_.callback(callbk);
			}
		};
		
		/**
		 *	Hide Overlay
		 */
		this.destroy = function(callbk){
			$matchedObject.trigger("overlay.beforeDestroy");
			
			_.removeEffect();
			
			//If the original overlay was on the body, lets put the contents back.
			if($matchedObject.is("#SpecialBodyContainer")){
				var body = $("#SpecialBodyContainer").contents().detach();
				$matchedObject = $("body");
				$matchedObject.prepend(body);
			}
			
			//Remove overlay and plugin data
			$OverlayContainer.remove();
			$matchedObject.removeData('plugin_ObjectOverlay');
			
			//All Done
			$matchedObject.trigger("overlay.destroyed");
			_.callback(callbk);
		};
		
		/**
		 *	Private Fucntions
		 */
		var _ = {
		
			/**
			 *	Get Actual Screen width / height 
			 *	@return Object
			 */
			windowSize: function(){
				var w=window,d=document,e=d.documentElement,g=d.getElementsByTagName('body')[0],screenWidth=w.innerWidth||e.clientWidth||g.clientWidth,screenHeight=w.innerHeight||e.clientHeight||g.clientHeight;
				
				return {
					width: screenWidth,
					height: screenHeight
				}
			},
			
			/**
			 *	Handle the object resizing.
			 *	@return Void
			 */
			resize: function(){
				if($OverlayContainer !== undefined){
					$OverlayContainer.css(($matchedObject.is("body")?{
						width: _.windowSize().width,
						height: _.windowSize().height
					}:{
						top: $matchedObject.offset().top,
						left: $matchedObject.offset().left,
						width: $matchedObject.outerWidth(),
						height: $matchedObject.outerHeight()			
					}));
				}
			},
			
			/**
			 *	Bind Event Handlers
			 *	@return Void
			 */
			bindHandlers: function(){
				//Bind Window Resize
				var supportsOrientationChange = "onorientationchange" in window,
					orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
					$(window).bind(orientationEvent, _.resize);
			},
			
			/**
			 *	Execute Callback Function
			 *	@return Function
			 */
			callback: function(fnName){
				if(typeof fnName === 'function'){
					return fnName.apply(that, Array.prototype.slice.call(arguments, 1));
				} else {
					fn = window[fnName];
					if(typeof fn === 'function'){
						 return window[fnName].apply(that, Array.prototype.slice.call(arguments, 1));
					}
				}
				return false;
			},
			
			/**
			 *	Filter is very unsupported at the moment, This will try prefixes aswell.
			 *	@TODO: Check implementation on IE
			 */
			makeCssHook: function(){
				//Get Filter Prefix
				var filterCss = hasFilter();
				if(filterCss){					
					if(!$.cssHooks){
						throw new Error("CSS Hooks require jQuery 1.4.3 or higher");
					}
					
					filterCss = $.camelCase(filterCss);
					if(filterCss !== "filter"){
						//Filter Support
						$.support.filter = filterCss;

						//Add Filter Hook
						$.cssHooks.filter = {
							get: function( elem, computed, extra ) {
								return $.css( elem, filterCss );
							},
							set: function( elem, value) {
								elem.style[ filterCss ] = value;
							}
						};
					}
				}
			},
			
			/**
			 *	Make Overlay 
			 */
			makeOverlay: function(){
				//Holder Container, this will contain any text / images
				$OverlayContainer = $("<div/>").css($.extend({}, ($matchedObject.is("body")?{
					position: "fixed",					
					width: _.windowSize().width,
					height: _.windowSize().height
				}:{
					position: "absolute",
					width: $matchedObject.outerWidth(),
					height: $matchedObject.outerHeight()	
				}), {
					top: $matchedObject.offset().top,
					left: $matchedObject.offset().left,
					textAlign: "center",
					zIndex: 9999999
				})).addClass(options.containerClass);
				
				//Add a user styleable element
				if(!options.overlayEffect || (options.overlayEffect && !hasFilter()) || (options.overlayEffect && !options.overlayCssAsFallback)){
					var overlay = $("<div/>").css($.extend({},{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%"
						}, options.overlayCss)).appendTo($OverlayContainer).addClass(options.overlayClass);
				}
				//Check if we are adding any content
				if(options.overlayText || options.overlayImage){
					var contentStr = "", contentHeight = 0;
					
					//Do we have an image to add?
					if(options.overlayImage){
						var contentImage = $("<img />").css({
							marginRight: "20px",
							verticalAlign: "middle"
						}).attr("src", options.overlayImage);
						
						contentHeight = contentHeight || overlayImageDimensions.height / 2;

						//Append Image
						contentStr += contentImage.outerHTML();
					}
					
					//Do we have text to add?
					if(options.overlayText){
						var backColor = options.overlayCss.backgroundColor || $matchedObject.css("backgroundColor"),
							backColorIsDark = _.isDark(backColor),
							contentText = $("<span/>").css($.extend({}, {
							fontSize: "20px",
							color: (backColorIsDark)?"#fff":"#333",
							textShadow: (!backColorIsDark)?"0px 0px 1px #999":"0px 0px 1px #333"
						}, options.overlayTextCss)).html(options.overlayText);
						
						contentHeight = contentHeight || parseInt(contentText.css("font-size"), 10) / 2;

						//Append Text
						contentStr += contentText.outerHTML();
					}
					
					//Center text/image inside our container
					var overlayContent = $("<div/>").css({
						position: "relative",
						top: ($OverlayContainer.outerHeight() / 2) - contentHeight
					}).html(contentStr).appendTo($OverlayContainer);
				}
				
				//Special Usecase for body
				if($matchedObject.is("body")){
					//Becuase the filter would be applied to body, the message inside the body would also be effected.
					//What we do is wrap the current body in a container div and apply the effect to that instead.

					//We want to wrap the contents of body minus the scripts in a div we can apply effects to.
					var bodyContents = $matchedObject.contents().not($("script")).detach();
					
					//We cannot use wrapInner due to the fact it appends any scripts and runs them again.	
					$matchedObject.prepend($("<div/>", {
						id: "SpecialBodyContainer",
						html: bodyContents
					}));
																
					$matchedObject = $("#SpecialBodyContainer");
				}
				
				//Add our overlay to the body.
				$("body").append($OverlayContainer);
			},
			
			/**
			 *	Add the CSS to make the cool widely unsupported effects
			 *	@return Boolean
			 */
			makeEffect: function(){
				var filterCss = hasFilter();
								
				if(options.overlayEffect && filterCss){
					var filterString = "";
					
					//Multiple Filters or Just the one?
					if($.isArray(options.overlayEffect) && $.isArray(options.overlayEffectValue)){
						for(var i = 0; i < options.overlayEffect.length; i++){
							filterString += options.overlayEffect[i]+'('+options.overlayEffectValue[i]+') ';
						}
					} else {
						filterString = options.overlayEffect+'('+options.overlayEffectValue+')';
					}
					
					//Add Animation Css if needed		
					if(options.animate){
						//As of jQuery 1.8 you can just use "transition" as it will automatically detect the prefix
						$matchedObject.css(vendorPrefix+"transition", filterCss+" "+options.animationTime/1000+"s ease-in-out");
					}
					
					//In a timeout to allow time for the css animation to be applied 
					setTimeout(function(){
						//Assign Filters.
						$matchedObject.css({
							filter: filterString
						});
					}, 0);
					return true;
				}
				return false;
			},
			/**
			 *	Remove the cool CSS
			 *	@return Boolean
			 */
			removeEffect: function(){
				if(options.overlayEffect && hasFilter()){
					$matchedObject.css("filter", "");
					return true;
				}
				return false;
			},
			/**
			 *	Are we applying text onto a dark background?
			 *	@return Boolean
			 */
			isDark: function( color ) {
				if(!color || color.length < 1) return;
				
				if(color.indexOf("#") != -1){
					color = "rgb("+hex2rgb(color)+")";
				}
						
				var match = /rgba?\((\d+).*?(\d+).*?(\d+)\)/.exec(color);
				return parseFloat(match[1])
					+ parseFloat(match[2])
					+ parseFloat(match[3])
					< 3 * 256 / 2; // r+g+b should be less than half of max (3 * 256)
			
				function hex2rgb(hexStr){
					//Remove Hash if there.
					if(hexStr[0] == "#"){
						hexStr = hexStr.substring(1);
					}
					
					// support for #rgb
					if(hexStr.length == 3){
						hexStr = hexStr[0]+hexStr[0]+hexStr[1]+hexStr[1]+hexStr[2]+hexStr[2];
					} 
					
					var hex = parseInt(hexStr, 16);
					var r = (hex & 0xff0000) >> 16;
					var g = (hex & 0x00ff00) >> 8;
					var b = hex & 0x0000ff;
					return [r, g, b];
				}
			}
			
		};

		this.init();
		return this;
	};
	
	//In here we can assign site defaults
	$.ObjectOverlay = {};
	
	//Assign To Fn
	$.fn.ObjectOverlay = function(options){
		if(options === undefined || typeof options === 'object'){
			return this.each(function(){
				if(!$.data(this, 'plugin_ObjectOverlay')){
					$.data(this, 'plugin_ObjectOverlay', new ObjectOverlay(this, options));
				}	
			});
		} else if(typeof options === 'string' && options[0] !== '_' && options !== 'init'){
			var args = Array.prototype.slice.call(arguments, 1);

			return this.each(function(){
				var instance = $.data(this, 'plugin_ObjectOverlay');
				if(instance instanceof ObjectOverlay && typeof instance[options] === 'function'){
					instance[options].apply(instance, args);
				}
			});
		}
	};

})(jQuery, this, document);