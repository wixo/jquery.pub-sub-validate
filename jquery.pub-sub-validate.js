//
//
//    jQuery.psublidate 0.0.1
//    Validate your forms in a pub sub way!
//    assuming jQuery and TwBootstrap, libraries free version sometime around 2016
//
//

//  lots of constraints: i.e. validation rules live in the markup as a data tag. be careful.

//  TODO: Find a really cool name.
//  TODO: Add multiple checkboxes, radio buttons and multiple radio buttons validations

/*jshint laxcomma:true, smarttabs:true, forin:true, noarg:true, noempty:true, eqeqeq:true, laxbreak:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, browser:true, indent:4, maxerr:50 */

// Pubsub Validate

(function ($, window, document, undefined) {
	"use strict";

	var PSL = (function() {

		// Statuses in an Array
		var controlsStatuses       = []
		// Are all validated inputs valid?
		  , isValid                = false
		// Main flow
		  , init
		  , updateFormStatus
		  , updateControlStatuses
		  , updateControlClass
		  , updateControlMessage
		  , validateControl
		  , validateFilter
		  , validateSelect
		  , validateCheckbox
		  , validateMultipleCheckboxes
		  , validateMultipleRadioButtons
		  ;

		init = function ( options ) {
			// This is the form, so is self
			var self   = this;

			this.$form = $(options.form);

			//TODO: implement no mark up based version
			this.controls = this.$form.find('[data-pslidate]');
			this.config   = options.config;

			$.subscribe( 'valid-form' , updateFormStatus );

			$.each( self.controls, function ( index, control ) {
				var rule
				  , validation
				  , publishOptions
				  ;

				control        = $(control);
				rule           = control.data('pslidate');
				validation     = self.config.rules[rule];
				publishOptions =
					{ status  : validateControl.apply( control, [{rule: rule, config: self.config, minimun: control.attr('data-pslCount') || 1 }] )
					, index   : index
					, control : control
					, config  : self.config
					, context : validation.indexOf('multiple') !== -1 ? 'multiple' : 'single'
					};

				$.subscribe( 'control-' + index, updateControlStatuses );

				$.publish( 'control-' + index, publishOptions );

				if ( validation === 'filter' ) {

					control.on( 'keyup paste blur' , function () {

						$.publish( 'control-' + index,
							{ status  : validateControl.apply( control, [{rule: rule, config: self.config}] )
							, index   : index
							, control : control
							, config  : self.config
							, context : 'single'
							}
						);
					} );

				} else if ( validation === 'select' || validation === 'checkbox' ) {

					control.on( 'change' , function () {
						$.publish( 'control-' + index,
							{ status  : validateControl.apply( control, [{rule: rule, config: self.config}] )
							, index   : index
							, control : control
							, config  : self.config
							, context : 'single'
							}
						);
					} );

				} else if ( validation === 'multipleCheckbox' || validation === 'multipleRadioButton' ) {

					control.on( 'change' , function () {
						$.publish( 'control-' + index,
						{ status  : validateControl.apply( control, [{rule: rule, config: self.config, minimun: control.attr('data-pslCount') || 1 }] )
						, index   : index
						, control : control
						, config  : self.config
						, context : 'multiple'
						}
						);
					});

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
			var control          = options.control
			  , message          = ( options.status !== true ) && options.config.messages[options.status]
			  , messageContainer = options.context === 'single' ? control.parent().find('p.help-inline') : control.find('p.help-inline')
			  , isValid
			  ;

			controlsStatuses[options.index] = options.status;

			updateControlMessage(
				{ messageContainer : messageContainer
					// Use control custom error message or control default error message or none
				, text             : message || ''
				, control          : control
				}
			);

			updateControlClass(
			{ control : control
			, type    : message && 'error'
			, config  : options.config
			, context : options.context
			} );

			isValid = controlsStatuses.every( function( element ) {
				return element === true;
			} );

			$.publish('valid-form', { isValid: isValid });

		};

		updateControlClass = function ( options ) {
			var $controlHolder = options.context === 'single' ? options.control.parent().parent() : options.control
			  , errorClass     = options.config.errorClass
			  ;

			if ( options.type === 'error' ) {
				$controlHolder.addClass( errorClass );
			} else {
				$controlHolder.removeClass( errorClass );
			}

		};

		updateControlMessage = function ( options ) {
			var text = options.text !== '' ? options.control.data('pslerror') || options.text : '';
			options.messageContainer.text( text );
		};

		validateControl = function ( options ) {
			var $this             = $(this)
			  , rule              = options.rule
			  , validation        = options.config.rules[rule]
			  , validationOptions =
			    { control : $this
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

			} else if ( validation === 'multipleCheckbox' ) {

				validationOptions.minimun = options.minimun;
				return validateMultipleCheckboxes( validationOptions );

			} else if ( validation === 'multipleRadioButton' ) {

				validationOptions.minimun = 1;
				return validateMultipleRadioButtons( validationOptions );

			}

		};

		validateFilter = function ( options ) {
			var $val   = options.control.val()
			  , filter = options.filter || /.*/
			  ;

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

		validateMultipleCheckboxes = function ( options ) {
			var $val = options.control.find(':checked').length;

			return $val >= options.minimun || options.rule;
		};

		validateMultipleRadioButtons = function ( options ) {
			var $val = options.control.find(':checked').length;

			return $val >= options.minimun || options.rule;
		};

		return {
			init : init
		};

	} )();

	$.fn.pslidate = function () {
		var psl = Object.create( PSL );
		// debug( $.fn.pslidate.config );
		return psl.init( {form: this, config: $.fn.pslidate.config} );
	};

	$.fn.pslidate.config =
		{ filters :
		  { text      : /^([a-záéíóúÁÉÍÓÚA-Z \-])+$/
		  , number    : /^([0-9\-])+$/
		  , email     : /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
		  , notEmpty  : /^\s*\S.*$/
		  }
		, messages :
		  { text                : "Escriba un texto válido."
		  , number              : "Escriba un número válido."
		  , email               : "Escriba un email válido."
		  , notEmpty            : "No se puede dejar en blanco."
		  , select              : "Elija una opción."
		  , checkbox            : "Elija una opción."
		  , multipleCheckbox    : "Elija una opción."
		  , multipleRadioButton : "Elija una opción."
		  }
		, rules  :
		  { text                 : "filter"
		  , number               : "filter"
		  , email                : "filter"
		  , notEmpty             : "filter"
		  , select               : "select"
		  , checkbox             : "checkbox"
		  , multipleCheckbox     : "multipleCheckbox"
		  , multipleRadioButton  : "multipleRadioButton"
		  }
		, errorClass : 'error'
		};

} )( window.jQuery, window, document );
