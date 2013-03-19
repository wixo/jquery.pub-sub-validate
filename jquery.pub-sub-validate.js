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

		// Statuses in an Arra
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
		  , validateMultipleSelects
		  , formatMessage
		  ;

		init = function ( options ) {
			// This is the form, so is self
			var self   = this;

			this.$form = $(options.form);

			//TODO: implement no mark up based version
			this.controls = this.$form.find('[data-pslidate]');
			this.config   = options.config;

			$.subscribe( 'valid-form', updateFormStatus );

			$.each( self.controls, function ( index, control ) {
				var rule
				  , validation
				  , minimun
				  , publishOptions
				  ;

				// Mostly DOM parsing
				control        = $(control);
				rule           = control.data('pslidate');
				validation     = self.config.rules[rule];
				minimun        = control.attr('data-pslCount') || 1;
				publishOptions =
					{ status  : validateControl.apply( control, [{rule: rule, config: self.config, minimun: minimun }] )
					, index   : index
					, control : control
					, config  : self.config
					, minimun : minimun
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

				} else if ( validation === 'multipleCheckbox' || validation === 'multipleRadioButton' || validation === 'multipleSelect' ) {

					control.on( 'change' , function () {

						$.publish( 'control-' + index,
							{ status  : validateControl.apply( control, [{rule: rule, config: self.config, minimun: minimun }] )
							, index   : index
							, control : control
							, config  : self.config
							, minimun : minimun
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
			  , minimun          = options.minimun
			  , message          = ( options.status !== true ) && options.config.messages[options.status]
			  , messageContainer = options.context === 'single' ? control.parents('div.control-group').find('p.help') : control.find('p.help')
			  , isValid
			  ;

			controlsStatuses[options.index] = options.status;

			updateControlMessage(
				{ messageContainer : messageContainer
					// Use control custom error message or control default error message or none
				, text             : message || ''
				, number           : minimun
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
			var $controlHolder = options.context === 'single' ? options.control.parents('div.control-group') : options.control
			  , errorClass     = options.config.errorClass
			  ;

			if ( options.type === 'error' ) {
				$controlHolder.addClass( errorClass );
			} else {
				$controlHolder.removeClass( errorClass );
			}

		};

		updateControlMessage = function ( options ) {
			var text   = options.text !== '' ? options.control.data('pslerror') || options.text : ''
			  , number = options.number
			  , givens = { text: text, number: number }
			  ;

			options.messageContainer.text( formatMessage( givens ) );
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

			} else if ( validation === 'multipleSelect' ) {

				validationOptions.minimun = options.minimun;
				return validateMultipleSelects( validationOptions );

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
			var $val = options.control[0].checked;
			return $val || options.rule;
		};

		validateMultipleRadioButtons = function ( options ) {
			var $val = options.control.find(':checked').length;
			return $val >= options.minimun || options.rule;
		};

		validateMultipleCheckboxes = function ( options ) {
			var $val = options.control.find(':checked').length;
			return $val >= options.minimun || options.rule;
		};

		validateMultipleSelects = function ( options ) {
			var $val = options.control.find('select').filter('[value!=""]').length;
			return $val === parseInt(options.minimun, 10) || options.rule;
		};

		formatMessage = function ( givens ) { // Givens is the object argument
			var text   = givens.text
			  , number = givens.number
			  ;

			return number ? text.replace( /\{n\}/, number ) : text;
		};

		return {
			init : init
		};

	} )();

	$.fn.pslidate = function () {
		var psl = Object.create( PSL );
		return psl.init( {form: this, config: $.fn.pslidate.config} );
	};

	$.fn.pslidate.config =
		{ filters :
			{ text      : /^([a-záéíóúÁÉÍÓÚA-Z \-])+$/
			, number    : /^([0-9 \-\(\)])+$/
			, email     : /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
			, notEmpty  : /^\s*\S.*$/
			}
		, messages :
			{ text                : "Enter a valid text."
			, number              : "Enter a valid number."
			, email               : "Enter a valid email address."
			, notEmpty            : "Can not be left empty."
			, select              : "Please choose an option."
			, checkbox            : "Please choose an option."
			, multipleRadioButton : "Please choose an option."
			, multipleCheckbox    : "Please choose at least {n} options."
			, multipleSelect      : "Please choose at least {n} options."
			}
		, rules  :
			{ text                 : "filter"
			, number               : "filter"
			, email                : "filter"
			, notEmpty             : "filter"
			, select               : "select"
			, checkbox             : "checkbox"
			, multipleRadioButton  : "multipleRadioButton"
			, multipleCheckbox     : "multipleCheckbox"
			, multipleSelect       : "multipleSelect"
			}
		, errorClass : 'error'
		};

} )( window.jQuery, window, window.document );
