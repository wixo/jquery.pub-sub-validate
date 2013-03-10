//
//
//    jQuery.psublidate 0.0.1
//    Validate your forms in a pub sub way!
//
//    Dependencies:
//    - E5Shim for oldIE
//    - jQuery
//    - Bootstrap forms markup
//    - jQuery-tiny-pubsub
//
//
//  Lots of constraints: i.e. validation rules live in the markup as a data tag. be careful.
//
//  TODO: Find a really cool name.
//  TODO: Add multiple checkboxes, radio buttons and multiple radio buttons validations
//
//

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
                    { status  : validateControl.apply( control, [{rule: rule, config: self.config}] )
                    , index   : index
                    , control : control
                    , config  : self.config
                    };

                $.subscribe( 'control-' + index, updateControlStatuses );

                $.publish( 'control-' + index, publishOptions );

                if ( validation === 'filter' ) {

                    control.on('keyup paste blur', function () {

                        $.publish( 'control-' + index,
                            { status  : validateControl.apply( control, [{rule: rule, config: self.config}] )
                            , index   : index
                            , control : control
                            , config  : self.config
                            }
                        );
                    } );

                } else if ( validation === 'select' || validation === 'checkbox' ) {

                    control.on('change', function () {
                        $.publish( 'control-' + index,
                            { status  : validateControl.apply( control, [{rule: rule, config: self.config}] )
                            , index   : index
                            , control : control
                            , config  : self.config
                            }
                        );
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
            var control          = options.control
              , message          = ( options.status !== true ) && options.config.messages[options.status]
              , messageContainer = control.parent().find('p.help-inline')
              , isValid
              ;

            controlsStatuses[options.index] = options.status;

            updateControlMessage(
                { messageContainer : messageContainer
                    // Use control custom error message or control default error message or none
                , text             : control.data('pslerror') || message || ''
                }
            );

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
          { text      : "Write a valid text."
          , number    : "Write a valid number."
          , email     : "Write a valid e-mail address."
          , notEmpty  : "Can not be empty."
          , select    : "Choose an option."
          , checkbox  : "Choose an option"
          }
        , rules  :
          { text      : "filter"
          , number    : "filter"
          , email     : "filter"
          , notEmpty  : "filter"
          , select    : "select"
          , checkbox  : "checkbox"
          }
        , errorClass : 'error'
        };

} )( window.jQuery, window, document );
