//jQuery.validate 0.0.1
//Just encapsulate the way I validate forms.
//assuming jQuery and TwBootstrap, libraries free version sometime around 2016

//lots of constraints: i.e. validation rule lives in the markup as a data tag. be careful.

//TODO: Find a cool name.
//TODO: Add More Controls to test()
//TODO: Wax On Wax Off, inhale, exhale.


// Object Create Polyfill
if ( typeof Object.create !== 'function' ) {
	Object.create = function( obj ) {
		function F() {};
		F.prototype = obj;
		return new F();
	};
}

// Array.every Polyfill
if (!Array.prototype.every) {
	Array.prototype.every = function(fun /*, thisp */) {
		"use strict";
		
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

// Pub/Sub Definition for jQuery
(function($) {

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

}(jQuery));

(function($, window, document, undefined) {
	var FV = {
		controlStatus : [],
		isValid : false,
		init : function(options, elem, rules) {
			var self     = this; //alias to work with this inside other scopes

			//elem should be the form we are working with
			self.elem    = elem;
			self.$elem   = $(elem); //jquery cache

			rules && (this.rules = rules); //if there are rules we use them

			//if there are no rules, we expect to find them in the markup
			//we populate the controls to validate as an array
			self.controls = self.$elem.find('[data-validate]');

			(self.controlStatus.length > 0) && (self.controlStatus = []);

			$.subscribe('valid-form', self.updateFormStatus);

			$.each(self.controls, function(index, control) {
				var $control       = $(control),
				    // controlRules = $control.data('validate').split(' '),
				    subscribeIndex = index,
				    rule           = $control.data('validate');

				    $.subscribe('control-'+subscribeIndex, self.updateControlStatus);

				    $.publish('control-'+subscribeIndex, [self.validateControl.apply(control, [rule, subscribeIndex]), rule, index, control, self]);

				    $control.on('keyup paste blur', function() {
				    	$.publish('control-'+subscribeIndex, [self.validateControl.apply(control, [rule, subscribeIndex]), rule, index, control, self]);
				    });

			});

			return self.isValid;
		},
		updateFormStatus : function(e, status, self) {
			self.isValid = status;
		},
		updateControlStatus : function(e, status, rule, index, control, self) {
			var isValid,
					$control          = $(control),
					$messageContainer = $control.parent().find('p.help-inline');
					message           = (status !== true) && $.fn.validate.config.messages[status];
			//self references the one and only self from init
			self.controlStatus[index] = status;

			self.updateControlMessage($messageContainer, (message !== false) ? message : '');
			self.updateControlClass($control, (message !== false) ? 'error' : undefined);

			isValid = self.controlStatus.every(function(element) {return element === true}); //return if every element in controlStatus Array is true

			$.publish('valid-form', [isValid, self]); 
		},
		updateControlClass : function($control, type) {
			//TODO: overwrite from user config.
			var $controlCache   = $control.parent().parent(),
					errorClass      = $.fn.validate.config.errorClass;

			(type === 'error') ? $controlCache.addClass(errorClass) : $controlCache.removeClass(errorClass);

		},
		updateControlMessage : function($messageContainer,text) {
			$messageContainer.text(text);
		},
		validateControl : function(rule, subscribeIndex) {
			// being called with the scope of the control
			var $this  = $(this),
			    filter = $.fn.validate.config.filters[rule] || false;
			return filter && (filter.test($this.val()) || rule);
		}
	}
	
	$.fn.validate = function(options) {
		var fv = Object.create( FV );
		    return fv.init( options, this );
	};

	$.fn.validate.config = {
		filters : {
			text      : /^([a-záéíóúÁÉÍÓÚA-Z \-])+$/,
			number    : /^([0-9\-])+$/,
			email     : /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
			notEmpty  : /^\s*\S.*$/
		},
		messages : {
			text      : "Escriba un Texto Válido.",
			number    : "Escriba un Número Válido.",
			email     : "Escriba un Email Válido.",
			notEmpty  : "No se puede dejar en blanco"
		},
		errorClass : 'error'
	}

})(jQuery, window, document);