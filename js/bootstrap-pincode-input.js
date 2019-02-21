/* =========================================================
 * bootstrap-pincode-input.js
 *
 * =========================================================
 * Created by Ferry Kranenburg
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

;(function ($, window, document, undefined) {

	"use strict";


	// Create the defaults once
	var pluginName = "pincodeInput";
	var defaults = {
		placeholders: undefined,					    // seperate with a " "(space) to set an placeholder for each input box
		inputs: 4,									    // 4 input boxes = code of 4 digits long
		hidedigits: true,								// hide digits
		pattern: '[0-9]*',
		inputtype: 'number',
		inputmode: 'numeric',
		keydown: function (e) {
		},
		change: function (input, value, inputnumber) {		// callback on every input on change (keyup event)
			//input = the input textbox DOM element
			//value = the value entered by user (or removed)
			//inputnumber = the position of the input box (in touch mode we only have 1 big input box, so always 1 is returned here)
		},
		complete: function (value, e, errorElement) {	// callback when all inputs are filled in (keyup event)
			//value = the entered code
			//e = last keyup event
			//errorElement = error span next to to this, fill with html e.g. : $(errorElement).html("Code not correct");
		}

	};

	// The actual plugin constructor
	function Plugin(element, options) {
		this.element = element;
		this.settings = $.extend({}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	}

	// Avoid Plugin.prototype conflicts
	$.extend(Plugin.prototype, {
		init: function () {
			this.buildInputBoxes();

		},
		updateOriginalInput: function () {
			var newValue = "";
			$('.pincode-input-text', this._container).each(function (index, value) {
				newValue += $(value).val().toString();
			});
			$(this.element).val(newValue);
		},
		check: function () {
			var isComplete = true;
			var code = "";
			$('.pincode-input-text', this._container).each(function (index, value) {
				code += $(value).val().toString();
				if (!$(value).val()) {
					isComplete = false;
				}
			});

			if (this._isTouchDevice()) {
				// check if single input has it all
				if (code.length === this.settings.inputs) {
					return true;
				}
			} else {
				return isComplete;
			}
		},
		buildInputBoxes: function () {
			this._container = $('<div />').addClass('pincode-input-container');

			var currentValue = [];
			var placeholders = [];
			var touchplaceholders = "";  //in touch mode we have just 1 big input box, and there is only 1 placeholder in this case

			if (this.settings.placeholders) {
				placeholders = this.settings.placeholders.split(" ");
				touchplaceholders = this.settings.placeholders.replace(/ /g, "");
			}

			// If we do not hide digits, we need to include the current value of the input box
			// This will only work if the current value is not longer than the number of input boxes.
			if (this.settings.hidedigits === false && $(this.element).val() != "") {
				currentValue = $(this.element).val().split("");
			}

			// make sure this is the first password field here
			if (this.settings.hidedigits) {
				this._pwcontainer = $('<div />').css("display", "none").appendTo(this._container);
				this._pwfield = $('<input>').attr({
					'type': 'number',
					'pattern': this.settings.pattern,
					'inputmode': this.settings.inputmode,
					'id': 'preventautofill',
					'autocomplete': 'off'
				}).appendTo(this._pwcontainer);
			}

            for (var i = 0; i < this.settings.inputs; i++) {

                var input = $('<input>').attr({
                    'type': this._isTouchDevice() ? 'number' : 'text',
                    'maxlength': "1",
                    'autocomplete': 'off',
                    'placeholder': (placeholders[i] ? placeholders[i] : undefined)
                }).addClass('form-control pincode-input-text').appendTo(this._container);
                if (this.settings.hidedigits) {
                    // hide digits
                    input.attr('type', 'text');
                } else {
                    // show digits, also include default value
                    input.val(currentValue[i]);
                }

                if (i === 0) {
                    input.addClass('first');
                } else if (i === (this.settings.inputs - 1)) {
                    input.addClass('last');
                } else {
                    input.addClass('mid');
                }

                // add events
                this._addEventsToInput(input, (i + 1));
            }

			// error box
			this._error = $('<div />').addClass('text-danger pincode-input-error').appendTo(this._container);

			//hide original element and place this before it
			$(this.element).css("display", "none");
			this._container.insertBefore(this.element);
		},
		enable: function () {
			$('.pincode-input-text', this._container).each(function (index, value) {
				$(value).prop('disabled', false);
			});
		},
		disable: function () {
			$('.pincode-input-text', this._container).each(function (index, value) {
				$(value).prop('disabled', true);
			});
		},
		focus: function () {
			$('.pincode-input-text', this._container).first().select().focus();
		},
		clear: function () {
			$('.pincode-input-text', this._container).each(function (index, value) {
				$(value).val("");
			});
			this.updateOriginalInput();
		},
		_isTouchDevice: function () {
			// I know, sniffing is a really bad idea, but it works 99% of the times
			if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				return true;
			}
		},
		_addEventsToInput: function (input, inputnumber) {

			input.on('focus', function (e) {
				this.select();  //automatically select current value
			});

			input.on('keydown', $.proxy(function (e) {
				if (this._pwfield) {
					// Because we need to prevent password saving by browser
					// remove the value here and change the type!
					// we do this every time the user types
					$(this._pwfield).attr({'type': 'text'});
					$(this._pwfield).val("");
				}

				// prevent more input for touch device (we can't limit it)
				if (this._isTouchDevice()) {
					if (e.key === 'Backspace' || e.key === 'Delete') {
						// do nothing on backspace and delete

					} else {
						if ($(this.element).val().length === this.settings.inputs) {
							e.preventDefault();
							e.stopPropagation();
						}
					}

				} else {
					// in desktop mode, check if an number was entered
					if (isNaN(e.key)) {
						e.preventDefault();     // Prevent character input
						e.stopPropagation();

					}

				}

				this.settings.keydown(e);
			}, this));

			input.on('keyup', $.proxy(function (e) {
			    var $current = $(e.currentTarget);
			    var changed = $current.get(0);
				// after every keystroke we check if all inputs have a value, if yes we call complete callback
				// on backspace or delete go to previous input box
				if (e.key === 'Backspace' || e.key === 'Delete') {
                    if ($current.val() != "") {
                        $current.val('');
                    } else {
                        // goto previous
                        $current.prev().select();
                        $current.prev().focus();
                        $current.prev().val('');
                        changed = $current.prev().get(0);
                    }
				} else {
					if ($current.val() != "") {
						$current.next().select();
						$current.next().focus();
					}
				}

				// update original input box
				this.updateOriginalInput();

				// oncomplete check
				if (this.check()) {
					this.settings.complete($(this.element).val(), e, this._error);
				}

				//onchange event for each input
				if (this.settings.change) {
					this.settings.change(changed, $current.val(), inputnumber);
				}


				// prevent more input for touch device (we can't limit it)
				if (this._isTouchDevice()) {
					if (e.key === 'Delete' || e.key === 'Backspace') {
						// do nothing on backspace and delete
					} else {
						if ($(this.element).val().length === this.settings.inputs) {
							$current.blur();
						}
					}

				}

			}, this));
		}


	});

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[pluginName] = function (options) {
		return this.each(function () {
			if (!$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName, new Plugin(this, options));
			}
		});
	};

})(jQuery, window, document);
