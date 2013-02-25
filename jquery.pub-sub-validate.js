//
//
//    jQuery.pub-sub-validate 0.0.1
//    Validate your forms in a pub sub way!
//    assuming jQuery and TwBootstrap, libraries free version sometime around 2016
//
//

//  lots of constraints: i.e. validation rules live in the markup as a data tag. be careful.

//  TODO: Find a really cool name.
//  TODO: Define dependencies instead of polyfills
//  TODO: Add multiple checkboxes, radio buttons and multiple radio buttons validations

/*jshint laxcomma:true, smarttabs:true, forin:true, noarg:true, noempty:true, eqeqeq:true, laxbreak:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, browser:true, indent:4, maxerr:50 */

//Polyfills
(function () {
	"use strict";
	// Object Create Polyfill
	if ( typeof Object.create !== 'function' ) {
		Object.create = function( obj ) {
			function F() {}
			F.prototype = obj;
			return new F();
		};
	}

	// Array.every Polyfill
	if (!Array.prototype.every) {
		Array.prototype.every = function(fun /*, thisp */) {
			
			if (this === null) {
				throw new TypeError();
			}
			
			var t = Object(this);
			var len = t.length >>> 0;

			if (typeof fun !== "function") {
				throw new TypeError();
			}
			
			var thisp = arguments[1];
			for (var i = 0; i < len; i++) {
				if (i in t && !fun.call(thisp, t[i], i, t)) {
					return false;
				}
			}
			
			return true;
		};
	}

} )();


/* jQuery Tiny Pub/Sub - v0.7 - 10/27/2011
 * http://benalman.com/
 * Copyright (c) 2011 "Cowboy" Ben Alman; Licensed MIT, GPL */

(function ($) {
	"use strict";

	var o = $({});

	$.subscribe = function() {
		o.on.apply(o, arguments);
	};

	$.unsubscribe = function() {
		o.off.apply(o, arguments);
	};

	$.publish = function() {
		o.trigger.apply(o, arguments);
	};

}( window.jQuery ));

//Validate

(function ($, window, document, undefined) {
	"use strict";

	var FV = (function() {

		var controlsStatuses = []
		  , isValid          = false
		  , init
		  , updateFormStatus
		  , updateControlStatuses
		  , updateControlClass
		  , updateControlMessage
		  , validateControl
		  , validateFilter
		  , validateSelect
		  , validateCheckbox
		  ;

		init = function ( options ) {
			var self   = this;

			this.$form = $(options.form);
			
			//TODO: implement no mark up based version
			this.controls = this.$form.find('[data-validate]');
			this.config   = options.config;
			
			$.subscribe( 'valid-form', updateFormStatus );

			$.each( self.controls, function ( index, control ) {
				var rule
				  , validation
				  , publishOptions
				  ;

				control        = $(control);
				rule           = control.data('validate');
				validation     = self.config.rules[rule];
				publishOptions = {
					status  : validateControl.apply( control, [{rule: rule, config: self.config}] )
				  , index   : index
				  , control : control
				  , config  : self.config
				};

				$.subscribe( 'control-' + index, updateControlStatuses );
				$.publish( 'control-' + index, publishOptions );

				if ( validation === 'filter' ) {

					control.on('keyup paste blur', function () {

						$.publish( 'control-' + index, {
							status  : validateControl.apply( control, [{rule: rule, config: self.config}] )
						  , index   : index
						  , control : control
						  , config  : self.config
						} );
					} );

				} else if ( validation === 'select' || validation === 'checkbox' ) {

					control.on('change', function () {
						$.publish( 'control-' + index, {
							status  : validateControl.apply( control, [{rule: rule, config: self.config}] )
						  , index   : index
						  , control : control
						  , config  : self.config
						} );
					} );

				} else {

					throw new Error('PubSubValidate: There is no validation for ' + rule + ', please review your data-validate rules');

				}

			} );

			return isValid;
		};

		updateFormStatus = function (e, options) {
			isValid = options.isValid;
		};

		updateControlStatuses = function (e, options) {
			var control  = options.control
			  , message  = ( options.status !== true ) && options.config.messages[options.status]
			  , messageContainer = control.parent().find('p.help-inline')
			  , isValid;

			controlsStatuses[options.index] = options.status;

			updateControlMessage( { 
				messageContainer: messageContainer
			  , text : message || ''
			} );

			updateControlClass( {
				control: control
			  , type   : message && 'error'
			  , config : options.config
			} );

			isValid = controlsStatuses.every( function( element ) {
				return element === true;
			} );

			$.publish('valid-form', { isValid: isValid });

		};

		updateControlClass = function ( options ) {
			var $controlHolder = options.control.parent().parent()
			  , errorClass     = options.config.errorClass;

			if ( options.type === 'error' ) {
				$controlHolder.addClass( errorClass );
			} else {
				$controlHolder.removeClass( errorClass );
			}

		};

		updateControlMessage = function ( options ) {
			options.messageContainer.text( options.text );
		};

		validateControl = function ( options ) {
			var $this             = $(this)
			  , rule              = options.rule
			  , validation        = options.config.rules[rule]
			  , validationOptions = {
			    control : $this
			  , config  : options.config
			  , filter  : options.config.filters[rule]
			  , rule    : rule
			}
			  ;

			if ( validation === 'filter' ) {

				return validateFilter( validationOptions );

			} else if ( validation === 'select' ) {

				return validateSelect( validationOptions );

			} else if ( validation === 'checkbox' ) {

				return validateCheckbox( validationOptions );

			}

		};

		validateFilter = function ( options ) {
			var $val   = options.control.val()
			  , filter = options.filter || /[]/;

			return filter.test( $val ) || options.rule;
		};

		validateSelect = function ( options ) {
			var $val = options.control.val();

			return $val !== '' || options.rule;
		};

		validateCheckbox = function ( options ) {
			var $val = options.control.prop('checked');

			return $val || options.rule;
		};

		return {
			init : init
		};

	} )();

	$.fn.validate = function () {
		var fv = Object.create( FV );
		// debug( $.fn.validate.config );
		return fv.init( {form: this, config: $.fn.validate.config} );
	};

	$.fn.validate.config = {
		filters : {
			text      : /^([a-záéíóúÁÉÍÓÚA-Z \-])+$/
		  , number    : /^([0-9\-])+$/
		  , email     : /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
		  , notEmpty  : /^\s*\S.*$/
		}
	  , messages : {
				text      : "Escriba un texto válido."
			  , number    : "Escriba un número válido."
			  , email     : "Escriba un email válido."
			  , notEmpty  : "No se puede dejar en blanco."
			  , select    : "Elija una opción."
			  , checkbox  : "Elija una opción"
			}
		  , rules  : {
				text      : "filter"
			  , number    : "filter"
			  , email     : "filter"
			  , notEmpty  : "filter"
			  , select    : "select"
			  , checkbox  : "checkbox"
			}
		  , errorClass : 'error'
		};

} )( window.jQuery, window, document );