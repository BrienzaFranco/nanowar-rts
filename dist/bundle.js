/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/socket.io-parser/node_modules/debug/src/browser.js"
/*!*************************************************************************!*\
  !*** ./node_modules/socket.io-parser/node_modules/debug/src/browser.js ***!
  \*************************************************************************/
(module, exports, __webpack_require__) {

/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	let m;

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	// eslint-disable-next-line no-return-assign
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug') || exports.storage.getItem('DEBUG') ;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = __webpack_require__(/*! ./common */ "./node_modules/socket.io-parser/node_modules/debug/src/common.js")(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};


/***/ },

/***/ "./node_modules/socket.io-parser/node_modules/debug/src/common.js"
/*!************************************************************************!*\
  !*** ./node_modules/socket.io-parser/node_modules/debug/src/common.js ***!
  \************************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = __webpack_require__(/*! ms */ "./node_modules/socket.io-parser/node_modules/ms/index.js");
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;
		let namespacesCache;
		let enabledCache;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => {
				if (enableOverride !== null) {
					return enableOverride;
				}
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}

				return enabledCache;
			},
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);
		createDebug.namespaces = namespaces;

		createDebug.names = [];
		createDebug.skips = [];

		const split = (typeof namespaces === 'string' ? namespaces : '')
			.trim()
			.replace(/\s+/g, ',')
			.split(',')
			.filter(Boolean);

		for (const ns of split) {
			if (ns[0] === '-') {
				createDebug.skips.push(ns.slice(1));
			} else {
				createDebug.names.push(ns);
			}
		}
	}

	/**
	 * Checks if the given string matches a namespace template, honoring
	 * asterisks as wildcards.
	 *
	 * @param {String} search
	 * @param {String} template
	 * @return {Boolean}
	 */
	function matchesTemplate(search, template) {
		let searchIndex = 0;
		let templateIndex = 0;
		let starIndex = -1;
		let matchIndex = 0;

		while (searchIndex < search.length) {
			if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === '*')) {
				// Match character or proceed with wildcard
				if (template[templateIndex] === '*') {
					starIndex = templateIndex;
					matchIndex = searchIndex;
					templateIndex++; // Skip the '*'
				} else {
					searchIndex++;
					templateIndex++;
				}
			} else if (starIndex !== -1) { // eslint-disable-line no-negated-condition
				// Backtrack to the last '*' and try to match more characters
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else {
				return false; // No match
			}
		}

		// Handle trailing '*' in template
		while (templateIndex < template.length && template[templateIndex] === '*') {
			templateIndex++;
		}

		return templateIndex === template.length;
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names,
			...createDebug.skips.map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		for (const skip of createDebug.skips) {
			if (matchesTemplate(name, skip)) {
				return false;
			}
		}

		for (const ns of createDebug.names) {
			if (matchesTemplate(name, ns)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

module.exports = setup;


/***/ },

/***/ "./node_modules/socket.io-parser/node_modules/ms/index.js"
/*!****************************************************************!*\
  !*** ./node_modules/socket.io-parser/node_modules/ms/index.js ***!
  \****************************************************************/
(module) {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}


/***/ },

/***/ "./node_modules/@socket.io/component-emitter/lib/esm/index.js"
/*!********************************************************************!*\
  !*** ./node_modules/@socket.io/component-emitter/lib/esm/index.js ***!
  \********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Emitter: () => (/* binding */ Emitter)
/* harmony export */ });
/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }

  // Remove event specific arrays for event types that no
  // one is subscribed for to avoid memory leak.
  if (callbacks.length === 0) {
    delete this._callbacks['$' + event];
  }

  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};

  var args = new Array(arguments.length - 1)
    , callbacks = this._callbacks['$' + event];

  for (var i = 1; i < arguments.length; i++) {
    args[i - 1] = arguments[i];
  }

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

// alias used for reserved events (protected method)
Emitter.prototype.emitReserved = Emitter.prototype.emit;

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/contrib/has-cors.js"
/*!*********************************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/contrib/has-cors.js ***!
  \*********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   hasCORS: () => (/* binding */ hasCORS)
/* harmony export */ });
// imported from https://github.com/component/has-cors
let value = false;
try {
    value = typeof XMLHttpRequest !== 'undefined' &&
        'withCredentials' in new XMLHttpRequest();
}
catch (err) {
    // if XMLHttp support is disabled in IE then it will throw
    // when trying to create
}
const hasCORS = value;


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/contrib/parseqs.js"
/*!********************************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/contrib/parseqs.js ***!
  \********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   decode: () => (/* binding */ decode),
/* harmony export */   encode: () => (/* binding */ encode)
/* harmony export */ });
// imported from https://github.com/galkn/querystring
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */
function encode(obj) {
    let str = '';
    for (let i in obj) {
        if (obj.hasOwnProperty(i)) {
            if (str.length)
                str += '&';
            str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
        }
    }
    return str;
}
/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */
function decode(qs) {
    let qry = {};
    let pairs = qs.split('&');
    for (let i = 0, l = pairs.length; i < l; i++) {
        let pair = pairs[i].split('=');
        qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
    return qry;
}


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/contrib/parseuri.js"
/*!*********************************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/contrib/parseuri.js ***!
  \*********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   parse: () => (/* binding */ parse)
/* harmony export */ });
// imported from https://github.com/galkn/parseuri
/**
 * Parses a URI
 *
 * Note: we could also have used the built-in URL object, but it isn't supported on all platforms.
 *
 * See:
 * - https://developer.mozilla.org/en-US/docs/Web/API/URL
 * - https://caniuse.com/url
 * - https://www.rfc-editor.org/rfc/rfc3986#appendix-B
 *
 * History of the parse() method:
 * - first commit: https://github.com/socketio/socket.io-client/commit/4ee1d5d94b3906a9c052b459f1a818b15f38f91c
 * - export into its own module: https://github.com/socketio/engine.io-client/commit/de2c561e4564efeb78f1bdb1ba39ef81b2822cb3
 * - reimport: https://github.com/socketio/engine.io-client/commit/df32277c3f6d622eec5ed09f493cae3f3391d242
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */
const re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
const parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];
function parse(str) {
    if (str.length > 8000) {
        throw "URI too long";
    }
    const src = str, b = str.indexOf('['), e = str.indexOf(']');
    if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }
    let m = re.exec(str || ''), uri = {}, i = 14;
    while (i--) {
        uri[parts[i]] = m[i] || '';
    }
    if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
    }
    uri.pathNames = pathNames(uri, uri['path']);
    uri.queryKey = queryKey(uri, uri['query']);
    return uri;
}
function pathNames(obj, path) {
    const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
    if (path.slice(0, 1) == '/' || path.length === 0) {
        names.splice(0, 1);
    }
    if (path.slice(-1) == '/') {
        names.splice(names.length - 1, 1);
    }
    return names;
}
function queryKey(uri, query) {
    const data = {};
    query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
        if ($1) {
            data[$1] = $2;
        }
    });
    return data;
}


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/globals.js"
/*!************************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/globals.js ***!
  \************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createCookieJar: () => (/* binding */ createCookieJar),
/* harmony export */   defaultBinaryType: () => (/* binding */ defaultBinaryType),
/* harmony export */   globalThisShim: () => (/* binding */ globalThisShim),
/* harmony export */   nextTick: () => (/* binding */ nextTick)
/* harmony export */ });
const nextTick = (() => {
    const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
    if (isPromiseAvailable) {
        return (cb) => Promise.resolve().then(cb);
    }
    else {
        return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
    }
})();
const globalThisShim = (() => {
    if (typeof self !== "undefined") {
        return self;
    }
    else if (typeof window !== "undefined") {
        return window;
    }
    else {
        return Function("return this")();
    }
})();
const defaultBinaryType = "arraybuffer";
function createCookieJar() { }


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/index.js"
/*!**********************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/index.js ***!
  \**********************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Fetch: () => (/* reexport safe */ _transports_polling_fetch_js__WEBPACK_IMPORTED_MODULE_6__.Fetch),
/* harmony export */   NodeWebSocket: () => (/* reexport safe */ _transports_websocket_node_js__WEBPACK_IMPORTED_MODULE_8__.WS),
/* harmony export */   NodeXHR: () => (/* reexport safe */ _transports_polling_xhr_node_js__WEBPACK_IMPORTED_MODULE_7__.XHR),
/* harmony export */   Socket: () => (/* reexport safe */ _socket_js__WEBPACK_IMPORTED_MODULE_0__.Socket),
/* harmony export */   SocketWithUpgrade: () => (/* reexport safe */ _socket_js__WEBPACK_IMPORTED_MODULE_0__.SocketWithUpgrade),
/* harmony export */   SocketWithoutUpgrade: () => (/* reexport safe */ _socket_js__WEBPACK_IMPORTED_MODULE_0__.SocketWithoutUpgrade),
/* harmony export */   Transport: () => (/* reexport safe */ _transport_js__WEBPACK_IMPORTED_MODULE_1__.Transport),
/* harmony export */   TransportError: () => (/* reexport safe */ _transport_js__WEBPACK_IMPORTED_MODULE_1__.TransportError),
/* harmony export */   WebSocket: () => (/* reexport safe */ _transports_websocket_node_js__WEBPACK_IMPORTED_MODULE_8__.WS),
/* harmony export */   WebTransport: () => (/* reexport safe */ _transports_webtransport_js__WEBPACK_IMPORTED_MODULE_9__.WT),
/* harmony export */   XHR: () => (/* reexport safe */ _transports_polling_xhr_node_js__WEBPACK_IMPORTED_MODULE_7__.XHR),
/* harmony export */   installTimerFunctions: () => (/* reexport safe */ _util_js__WEBPACK_IMPORTED_MODULE_3__.installTimerFunctions),
/* harmony export */   nextTick: () => (/* reexport safe */ _globals_node_js__WEBPACK_IMPORTED_MODULE_5__.nextTick),
/* harmony export */   parse: () => (/* reexport safe */ _contrib_parseuri_js__WEBPACK_IMPORTED_MODULE_4__.parse),
/* harmony export */   protocol: () => (/* binding */ protocol),
/* harmony export */   transports: () => (/* reexport safe */ _transports_index_js__WEBPACK_IMPORTED_MODULE_2__.transports)
/* harmony export */ });
/* harmony import */ var _socket_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./socket.js */ "./node_modules/engine.io-client/build/esm/socket.js");
/* harmony import */ var _transport_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./transport.js */ "./node_modules/engine.io-client/build/esm/transport.js");
/* harmony import */ var _transports_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./transports/index.js */ "./node_modules/engine.io-client/build/esm/transports/index.js");
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./util.js */ "./node_modules/engine.io-client/build/esm/util.js");
/* harmony import */ var _contrib_parseuri_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./contrib/parseuri.js */ "./node_modules/engine.io-client/build/esm/contrib/parseuri.js");
/* harmony import */ var _globals_node_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./globals.node.js */ "./node_modules/engine.io-client/build/esm/globals.js");
/* harmony import */ var _transports_polling_fetch_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./transports/polling-fetch.js */ "./node_modules/engine.io-client/build/esm/transports/polling-fetch.js");
/* harmony import */ var _transports_polling_xhr_node_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./transports/polling-xhr.js */ "./node_modules/engine.io-client/build/esm/transports/polling-xhr.js");
/* harmony import */ var _transports_websocket_node_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./transports/websocket.js */ "./node_modules/engine.io-client/build/esm/transports/websocket.js");
/* harmony import */ var _transports_webtransport_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./transports/webtransport.js */ "./node_modules/engine.io-client/build/esm/transports/webtransport.js");



const protocol = _socket_js__WEBPACK_IMPORTED_MODULE_0__.Socket.protocol;













/***/ },

/***/ "./node_modules/engine.io-client/build/esm/socket.js"
/*!***********************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/socket.js ***!
  \***********************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Socket: () => (/* binding */ Socket),
/* harmony export */   SocketWithUpgrade: () => (/* binding */ SocketWithUpgrade),
/* harmony export */   SocketWithoutUpgrade: () => (/* binding */ SocketWithoutUpgrade)
/* harmony export */ });
/* harmony import */ var _transports_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./transports/index.js */ "./node_modules/engine.io-client/build/esm/transports/index.js");
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./util.js */ "./node_modules/engine.io-client/build/esm/util.js");
/* harmony import */ var _contrib_parseqs_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./contrib/parseqs.js */ "./node_modules/engine.io-client/build/esm/contrib/parseqs.js");
/* harmony import */ var _contrib_parseuri_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./contrib/parseuri.js */ "./node_modules/engine.io-client/build/esm/contrib/parseuri.js");
/* harmony import */ var _socket_io_component_emitter__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @socket.io/component-emitter */ "./node_modules/@socket.io/component-emitter/lib/esm/index.js");
/* harmony import */ var engine_io_parser__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/build/esm/index.js");
/* harmony import */ var _globals_node_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./globals.node.js */ "./node_modules/engine.io-client/build/esm/globals.js");







const withEventListeners = typeof addEventListener === "function" &&
    typeof removeEventListener === "function";
const OFFLINE_EVENT_LISTENERS = [];
if (withEventListeners) {
    // within a ServiceWorker, any event handler for the 'offline' event must be added on the initial evaluation of the
    // script, so we create one single event listener here which will forward the event to the socket instances
    addEventListener("offline", () => {
        OFFLINE_EVENT_LISTENERS.forEach((listener) => listener());
    }, false);
}
/**
 * This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
 * with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
 *
 * This class comes without upgrade mechanism, which means that it will keep the first low-level transport that
 * successfully establishes the connection.
 *
 * In order to allow tree-shaking, there are no transports included, that's why the `transports` option is mandatory.
 *
 * @example
 * import { SocketWithoutUpgrade, WebSocket } from "engine.io-client";
 *
 * const socket = new SocketWithoutUpgrade({
 *   transports: [WebSocket]
 * });
 *
 * socket.on("open", () => {
 *   socket.send("hello");
 * });
 *
 * @see SocketWithUpgrade
 * @see Socket
 */
class SocketWithoutUpgrade extends _socket_io_component_emitter__WEBPACK_IMPORTED_MODULE_4__.Emitter {
    /**
     * Socket constructor.
     *
     * @param {String|Object} uri - uri or options
     * @param {Object} opts - options
     */
    constructor(uri, opts) {
        super();
        this.binaryType = _globals_node_js__WEBPACK_IMPORTED_MODULE_6__.defaultBinaryType;
        this.writeBuffer = [];
        this._prevBufferLen = 0;
        this._pingInterval = -1;
        this._pingTimeout = -1;
        this._maxPayload = -1;
        /**
         * The expiration timestamp of the {@link _pingTimeoutTimer} object is tracked, in case the timer is throttled and the
         * callback is not fired on time. This can happen for example when a laptop is suspended or when a phone is locked.
         */
        this._pingTimeoutTime = Infinity;
        if (uri && "object" === typeof uri) {
            opts = uri;
            uri = null;
        }
        if (uri) {
            const parsedUri = (0,_contrib_parseuri_js__WEBPACK_IMPORTED_MODULE_3__.parse)(uri);
            opts.hostname = parsedUri.host;
            opts.secure =
                parsedUri.protocol === "https" || parsedUri.protocol === "wss";
            opts.port = parsedUri.port;
            if (parsedUri.query)
                opts.query = parsedUri.query;
        }
        else if (opts.host) {
            opts.hostname = (0,_contrib_parseuri_js__WEBPACK_IMPORTED_MODULE_3__.parse)(opts.host).host;
        }
        (0,_util_js__WEBPACK_IMPORTED_MODULE_1__.installTimerFunctions)(this, opts);
        this.secure =
            null != opts.secure
                ? opts.secure
                : typeof location !== "undefined" && "https:" === location.protocol;
        if (opts.hostname && !opts.port) {
            // if no port is specified manually, use the protocol default
            opts.port = this.secure ? "443" : "80";
        }
        this.hostname =
            opts.hostname ||
                (typeof location !== "undefined" ? location.hostname : "localhost");
        this.port =
            opts.port ||
                (typeof location !== "undefined" && location.port
                    ? location.port
                    : this.secure
                        ? "443"
                        : "80");
        this.transports = [];
        this._transportsByName = {};
        opts.transports.forEach((t) => {
            const transportName = t.prototype.name;
            this.transports.push(transportName);
            this._transportsByName[transportName] = t;
        });
        this.opts = Object.assign({
            path: "/engine.io",
            agent: false,
            withCredentials: false,
            upgrade: true,
            timestampParam: "t",
            rememberUpgrade: false,
            addTrailingSlash: true,
            rejectUnauthorized: true,
            perMessageDeflate: {
                threshold: 1024,
            },
            transportOptions: {},
            closeOnBeforeunload: false,
        }, opts);
        this.opts.path =
            this.opts.path.replace(/\/$/, "") +
                (this.opts.addTrailingSlash ? "/" : "");
        if (typeof this.opts.query === "string") {
            this.opts.query = (0,_contrib_parseqs_js__WEBPACK_IMPORTED_MODULE_2__.decode)(this.opts.query);
        }
        if (withEventListeners) {
            if (this.opts.closeOnBeforeunload) {
                // Firefox closes the connection when the "beforeunload" event is emitted but not Chrome. This event listener
                // ensures every browser behaves the same (no "disconnect" event at the Socket.IO level when the page is
                // closed/reloaded)
                this._beforeunloadEventListener = () => {
                    if (this.transport) {
                        // silently close the transport
                        this.transport.removeAllListeners();
                        this.transport.close();
                    }
                };
                addEventListener("beforeunload", this._beforeunloadEventListener, false);
            }
            if (this.hostname !== "localhost") {
                this._offlineEventListener = () => {
                    this._onClose("transport close", {
                        description: "network connection lost",
                    });
                };
                OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
            }
        }
        if (this.opts.withCredentials) {
            this._cookieJar = (0,_globals_node_js__WEBPACK_IMPORTED_MODULE_6__.createCookieJar)();
        }
        this._open();
    }
    /**
     * Creates transport of the given type.
     *
     * @param {String} name - transport name
     * @return {Transport}
     * @private
     */
    createTransport(name) {
        const query = Object.assign({}, this.opts.query);
        // append engine.io protocol identifier
        query.EIO = engine_io_parser__WEBPACK_IMPORTED_MODULE_5__.protocol;
        // transport name
        query.transport = name;
        // session id if we already have one
        if (this.id)
            query.sid = this.id;
        const opts = Object.assign({}, this.opts, {
            query,
            socket: this,
            hostname: this.hostname,
            secure: this.secure,
            port: this.port,
        }, this.opts.transportOptions[name]);
        return new this._transportsByName[name](opts);
    }
    /**
     * Initializes transport to use and starts probe.
     *
     * @private
     */
    _open() {
        if (this.transports.length === 0) {
            // Emit error on next tick so it can be listened to
            this.setTimeoutFn(() => {
                this.emitReserved("error", "No transports available");
            }, 0);
            return;
        }
        const transportName = this.opts.rememberUpgrade &&
            SocketWithoutUpgrade.priorWebsocketSuccess &&
            this.transports.indexOf("websocket") !== -1
            ? "websocket"
            : this.transports[0];
        this.readyState = "opening";
        const transport = this.createTransport(transportName);
        transport.open();
        this.setTransport(transport);
    }
    /**
     * Sets the current transport. Disables the existing one (if any).
     *
     * @private
     */
    setTransport(transport) {
        if (this.transport) {
            this.transport.removeAllListeners();
        }
        // set up transport
        this.transport = transport;
        // set up transport listeners
        transport
            .on("drain", this._onDrain.bind(this))
            .on("packet", this._onPacket.bind(this))
            .on("error", this._onError.bind(this))
            .on("close", (reason) => this._onClose("transport close", reason));
    }
    /**
     * Called when connection is deemed open.
     *
     * @private
     */
    onOpen() {
        this.readyState = "open";
        SocketWithoutUpgrade.priorWebsocketSuccess =
            "websocket" === this.transport.name;
        this.emitReserved("open");
        this.flush();
    }
    /**
     * Handles a packet.
     *
     * @private
     */
    _onPacket(packet) {
        if ("opening" === this.readyState ||
            "open" === this.readyState ||
            "closing" === this.readyState) {
            this.emitReserved("packet", packet);
            // Socket is live - any packet counts
            this.emitReserved("heartbeat");
            switch (packet.type) {
                case "open":
                    this.onHandshake(JSON.parse(packet.data));
                    break;
                case "ping":
                    this._sendPacket("pong");
                    this.emitReserved("ping");
                    this.emitReserved("pong");
                    this._resetPingTimeout();
                    break;
                case "error":
                    const err = new Error("server error");
                    // @ts-ignore
                    err.code = packet.data;
                    this._onError(err);
                    break;
                case "message":
                    this.emitReserved("data", packet.data);
                    this.emitReserved("message", packet.data);
                    break;
            }
        }
        else {
        }
    }
    /**
     * Called upon handshake completion.
     *
     * @param {Object} data - handshake obj
     * @private
     */
    onHandshake(data) {
        this.emitReserved("handshake", data);
        this.id = data.sid;
        this.transport.query.sid = data.sid;
        this._pingInterval = data.pingInterval;
        this._pingTimeout = data.pingTimeout;
        this._maxPayload = data.maxPayload;
        this.onOpen();
        // In case open handler closes socket
        if ("closed" === this.readyState)
            return;
        this._resetPingTimeout();
    }
    /**
     * Sets and resets ping timeout timer based on server pings.
     *
     * @private
     */
    _resetPingTimeout() {
        this.clearTimeoutFn(this._pingTimeoutTimer);
        const delay = this._pingInterval + this._pingTimeout;
        this._pingTimeoutTime = Date.now() + delay;
        this._pingTimeoutTimer = this.setTimeoutFn(() => {
            this._onClose("ping timeout");
        }, delay);
        if (this.opts.autoUnref) {
            this._pingTimeoutTimer.unref();
        }
    }
    /**
     * Called on `drain` event
     *
     * @private
     */
    _onDrain() {
        this.writeBuffer.splice(0, this._prevBufferLen);
        // setting prevBufferLen = 0 is very important
        // for example, when upgrading, upgrade packet is sent over,
        // and a nonzero prevBufferLen could cause problems on `drain`
        this._prevBufferLen = 0;
        if (0 === this.writeBuffer.length) {
            this.emitReserved("drain");
        }
        else {
            this.flush();
        }
    }
    /**
     * Flush write buffers.
     *
     * @private
     */
    flush() {
        if ("closed" !== this.readyState &&
            this.transport.writable &&
            !this.upgrading &&
            this.writeBuffer.length) {
            const packets = this._getWritablePackets();
            this.transport.send(packets);
            // keep track of current length of writeBuffer
            // splice writeBuffer and callbackBuffer on `drain`
            this._prevBufferLen = packets.length;
            this.emitReserved("flush");
        }
    }
    /**
     * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
     * long-polling)
     *
     * @private
     */
    _getWritablePackets() {
        const shouldCheckPayloadSize = this._maxPayload &&
            this.transport.name === "polling" &&
            this.writeBuffer.length > 1;
        if (!shouldCheckPayloadSize) {
            return this.writeBuffer;
        }
        let payloadSize = 1; // first packet type
        for (let i = 0; i < this.writeBuffer.length; i++) {
            const data = this.writeBuffer[i].data;
            if (data) {
                payloadSize += (0,_util_js__WEBPACK_IMPORTED_MODULE_1__.byteLength)(data);
            }
            if (i > 0 && payloadSize > this._maxPayload) {
                return this.writeBuffer.slice(0, i);
            }
            payloadSize += 2; // separator + packet type
        }
        return this.writeBuffer;
    }
    /**
     * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
     *
     * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
     * `write()` method then the message would not be buffered by the Socket.IO client.
     *
     * @return {boolean}
     * @private
     */
    /* private */ _hasPingExpired() {
        if (!this._pingTimeoutTime)
            return true;
        const hasExpired = Date.now() > this._pingTimeoutTime;
        if (hasExpired) {
            this._pingTimeoutTime = 0;
            (0,_globals_node_js__WEBPACK_IMPORTED_MODULE_6__.nextTick)(() => {
                this._onClose("ping timeout");
            }, this.setTimeoutFn);
        }
        return hasExpired;
    }
    /**
     * Sends a message.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @return {Socket} for chaining.
     */
    write(msg, options, fn) {
        this._sendPacket("message", msg, options, fn);
        return this;
    }
    /**
     * Sends a message. Alias of {@link Socket#write}.
     *
     * @param {String} msg - message.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @return {Socket} for chaining.
     */
    send(msg, options, fn) {
        this._sendPacket("message", msg, options, fn);
        return this;
    }
    /**
     * Sends a packet.
     *
     * @param {String} type: packet type.
     * @param {String} data.
     * @param {Object} options.
     * @param {Function} fn - callback function.
     * @private
     */
    _sendPacket(type, data, options, fn) {
        if ("function" === typeof data) {
            fn = data;
            data = undefined;
        }
        if ("function" === typeof options) {
            fn = options;
            options = null;
        }
        if ("closing" === this.readyState || "closed" === this.readyState) {
            return;
        }
        options = options || {};
        options.compress = false !== options.compress;
        const packet = {
            type: type,
            data: data,
            options: options,
        };
        this.emitReserved("packetCreate", packet);
        this.writeBuffer.push(packet);
        if (fn)
            this.once("flush", fn);
        this.flush();
    }
    /**
     * Closes the connection.
     */
    close() {
        const close = () => {
            this._onClose("forced close");
            this.transport.close();
        };
        const cleanupAndClose = () => {
            this.off("upgrade", cleanupAndClose);
            this.off("upgradeError", cleanupAndClose);
            close();
        };
        const waitForUpgrade = () => {
            // wait for upgrade to finish since we can't send packets while pausing a transport
            this.once("upgrade", cleanupAndClose);
            this.once("upgradeError", cleanupAndClose);
        };
        if ("opening" === this.readyState || "open" === this.readyState) {
            this.readyState = "closing";
            if (this.writeBuffer.length) {
                this.once("drain", () => {
                    if (this.upgrading) {
                        waitForUpgrade();
                    }
                    else {
                        close();
                    }
                });
            }
            else if (this.upgrading) {
                waitForUpgrade();
            }
            else {
                close();
            }
        }
        return this;
    }
    /**
     * Called upon transport error
     *
     * @private
     */
    _onError(err) {
        SocketWithoutUpgrade.priorWebsocketSuccess = false;
        if (this.opts.tryAllTransports &&
            this.transports.length > 1 &&
            this.readyState === "opening") {
            this.transports.shift();
            return this._open();
        }
        this.emitReserved("error", err);
        this._onClose("transport error", err);
    }
    /**
     * Called upon transport close.
     *
     * @private
     */
    _onClose(reason, description) {
        if ("opening" === this.readyState ||
            "open" === this.readyState ||
            "closing" === this.readyState) {
            // clear timers
            this.clearTimeoutFn(this._pingTimeoutTimer);
            // stop event from firing again for transport
            this.transport.removeAllListeners("close");
            // ensure transport won't stay open
            this.transport.close();
            // ignore further transport communication
            this.transport.removeAllListeners();
            if (withEventListeners) {
                if (this._beforeunloadEventListener) {
                    removeEventListener("beforeunload", this._beforeunloadEventListener, false);
                }
                if (this._offlineEventListener) {
                    const i = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
                    if (i !== -1) {
                        OFFLINE_EVENT_LISTENERS.splice(i, 1);
                    }
                }
            }
            // set ready state
            this.readyState = "closed";
            // clear session id
            this.id = null;
            // emit close event
            this.emitReserved("close", reason, description);
            // clean buffers after, so users can still
            // grab the buffers on `close` event
            this.writeBuffer = [];
            this._prevBufferLen = 0;
        }
    }
}
SocketWithoutUpgrade.protocol = engine_io_parser__WEBPACK_IMPORTED_MODULE_5__.protocol;
/**
 * This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
 * with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
 *
 * This class comes with an upgrade mechanism, which means that once the connection is established with the first
 * low-level transport, it will try to upgrade to a better transport.
 *
 * In order to allow tree-shaking, there are no transports included, that's why the `transports` option is mandatory.
 *
 * @example
 * import { SocketWithUpgrade, WebSocket } from "engine.io-client";
 *
 * const socket = new SocketWithUpgrade({
 *   transports: [WebSocket]
 * });
 *
 * socket.on("open", () => {
 *   socket.send("hello");
 * });
 *
 * @see SocketWithoutUpgrade
 * @see Socket
 */
class SocketWithUpgrade extends SocketWithoutUpgrade {
    constructor() {
        super(...arguments);
        this._upgrades = [];
    }
    onOpen() {
        super.onOpen();
        if ("open" === this.readyState && this.opts.upgrade) {
            for (let i = 0; i < this._upgrades.length; i++) {
                this._probe(this._upgrades[i]);
            }
        }
    }
    /**
     * Probes a transport.
     *
     * @param {String} name - transport name
     * @private
     */
    _probe(name) {
        let transport = this.createTransport(name);
        let failed = false;
        SocketWithoutUpgrade.priorWebsocketSuccess = false;
        const onTransportOpen = () => {
            if (failed)
                return;
            transport.send([{ type: "ping", data: "probe" }]);
            transport.once("packet", (msg) => {
                if (failed)
                    return;
                if ("pong" === msg.type && "probe" === msg.data) {
                    this.upgrading = true;
                    this.emitReserved("upgrading", transport);
                    if (!transport)
                        return;
                    SocketWithoutUpgrade.priorWebsocketSuccess =
                        "websocket" === transport.name;
                    this.transport.pause(() => {
                        if (failed)
                            return;
                        if ("closed" === this.readyState)
                            return;
                        cleanup();
                        this.setTransport(transport);
                        transport.send([{ type: "upgrade" }]);
                        this.emitReserved("upgrade", transport);
                        transport = null;
                        this.upgrading = false;
                        this.flush();
                    });
                }
                else {
                    const err = new Error("probe error");
                    // @ts-ignore
                    err.transport = transport.name;
                    this.emitReserved("upgradeError", err);
                }
            });
        };
        function freezeTransport() {
            if (failed)
                return;
            // Any callback called by transport should be ignored since now
            failed = true;
            cleanup();
            transport.close();
            transport = null;
        }
        // Handle any error that happens while probing
        const onerror = (err) => {
            const error = new Error("probe error: " + err);
            // @ts-ignore
            error.transport = transport.name;
            freezeTransport();
            this.emitReserved("upgradeError", error);
        };
        function onTransportClose() {
            onerror("transport closed");
        }
        // When the socket is closed while we're probing
        function onclose() {
            onerror("socket closed");
        }
        // When the socket is upgraded while we're probing
        function onupgrade(to) {
            if (transport && to.name !== transport.name) {
                freezeTransport();
            }
        }
        // Remove all listeners on the transport and on self
        const cleanup = () => {
            transport.removeListener("open", onTransportOpen);
            transport.removeListener("error", onerror);
            transport.removeListener("close", onTransportClose);
            this.off("close", onclose);
            this.off("upgrading", onupgrade);
        };
        transport.once("open", onTransportOpen);
        transport.once("error", onerror);
        transport.once("close", onTransportClose);
        this.once("close", onclose);
        this.once("upgrading", onupgrade);
        if (this._upgrades.indexOf("webtransport") !== -1 &&
            name !== "webtransport") {
            // favor WebTransport
            this.setTimeoutFn(() => {
                if (!failed) {
                    transport.open();
                }
            }, 200);
        }
        else {
            transport.open();
        }
    }
    onHandshake(data) {
        this._upgrades = this._filterUpgrades(data.upgrades);
        super.onHandshake(data);
    }
    /**
     * Filters upgrades, returning only those matching client transports.
     *
     * @param {Array} upgrades - server upgrades
     * @private
     */
    _filterUpgrades(upgrades) {
        const filteredUpgrades = [];
        for (let i = 0; i < upgrades.length; i++) {
            if (~this.transports.indexOf(upgrades[i]))
                filteredUpgrades.push(upgrades[i]);
        }
        return filteredUpgrades;
    }
}
/**
 * This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
 * with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
 *
 * This class comes with an upgrade mechanism, which means that once the connection is established with the first
 * low-level transport, it will try to upgrade to a better transport.
 *
 * @example
 * import { Socket } from "engine.io-client";
 *
 * const socket = new Socket();
 *
 * socket.on("open", () => {
 *   socket.send("hello");
 * });
 *
 * @see SocketWithoutUpgrade
 * @see SocketWithUpgrade
 */
class Socket extends SocketWithUpgrade {
    constructor(uri, opts = {}) {
        const o = typeof uri === "object" ? uri : opts;
        if (!o.transports ||
            (o.transports && typeof o.transports[0] === "string")) {
            o.transports = (o.transports || ["polling", "websocket", "webtransport"])
                .map((transportName) => _transports_index_js__WEBPACK_IMPORTED_MODULE_0__.transports[transportName])
                .filter((t) => !!t);
        }
        super(uri, o);
    }
}


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/transport.js"
/*!**************************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/transport.js ***!
  \**************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Transport: () => (/* binding */ Transport),
/* harmony export */   TransportError: () => (/* binding */ TransportError)
/* harmony export */ });
/* harmony import */ var engine_io_parser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/build/esm/index.js");
/* harmony import */ var _socket_io_component_emitter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @socket.io/component-emitter */ "./node_modules/@socket.io/component-emitter/lib/esm/index.js");
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./util.js */ "./node_modules/engine.io-client/build/esm/util.js");
/* harmony import */ var _contrib_parseqs_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./contrib/parseqs.js */ "./node_modules/engine.io-client/build/esm/contrib/parseqs.js");




class TransportError extends Error {
    constructor(reason, description, context) {
        super(reason);
        this.description = description;
        this.context = context;
        this.type = "TransportError";
    }
}
class Transport extends _socket_io_component_emitter__WEBPACK_IMPORTED_MODULE_1__.Emitter {
    /**
     * Transport abstract constructor.
     *
     * @param {Object} opts - options
     * @protected
     */
    constructor(opts) {
        super();
        this.writable = false;
        (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.installTimerFunctions)(this, opts);
        this.opts = opts;
        this.query = opts.query;
        this.socket = opts.socket;
        this.supportsBinary = !opts.forceBase64;
    }
    /**
     * Emits an error.
     *
     * @param {String} reason
     * @param description
     * @param context - the error context
     * @return {Transport} for chaining
     * @protected
     */
    onError(reason, description, context) {
        super.emitReserved("error", new TransportError(reason, description, context));
        return this;
    }
    /**
     * Opens the transport.
     */
    open() {
        this.readyState = "opening";
        this.doOpen();
        return this;
    }
    /**
     * Closes the transport.
     */
    close() {
        if (this.readyState === "opening" || this.readyState === "open") {
            this.doClose();
            this.onClose();
        }
        return this;
    }
    /**
     * Sends multiple packets.
     *
     * @param {Array} packets
     */
    send(packets) {
        if (this.readyState === "open") {
            this.write(packets);
        }
        else {
            // this might happen if the transport was silently closed in the beforeunload event handler
        }
    }
    /**
     * Called upon open
     *
     * @protected
     */
    onOpen() {
        this.readyState = "open";
        this.writable = true;
        super.emitReserved("open");
    }
    /**
     * Called with data.
     *
     * @param {String} data
     * @protected
     */
    onData(data) {
        const packet = (0,engine_io_parser__WEBPACK_IMPORTED_MODULE_0__.decodePacket)(data, this.socket.binaryType);
        this.onPacket(packet);
    }
    /**
     * Called with a decoded packet.
     *
     * @protected
     */
    onPacket(packet) {
        super.emitReserved("packet", packet);
    }
    /**
     * Called upon close.
     *
     * @protected
     */
    onClose(details) {
        this.readyState = "closed";
        super.emitReserved("close", details);
    }
    /**
     * Pauses the transport, in order not to lose packets during an upgrade.
     *
     * @param onPause
     */
    pause(onPause) { }
    createUri(schema, query = {}) {
        return (schema +
            "://" +
            this._hostname() +
            this._port() +
            this.opts.path +
            this._query(query));
    }
    _hostname() {
        const hostname = this.opts.hostname;
        return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
    }
    _port() {
        if (this.opts.port &&
            ((this.opts.secure && Number(this.opts.port) !== 443) ||
                (!this.opts.secure && Number(this.opts.port) !== 80))) {
            return ":" + this.opts.port;
        }
        else {
            return "";
        }
    }
    _query(query) {
        const encodedQuery = (0,_contrib_parseqs_js__WEBPACK_IMPORTED_MODULE_3__.encode)(query);
        return encodedQuery.length ? "?" + encodedQuery : "";
    }
}


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/transports/index.js"
/*!*********************************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/transports/index.js ***!
  \*********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   transports: () => (/* binding */ transports)
/* harmony export */ });
/* harmony import */ var _polling_xhr_node_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./polling-xhr.node.js */ "./node_modules/engine.io-client/build/esm/transports/polling-xhr.js");
/* harmony import */ var _websocket_node_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./websocket.node.js */ "./node_modules/engine.io-client/build/esm/transports/websocket.js");
/* harmony import */ var _webtransport_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./webtransport.js */ "./node_modules/engine.io-client/build/esm/transports/webtransport.js");



const transports = {
    websocket: _websocket_node_js__WEBPACK_IMPORTED_MODULE_1__.WS,
    webtransport: _webtransport_js__WEBPACK_IMPORTED_MODULE_2__.WT,
    polling: _polling_xhr_node_js__WEBPACK_IMPORTED_MODULE_0__.XHR,
};


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/transports/polling-fetch.js"
/*!*****************************************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/transports/polling-fetch.js ***!
  \*****************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Fetch: () => (/* binding */ Fetch)
/* harmony export */ });
/* harmony import */ var _polling_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./polling.js */ "./node_modules/engine.io-client/build/esm/transports/polling.js");

/**
 * HTTP long-polling based on the built-in `fetch()` method.
 *
 * Usage: browser, Node.js (since v18), Deno, Bun
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/fetch
 * @see https://caniuse.com/fetch
 * @see https://nodejs.org/api/globals.html#fetch
 */
class Fetch extends _polling_js__WEBPACK_IMPORTED_MODULE_0__.Polling {
    doPoll() {
        this._fetch()
            .then((res) => {
            if (!res.ok) {
                return this.onError("fetch read error", res.status, res);
            }
            res.text().then((data) => this.onData(data));
        })
            .catch((err) => {
            this.onError("fetch read error", err);
        });
    }
    doWrite(data, callback) {
        this._fetch(data)
            .then((res) => {
            if (!res.ok) {
                return this.onError("fetch write error", res.status, res);
            }
            callback();
        })
            .catch((err) => {
            this.onError("fetch write error", err);
        });
    }
    _fetch(data) {
        var _a;
        const isPost = data !== undefined;
        const headers = new Headers(this.opts.extraHeaders);
        if (isPost) {
            headers.set("content-type", "text/plain;charset=UTF-8");
        }
        (_a = this.socket._cookieJar) === null || _a === void 0 ? void 0 : _a.appendCookies(headers);
        return fetch(this.uri(), {
            method: isPost ? "POST" : "GET",
            body: isPost ? data : null,
            headers,
            credentials: this.opts.withCredentials ? "include" : "omit",
        }).then((res) => {
            var _a;
            // @ts-ignore getSetCookie() was added in Node.js v19.7.0
            (_a = this.socket._cookieJar) === null || _a === void 0 ? void 0 : _a.parseCookies(res.headers.getSetCookie());
            return res;
        });
    }
}


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/transports/polling-xhr.js"
/*!***************************************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/transports/polling-xhr.js ***!
  \***************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseXHR: () => (/* binding */ BaseXHR),
/* harmony export */   Request: () => (/* binding */ Request),
/* harmony export */   XHR: () => (/* binding */ XHR)
/* harmony export */ });
/* harmony import */ var _polling_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./polling.js */ "./node_modules/engine.io-client/build/esm/transports/polling.js");
/* harmony import */ var _socket_io_component_emitter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @socket.io/component-emitter */ "./node_modules/@socket.io/component-emitter/lib/esm/index.js");
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../util.js */ "./node_modules/engine.io-client/build/esm/util.js");
/* harmony import */ var _globals_node_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../globals.node.js */ "./node_modules/engine.io-client/build/esm/globals.js");
/* harmony import */ var _contrib_has_cors_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../contrib/has-cors.js */ "./node_modules/engine.io-client/build/esm/contrib/has-cors.js");





function empty() { }
class BaseXHR extends _polling_js__WEBPACK_IMPORTED_MODULE_0__.Polling {
    /**
     * XHR Polling constructor.
     *
     * @param {Object} opts
     * @package
     */
    constructor(opts) {
        super(opts);
        if (typeof location !== "undefined") {
            const isSSL = "https:" === location.protocol;
            let port = location.port;
            // some user agents have empty `location.port`
            if (!port) {
                port = isSSL ? "443" : "80";
            }
            this.xd =
                (typeof location !== "undefined" &&
                    opts.hostname !== location.hostname) ||
                    port !== opts.port;
        }
    }
    /**
     * Sends data.
     *
     * @param {String} data to send.
     * @param {Function} called upon flush.
     * @private
     */
    doWrite(data, fn) {
        const req = this.request({
            method: "POST",
            data: data,
        });
        req.on("success", fn);
        req.on("error", (xhrStatus, context) => {
            this.onError("xhr post error", xhrStatus, context);
        });
    }
    /**
     * Starts a poll cycle.
     *
     * @private
     */
    doPoll() {
        const req = this.request();
        req.on("data", this.onData.bind(this));
        req.on("error", (xhrStatus, context) => {
            this.onError("xhr poll error", xhrStatus, context);
        });
        this.pollXhr = req;
    }
}
class Request extends _socket_io_component_emitter__WEBPACK_IMPORTED_MODULE_1__.Emitter {
    /**
     * Request constructor
     *
     * @param {Object} options
     * @package
     */
    constructor(createRequest, uri, opts) {
        super();
        this.createRequest = createRequest;
        (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.installTimerFunctions)(this, opts);
        this._opts = opts;
        this._method = opts.method || "GET";
        this._uri = uri;
        this._data = undefined !== opts.data ? opts.data : null;
        this._create();
    }
    /**
     * Creates the XHR object and sends the request.
     *
     * @private
     */
    _create() {
        var _a;
        const opts = (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.pick)(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
        opts.xdomain = !!this._opts.xd;
        const xhr = (this._xhr = this.createRequest(opts));
        try {
            xhr.open(this._method, this._uri, true);
            try {
                if (this._opts.extraHeaders) {
                    // @ts-ignore
                    xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
                    for (let i in this._opts.extraHeaders) {
                        if (this._opts.extraHeaders.hasOwnProperty(i)) {
                            xhr.setRequestHeader(i, this._opts.extraHeaders[i]);
                        }
                    }
                }
            }
            catch (e) { }
            if ("POST" === this._method) {
                try {
                    xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
                }
                catch (e) { }
            }
            try {
                xhr.setRequestHeader("Accept", "*/*");
            }
            catch (e) { }
            (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.addCookies(xhr);
            // ie6 check
            if ("withCredentials" in xhr) {
                xhr.withCredentials = this._opts.withCredentials;
            }
            if (this._opts.requestTimeout) {
                xhr.timeout = this._opts.requestTimeout;
            }
            xhr.onreadystatechange = () => {
                var _a;
                if (xhr.readyState === 3) {
                    (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.parseCookies(
                    // @ts-ignore
                    xhr.getResponseHeader("set-cookie"));
                }
                if (4 !== xhr.readyState)
                    return;
                if (200 === xhr.status || 1223 === xhr.status) {
                    this._onLoad();
                }
                else {
                    // make sure the `error` event handler that's user-set
                    // does not throw in the same tick and gets caught here
                    this.setTimeoutFn(() => {
                        this._onError(typeof xhr.status === "number" ? xhr.status : 0);
                    }, 0);
                }
            };
            xhr.send(this._data);
        }
        catch (e) {
            // Need to defer since .create() is called directly from the constructor
            // and thus the 'error' event can only be only bound *after* this exception
            // occurs.  Therefore, also, we cannot throw here at all.
            this.setTimeoutFn(() => {
                this._onError(e);
            }, 0);
            return;
        }
        if (typeof document !== "undefined") {
            this._index = Request.requestsCount++;
            Request.requests[this._index] = this;
        }
    }
    /**
     * Called upon error.
     *
     * @private
     */
    _onError(err) {
        this.emitReserved("error", err, this._xhr);
        this._cleanup(true);
    }
    /**
     * Cleans up house.
     *
     * @private
     */
    _cleanup(fromError) {
        if ("undefined" === typeof this._xhr || null === this._xhr) {
            return;
        }
        this._xhr.onreadystatechange = empty;
        if (fromError) {
            try {
                this._xhr.abort();
            }
            catch (e) { }
        }
        if (typeof document !== "undefined") {
            delete Request.requests[this._index];
        }
        this._xhr = null;
    }
    /**
     * Called upon load.
     *
     * @private
     */
    _onLoad() {
        const data = this._xhr.responseText;
        if (data !== null) {
            this.emitReserved("data", data);
            this.emitReserved("success");
            this._cleanup();
        }
    }
    /**
     * Aborts the request.
     *
     * @package
     */
    abort() {
        this._cleanup();
    }
}
Request.requestsCount = 0;
Request.requests = {};
/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */
if (typeof document !== "undefined") {
    // @ts-ignore
    if (typeof attachEvent === "function") {
        // @ts-ignore
        attachEvent("onunload", unloadHandler);
    }
    else if (typeof addEventListener === "function") {
        const terminationEvent = "onpagehide" in _globals_node_js__WEBPACK_IMPORTED_MODULE_3__.globalThisShim ? "pagehide" : "unload";
        addEventListener(terminationEvent, unloadHandler, false);
    }
}
function unloadHandler() {
    for (let i in Request.requests) {
        if (Request.requests.hasOwnProperty(i)) {
            Request.requests[i].abort();
        }
    }
}
const hasXHR2 = (function () {
    const xhr = newRequest({
        xdomain: false,
    });
    return xhr && xhr.responseType !== null;
})();
/**
 * HTTP long-polling based on the built-in `XMLHttpRequest` object.
 *
 * Usage: browser
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 */
class XHR extends BaseXHR {
    constructor(opts) {
        super(opts);
        const forceBase64 = opts && opts.forceBase64;
        this.supportsBinary = hasXHR2 && !forceBase64;
    }
    request(opts = {}) {
        Object.assign(opts, { xd: this.xd }, this.opts);
        return new Request(newRequest, this.uri(), opts);
    }
}
function newRequest(opts) {
    const xdomain = opts.xdomain;
    // XMLHttpRequest can be disabled on IE
    try {
        if ("undefined" !== typeof XMLHttpRequest && (!xdomain || _contrib_has_cors_js__WEBPACK_IMPORTED_MODULE_4__.hasCORS)) {
            return new XMLHttpRequest();
        }
    }
    catch (e) { }
    if (!xdomain) {
        try {
            return new _globals_node_js__WEBPACK_IMPORTED_MODULE_3__.globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
        }
        catch (e) { }
    }
}


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/transports/polling.js"
/*!***********************************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/transports/polling.js ***!
  \***********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Polling: () => (/* binding */ Polling)
/* harmony export */ });
/* harmony import */ var _transport_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../transport.js */ "./node_modules/engine.io-client/build/esm/transport.js");
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util.js */ "./node_modules/engine.io-client/build/esm/util.js");
/* harmony import */ var engine_io_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/build/esm/index.js");



class Polling extends _transport_js__WEBPACK_IMPORTED_MODULE_0__.Transport {
    constructor() {
        super(...arguments);
        this._polling = false;
    }
    get name() {
        return "polling";
    }
    /**
     * Opens the socket (triggers polling). We write a PING message to determine
     * when the transport is open.
     *
     * @protected
     */
    doOpen() {
        this._poll();
    }
    /**
     * Pauses polling.
     *
     * @param {Function} onPause - callback upon buffers are flushed and transport is paused
     * @package
     */
    pause(onPause) {
        this.readyState = "pausing";
        const pause = () => {
            this.readyState = "paused";
            onPause();
        };
        if (this._polling || !this.writable) {
            let total = 0;
            if (this._polling) {
                total++;
                this.once("pollComplete", function () {
                    --total || pause();
                });
            }
            if (!this.writable) {
                total++;
                this.once("drain", function () {
                    --total || pause();
                });
            }
        }
        else {
            pause();
        }
    }
    /**
     * Starts polling cycle.
     *
     * @private
     */
    _poll() {
        this._polling = true;
        this.doPoll();
        this.emitReserved("poll");
    }
    /**
     * Overloads onData to detect payloads.
     *
     * @protected
     */
    onData(data) {
        const callback = (packet) => {
            // if its the first message we consider the transport open
            if ("opening" === this.readyState && packet.type === "open") {
                this.onOpen();
            }
            // if its a close packet, we close the ongoing requests
            if ("close" === packet.type) {
                this.onClose({ description: "transport closed by the server" });
                return false;
            }
            // otherwise bypass onData and handle the message
            this.onPacket(packet);
        };
        // decode payload
        (0,engine_io_parser__WEBPACK_IMPORTED_MODULE_2__.decodePayload)(data, this.socket.binaryType).forEach(callback);
        // if an event did not trigger closing
        if ("closed" !== this.readyState) {
            // if we got data we're not polling
            this._polling = false;
            this.emitReserved("pollComplete");
            if ("open" === this.readyState) {
                this._poll();
            }
            else {
            }
        }
    }
    /**
     * For polling, send a close packet.
     *
     * @protected
     */
    doClose() {
        const close = () => {
            this.write([{ type: "close" }]);
        };
        if ("open" === this.readyState) {
            close();
        }
        else {
            // in case we're trying to close while
            // handshaking is in progress (GH-164)
            this.once("open", close);
        }
    }
    /**
     * Writes a packets payload.
     *
     * @param {Array} packets - data packets
     * @protected
     */
    write(packets) {
        this.writable = false;
        (0,engine_io_parser__WEBPACK_IMPORTED_MODULE_2__.encodePayload)(packets, (data) => {
            this.doWrite(data, () => {
                this.writable = true;
                this.emitReserved("drain");
            });
        });
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
        const schema = this.opts.secure ? "https" : "http";
        const query = this.query || {};
        // cache busting is forced
        if (false !== this.opts.timestampRequests) {
            query[this.opts.timestampParam] = (0,_util_js__WEBPACK_IMPORTED_MODULE_1__.randomString)();
        }
        if (!this.supportsBinary && !query.sid) {
            query.b64 = 1;
        }
        return this.createUri(schema, query);
    }
}


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/transports/websocket.js"
/*!*************************************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/transports/websocket.js ***!
  \*************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseWS: () => (/* binding */ BaseWS),
/* harmony export */   WS: () => (/* binding */ WS)
/* harmony export */ });
/* harmony import */ var _transport_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../transport.js */ "./node_modules/engine.io-client/build/esm/transport.js");
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../util.js */ "./node_modules/engine.io-client/build/esm/util.js");
/* harmony import */ var engine_io_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/build/esm/index.js");
/* harmony import */ var _globals_node_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../globals.node.js */ "./node_modules/engine.io-client/build/esm/globals.js");




// detect ReactNative environment
const isReactNative = typeof navigator !== "undefined" &&
    typeof navigator.product === "string" &&
    navigator.product.toLowerCase() === "reactnative";
class BaseWS extends _transport_js__WEBPACK_IMPORTED_MODULE_0__.Transport {
    get name() {
        return "websocket";
    }
    doOpen() {
        const uri = this.uri();
        const protocols = this.opts.protocols;
        // React Native only supports the 'headers' option, and will print a warning if anything else is passed
        const opts = isReactNative
            ? {}
            : (0,_util_js__WEBPACK_IMPORTED_MODULE_1__.pick)(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
        if (this.opts.extraHeaders) {
            opts.headers = this.opts.extraHeaders;
        }
        try {
            this.ws = this.createSocket(uri, protocols, opts);
        }
        catch (err) {
            return this.emitReserved("error", err);
        }
        this.ws.binaryType = this.socket.binaryType;
        this.addEventListeners();
    }
    /**
     * Adds event listeners to the socket
     *
     * @private
     */
    addEventListeners() {
        this.ws.onopen = () => {
            if (this.opts.autoUnref) {
                this.ws._socket.unref();
            }
            this.onOpen();
        };
        this.ws.onclose = (closeEvent) => this.onClose({
            description: "websocket connection closed",
            context: closeEvent,
        });
        this.ws.onmessage = (ev) => this.onData(ev.data);
        this.ws.onerror = (e) => this.onError("websocket error", e);
    }
    write(packets) {
        this.writable = false;
        // encodePacket efficient as it uses WS framing
        // no need for encodePayload
        for (let i = 0; i < packets.length; i++) {
            const packet = packets[i];
            const lastPacket = i === packets.length - 1;
            (0,engine_io_parser__WEBPACK_IMPORTED_MODULE_2__.encodePacket)(packet, this.supportsBinary, (data) => {
                // Sometimes the websocket has already been closed but the browser didn't
                // have a chance of informing us about it yet, in that case send will
                // throw an error
                try {
                    this.doWrite(packet, data);
                }
                catch (e) {
                }
                if (lastPacket) {
                    // fake drain
                    // defer to next tick to allow Socket to clear writeBuffer
                    (0,_globals_node_js__WEBPACK_IMPORTED_MODULE_3__.nextTick)(() => {
                        this.writable = true;
                        this.emitReserved("drain");
                    }, this.setTimeoutFn);
                }
            });
        }
    }
    doClose() {
        if (typeof this.ws !== "undefined") {
            this.ws.onerror = () => { };
            this.ws.close();
            this.ws = null;
        }
    }
    /**
     * Generates uri for connection.
     *
     * @private
     */
    uri() {
        const schema = this.opts.secure ? "wss" : "ws";
        const query = this.query || {};
        // append timestamp to URI
        if (this.opts.timestampRequests) {
            query[this.opts.timestampParam] = (0,_util_js__WEBPACK_IMPORTED_MODULE_1__.randomString)();
        }
        // communicate binary support capabilities
        if (!this.supportsBinary) {
            query.b64 = 1;
        }
        return this.createUri(schema, query);
    }
}
const WebSocketCtor = _globals_node_js__WEBPACK_IMPORTED_MODULE_3__.globalThisShim.WebSocket || _globals_node_js__WEBPACK_IMPORTED_MODULE_3__.globalThisShim.MozWebSocket;
/**
 * WebSocket transport based on the built-in `WebSocket` object.
 *
 * Usage: browser, Node.js (since v21), Deno, Bun
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
 * @see https://caniuse.com/mdn-api_websocket
 * @see https://nodejs.org/api/globals.html#websocket
 */
class WS extends BaseWS {
    createSocket(uri, protocols, opts) {
        return !isReactNative
            ? protocols
                ? new WebSocketCtor(uri, protocols)
                : new WebSocketCtor(uri)
            : new WebSocketCtor(uri, protocols, opts);
    }
    doWrite(_packet, data) {
        this.ws.send(data);
    }
}


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/transports/webtransport.js"
/*!****************************************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/transports/webtransport.js ***!
  \****************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WT: () => (/* binding */ WT)
/* harmony export */ });
/* harmony import */ var _transport_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../transport.js */ "./node_modules/engine.io-client/build/esm/transport.js");
/* harmony import */ var _globals_node_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../globals.node.js */ "./node_modules/engine.io-client/build/esm/globals.js");
/* harmony import */ var engine_io_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! engine.io-parser */ "./node_modules/engine.io-parser/build/esm/index.js");



/**
 * WebTransport transport based on the built-in `WebTransport` object.
 *
 * Usage: browser, Node.js (with the `@fails-components/webtransport` package)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebTransport
 * @see https://caniuse.com/webtransport
 */
class WT extends _transport_js__WEBPACK_IMPORTED_MODULE_0__.Transport {
    get name() {
        return "webtransport";
    }
    doOpen() {
        try {
            // @ts-ignore
            this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
        }
        catch (err) {
            return this.emitReserved("error", err);
        }
        this._transport.closed
            .then(() => {
            this.onClose();
        })
            .catch((err) => {
            this.onError("webtransport error", err);
        });
        // note: we could have used async/await, but that would require some additional polyfills
        this._transport.ready.then(() => {
            this._transport.createBidirectionalStream().then((stream) => {
                const decoderStream = (0,engine_io_parser__WEBPACK_IMPORTED_MODULE_2__.createPacketDecoderStream)(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
                const reader = stream.readable.pipeThrough(decoderStream).getReader();
                const encoderStream = (0,engine_io_parser__WEBPACK_IMPORTED_MODULE_2__.createPacketEncoderStream)();
                encoderStream.readable.pipeTo(stream.writable);
                this._writer = encoderStream.writable.getWriter();
                const read = () => {
                    reader
                        .read()
                        .then(({ done, value }) => {
                        if (done) {
                            return;
                        }
                        this.onPacket(value);
                        read();
                    })
                        .catch((err) => {
                    });
                };
                read();
                const packet = { type: "open" };
                if (this.query.sid) {
                    packet.data = `{"sid":"${this.query.sid}"}`;
                }
                this._writer.write(packet).then(() => this.onOpen());
            });
        });
    }
    write(packets) {
        this.writable = false;
        for (let i = 0; i < packets.length; i++) {
            const packet = packets[i];
            const lastPacket = i === packets.length - 1;
            this._writer.write(packet).then(() => {
                if (lastPacket) {
                    (0,_globals_node_js__WEBPACK_IMPORTED_MODULE_1__.nextTick)(() => {
                        this.writable = true;
                        this.emitReserved("drain");
                    }, this.setTimeoutFn);
                }
            });
        }
    }
    doClose() {
        var _a;
        (_a = this._transport) === null || _a === void 0 ? void 0 : _a.close();
    }
}


/***/ },

/***/ "./node_modules/engine.io-client/build/esm/util.js"
/*!*********************************************************!*\
  !*** ./node_modules/engine.io-client/build/esm/util.js ***!
  \*********************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   byteLength: () => (/* binding */ byteLength),
/* harmony export */   installTimerFunctions: () => (/* binding */ installTimerFunctions),
/* harmony export */   pick: () => (/* binding */ pick),
/* harmony export */   randomString: () => (/* binding */ randomString)
/* harmony export */ });
/* harmony import */ var _globals_node_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./globals.node.js */ "./node_modules/engine.io-client/build/esm/globals.js");

function pick(obj, ...attr) {
    return attr.reduce((acc, k) => {
        if (obj.hasOwnProperty(k)) {
            acc[k] = obj[k];
        }
        return acc;
    }, {});
}
// Keep a reference to the real timeout functions so they can be used when overridden
const NATIVE_SET_TIMEOUT = _globals_node_js__WEBPACK_IMPORTED_MODULE_0__.globalThisShim.setTimeout;
const NATIVE_CLEAR_TIMEOUT = _globals_node_js__WEBPACK_IMPORTED_MODULE_0__.globalThisShim.clearTimeout;
function installTimerFunctions(obj, opts) {
    if (opts.useNativeTimers) {
        obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(_globals_node_js__WEBPACK_IMPORTED_MODULE_0__.globalThisShim);
        obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(_globals_node_js__WEBPACK_IMPORTED_MODULE_0__.globalThisShim);
    }
    else {
        obj.setTimeoutFn = _globals_node_js__WEBPACK_IMPORTED_MODULE_0__.globalThisShim.setTimeout.bind(_globals_node_js__WEBPACK_IMPORTED_MODULE_0__.globalThisShim);
        obj.clearTimeoutFn = _globals_node_js__WEBPACK_IMPORTED_MODULE_0__.globalThisShim.clearTimeout.bind(_globals_node_js__WEBPACK_IMPORTED_MODULE_0__.globalThisShim);
    }
}
// base64 encoded buffers are about 33% bigger (https://en.wikipedia.org/wiki/Base64)
const BASE64_OVERHEAD = 1.33;
// we could also have used `new Blob([obj]).size`, but it isn't supported in IE9
function byteLength(obj) {
    if (typeof obj === "string") {
        return utf8Length(obj);
    }
    // arraybuffer or blob
    return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
}
function utf8Length(str) {
    let c = 0, length = 0;
    for (let i = 0, l = str.length; i < l; i++) {
        c = str.charCodeAt(i);
        if (c < 0x80) {
            length += 1;
        }
        else if (c < 0x800) {
            length += 2;
        }
        else if (c < 0xd800 || c >= 0xe000) {
            length += 3;
        }
        else {
            i++;
            length += 4;
        }
    }
    return length;
}
/**
 * Generates a random 8-characters string.
 */
function randomString() {
    return (Date.now().toString(36).substring(3) +
        Math.random().toString(36).substring(2, 5));
}


/***/ },

/***/ "./node_modules/engine.io-parser/build/esm/commons.js"
/*!************************************************************!*\
  !*** ./node_modules/engine.io-parser/build/esm/commons.js ***!
  \************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ERROR_PACKET: () => (/* binding */ ERROR_PACKET),
/* harmony export */   PACKET_TYPES: () => (/* binding */ PACKET_TYPES),
/* harmony export */   PACKET_TYPES_REVERSE: () => (/* binding */ PACKET_TYPES_REVERSE)
/* harmony export */ });
const PACKET_TYPES = Object.create(null); // no Map = no polyfill
PACKET_TYPES["open"] = "0";
PACKET_TYPES["close"] = "1";
PACKET_TYPES["ping"] = "2";
PACKET_TYPES["pong"] = "3";
PACKET_TYPES["message"] = "4";
PACKET_TYPES["upgrade"] = "5";
PACKET_TYPES["noop"] = "6";
const PACKET_TYPES_REVERSE = Object.create(null);
Object.keys(PACKET_TYPES).forEach((key) => {
    PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
});
const ERROR_PACKET = { type: "error", data: "parser error" };



/***/ },

/***/ "./node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js"
/*!*******************************************************************************!*\
  !*** ./node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js ***!
  \*******************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   decode: () => (/* binding */ decode),
/* harmony export */   encode: () => (/* binding */ encode)
/* harmony export */ });
// imported from https://github.com/socketio/base64-arraybuffer
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
// Use a lookup table to find the index.
const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
}
const encode = (arraybuffer) => {
    let bytes = new Uint8Array(arraybuffer), i, len = bytes.length, base64 = '';
    for (i = 0; i < len; i += 3) {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64 += chars[bytes[i + 2] & 63];
    }
    if (len % 3 === 2) {
        base64 = base64.substring(0, base64.length - 1) + '=';
    }
    else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + '==';
    }
    return base64;
};
const decode = (base64) => {
    let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
    if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }
    const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
    for (i = 0; i < len; i += 4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];
        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return arraybuffer;
};


/***/ },

/***/ "./node_modules/engine.io-parser/build/esm/decodePacket.browser.js"
/*!*************************************************************************!*\
  !*** ./node_modules/engine.io-parser/build/esm/decodePacket.browser.js ***!
  \*************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   decodePacket: () => (/* binding */ decodePacket)
/* harmony export */ });
/* harmony import */ var _commons_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./commons.js */ "./node_modules/engine.io-parser/build/esm/commons.js");
/* harmony import */ var _contrib_base64_arraybuffer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./contrib/base64-arraybuffer.js */ "./node_modules/engine.io-parser/build/esm/contrib/base64-arraybuffer.js");


const withNativeArrayBuffer = typeof ArrayBuffer === "function";
const decodePacket = (encodedPacket, binaryType) => {
    if (typeof encodedPacket !== "string") {
        return {
            type: "message",
            data: mapBinary(encodedPacket, binaryType),
        };
    }
    const type = encodedPacket.charAt(0);
    if (type === "b") {
        return {
            type: "message",
            data: decodeBase64Packet(encodedPacket.substring(1), binaryType),
        };
    }
    const packetType = _commons_js__WEBPACK_IMPORTED_MODULE_0__.PACKET_TYPES_REVERSE[type];
    if (!packetType) {
        return _commons_js__WEBPACK_IMPORTED_MODULE_0__.ERROR_PACKET;
    }
    return encodedPacket.length > 1
        ? {
            type: _commons_js__WEBPACK_IMPORTED_MODULE_0__.PACKET_TYPES_REVERSE[type],
            data: encodedPacket.substring(1),
        }
        : {
            type: _commons_js__WEBPACK_IMPORTED_MODULE_0__.PACKET_TYPES_REVERSE[type],
        };
};
const decodeBase64Packet = (data, binaryType) => {
    if (withNativeArrayBuffer) {
        const decoded = (0,_contrib_base64_arraybuffer_js__WEBPACK_IMPORTED_MODULE_1__.decode)(data);
        return mapBinary(decoded, binaryType);
    }
    else {
        return { base64: true, data }; // fallback for old browsers
    }
};
const mapBinary = (data, binaryType) => {
    switch (binaryType) {
        case "blob":
            if (data instanceof Blob) {
                // from WebSocket + binaryType "blob"
                return data;
            }
            else {
                // from HTTP long-polling or WebTransport
                return new Blob([data]);
            }
        case "arraybuffer":
        default:
            if (data instanceof ArrayBuffer) {
                // from HTTP long-polling (base64) or WebSocket + binaryType "arraybuffer"
                return data;
            }
            else {
                // from WebTransport (Uint8Array)
                return data.buffer;
            }
    }
};


/***/ },

/***/ "./node_modules/engine.io-parser/build/esm/encodePacket.browser.js"
/*!*************************************************************************!*\
  !*** ./node_modules/engine.io-parser/build/esm/encodePacket.browser.js ***!
  \*************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   encodePacket: () => (/* binding */ encodePacket),
/* harmony export */   encodePacketToBinary: () => (/* binding */ encodePacketToBinary)
/* harmony export */ });
/* harmony import */ var _commons_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./commons.js */ "./node_modules/engine.io-parser/build/esm/commons.js");

const withNativeBlob = typeof Blob === "function" ||
    (typeof Blob !== "undefined" &&
        Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
const withNativeArrayBuffer = typeof ArrayBuffer === "function";
// ArrayBuffer.isView method is not defined in IE10
const isView = (obj) => {
    return typeof ArrayBuffer.isView === "function"
        ? ArrayBuffer.isView(obj)
        : obj && obj.buffer instanceof ArrayBuffer;
};
const encodePacket = ({ type, data }, supportsBinary, callback) => {
    if (withNativeBlob && data instanceof Blob) {
        if (supportsBinary) {
            return callback(data);
        }
        else {
            return encodeBlobAsBase64(data, callback);
        }
    }
    else if (withNativeArrayBuffer &&
        (data instanceof ArrayBuffer || isView(data))) {
        if (supportsBinary) {
            return callback(data);
        }
        else {
            return encodeBlobAsBase64(new Blob([data]), callback);
        }
    }
    // plain string
    return callback(_commons_js__WEBPACK_IMPORTED_MODULE_0__.PACKET_TYPES[type] + (data || ""));
};
const encodeBlobAsBase64 = (data, callback) => {
    const fileReader = new FileReader();
    fileReader.onload = function () {
        const content = fileReader.result.split(",")[1];
        callback("b" + (content || ""));
    };
    return fileReader.readAsDataURL(data);
};
function toArray(data) {
    if (data instanceof Uint8Array) {
        return data;
    }
    else if (data instanceof ArrayBuffer) {
        return new Uint8Array(data);
    }
    else {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
}
let TEXT_ENCODER;
function encodePacketToBinary(packet, callback) {
    if (withNativeBlob && packet.data instanceof Blob) {
        return packet.data.arrayBuffer().then(toArray).then(callback);
    }
    else if (withNativeArrayBuffer &&
        (packet.data instanceof ArrayBuffer || isView(packet.data))) {
        return callback(toArray(packet.data));
    }
    encodePacket(packet, false, (encoded) => {
        if (!TEXT_ENCODER) {
            TEXT_ENCODER = new TextEncoder();
        }
        callback(TEXT_ENCODER.encode(encoded));
    });
}



/***/ },

/***/ "./node_modules/engine.io-parser/build/esm/index.js"
/*!**********************************************************!*\
  !*** ./node_modules/engine.io-parser/build/esm/index.js ***!
  \**********************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createPacketDecoderStream: () => (/* binding */ createPacketDecoderStream),
/* harmony export */   createPacketEncoderStream: () => (/* binding */ createPacketEncoderStream),
/* harmony export */   decodePacket: () => (/* reexport safe */ _decodePacket_js__WEBPACK_IMPORTED_MODULE_1__.decodePacket),
/* harmony export */   decodePayload: () => (/* binding */ decodePayload),
/* harmony export */   encodePacket: () => (/* reexport safe */ _encodePacket_js__WEBPACK_IMPORTED_MODULE_0__.encodePacket),
/* harmony export */   encodePayload: () => (/* binding */ encodePayload),
/* harmony export */   protocol: () => (/* binding */ protocol)
/* harmony export */ });
/* harmony import */ var _encodePacket_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./encodePacket.js */ "./node_modules/engine.io-parser/build/esm/encodePacket.browser.js");
/* harmony import */ var _decodePacket_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./decodePacket.js */ "./node_modules/engine.io-parser/build/esm/decodePacket.browser.js");
/* harmony import */ var _commons_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./commons.js */ "./node_modules/engine.io-parser/build/esm/commons.js");



const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text
const encodePayload = (packets, callback) => {
    // some packets may be added to the array while encoding, so the initial length must be saved
    const length = packets.length;
    const encodedPackets = new Array(length);
    let count = 0;
    packets.forEach((packet, i) => {
        // force base64 encoding for binary packets
        (0,_encodePacket_js__WEBPACK_IMPORTED_MODULE_0__.encodePacket)(packet, false, (encodedPacket) => {
            encodedPackets[i] = encodedPacket;
            if (++count === length) {
                callback(encodedPackets.join(SEPARATOR));
            }
        });
    });
};
const decodePayload = (encodedPayload, binaryType) => {
    const encodedPackets = encodedPayload.split(SEPARATOR);
    const packets = [];
    for (let i = 0; i < encodedPackets.length; i++) {
        const decodedPacket = (0,_decodePacket_js__WEBPACK_IMPORTED_MODULE_1__.decodePacket)(encodedPackets[i], binaryType);
        packets.push(decodedPacket);
        if (decodedPacket.type === "error") {
            break;
        }
    }
    return packets;
};
function createPacketEncoderStream() {
    return new TransformStream({
        transform(packet, controller) {
            (0,_encodePacket_js__WEBPACK_IMPORTED_MODULE_0__.encodePacketToBinary)(packet, (encodedPacket) => {
                const payloadLength = encodedPacket.length;
                let header;
                // inspired by the WebSocket format: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#decoding_payload_length
                if (payloadLength < 126) {
                    header = new Uint8Array(1);
                    new DataView(header.buffer).setUint8(0, payloadLength);
                }
                else if (payloadLength < 65536) {
                    header = new Uint8Array(3);
                    const view = new DataView(header.buffer);
                    view.setUint8(0, 126);
                    view.setUint16(1, payloadLength);
                }
                else {
                    header = new Uint8Array(9);
                    const view = new DataView(header.buffer);
                    view.setUint8(0, 127);
                    view.setBigUint64(1, BigInt(payloadLength));
                }
                // first bit indicates whether the payload is plain text (0) or binary (1)
                if (packet.data && typeof packet.data !== "string") {
                    header[0] |= 0x80;
                }
                controller.enqueue(header);
                controller.enqueue(encodedPacket);
            });
        },
    });
}
let TEXT_DECODER;
function totalLength(chunks) {
    return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
}
function concatChunks(chunks, size) {
    if (chunks[0].length === size) {
        return chunks.shift();
    }
    const buffer = new Uint8Array(size);
    let j = 0;
    for (let i = 0; i < size; i++) {
        buffer[i] = chunks[0][j++];
        if (j === chunks[0].length) {
            chunks.shift();
            j = 0;
        }
    }
    if (chunks.length && j < chunks[0].length) {
        chunks[0] = chunks[0].slice(j);
    }
    return buffer;
}
function createPacketDecoderStream(maxPayload, binaryType) {
    if (!TEXT_DECODER) {
        TEXT_DECODER = new TextDecoder();
    }
    const chunks = [];
    let state = 0 /* State.READ_HEADER */;
    let expectedLength = -1;
    let isBinary = false;
    return new TransformStream({
        transform(chunk, controller) {
            chunks.push(chunk);
            while (true) {
                if (state === 0 /* State.READ_HEADER */) {
                    if (totalLength(chunks) < 1) {
                        break;
                    }
                    const header = concatChunks(chunks, 1);
                    isBinary = (header[0] & 0x80) === 0x80;
                    expectedLength = header[0] & 0x7f;
                    if (expectedLength < 126) {
                        state = 3 /* State.READ_PAYLOAD */;
                    }
                    else if (expectedLength === 126) {
                        state = 1 /* State.READ_EXTENDED_LENGTH_16 */;
                    }
                    else {
                        state = 2 /* State.READ_EXTENDED_LENGTH_64 */;
                    }
                }
                else if (state === 1 /* State.READ_EXTENDED_LENGTH_16 */) {
                    if (totalLength(chunks) < 2) {
                        break;
                    }
                    const headerArray = concatChunks(chunks, 2);
                    expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
                    state = 3 /* State.READ_PAYLOAD */;
                }
                else if (state === 2 /* State.READ_EXTENDED_LENGTH_64 */) {
                    if (totalLength(chunks) < 8) {
                        break;
                    }
                    const headerArray = concatChunks(chunks, 8);
                    const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
                    const n = view.getUint32(0);
                    if (n > Math.pow(2, 53 - 32) - 1) {
                        // the maximum safe integer in JavaScript is 2^53 - 1
                        controller.enqueue(_commons_js__WEBPACK_IMPORTED_MODULE_2__.ERROR_PACKET);
                        break;
                    }
                    expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
                    state = 3 /* State.READ_PAYLOAD */;
                }
                else {
                    if (totalLength(chunks) < expectedLength) {
                        break;
                    }
                    const data = concatChunks(chunks, expectedLength);
                    controller.enqueue((0,_decodePacket_js__WEBPACK_IMPORTED_MODULE_1__.decodePacket)(isBinary ? data : TEXT_DECODER.decode(data), binaryType));
                    state = 0 /* State.READ_HEADER */;
                }
                if (expectedLength === 0 || expectedLength > maxPayload) {
                    controller.enqueue(_commons_js__WEBPACK_IMPORTED_MODULE_2__.ERROR_PACKET);
                    break;
                }
            }
        },
    });
}
const protocol = 4;



/***/ },

/***/ "./node_modules/socket.io-client/build/esm/contrib/backo2.js"
/*!*******************************************************************!*\
  !*** ./node_modules/socket.io-client/build/esm/contrib/backo2.js ***!
  \*******************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Backoff: () => (/* binding */ Backoff)
/* harmony export */ });
/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */
function Backoff(opts) {
    opts = opts || {};
    this.ms = opts.min || 100;
    this.max = opts.max || 10000;
    this.factor = opts.factor || 2;
    this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
    this.attempts = 0;
}
/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */
Backoff.prototype.duration = function () {
    var ms = this.ms * Math.pow(this.factor, this.attempts++);
    if (this.jitter) {
        var rand = Math.random();
        var deviation = Math.floor(rand * this.jitter * ms);
        ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
    }
    return Math.min(ms, this.max) | 0;
};
/**
 * Reset the number of attempts.
 *
 * @api public
 */
Backoff.prototype.reset = function () {
    this.attempts = 0;
};
/**
 * Set the minimum duration
 *
 * @api public
 */
Backoff.prototype.setMin = function (min) {
    this.ms = min;
};
/**
 * Set the maximum duration
 *
 * @api public
 */
Backoff.prototype.setMax = function (max) {
    this.max = max;
};
/**
 * Set the jitter
 *
 * @api public
 */
Backoff.prototype.setJitter = function (jitter) {
    this.jitter = jitter;
};


/***/ },

/***/ "./node_modules/socket.io-client/build/esm/index.js"
/*!**********************************************************!*\
  !*** ./node_modules/socket.io-client/build/esm/index.js ***!
  \**********************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Fetch: () => (/* reexport safe */ engine_io_client__WEBPACK_IMPORTED_MODULE_4__.Fetch),
/* harmony export */   Manager: () => (/* reexport safe */ _manager_js__WEBPACK_IMPORTED_MODULE_1__.Manager),
/* harmony export */   NodeWebSocket: () => (/* reexport safe */ engine_io_client__WEBPACK_IMPORTED_MODULE_4__.NodeWebSocket),
/* harmony export */   NodeXHR: () => (/* reexport safe */ engine_io_client__WEBPACK_IMPORTED_MODULE_4__.NodeXHR),
/* harmony export */   Socket: () => (/* reexport safe */ _socket_js__WEBPACK_IMPORTED_MODULE_2__.Socket),
/* harmony export */   WebSocket: () => (/* reexport safe */ engine_io_client__WEBPACK_IMPORTED_MODULE_4__.WebSocket),
/* harmony export */   WebTransport: () => (/* reexport safe */ engine_io_client__WEBPACK_IMPORTED_MODULE_4__.WebTransport),
/* harmony export */   XHR: () => (/* reexport safe */ engine_io_client__WEBPACK_IMPORTED_MODULE_4__.XHR),
/* harmony export */   connect: () => (/* binding */ lookup),
/* harmony export */   "default": () => (/* binding */ lookup),
/* harmony export */   io: () => (/* binding */ lookup),
/* harmony export */   protocol: () => (/* reexport safe */ socket_io_parser__WEBPACK_IMPORTED_MODULE_3__.protocol)
/* harmony export */ });
/* harmony import */ var _url_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./url.js */ "./node_modules/socket.io-client/build/esm/url.js");
/* harmony import */ var _manager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./manager.js */ "./node_modules/socket.io-client/build/esm/manager.js");
/* harmony import */ var _socket_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./socket.js */ "./node_modules/socket.io-client/build/esm/socket.js");
/* harmony import */ var socket_io_parser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! socket.io-parser */ "./node_modules/socket.io-parser/build/esm-debug/index.js");
/* harmony import */ var engine_io_client__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! engine.io-client */ "./node_modules/engine.io-client/build/esm/index.js");



/**
 * Managers cache.
 */
const cache = {};
function lookup(uri, opts) {
    if (typeof uri === "object") {
        opts = uri;
        uri = undefined;
    }
    opts = opts || {};
    const parsed = (0,_url_js__WEBPACK_IMPORTED_MODULE_0__.url)(uri, opts.path || "/socket.io");
    const source = parsed.source;
    const id = parsed.id;
    const path = parsed.path;
    const sameNamespace = cache[id] && path in cache[id]["nsps"];
    const newConnection = opts.forceNew ||
        opts["force new connection"] ||
        false === opts.multiplex ||
        sameNamespace;
    let io;
    if (newConnection) {
        io = new _manager_js__WEBPACK_IMPORTED_MODULE_1__.Manager(source, opts);
    }
    else {
        if (!cache[id]) {
            cache[id] = new _manager_js__WEBPACK_IMPORTED_MODULE_1__.Manager(source, opts);
        }
        io = cache[id];
    }
    if (parsed.query && !opts.query) {
        opts.query = parsed.queryKey;
    }
    return io.socket(parsed.path, opts);
}
// so that "lookup" can be used both as a function (e.g. `io(...)`) and as a
// namespace (e.g. `io.connect(...)`), for backward compatibility
Object.assign(lookup, {
    Manager: _manager_js__WEBPACK_IMPORTED_MODULE_1__.Manager,
    Socket: _socket_js__WEBPACK_IMPORTED_MODULE_2__.Socket,
    io: lookup,
    connect: lookup,
});
/**
 * Protocol version.
 *
 * @public
 */

/**
 * Expose constructors for standalone build.
 *
 * @public
 */




/***/ },

/***/ "./node_modules/socket.io-client/build/esm/manager.js"
/*!************************************************************!*\
  !*** ./node_modules/socket.io-client/build/esm/manager.js ***!
  \************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Manager: () => (/* binding */ Manager)
/* harmony export */ });
/* harmony import */ var engine_io_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! engine.io-client */ "./node_modules/engine.io-client/build/esm/index.js");
/* harmony import */ var _socket_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./socket.js */ "./node_modules/socket.io-client/build/esm/socket.js");
/* harmony import */ var socket_io_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! socket.io-parser */ "./node_modules/socket.io-parser/build/esm-debug/index.js");
/* harmony import */ var _on_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./on.js */ "./node_modules/socket.io-client/build/esm/on.js");
/* harmony import */ var _contrib_backo2_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./contrib/backo2.js */ "./node_modules/socket.io-client/build/esm/contrib/backo2.js");
/* harmony import */ var _socket_io_component_emitter__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @socket.io/component-emitter */ "./node_modules/@socket.io/component-emitter/lib/esm/index.js");






class Manager extends _socket_io_component_emitter__WEBPACK_IMPORTED_MODULE_5__.Emitter {
    constructor(uri, opts) {
        var _a;
        super();
        this.nsps = {};
        this.subs = [];
        if (uri && "object" === typeof uri) {
            opts = uri;
            uri = undefined;
        }
        opts = opts || {};
        opts.path = opts.path || "/socket.io";
        this.opts = opts;
        (0,engine_io_client__WEBPACK_IMPORTED_MODULE_0__.installTimerFunctions)(this, opts);
        this.reconnection(opts.reconnection !== false);
        this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
        this.reconnectionDelay(opts.reconnectionDelay || 1000);
        this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
        this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
        this.backoff = new _contrib_backo2_js__WEBPACK_IMPORTED_MODULE_4__.Backoff({
            min: this.reconnectionDelay(),
            max: this.reconnectionDelayMax(),
            jitter: this.randomizationFactor(),
        });
        this.timeout(null == opts.timeout ? 20000 : opts.timeout);
        this._readyState = "closed";
        this.uri = uri;
        const _parser = opts.parser || socket_io_parser__WEBPACK_IMPORTED_MODULE_2__;
        this.encoder = new _parser.Encoder();
        this.decoder = new _parser.Decoder();
        this._autoConnect = opts.autoConnect !== false;
        if (this._autoConnect)
            this.open();
    }
    reconnection(v) {
        if (!arguments.length)
            return this._reconnection;
        this._reconnection = !!v;
        if (!v) {
            this.skipReconnect = true;
        }
        return this;
    }
    reconnectionAttempts(v) {
        if (v === undefined)
            return this._reconnectionAttempts;
        this._reconnectionAttempts = v;
        return this;
    }
    reconnectionDelay(v) {
        var _a;
        if (v === undefined)
            return this._reconnectionDelay;
        this._reconnectionDelay = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
        return this;
    }
    randomizationFactor(v) {
        var _a;
        if (v === undefined)
            return this._randomizationFactor;
        this._randomizationFactor = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
        return this;
    }
    reconnectionDelayMax(v) {
        var _a;
        if (v === undefined)
            return this._reconnectionDelayMax;
        this._reconnectionDelayMax = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
        return this;
    }
    timeout(v) {
        if (!arguments.length)
            return this._timeout;
        this._timeout = v;
        return this;
    }
    /**
     * Starts trying to reconnect if reconnection is enabled and we have not
     * started reconnecting yet
     *
     * @private
     */
    maybeReconnectOnOpen() {
        // Only try to reconnect if it's the first time we're connecting
        if (!this._reconnecting &&
            this._reconnection &&
            this.backoff.attempts === 0) {
            // keeps reconnection from firing twice for the same reconnection loop
            this.reconnect();
        }
    }
    /**
     * Sets the current transport `socket`.
     *
     * @param {Function} fn - optional, callback
     * @return self
     * @public
     */
    open(fn) {
        if (~this._readyState.indexOf("open"))
            return this;
        this.engine = new engine_io_client__WEBPACK_IMPORTED_MODULE_0__.Socket(this.uri, this.opts);
        const socket = this.engine;
        const self = this;
        this._readyState = "opening";
        this.skipReconnect = false;
        // emit `open`
        const openSubDestroy = (0,_on_js__WEBPACK_IMPORTED_MODULE_3__.on)(socket, "open", function () {
            self.onopen();
            fn && fn();
        });
        const onError = (err) => {
            this.cleanup();
            this._readyState = "closed";
            this.emitReserved("error", err);
            if (fn) {
                fn(err);
            }
            else {
                // Only do this if there is no fn to handle the error
                this.maybeReconnectOnOpen();
            }
        };
        // emit `error`
        const errorSub = (0,_on_js__WEBPACK_IMPORTED_MODULE_3__.on)(socket, "error", onError);
        if (false !== this._timeout) {
            const timeout = this._timeout;
            // set timer
            const timer = this.setTimeoutFn(() => {
                openSubDestroy();
                onError(new Error("timeout"));
                socket.close();
            }, timeout);
            if (this.opts.autoUnref) {
                timer.unref();
            }
            this.subs.push(() => {
                this.clearTimeoutFn(timer);
            });
        }
        this.subs.push(openSubDestroy);
        this.subs.push(errorSub);
        return this;
    }
    /**
     * Alias for open()
     *
     * @return self
     * @public
     */
    connect(fn) {
        return this.open(fn);
    }
    /**
     * Called upon transport open.
     *
     * @private
     */
    onopen() {
        // clear old subs
        this.cleanup();
        // mark as open
        this._readyState = "open";
        this.emitReserved("open");
        // add new subs
        const socket = this.engine;
        this.subs.push((0,_on_js__WEBPACK_IMPORTED_MODULE_3__.on)(socket, "ping", this.onping.bind(this)), (0,_on_js__WEBPACK_IMPORTED_MODULE_3__.on)(socket, "data", this.ondata.bind(this)), (0,_on_js__WEBPACK_IMPORTED_MODULE_3__.on)(socket, "error", this.onerror.bind(this)), (0,_on_js__WEBPACK_IMPORTED_MODULE_3__.on)(socket, "close", this.onclose.bind(this)), 
        // @ts-ignore
        (0,_on_js__WEBPACK_IMPORTED_MODULE_3__.on)(this.decoder, "decoded", this.ondecoded.bind(this)));
    }
    /**
     * Called upon a ping.
     *
     * @private
     */
    onping() {
        this.emitReserved("ping");
    }
    /**
     * Called with data.
     *
     * @private
     */
    ondata(data) {
        try {
            this.decoder.add(data);
        }
        catch (e) {
            this.onclose("parse error", e);
        }
    }
    /**
     * Called when parser fully decodes a packet.
     *
     * @private
     */
    ondecoded(packet) {
        // the nextTick call prevents an exception in a user-provided event listener from triggering a disconnection due to a "parse error"
        (0,engine_io_client__WEBPACK_IMPORTED_MODULE_0__.nextTick)(() => {
            this.emitReserved("packet", packet);
        }, this.setTimeoutFn);
    }
    /**
     * Called upon socket error.
     *
     * @private
     */
    onerror(err) {
        this.emitReserved("error", err);
    }
    /**
     * Creates a new socket for the given `nsp`.
     *
     * @return {Socket}
     * @public
     */
    socket(nsp, opts) {
        let socket = this.nsps[nsp];
        if (!socket) {
            socket = new _socket_js__WEBPACK_IMPORTED_MODULE_1__.Socket(this, nsp, opts);
            this.nsps[nsp] = socket;
        }
        else if (this._autoConnect && !socket.active) {
            socket.connect();
        }
        return socket;
    }
    /**
     * Called upon a socket close.
     *
     * @param socket
     * @private
     */
    _destroy(socket) {
        const nsps = Object.keys(this.nsps);
        for (const nsp of nsps) {
            const socket = this.nsps[nsp];
            if (socket.active) {
                return;
            }
        }
        this._close();
    }
    /**
     * Writes a packet.
     *
     * @param packet
     * @private
     */
    _packet(packet) {
        const encodedPackets = this.encoder.encode(packet);
        for (let i = 0; i < encodedPackets.length; i++) {
            this.engine.write(encodedPackets[i], packet.options);
        }
    }
    /**
     * Clean up transport subscriptions and packet buffer.
     *
     * @private
     */
    cleanup() {
        this.subs.forEach((subDestroy) => subDestroy());
        this.subs.length = 0;
        this.decoder.destroy();
    }
    /**
     * Close the current socket.
     *
     * @private
     */
    _close() {
        this.skipReconnect = true;
        this._reconnecting = false;
        this.onclose("forced close");
    }
    /**
     * Alias for close()
     *
     * @private
     */
    disconnect() {
        return this._close();
    }
    /**
     * Called when:
     *
     * - the low-level engine is closed
     * - the parser encountered a badly formatted packet
     * - all sockets are disconnected
     *
     * @private
     */
    onclose(reason, description) {
        var _a;
        this.cleanup();
        (_a = this.engine) === null || _a === void 0 ? void 0 : _a.close();
        this.backoff.reset();
        this._readyState = "closed";
        this.emitReserved("close", reason, description);
        if (this._reconnection && !this.skipReconnect) {
            this.reconnect();
        }
    }
    /**
     * Attempt a reconnection.
     *
     * @private
     */
    reconnect() {
        if (this._reconnecting || this.skipReconnect)
            return this;
        const self = this;
        if (this.backoff.attempts >= this._reconnectionAttempts) {
            this.backoff.reset();
            this.emitReserved("reconnect_failed");
            this._reconnecting = false;
        }
        else {
            const delay = this.backoff.duration();
            this._reconnecting = true;
            const timer = this.setTimeoutFn(() => {
                if (self.skipReconnect)
                    return;
                this.emitReserved("reconnect_attempt", self.backoff.attempts);
                // check again for the case socket closed in above events
                if (self.skipReconnect)
                    return;
                self.open((err) => {
                    if (err) {
                        self._reconnecting = false;
                        self.reconnect();
                        this.emitReserved("reconnect_error", err);
                    }
                    else {
                        self.onreconnect();
                    }
                });
            }, delay);
            if (this.opts.autoUnref) {
                timer.unref();
            }
            this.subs.push(() => {
                this.clearTimeoutFn(timer);
            });
        }
    }
    /**
     * Called upon successful reconnect.
     *
     * @private
     */
    onreconnect() {
        const attempt = this.backoff.attempts;
        this._reconnecting = false;
        this.backoff.reset();
        this.emitReserved("reconnect", attempt);
    }
}


/***/ },

/***/ "./node_modules/socket.io-client/build/esm/on.js"
/*!*******************************************************!*\
  !*** ./node_modules/socket.io-client/build/esm/on.js ***!
  \*******************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   on: () => (/* binding */ on)
/* harmony export */ });
function on(obj, ev, fn) {
    obj.on(ev, fn);
    return function subDestroy() {
        obj.off(ev, fn);
    };
}


/***/ },

/***/ "./node_modules/socket.io-client/build/esm/socket.js"
/*!***********************************************************!*\
  !*** ./node_modules/socket.io-client/build/esm/socket.js ***!
  \***********************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Socket: () => (/* binding */ Socket)
/* harmony export */ });
/* harmony import */ var socket_io_parser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! socket.io-parser */ "./node_modules/socket.io-parser/build/esm-debug/index.js");
/* harmony import */ var _on_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./on.js */ "./node_modules/socket.io-client/build/esm/on.js");
/* harmony import */ var _socket_io_component_emitter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @socket.io/component-emitter */ "./node_modules/@socket.io/component-emitter/lib/esm/index.js");



/**
 * Internal events.
 * These events can't be emitted by the user.
 */
const RESERVED_EVENTS = Object.freeze({
    connect: 1,
    connect_error: 1,
    disconnect: 1,
    disconnecting: 1,
    // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
    newListener: 1,
    removeListener: 1,
});
/**
 * A Socket is the fundamental class for interacting with the server.
 *
 * A Socket belongs to a certain Namespace (by default /) and uses an underlying {@link Manager} to communicate.
 *
 * @example
 * const socket = io();
 *
 * socket.on("connect", () => {
 *   console.log("connected");
 * });
 *
 * // send an event to the server
 * socket.emit("foo", "bar");
 *
 * socket.on("foobar", () => {
 *   // an event was received from the server
 * });
 *
 * // upon disconnection
 * socket.on("disconnect", (reason) => {
 *   console.log(`disconnected due to ${reason}`);
 * });
 */
class Socket extends _socket_io_component_emitter__WEBPACK_IMPORTED_MODULE_2__.Emitter {
    /**
     * `Socket` constructor.
     */
    constructor(io, nsp, opts) {
        super();
        /**
         * Whether the socket is currently connected to the server.
         *
         * @example
         * const socket = io();
         *
         * socket.on("connect", () => {
         *   console.log(socket.connected); // true
         * });
         *
         * socket.on("disconnect", () => {
         *   console.log(socket.connected); // false
         * });
         */
        this.connected = false;
        /**
         * Whether the connection state was recovered after a temporary disconnection. In that case, any missed packets will
         * be transmitted by the server.
         */
        this.recovered = false;
        /**
         * Buffer for packets received before the CONNECT packet
         */
        this.receiveBuffer = [];
        /**
         * Buffer for packets that will be sent once the socket is connected
         */
        this.sendBuffer = [];
        /**
         * The queue of packets to be sent with retry in case of failure.
         *
         * Packets are sent one by one, each waiting for the server acknowledgement, in order to guarantee the delivery order.
         * @private
         */
        this._queue = [];
        /**
         * A sequence to generate the ID of the {@link QueuedPacket}.
         * @private
         */
        this._queueSeq = 0;
        this.ids = 0;
        /**
         * A map containing acknowledgement handlers.
         *
         * The `withError` attribute is used to differentiate handlers that accept an error as first argument:
         *
         * - `socket.emit("test", (err, value) => { ... })` with `ackTimeout` option
         * - `socket.timeout(5000).emit("test", (err, value) => { ... })`
         * - `const value = await socket.emitWithAck("test")`
         *
         * From those that don't:
         *
         * - `socket.emit("test", (value) => { ... });`
         *
         * In the first case, the handlers will be called with an error when:
         *
         * - the timeout is reached
         * - the socket gets disconnected
         *
         * In the second case, the handlers will be simply discarded upon disconnection, since the client will never receive
         * an acknowledgement from the server.
         *
         * @private
         */
        this.acks = {};
        this.flags = {};
        this.io = io;
        this.nsp = nsp;
        if (opts && opts.auth) {
            this.auth = opts.auth;
        }
        this._opts = Object.assign({}, opts);
        if (this.io._autoConnect)
            this.open();
    }
    /**
     * Whether the socket is currently disconnected
     *
     * @example
     * const socket = io();
     *
     * socket.on("connect", () => {
     *   console.log(socket.disconnected); // false
     * });
     *
     * socket.on("disconnect", () => {
     *   console.log(socket.disconnected); // true
     * });
     */
    get disconnected() {
        return !this.connected;
    }
    /**
     * Subscribe to open, close and packet events
     *
     * @private
     */
    subEvents() {
        if (this.subs)
            return;
        const io = this.io;
        this.subs = [
            (0,_on_js__WEBPACK_IMPORTED_MODULE_1__.on)(io, "open", this.onopen.bind(this)),
            (0,_on_js__WEBPACK_IMPORTED_MODULE_1__.on)(io, "packet", this.onpacket.bind(this)),
            (0,_on_js__WEBPACK_IMPORTED_MODULE_1__.on)(io, "error", this.onerror.bind(this)),
            (0,_on_js__WEBPACK_IMPORTED_MODULE_1__.on)(io, "close", this.onclose.bind(this)),
        ];
    }
    /**
     * Whether the Socket will try to reconnect when its Manager connects or reconnects.
     *
     * @example
     * const socket = io();
     *
     * console.log(socket.active); // true
     *
     * socket.on("disconnect", (reason) => {
     *   if (reason === "io server disconnect") {
     *     // the disconnection was initiated by the server, you need to manually reconnect
     *     console.log(socket.active); // false
     *   }
     *   // else the socket will automatically try to reconnect
     *   console.log(socket.active); // true
     * });
     */
    get active() {
        return !!this.subs;
    }
    /**
     * "Opens" the socket.
     *
     * @example
     * const socket = io({
     *   autoConnect: false
     * });
     *
     * socket.connect();
     */
    connect() {
        if (this.connected)
            return this;
        this.subEvents();
        if (!this.io["_reconnecting"])
            this.io.open(); // ensure open
        if ("open" === this.io._readyState)
            this.onopen();
        return this;
    }
    /**
     * Alias for {@link connect()}.
     */
    open() {
        return this.connect();
    }
    /**
     * Sends a `message` event.
     *
     * This method mimics the WebSocket.send() method.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
     *
     * @example
     * socket.send("hello");
     *
     * // this is equivalent to
     * socket.emit("message", "hello");
     *
     * @return self
     */
    send(...args) {
        args.unshift("message");
        this.emit.apply(this, args);
        return this;
    }
    /**
     * Override `emit`.
     * If the event is in `events`, it's emitted normally.
     *
     * @example
     * socket.emit("hello", "world");
     *
     * // all serializable datastructures are supported (no need to call JSON.stringify)
     * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
     *
     * // with an acknowledgement from the server
     * socket.emit("hello", "world", (val) => {
     *   // ...
     * });
     *
     * @return self
     */
    emit(ev, ...args) {
        var _a, _b, _c;
        if (RESERVED_EVENTS.hasOwnProperty(ev)) {
            throw new Error('"' + ev.toString() + '" is a reserved event name');
        }
        args.unshift(ev);
        if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
            this._addToQueue(args);
            return this;
        }
        const packet = {
            type: socket_io_parser__WEBPACK_IMPORTED_MODULE_0__.PacketType.EVENT,
            data: args,
        };
        packet.options = {};
        packet.options.compress = this.flags.compress !== false;
        // event ack callback
        if ("function" === typeof args[args.length - 1]) {
            const id = this.ids++;
            const ack = args.pop();
            this._registerAckCallback(id, ack);
            packet.id = id;
        }
        const isTransportWritable = (_b = (_a = this.io.engine) === null || _a === void 0 ? void 0 : _a.transport) === null || _b === void 0 ? void 0 : _b.writable;
        const isConnected = this.connected && !((_c = this.io.engine) === null || _c === void 0 ? void 0 : _c._hasPingExpired());
        const discardPacket = this.flags.volatile && !isTransportWritable;
        if (discardPacket) {
        }
        else if (isConnected) {
            this.notifyOutgoingListeners(packet);
            this.packet(packet);
        }
        else {
            this.sendBuffer.push(packet);
        }
        this.flags = {};
        return this;
    }
    /**
     * @private
     */
    _registerAckCallback(id, ack) {
        var _a;
        const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
        if (timeout === undefined) {
            this.acks[id] = ack;
            return;
        }
        // @ts-ignore
        const timer = this.io.setTimeoutFn(() => {
            delete this.acks[id];
            for (let i = 0; i < this.sendBuffer.length; i++) {
                if (this.sendBuffer[i].id === id) {
                    this.sendBuffer.splice(i, 1);
                }
            }
            ack.call(this, new Error("operation has timed out"));
        }, timeout);
        const fn = (...args) => {
            // @ts-ignore
            this.io.clearTimeoutFn(timer);
            ack.apply(this, args);
        };
        fn.withError = true;
        this.acks[id] = fn;
    }
    /**
     * Emits an event and waits for an acknowledgement
     *
     * @example
     * // without timeout
     * const response = await socket.emitWithAck("hello", "world");
     *
     * // with a specific timeout
     * try {
     *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
     * } catch (err) {
     *   // the server did not acknowledge the event in the given delay
     * }
     *
     * @return a Promise that will be fulfilled when the server acknowledges the event
     */
    emitWithAck(ev, ...args) {
        return new Promise((resolve, reject) => {
            const fn = (arg1, arg2) => {
                return arg1 ? reject(arg1) : resolve(arg2);
            };
            fn.withError = true;
            args.push(fn);
            this.emit(ev, ...args);
        });
    }
    /**
     * Add the packet to the queue.
     * @param args
     * @private
     */
    _addToQueue(args) {
        let ack;
        if (typeof args[args.length - 1] === "function") {
            ack = args.pop();
        }
        const packet = {
            id: this._queueSeq++,
            tryCount: 0,
            pending: false,
            args,
            flags: Object.assign({ fromQueue: true }, this.flags),
        };
        args.push((err, ...responseArgs) => {
            if (packet !== this._queue[0]) {
            }
            const hasError = err !== null;
            if (hasError) {
                if (packet.tryCount > this._opts.retries) {
                    this._queue.shift();
                    if (ack) {
                        ack(err);
                    }
                }
            }
            else {
                this._queue.shift();
                if (ack) {
                    ack(null, ...responseArgs);
                }
            }
            packet.pending = false;
            return this._drainQueue();
        });
        this._queue.push(packet);
        this._drainQueue();
    }
    /**
     * Send the first packet of the queue, and wait for an acknowledgement from the server.
     * @param force - whether to resend a packet that has not been acknowledged yet
     *
     * @private
     */
    _drainQueue(force = false) {
        if (!this.connected || this._queue.length === 0) {
            return;
        }
        const packet = this._queue[0];
        if (packet.pending && !force) {
            return;
        }
        packet.pending = true;
        packet.tryCount++;
        this.flags = packet.flags;
        this.emit.apply(this, packet.args);
    }
    /**
     * Sends a packet.
     *
     * @param packet
     * @private
     */
    packet(packet) {
        packet.nsp = this.nsp;
        this.io._packet(packet);
    }
    /**
     * Called upon engine `open`.
     *
     * @private
     */
    onopen() {
        if (typeof this.auth == "function") {
            this.auth((data) => {
                this._sendConnectPacket(data);
            });
        }
        else {
            this._sendConnectPacket(this.auth);
        }
    }
    /**
     * Sends a CONNECT packet to initiate the Socket.IO session.
     *
     * @param data
     * @private
     */
    _sendConnectPacket(data) {
        this.packet({
            type: socket_io_parser__WEBPACK_IMPORTED_MODULE_0__.PacketType.CONNECT,
            data: this._pid
                ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data)
                : data,
        });
    }
    /**
     * Called upon engine or manager `error`.
     *
     * @param err
     * @private
     */
    onerror(err) {
        if (!this.connected) {
            this.emitReserved("connect_error", err);
        }
    }
    /**
     * Called upon engine `close`.
     *
     * @param reason
     * @param description
     * @private
     */
    onclose(reason, description) {
        this.connected = false;
        delete this.id;
        this.emitReserved("disconnect", reason, description);
        this._clearAcks();
    }
    /**
     * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
     * the server.
     *
     * @private
     */
    _clearAcks() {
        Object.keys(this.acks).forEach((id) => {
            const isBuffered = this.sendBuffer.some((packet) => String(packet.id) === id);
            if (!isBuffered) {
                // note: handlers that do not accept an error as first argument are ignored here
                const ack = this.acks[id];
                delete this.acks[id];
                if (ack.withError) {
                    ack.call(this, new Error("socket has been disconnected"));
                }
            }
        });
    }
    /**
     * Called with socket packet.
     *
     * @param packet
     * @private
     */
    onpacket(packet) {
        const sameNamespace = packet.nsp === this.nsp;
        if (!sameNamespace)
            return;
        switch (packet.type) {
            case socket_io_parser__WEBPACK_IMPORTED_MODULE_0__.PacketType.CONNECT:
                if (packet.data && packet.data.sid) {
                    this.onconnect(packet.data.sid, packet.data.pid);
                }
                else {
                    this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                }
                break;
            case socket_io_parser__WEBPACK_IMPORTED_MODULE_0__.PacketType.EVENT:
            case socket_io_parser__WEBPACK_IMPORTED_MODULE_0__.PacketType.BINARY_EVENT:
                this.onevent(packet);
                break;
            case socket_io_parser__WEBPACK_IMPORTED_MODULE_0__.PacketType.ACK:
            case socket_io_parser__WEBPACK_IMPORTED_MODULE_0__.PacketType.BINARY_ACK:
                this.onack(packet);
                break;
            case socket_io_parser__WEBPACK_IMPORTED_MODULE_0__.PacketType.DISCONNECT:
                this.ondisconnect();
                break;
            case socket_io_parser__WEBPACK_IMPORTED_MODULE_0__.PacketType.CONNECT_ERROR:
                this.destroy();
                const err = new Error(packet.data.message);
                // @ts-ignore
                err.data = packet.data.data;
                this.emitReserved("connect_error", err);
                break;
        }
    }
    /**
     * Called upon a server event.
     *
     * @param packet
     * @private
     */
    onevent(packet) {
        const args = packet.data || [];
        if (null != packet.id) {
            args.push(this.ack(packet.id));
        }
        if (this.connected) {
            this.emitEvent(args);
        }
        else {
            this.receiveBuffer.push(Object.freeze(args));
        }
    }
    emitEvent(args) {
        if (this._anyListeners && this._anyListeners.length) {
            const listeners = this._anyListeners.slice();
            for (const listener of listeners) {
                listener.apply(this, args);
            }
        }
        super.emit.apply(this, args);
        if (this._pid && args.length && typeof args[args.length - 1] === "string") {
            this._lastOffset = args[args.length - 1];
        }
    }
    /**
     * Produces an ack callback to emit with an event.
     *
     * @private
     */
    ack(id) {
        const self = this;
        let sent = false;
        return function (...args) {
            // prevent double callbacks
            if (sent)
                return;
            sent = true;
            self.packet({
                type: socket_io_parser__WEBPACK_IMPORTED_MODULE_0__.PacketType.ACK,
                id: id,
                data: args,
            });
        };
    }
    /**
     * Called upon a server acknowledgement.
     *
     * @param packet
     * @private
     */
    onack(packet) {
        const ack = this.acks[packet.id];
        if (typeof ack !== "function") {
            return;
        }
        delete this.acks[packet.id];
        // @ts-ignore FIXME ack is incorrectly inferred as 'never'
        if (ack.withError) {
            packet.data.unshift(null);
        }
        // @ts-ignore
        ack.apply(this, packet.data);
    }
    /**
     * Called upon server connect.
     *
     * @private
     */
    onconnect(id, pid) {
        this.id = id;
        this.recovered = pid && this._pid === pid;
        this._pid = pid; // defined only if connection state recovery is enabled
        this.connected = true;
        this.emitBuffered();
        this._drainQueue(true);
        this.emitReserved("connect");
    }
    /**
     * Emit buffered events (received and emitted).
     *
     * @private
     */
    emitBuffered() {
        this.receiveBuffer.forEach((args) => this.emitEvent(args));
        this.receiveBuffer = [];
        this.sendBuffer.forEach((packet) => {
            this.notifyOutgoingListeners(packet);
            this.packet(packet);
        });
        this.sendBuffer = [];
    }
    /**
     * Called upon server disconnect.
     *
     * @private
     */
    ondisconnect() {
        this.destroy();
        this.onclose("io server disconnect");
    }
    /**
     * Called upon forced client/server side disconnections,
     * this method ensures the manager stops tracking us and
     * that reconnections don't get triggered for this.
     *
     * @private
     */
    destroy() {
        if (this.subs) {
            // clean subscriptions to avoid reconnections
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs = undefined;
        }
        this.io["_destroy"](this);
    }
    /**
     * Disconnects the socket manually. In that case, the socket will not try to reconnect.
     *
     * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
     *
     * @example
     * const socket = io();
     *
     * socket.on("disconnect", (reason) => {
     *   // console.log(reason); prints "io client disconnect"
     * });
     *
     * socket.disconnect();
     *
     * @return self
     */
    disconnect() {
        if (this.connected) {
            this.packet({ type: socket_io_parser__WEBPACK_IMPORTED_MODULE_0__.PacketType.DISCONNECT });
        }
        // remove socket from pool
        this.destroy();
        if (this.connected) {
            // fire events
            this.onclose("io client disconnect");
        }
        return this;
    }
    /**
     * Alias for {@link disconnect()}.
     *
     * @return self
     */
    close() {
        return this.disconnect();
    }
    /**
     * Sets the compress flag.
     *
     * @example
     * socket.compress(false).emit("hello");
     *
     * @param compress - if `true`, compresses the sending data
     * @return self
     */
    compress(compress) {
        this.flags.compress = compress;
        return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
     * ready to send messages.
     *
     * @example
     * socket.volatile.emit("hello"); // the server may or may not receive it
     *
     * @returns self
     */
    get volatile() {
        this.flags.volatile = true;
        return this;
    }
    /**
     * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
     * given number of milliseconds have elapsed without an acknowledgement from the server:
     *
     * @example
     * socket.timeout(5000).emit("my-event", (err) => {
     *   if (err) {
     *     // the server did not acknowledge the event in the given delay
     *   }
     * });
     *
     * @returns self
     */
    timeout(timeout) {
        this.flags.timeout = timeout;
        return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * @example
     * socket.onAny((event, ...args) => {
     *   console.log(`got ${event}`);
     * });
     *
     * @param listener
     */
    onAny(listener) {
        this._anyListeners = this._anyListeners || [];
        this._anyListeners.push(listener);
        return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * @example
     * socket.prependAny((event, ...args) => {
     *   console.log(`got event ${event}`);
     * });
     *
     * @param listener
     */
    prependAny(listener) {
        this._anyListeners = this._anyListeners || [];
        this._anyListeners.unshift(listener);
        return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`got event ${event}`);
     * }
     *
     * socket.onAny(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAny(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAny();
     *
     * @param listener
     */
    offAny(listener) {
        if (!this._anyListeners) {
            return this;
        }
        if (listener) {
            const listeners = this._anyListeners;
            for (let i = 0; i < listeners.length; i++) {
                if (listener === listeners[i]) {
                    listeners.splice(i, 1);
                    return this;
                }
            }
        }
        else {
            this._anyListeners = [];
        }
        return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAny() {
        return this._anyListeners || [];
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.onAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    onAnyOutgoing(listener) {
        this._anyOutgoingListeners = this._anyOutgoingListeners || [];
        this._anyOutgoingListeners.push(listener);
        return this;
    }
    /**
     * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
     * callback. The listener is added to the beginning of the listeners array.
     *
     * Note: acknowledgements sent to the server are not included.
     *
     * @example
     * socket.prependAnyOutgoing((event, ...args) => {
     *   console.log(`sent event ${event}`);
     * });
     *
     * @param listener
     */
    prependAnyOutgoing(listener) {
        this._anyOutgoingListeners = this._anyOutgoingListeners || [];
        this._anyOutgoingListeners.unshift(listener);
        return this;
    }
    /**
     * Removes the listener that will be fired when any event is emitted.
     *
     * @example
     * const catchAllListener = (event, ...args) => {
     *   console.log(`sent event ${event}`);
     * }
     *
     * socket.onAnyOutgoing(catchAllListener);
     *
     * // remove a specific listener
     * socket.offAnyOutgoing(catchAllListener);
     *
     * // or remove all listeners
     * socket.offAnyOutgoing();
     *
     * @param [listener] - the catch-all listener (optional)
     */
    offAnyOutgoing(listener) {
        if (!this._anyOutgoingListeners) {
            return this;
        }
        if (listener) {
            const listeners = this._anyOutgoingListeners;
            for (let i = 0; i < listeners.length; i++) {
                if (listener === listeners[i]) {
                    listeners.splice(i, 1);
                    return this;
                }
            }
        }
        else {
            this._anyOutgoingListeners = [];
        }
        return this;
    }
    /**
     * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
     * e.g. to remove listeners.
     */
    listenersAnyOutgoing() {
        return this._anyOutgoingListeners || [];
    }
    /**
     * Notify the listeners for each packet sent
     *
     * @param packet
     *
     * @private
     */
    notifyOutgoingListeners(packet) {
        if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
            const listeners = this._anyOutgoingListeners.slice();
            for (const listener of listeners) {
                listener.apply(this, packet.data);
            }
        }
    }
}


/***/ },

/***/ "./node_modules/socket.io-client/build/esm/url.js"
/*!********************************************************!*\
  !*** ./node_modules/socket.io-client/build/esm/url.js ***!
  \********************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   url: () => (/* binding */ url)
/* harmony export */ });
/* harmony import */ var engine_io_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! engine.io-client */ "./node_modules/engine.io-client/build/esm/index.js");

/**
 * URL parser.
 *
 * @param uri - url
 * @param path - the request path of the connection
 * @param loc - An object meant to mimic window.location.
 *        Defaults to window.location.
 * @public
 */
function url(uri, path = "", loc) {
    let obj = uri;
    // default to window.location
    loc = loc || (typeof location !== "undefined" && location);
    if (null == uri)
        uri = loc.protocol + "//" + loc.host;
    // relative path support
    if (typeof uri === "string") {
        if ("/" === uri.charAt(0)) {
            if ("/" === uri.charAt(1)) {
                uri = loc.protocol + uri;
            }
            else {
                uri = loc.host + uri;
            }
        }
        if (!/^(https?|wss?):\/\//.test(uri)) {
            if ("undefined" !== typeof loc) {
                uri = loc.protocol + "//" + uri;
            }
            else {
                uri = "https://" + uri;
            }
        }
        // parse
        obj = (0,engine_io_client__WEBPACK_IMPORTED_MODULE_0__.parse)(uri);
    }
    // make sure we treat `localhost:80` and `localhost` equally
    if (!obj.port) {
        if (/^(http|ws)$/.test(obj.protocol)) {
            obj.port = "80";
        }
        else if (/^(http|ws)s$/.test(obj.protocol)) {
            obj.port = "443";
        }
    }
    obj.path = obj.path || "/";
    const ipv6 = obj.host.indexOf(":") !== -1;
    const host = ipv6 ? "[" + obj.host + "]" : obj.host;
    // define unique id
    obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
    // define href
    obj.href =
        obj.protocol +
            "://" +
            host +
            (loc && loc.port === obj.port ? "" : ":" + obj.port);
    return obj;
}


/***/ },

/***/ "./node_modules/socket.io-parser/build/esm-debug/binary.js"
/*!*****************************************************************!*\
  !*** ./node_modules/socket.io-parser/build/esm-debug/binary.js ***!
  \*****************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   deconstructPacket: () => (/* binding */ deconstructPacket),
/* harmony export */   reconstructPacket: () => (/* binding */ reconstructPacket)
/* harmony export */ });
/* harmony import */ var _is_binary_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./is-binary.js */ "./node_modules/socket.io-parser/build/esm-debug/is-binary.js");

/**
 * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
 *
 * @param {Object} packet - socket.io event packet
 * @return {Object} with deconstructed packet and list of buffers
 * @public
 */
function deconstructPacket(packet) {
    const buffers = [];
    const packetData = packet.data;
    const pack = packet;
    pack.data = _deconstructPacket(packetData, buffers);
    pack.attachments = buffers.length; // number of binary 'attachments'
    return { packet: pack, buffers: buffers };
}
function _deconstructPacket(data, buffers) {
    if (!data)
        return data;
    if ((0,_is_binary_js__WEBPACK_IMPORTED_MODULE_0__.isBinary)(data)) {
        const placeholder = { _placeholder: true, num: buffers.length };
        buffers.push(data);
        return placeholder;
    }
    else if (Array.isArray(data)) {
        const newData = new Array(data.length);
        for (let i = 0; i < data.length; i++) {
            newData[i] = _deconstructPacket(data[i], buffers);
        }
        return newData;
    }
    else if (typeof data === "object" && !(data instanceof Date)) {
        const newData = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newData[key] = _deconstructPacket(data[key], buffers);
            }
        }
        return newData;
    }
    return data;
}
/**
 * Reconstructs a binary packet from its placeholder packet and buffers
 *
 * @param {Object} packet - event packet with placeholders
 * @param {Array} buffers - binary buffers to put in placeholder positions
 * @return {Object} reconstructed packet
 * @public
 */
function reconstructPacket(packet, buffers) {
    packet.data = _reconstructPacket(packet.data, buffers);
    delete packet.attachments; // no longer useful
    return packet;
}
function _reconstructPacket(data, buffers) {
    if (!data)
        return data;
    if (data && data._placeholder === true) {
        const isIndexValid = typeof data.num === "number" &&
            data.num >= 0 &&
            data.num < buffers.length;
        if (isIndexValid) {
            return buffers[data.num]; // appropriate buffer (should be natural order anyway)
        }
        else {
            throw new Error("illegal attachments");
        }
    }
    else if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            data[i] = _reconstructPacket(data[i], buffers);
        }
    }
    else if (typeof data === "object") {
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                data[key] = _reconstructPacket(data[key], buffers);
            }
        }
    }
    return data;
}


/***/ },

/***/ "./node_modules/socket.io-parser/build/esm-debug/index.js"
/*!****************************************************************!*\
  !*** ./node_modules/socket.io-parser/build/esm-debug/index.js ***!
  \****************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Decoder: () => (/* binding */ Decoder),
/* harmony export */   Encoder: () => (/* binding */ Encoder),
/* harmony export */   PacketType: () => (/* binding */ PacketType),
/* harmony export */   isPacketValid: () => (/* binding */ isPacketValid),
/* harmony export */   protocol: () => (/* binding */ protocol)
/* harmony export */ });
/* harmony import */ var _socket_io_component_emitter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @socket.io/component-emitter */ "./node_modules/@socket.io/component-emitter/lib/esm/index.js");
/* harmony import */ var _binary_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./binary.js */ "./node_modules/socket.io-parser/build/esm-debug/binary.js");
/* harmony import */ var _is_binary_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./is-binary.js */ "./node_modules/socket.io-parser/build/esm-debug/is-binary.js");
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! debug */ "./node_modules/socket.io-parser/node_modules/debug/src/browser.js");



 // debug()
const debug = debug__WEBPACK_IMPORTED_MODULE_3__("socket.io-parser"); // debug()
/**
 * These strings must not be used as event names, as they have a special meaning.
 */
const RESERVED_EVENTS = [
    "connect", // used on the client side
    "connect_error", // used on the client side
    "disconnect", // used on both sides
    "disconnecting", // used on the server side
    "newListener", // used by the Node.js EventEmitter
    "removeListener", // used by the Node.js EventEmitter
];
/**
 * Protocol version.
 *
 * @public
 */
const protocol = 5;
var PacketType;
(function (PacketType) {
    PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
    PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
    PacketType[PacketType["EVENT"] = 2] = "EVENT";
    PacketType[PacketType["ACK"] = 3] = "ACK";
    PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
    PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
    PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
})(PacketType || (PacketType = {}));
/**
 * A socket.io Encoder instance
 */
class Encoder {
    /**
     * Encoder constructor
     *
     * @param {function} replacer - custom replacer to pass down to JSON.parse
     */
    constructor(replacer) {
        this.replacer = replacer;
    }
    /**
     * Encode a packet as a single string if non-binary, or as a
     * buffer sequence, depending on packet type.
     *
     * @param {Object} obj - packet object
     */
    encode(obj) {
        debug("encoding packet %j", obj);
        if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
            if ((0,_is_binary_js__WEBPACK_IMPORTED_MODULE_2__.hasBinary)(obj)) {
                return this.encodeAsBinary({
                    type: obj.type === PacketType.EVENT
                        ? PacketType.BINARY_EVENT
                        : PacketType.BINARY_ACK,
                    nsp: obj.nsp,
                    data: obj.data,
                    id: obj.id,
                });
            }
        }
        return [this.encodeAsString(obj)];
    }
    /**
     * Encode packet as string.
     */
    encodeAsString(obj) {
        // first is type
        let str = "" + obj.type;
        // attachments if we have them
        if (obj.type === PacketType.BINARY_EVENT ||
            obj.type === PacketType.BINARY_ACK) {
            str += obj.attachments + "-";
        }
        // if we have a namespace other than `/`
        // we append it followed by a comma `,`
        if (obj.nsp && "/" !== obj.nsp) {
            str += obj.nsp + ",";
        }
        // immediately followed by the id
        if (null != obj.id) {
            str += obj.id;
        }
        // json data
        if (null != obj.data) {
            str += JSON.stringify(obj.data, this.replacer);
        }
        debug("encoded %j as %s", obj, str);
        return str;
    }
    /**
     * Encode packet as 'buffer sequence' by removing blobs, and
     * deconstructing packet into object with placeholders and
     * a list of buffers.
     */
    encodeAsBinary(obj) {
        const deconstruction = (0,_binary_js__WEBPACK_IMPORTED_MODULE_1__.deconstructPacket)(obj);
        const pack = this.encodeAsString(deconstruction.packet);
        const buffers = deconstruction.buffers;
        buffers.unshift(pack); // add packet info to beginning of data list
        return buffers; // write all the buffers
    }
}
/**
 * A socket.io Decoder instance
 *
 * @return {Object} decoder
 */
class Decoder extends _socket_io_component_emitter__WEBPACK_IMPORTED_MODULE_0__.Emitter {
    /**
     * Decoder constructor
     *
     * @param {function} reviver - custom reviver to pass down to JSON.stringify
     */
    constructor(reviver) {
        super();
        this.reviver = reviver;
    }
    /**
     * Decodes an encoded packet string into packet JSON.
     *
     * @param {String} obj - encoded packet
     */
    add(obj) {
        let packet;
        if (typeof obj === "string") {
            if (this.reconstructor) {
                throw new Error("got plaintext data when reconstructing a packet");
            }
            packet = this.decodeString(obj);
            const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
            if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
                packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
                // binary packet's json
                this.reconstructor = new BinaryReconstructor(packet);
                // no attachments, labeled binary but no binary data to follow
                if (packet.attachments === 0) {
                    super.emitReserved("decoded", packet);
                }
            }
            else {
                // non-binary full packet
                super.emitReserved("decoded", packet);
            }
        }
        else if ((0,_is_binary_js__WEBPACK_IMPORTED_MODULE_2__.isBinary)(obj) || obj.base64) {
            // raw binary data
            if (!this.reconstructor) {
                throw new Error("got binary data when not reconstructing a packet");
            }
            else {
                packet = this.reconstructor.takeBinaryData(obj);
                if (packet) {
                    // received final buffer
                    this.reconstructor = null;
                    super.emitReserved("decoded", packet);
                }
            }
        }
        else {
            throw new Error("Unknown type: " + obj);
        }
    }
    /**
     * Decode a packet String (JSON data)
     *
     * @param {String} str
     * @return {Object} packet
     */
    decodeString(str) {
        let i = 0;
        // look up type
        const p = {
            type: Number(str.charAt(0)),
        };
        if (PacketType[p.type] === undefined) {
            throw new Error("unknown packet type " + p.type);
        }
        // look up attachments if type binary
        if (p.type === PacketType.BINARY_EVENT ||
            p.type === PacketType.BINARY_ACK) {
            const start = i + 1;
            while (str.charAt(++i) !== "-" && i != str.length) { }
            const buf = str.substring(start, i);
            if (buf != Number(buf) || str.charAt(i) !== "-") {
                throw new Error("Illegal attachments");
            }
            p.attachments = Number(buf);
        }
        // look up namespace (if any)
        if ("/" === str.charAt(i + 1)) {
            const start = i + 1;
            while (++i) {
                const c = str.charAt(i);
                if ("," === c)
                    break;
                if (i === str.length)
                    break;
            }
            p.nsp = str.substring(start, i);
        }
        else {
            p.nsp = "/";
        }
        // look up id
        const next = str.charAt(i + 1);
        if ("" !== next && Number(next) == next) {
            const start = i + 1;
            while (++i) {
                const c = str.charAt(i);
                if (null == c || Number(c) != c) {
                    --i;
                    break;
                }
                if (i === str.length)
                    break;
            }
            p.id = Number(str.substring(start, i + 1));
        }
        // look up json data
        if (str.charAt(++i)) {
            const payload = this.tryParse(str.substr(i));
            if (Decoder.isPayloadValid(p.type, payload)) {
                p.data = payload;
            }
            else {
                throw new Error("invalid payload");
            }
        }
        debug("decoded %s as %j", str, p);
        return p;
    }
    tryParse(str) {
        try {
            return JSON.parse(str, this.reviver);
        }
        catch (e) {
            return false;
        }
    }
    static isPayloadValid(type, payload) {
        switch (type) {
            case PacketType.CONNECT:
                return isObject(payload);
            case PacketType.DISCONNECT:
                return payload === undefined;
            case PacketType.CONNECT_ERROR:
                return typeof payload === "string" || isObject(payload);
            case PacketType.EVENT:
            case PacketType.BINARY_EVENT:
                return (Array.isArray(payload) &&
                    (typeof payload[0] === "number" ||
                        (typeof payload[0] === "string" &&
                            RESERVED_EVENTS.indexOf(payload[0]) === -1)));
            case PacketType.ACK:
            case PacketType.BINARY_ACK:
                return Array.isArray(payload);
        }
    }
    /**
     * Deallocates a parser's resources
     */
    destroy() {
        if (this.reconstructor) {
            this.reconstructor.finishedReconstruction();
            this.reconstructor = null;
        }
    }
}
/**
 * A manager of a binary event's 'buffer sequence'. Should
 * be constructed whenever a packet of type BINARY_EVENT is
 * decoded.
 *
 * @param {Object} packet
 * @return {BinaryReconstructor} initialized reconstructor
 */
class BinaryReconstructor {
    constructor(packet) {
        this.packet = packet;
        this.buffers = [];
        this.reconPack = packet;
    }
    /**
     * Method to be called when binary data received from connection
     * after a BINARY_EVENT packet.
     *
     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
     * @return {null | Object} returns null if more binary data is expected or
     *   a reconstructed packet object if all buffers have been received.
     */
    takeBinaryData(binData) {
        this.buffers.push(binData);
        if (this.buffers.length === this.reconPack.attachments) {
            // done with buffer list
            const packet = (0,_binary_js__WEBPACK_IMPORTED_MODULE_1__.reconstructPacket)(this.reconPack, this.buffers);
            this.finishedReconstruction();
            return packet;
        }
        return null;
    }
    /**
     * Cleans up binary packet reconstruction variables.
     */
    finishedReconstruction() {
        this.reconPack = null;
        this.buffers = [];
    }
}
function isNamespaceValid(nsp) {
    return typeof nsp === "string";
}
// see https://caniuse.com/mdn-javascript_builtins_number_isinteger
const isInteger = Number.isInteger ||
    function (value) {
        return (typeof value === "number" &&
            isFinite(value) &&
            Math.floor(value) === value);
    };
function isAckIdValid(id) {
    return id === undefined || isInteger(id);
}
// see https://stackoverflow.com/questions/8511281/check-if-a-value-is-an-object-in-javascript
function isObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
}
function isDataValid(type, payload) {
    switch (type) {
        case PacketType.CONNECT:
            return payload === undefined || isObject(payload);
        case PacketType.DISCONNECT:
            return payload === undefined;
        case PacketType.EVENT:
            return (Array.isArray(payload) &&
                (typeof payload[0] === "number" ||
                    (typeof payload[0] === "string" &&
                        RESERVED_EVENTS.indexOf(payload[0]) === -1)));
        case PacketType.ACK:
            return Array.isArray(payload);
        case PacketType.CONNECT_ERROR:
            return typeof payload === "string" || isObject(payload);
        default:
            return false;
    }
}
function isPacketValid(packet) {
    return (isNamespaceValid(packet.nsp) &&
        isAckIdValid(packet.id) &&
        isDataValid(packet.type, packet.data));
}


/***/ },

/***/ "./node_modules/socket.io-parser/build/esm-debug/is-binary.js"
/*!********************************************************************!*\
  !*** ./node_modules/socket.io-parser/build/esm-debug/is-binary.js ***!
  \********************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   hasBinary: () => (/* binding */ hasBinary),
/* harmony export */   isBinary: () => (/* binding */ isBinary)
/* harmony export */ });
const withNativeArrayBuffer = typeof ArrayBuffer === "function";
const isView = (obj) => {
    return typeof ArrayBuffer.isView === "function"
        ? ArrayBuffer.isView(obj)
        : obj.buffer instanceof ArrayBuffer;
};
const toString = Object.prototype.toString;
const withNativeBlob = typeof Blob === "function" ||
    (typeof Blob !== "undefined" &&
        toString.call(Blob) === "[object BlobConstructor]");
const withNativeFile = typeof File === "function" ||
    (typeof File !== "undefined" &&
        toString.call(File) === "[object FileConstructor]");
/**
 * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
 *
 * @private
 */
function isBinary(obj) {
    return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
        (withNativeBlob && obj instanceof Blob) ||
        (withNativeFile && obj instanceof File));
}
function hasBinary(obj, toJSON) {
    if (!obj || typeof obj !== "object") {
        return false;
    }
    if (Array.isArray(obj)) {
        for (let i = 0, l = obj.length; i < l; i++) {
            if (hasBinary(obj[i])) {
                return true;
            }
        }
        return false;
    }
    if (isBinary(obj)) {
        return true;
    }
    if (obj.toJSON &&
        typeof obj.toJSON === "function" &&
        arguments.length === 1) {
        return hasBinary(obj.toJSON(), true);
    }
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
            return true;
        }
    }
    return false;
}


/***/ },

/***/ "./src/client/core/Camera.js"
/*!***********************************!*\
  !*** ./src/client/core/Camera.js ***!
  \***********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Camera: () => (/* binding */ Camera)
/* harmony export */ });
class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 3;
    }
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom,
            y: (worldY - this.y) * this.zoom
        };
    }
    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.zoom + this.x,
            y: screenY / this.zoom + this.y
        };
    }
    zoomAt(screenX, screenY, delta) {
        const worldPos = this.screenToWorld(screenX, screenY);
        this.zoom *= delta;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
        this.x = worldPos.x - screenX / this.zoom;
        this.y = worldPos.y - screenY / this.zoom;
    }
    pan(dx, dy) {
        this.x -= dx / this.zoom;
        this.y -= dy / this.zoom;
    }
    zoomToFit(worldWidth, worldHeight, screenWidth, screenHeight) {
        const padding = 100;
        const zoomX = screenWidth / (worldWidth + padding * 2);
        const zoomY = screenHeight / (worldHeight + padding * 2);
        this.zoom = Math.min(zoomX, zoomY);
        this.x = -padding;
        this.y = -padding;
    }
    centerOn(worldX, worldY, screenWidth, screenHeight) {
        this.x = worldX - screenWidth / (2 * this.zoom);
        this.y = worldY - screenHeight / (2 * this.zoom);
    }
}


/***/ },

/***/ "./src/client/core/Game.js"
/*!*********************************!*\
  !*** ./src/client/core/Game.js ***!
  \*********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Game: () => (/* binding */ Game)
/* harmony export */ });
/* harmony import */ var _Camera_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Camera.js */ "./src/client/core/Camera.js");
/* harmony import */ var _Renderer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Renderer.js */ "./src/client/core/Renderer.js");
/* harmony import */ var _shared_GameState_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/GameState.js */ "./src/shared/GameState.js");
/* harmony import */ var _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/GameConfig.js */ "./src/shared/GameConfig.js");
/* harmony import */ var _Particle_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Particle.js */ "./src/client/core/Particle.js");
/* harmony import */ var _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../systems/SoundManager.js */ "./src/client/systems/SoundManager.js");







class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.camera = new _Camera_js__WEBPACK_IMPORTED_MODULE_0__.Camera();
        this.renderer = new _Renderer_js__WEBPACK_IMPORTED_MODULE_1__.Renderer(this.ctx, this);
        this.state = new _shared_GameState_js__WEBPACK_IMPORTED_MODULE_2__.GameState();
        this.particles = [];
        this.commandIndicators = [];
        this.waypointLines = [];

        this.running = false;
        this.gameOverShown = false;
        this.healSoundCooldown = 0;
        this.healSoundDelay = 5; // Don't play heal sounds first 5 seconds
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.camera.zoomToFit(this.state.worldWidth, this.state.worldHeight, this.canvas.width, this.canvas.height);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.renderer && this.renderer.resize) {
            this.renderer.resize(window.innerWidth, window.innerHeight);
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.healSoundCooldown = 0;
        this.healSoundDelay = 5; // 5 second delay before heal sounds

        const game = this;
        const loop = (now) => {
            if (!game.running) return;
            const dt = Math.min((now - game.lastTime) / 1000, 0.05);
            game.lastTime = now;

            game.update(dt);
            game.draw(dt);

            game.animationId = requestAnimationFrame(loop);
        };
        game.animationId = requestAnimationFrame(loop);
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    update(dt) {
        // Set player index for sounds
        _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_5__.sounds.setPlayerIndex(this.controller?.playerIndex ?? 0);

        // Track node owners and HP before update for capture detection
        const nodeOwnersBefore = new Map();
        const nodeHpBefore = new Map();
        const playerIdx = this.controller?.playerIndex ?? 0;

        this.state.nodes.forEach(n => {
            nodeOwnersBefore.set(n.id, n.owner);
            nodeHpBefore.set(n.id, n.baseHp);
        });

        // Track entities before update for collision detection
        // Use cached counts from previous frame (or init) to avoid O(N) filter
        const playerEntitiesBefore = this.state.unitCounts ? (this.state.unitCounts[playerIdx] || 0) : 0;

        this.state.update(dt, this);
        if (this.controller && this.controller.update) {
            this.controller.update(dt);
        }
        if (this.systems && this.systems.input) {
            this.systems.input.update(dt);
        }
        this.particles = this.particles.filter(p => p.update(dt));
        this.commandIndicators = this.commandIndicators.filter(ci => ci.update(dt));
        this.waypointLines = this.waypointLines.filter(wl => wl.update(dt));

        // Only play sounds if we have a valid player index (>= 0)
        const isValidPlayer = playerIdx >= 0;

        // Check for node captures - ONLY FOR OUR NODES
        this.state.nodes.forEach(n => {
            const oldOwner = nodeOwnersBefore.get(n.id);

            // Node was captured by US (from neutral)
            if (isValidPlayer && oldOwner !== undefined && oldOwner === -1 && n.owner === playerIdx) {
                _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_5__.sounds.playCapture();
            }
        });

        // Check for OUR cell collisions - play when OUR units die
        const playerEntitiesNow = this.state.unitCounts ? (this.state.unitCounts[playerIdx] || 0) : 0;

        // If OUR units died, play collision sound
        if (playerEntitiesNow < playerEntitiesBefore && isValidPlayer) {
            _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_5__.sounds.playCollision();
        }
    }

    draw(dt) {
        const playerIdx = this.controller?.playerIndex ?? 0;
        this.renderer.setPlayerIndex(playerIdx);

        this.renderer.clear(this.canvas.width, this.canvas.height);
        this.renderer.drawGrid(this.canvas.width, this.canvas.height, this.camera);

        this.state.nodes.forEach(node => {
            const isSelected = this.systems?.selection?.isSelected(node);
            this.renderer.drawNode(node, this.camera, isSelected);
        });

        // First pass: Queue and draw trails (batch rendered for performance)
        this.state.entities.forEach(entity => {
            const isSelected = this.systems?.selection?.isSelected(entity);
            this.renderer.drawEntity(entity, this.camera, isSelected);
        });
        this.renderer.renderTrails(this.camera, dt);

        // Third pass (already done by drawEntity): Bodies
        // Wait, my drawEntity already draws the bodies. 
        // So trails will be ON TOP unless I restructure more.
        // User said "bolota", glowing clouds look fine on top or bottom.
        // Let's keep it as is for simplicity, or move trails before entities.

        this.particles.forEach(p => this.renderer.drawParticle(p, this.camera));
        this.commandIndicators.forEach(ci => this.renderer.drawCommandIndicator(ci, this.camera));

        // Only show waypoint lines for our player
        this.waypointLines.filter(wl => wl.owner === playerIdx).forEach(wl => this.renderer.drawWaypointLine(wl, this.camera));

        // Draw selection box
        if (this.systems.selection.isSelectingBox) {
            const input = this.systems.input;
            this.renderer.drawSelectionBox(
                this.systems.selection.boxStart.x,
                this.systems.selection.boxStart.y,
                input.mouse.x,
                input.mouse.y
            );
        }

        // Draw current drawing path
        if (this.systems.selection.currentPath.length > 0) {
            this.renderer.drawPath(this.systems.selection.currentPath, this.camera, 'rgba(255, 255, 255, 0.6)', 3);
        }

        // Draw waypoints for selected units (only our own)
        this.state.entities.filter(e => e.owner === playerIdx).forEach(e => {
            if (this.systems.selection.isSelected(e) && e.waypoints.length > 0) {
                // Combine current position with waypoints for a complete line
                this.renderer.drawPath([e, ...e.waypoints], this.camera, 'rgba(255, 255, 255, 0.15)', 1.2, true);

                // Draw a small indicator at the current target
                const target = e.currentTarget || e.waypoints[0];
                const screen = this.camera.worldToScreen(target.x, target.y);
                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, 2 * this.camera.zoom, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fill();
            }
        });

        // Draw HUD/UI via systems if initialized
        if (this.systems && this.systems.ui) {
            this.systems.ui.draw(this.renderer);
        }
    }

    spawnCommandIndicator(x, y, type) {
        // Simple indicator logic
        const ci = {
            x, y, type, life: 1.0, maxLife: 1.0,
            update: function (dt) { this.life -= dt; return this.life > 0; }
        };
        this.commandIndicators.push(ci);
    }

    spawnWaypointLine(points, owner) {
        const wl = {
            points, owner, life: 2.0, maxLife: 2.0,
            update: function (dt) { this.life -= dt; return this.life > 0; }
        };
        this.waypointLines.push(wl);
    }

    spawnParticles(x, y, color, count, type) {
        if (this.particles.length > 100) return; // Hard cap on particles for performance
        for (let i = 0; i < count; i++) {
            this.particles.push(new _Particle_js__WEBPACK_IMPORTED_MODULE_4__.Particle(x, y, color, Math.random() * 2 + 1, type));
        }
    }
}


/***/ },

/***/ "./src/client/core/Particle.js"
/*!*************************************!*\
  !*** ./src/client/core/Particle.js ***!
  \*************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Particle: () => (/* binding */ Particle)
/* harmony export */ });
class Particle {
    constructor(x, y, color, size, type) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.type = type;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.vx = (Math.random() - 0.5) * 100;
        this.vy = (Math.random() - 0.5) * 100;
        if (type === 'hit') {
            this.life = 0.3;
            this.maxLife = 0.3;
        }
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        return this.life > 0;
    }
}


/***/ },

/***/ "./src/client/core/Renderer.js"
/*!*************************************!*\
  !*** ./src/client/core/Renderer.js ***!
  \*************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Renderer: () => (/* binding */ Renderer)
/* harmony export */ });
/* harmony import */ var _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../shared/GameConfig.js */ "./src/shared/GameConfig.js");
/* harmony import */ var _utils_helpers_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/helpers.js */ "./src/client/utils/helpers.js");



class Renderer {
    constructor(ctx, game) {
        this.ctx = ctx;
        this.game = game;
        this.playerIndex = 0;
        this.trailQueue = []; // Current frame units (kept for legacy support if needed)

        // Pre-rendered glow cache for each player color
        // Key: "#RRGGBB", Value: { canvas, size }
        this.glowCache = new Map();

        // High-performance unit sprite cache
        this.unitSpriteCache = new Map();

        // High-performance particle sprite cache
        this.particleSpriteCache = new Map();
    }

    /**
     * Pre-render unit sprite for a player color
     * Creates an offscreen canvas with the unit circle, shadow, and highlight cached
     */
    _getOrCreateUnitSprite(color, radius) {
        // Round radius to avoid creating too many cache entries for slight zoom changes
        const r = Math.round(radius);
        const key = `${color}_${r}`;

        if (this.unitSpriteCache.has(key)) {
            return this.unitSpriteCache.get(key);
        }

        // Create offscreen canvas with padding for shadow
        const padding = 2;
        const size = (r + padding) * 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const center = size / 2;

        // 1. Shadow (minimal)
        ctx.beginPath();
        ctx.arc(center + 1, center + 1, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        // 2. Unit Body
        ctx.beginPath();
        ctx.arc(center, center, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // 3. Highlight
        ctx.beginPath();
        ctx.arc(center - r * 0.3, center - r * 0.3, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        this.unitSpriteCache.set(key, canvas);
        return canvas;
    }

    /**
     * Pre-render a generic particle sprite
     * Keyed by color, using a fixed reference size for scaling
     */
    _getOrCreateParticleSprite(color) {
        if (this.particleSpriteCache.has(color)) {
            return this.particleSpriteCache.get(color);
        }

        const size = 32; // Fixed reference size
        const center = size / 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.arc(center, center, (size / 2) - 1, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        this.particleSpriteCache.set(color, canvas);
        return canvas;
    }

    /**
     * Pre-render glow sprite for a player color
     * Creates an offscreen canvas with the glow effect cached
     */
    _getOrCreateGlow(color) {
        if (this.glowCache.has(color)) {
            return this.glowCache.get(color);
        }

        // Create offscreen canvas for the glow sprite
        // Size: 64x64 for good resolution with some margin
        const size = 64;
        const center = size / 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Parse color components
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        // Create glow using radial gradient (once, not per frame!)
        const gradient = ctx.createRadialGradient(center, center, 4, center, center, size / 2 - 2);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.3)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'source-over';

        const glowData = { canvas, size };
        this.glowCache.set(color, glowData);
        return glowData;
    }

    setPlayerIndex(idx) {
        this.playerIndex = idx;
    }

    clear(width, height) {
        this.width = width;
        this.height = height;
        this.ctx.clearRect(0, 0, width, height); // Clear the entire canvas
        this.trailQueue = []; // Reset for next frame
        this.ctx.fillStyle = '#151515';
        this.ctx.fillRect(0, 0, width, height);
    }

    drawGrid(width, height, camera) {
        // Skip grid drawing if zoomed out too far (performance)
        if (camera.zoom < 0.15) return;

        const gridSize = 100 * camera.zoom;
        const offsetX = (-camera.x * camera.zoom) % gridSize;
        const offsetY = (-camera.y * camera.zoom) % gridSize;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        this.ctx.lineWidth = 1;
        for (let x = offsetX; x < width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        for (let y = offsetY; y < height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }

        // Map boundary ring - only visible when units approach
        const worldRadius = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.GAME_SETTINGS.WORLD_RADIUS || 1800;
        const centerX = (_shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.GAME_SETTINGS.WORLD_WIDTH || 2400) / 2;
        const centerY = (_shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.GAME_SETTINGS.WORLD_HEIGHT || 1800) / 2;

        // Only draw boundary if any unit is near it
        let nearBoundary = false;
        if (this.game && this.game.state && this.game.state.entities) {
            for (const ent of this.game.state.entities) {
                if (ent.dead || ent.dying) continue;
                const dx = ent.x - centerX;
                const dy = ent.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > worldRadius - 300) {
                    nearBoundary = true;
                    break;
                }
            }
        }

        if (nearBoundary) {
            const screenCenter = camera.worldToScreen(centerX, centerY);
            const boundaryRadius = worldRadius * camera.zoom;

            this.ctx.beginPath();
            this.ctx.arc(screenCenter.x, screenCenter.y, boundaryRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([10 * camera.zoom, 20 * camera.zoom]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    drawNode(node, camera, isSelected = false) {
        const screen = camera.worldToScreen(node.x, node.y);
        const sr = node.radius * camera.zoom;
        const sir = node.influenceRadius * camera.zoom;

        // Culling for nodes - skip if completely off screen
        const margin = sir * 2;
        if (this.width && (screen.x < -margin || screen.x > this.width + margin || screen.y < -margin || screen.y > this.height + margin)) {
            return;
        }

        const baseColor = node.getColor();

        const c = baseColor.slice(1);
        const areaColor = [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)].join(',');

        // Aura - Optimized with sprite-based rendering and reduced alpha
        const glowData = this._getOrCreateGlow(baseColor);
        const auraAlpha = 0.05; // Reduced from 0.08 for "subtle" look

        this.ctx.save();
        this.ctx.globalAlpha = auraAlpha;
        this.ctx.drawImage(
            glowData.canvas,
            screen.x - sir,
            screen.y - sir,
            sir * 2,
            sir * 2
        );
        this.ctx.restore();

        // Dashed border (kept as vector for sharpness, but subtle)
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, sir, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(${areaColor},0.2)`;
        this.ctx.lineWidth = 1.2 * camera.zoom;
        this.ctx.setLineDash([8 * camera.zoom, 6 * camera.zoom]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Rally Line - only show for our own nodes
        if (node.rallyPoint && node.owner !== -1 && node.owner === this.playerIndex) {
            const rx = (node.rallyPoint.x - camera.x) * camera.zoom;
            const ry = (node.rallyPoint.y - camera.y) * camera.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(screen.x, screen.y);
            this.ctx.lineTo(rx, ry);
            this.ctx.strokeStyle = `rgba(${areaColor},0.5)`;
            this.ctx.setLineDash([4 * camera.zoom, 4 * camera.zoom]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.beginPath();
            this.ctx.arc(rx, ry, 5 * camera.zoom, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${areaColor},0.7)`;
            this.ctx.fill();
        }

        // Spawn Progress - player color when full, white otherwise
        if (node.owner !== -1 && node.spawnProgress > 0) {
            const isFull = node.baseHp >= node.maxHp;

            // Use player color when full, white otherwise
            let progressColor = isFull ? baseColor : '#ffffff';

            // If under enemy pressure, flash between red and normal
            if (node.enemyPressure) {
                const flash = Math.sin(Date.now() / 150) > 0;
                progressColor = flash ? '#ff0000' : progressColor;
            }

            const lineWidth = isFull ? (3 * camera.zoom) : (2 * camera.zoom);

            // Cap at 1.0 to prevent visual overflow/looping
            let progress = Math.min(1.0, node.spawnProgress);

            // VISUAL FIX: If node just spawned (spawnEffect high), show full ring
            // This prevents the "99% -> 0%" visual gap, making it feel perfectly synced
            if (node.spawnEffect > 0.3) {
                progress = 1.0;
            }

            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, sr + 5 * camera.zoom, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            this.ctx.strokeStyle = progressColor;
            this.ctx.lineWidth = lineWidth;
            this.ctx.stroke();
        }

        // Node Body (Radial Fill)
        const totalHp = node.getTotalHp();
        const hpPercent = Math.max(0, Math.min(1, totalHp / node.maxHp));
        const currentRadius = sr * hpPercent;

        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);

        let brightness = 1;
        if (node.owner !== -1) {
            brightness = 1 + Math.min(totalHp * 0.01, 0.5); // Subtle brightness based on hp
        } else {
            brightness = 1 + (node.baseHp / node.maxHp) * 0.3;
        }
        const brightColor = `rgb(${Math.min(255, r * brightness)}, ${Math.min(255, g * brightness)}, ${Math.min(255, b * brightness)})`;

        // Background / Capacity indicator
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, sr, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(40,40,40,0.4)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.lineWidth = 1 * camera.zoom;
        this.ctx.stroke();

        if (hpPercent > 0) {
            const grad = this.ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, currentRadius);
            grad.addColorStop(0, `rgba(${r * 0.8}, ${g * 0.8}, ${b * 0.8}, 1)`);
            grad.addColorStop(1, brightColor);

            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, currentRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = grad;
            this.ctx.fill();
        }

        const borderColorStr = isSelected ? 'rgba(255,255,255,0.9)' : `rgba(${areaColor},0.5)`;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, sr, 0, Math.PI * 2);
        this.ctx.strokeStyle = borderColorStr;
        this.ctx.lineWidth = isSelected ? 3 * camera.zoom : 1.5 * camera.zoom;
        this.ctx.stroke();

        if (node.hitFlash > 0) {
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, sr, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255,100,100,${node.hitFlash})`;
            this.ctx.lineWidth = 5 * camera.zoom;
            this.ctx.stroke();
        }
        if (node.spawnEffect > 0) {
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, sr * (1.3 + (0.5 - node.spawnEffect) * 0.6), 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255,255,255,${node.spawnEffect * 1.5})`;
            this.ctx.lineWidth = 3 * camera.zoom;
            this.ctx.stroke();
        }
    }

    drawEntity(entity, camera, isSelected = false) {
        if (entity.dead) return;
        const screen = camera.worldToScreen(entity.x, entity.y);
        const margin = entity.radius * camera.zoom + 5;

        // Culling: If off screen, skip drawing (Performance)
        if (this.width && (
            screen.x < -margin || screen.x > this.width + margin ||
            screen.y < -margin || screen.y > this.height + margin
        )) {
            return;
        }

        // Dying animation handling
        if (entity.dying) {
            const progress = entity.deathTime / 0.4;
            const sr = entity.radius * camera.zoom;
            if (entity.deathType === 'explosion') {
                const maxRadius = sr * 4;
                const currentRadius = sr + (maxRadius - sr) * progress;
                const alpha = 1 - progress;

                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, currentRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.3})`;
                this.ctx.fill();

                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, sr * (1 - progress * 0.8), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
                this.ctx.fill();
            } else if (entity.deathType === 'attack') {
                const flash = Math.sin(progress * Math.PI * 6) * 0.5 + 0.5;
                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, sr * (1 + progress * 2), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 100, 100, ${flash * 0.4 * (1 - progress)})`;
                this.ctx.fill();
            } else if (entity.deathType === 'sacrifice' && entity.absorbTarget) {
                const node = entity.absorbTarget;
                const easeProgress = progress * progress;
                const currentX = entity.x + (node.x - entity.x) * easeProgress;
                const currentY = entity.y + (node.y - entity.y) * easeProgress;
                const absorbScreen = camera.worldToScreen(currentX, currentY);
                const currentRadius = sr * (1 - progress * 0.7);
                const alpha = 1 - progress;

                const playerColor = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS[entity.owner % _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS.length];
                const r = parseInt(playerColor.slice(1, 3), 16);
                const g = parseInt(playerColor.slice(3, 5), 16);
                const b = parseInt(playerColor.slice(5, 7), 16);

                this.ctx.save();
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.beginPath();
                this.ctx.arc(absorbScreen.x, absorbScreen.y, currentRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                this.ctx.fill();
                this.ctx.restore();
            }
            return;
        }

        const playerColor = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS[entity.owner % _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS.length];
        const renderRadius = entity.radius * camera.zoom;

        // Optimization: Image-based rendering with cached sprites
        const sprite = this._getOrCreateUnitSprite(playerColor, renderRadius);
        const offset = sprite.width / 2;

        // Quick draw using drawImage (Bit blit is much faster than ctx.arc fill)
        this.ctx.drawImage(sprite, (screen.x - offset) | 0, (screen.y - offset) | 0);

        // Selection circle
        if (isSelected) {
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, renderRadius + 2, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        // Speed Boost Glow - Restored and unconditionally enabled for visual satisfaction
        const smoothedBoost = entity.speedBoost * entity.speedBoost;
        if (smoothedBoost > 0.1) {
            const glowData = this._getOrCreateGlow(playerColor);
            const glowRadius = renderRadius * (1.2 + smoothedBoost * 1.5);

            this.ctx.save();
            this.ctx.globalCompositeOperation = 'lighter';
            // Reduced from 0.7 to 0.45 for a cleaner, less saturated screen
            this.ctx.globalAlpha = smoothedBoost * 0.45;
            this.ctx.drawImage(
                glowData.canvas,
                screen.x - glowRadius,
                screen.y - glowRadius,
                glowRadius * 2,
                glowRadius * 2
            );
            this.ctx.restore();
        }
    }

    renderTrails(camera, dt = 0.016) {
        // Trails removed in favor of direct unit glow for "satisfying" and optimized visuals
        this.trailQueue = [];
    }

    drawParticle(p, camera) {
        if (p.life <= 0) return;
        const screen = camera.worldToScreen(p.x, p.y);

        // Culling
        if (this.width && (screen.x < -20 || screen.x > this.width + 20 || screen.y < -20 || screen.y > this.height + 20)) {
            return;
        }

        this.ctx.globalAlpha = p.life / p.maxLife;

        if (p.type === 'hit') {
            // Hit particles are lines, keeping vector for now as they are few, 
            // but optimized with globalAlpha
            this.ctx.beginPath();
            this.ctx.moveTo(screen.x, screen.y);
            this.ctx.lineTo(screen.x - p.vx * 0.1, screen.y - p.vy * 0.1);
            this.ctx.strokeStyle = p.color;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.stroke();
        } else {
            // Explosions/Death particles: Sprite-based
            const sprite = this._getOrCreateParticleSprite(p.color);
            const renderSize = p.size * 1.2 * camera.zoom;

            // Speed-based particle glow (Restore requested beauty)
            const speedSq = p.vx * p.vx + p.vy * p.vy;
            if (speedSq > 4000) { // Only for fast moving particles
                const glowData = this._getOrCreateGlow(p.color);
                const glowRadius = renderSize * 2.5;
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.globalAlpha = (p.life / p.maxLife) * 0.4;
                this.ctx.drawImage(
                    glowData.canvas,
                    screen.x - glowRadius,
                    screen.y - glowRadius,
                    glowRadius * 2,
                    glowRadius * 2
                );
                this.ctx.restore();
            }

            // Fast bit blit
            this.ctx.drawImage(
                sprite,
                screen.x - renderSize / 2,
                screen.y - renderSize / 2,
                renderSize,
                renderSize
            );
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawCommandIndicator(ci, camera) {
        const screen = camera.worldToScreen(ci.x, ci.y);
        const alpha = Math.max(0, ci.life / ci.maxLife);
        const size = 10 * camera.zoom;

        if (ci.type === 'attack') {
            this.ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(screen.x - size, screen.y - size);
            this.ctx.lineTo(screen.x + size, screen.y + size);
            this.ctx.moveTo(screen.x + size, screen.y - size);
            this.ctx.lineTo(screen.x - size, screen.y + size);
            this.ctx.stroke();
        } else {
            this.ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, size * (1 - alpha), 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawSelectionBox(x1, y1, x2, y2) {
        const x = Math.min(x1, x2), y = Math.min(y1, y2);
        const w = Math.abs(x1 - x2), h = Math.abs(y1 - y2);
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(x, y, w, h);
    }

    drawPath(points, camera, color = 'rgba(255, 255, 255, 0.4)', lineWidth = 2, dashed = false) {
        if (points.length < 2) return;
        this.ctx.beginPath();
        const start = camera.worldToScreen(points[0].x, points[0].y);
        this.ctx.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
            const p = camera.worldToScreen(points[i].x, points[i].y);
            this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth * camera.zoom;
        if (dashed) this.ctx.setLineDash([5 * camera.zoom, 5 * camera.zoom]);
        this.ctx.stroke();
        if (dashed) this.ctx.setLineDash([]);
    }

    drawWaypointLine(wl, camera) {
        if (wl.points.length < 2) return;
        const alpha = Math.max(0, wl.life / wl.maxLife) * 0.7;
        const color = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS[wl.owner % _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS.length];

        // Helper to convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;

        this.ctx.lineWidth = 4 * camera.zoom;
        this.ctx.setLineDash([8 * camera.zoom, 6 * camera.zoom]);
        this.ctx.strokeStyle = rgba;

        this.ctx.beginPath();
        const start = camera.worldToScreen(wl.points[0].x, wl.points[0].y);
        this.ctx.moveTo(start.x, start.y);

        for (let i = 1; i < wl.points.length; i++) {
            const p = camera.worldToScreen(wl.points[i].x, wl.points[i].y);
            this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        wl.points.forEach((point, i) => {
            const screen = camera.worldToScreen(point.x, point.y);
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, (i === wl.points.length - 1 ? 6 : 3) * camera.zoom, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * (i === wl.points.length - 1 ? 1 : 0.6)})`;
            this.ctx.fill();
        });
    }
}


/***/ },

/***/ "./src/client/modes/MultiplayerController.js"
/*!***************************************************!*\
  !*** ./src/client/modes/MultiplayerController.js ***!
  \***************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MultiplayerController: () => (/* binding */ MultiplayerController)
/* harmony export */ });
/* harmony import */ var socket_io_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! socket.io-client */ "./node_modules/socket.io-client/build/esm/index.js");
/* harmony import */ var _shared_Entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/Entity.js */ "./src/shared/Entity.js");
/* harmony import */ var _shared_Node_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/Node.js */ "./src/shared/Node.js");
/* harmony import */ var _shared_GameState_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/GameState.js */ "./src/shared/GameState.js");
/* harmony import */ var _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../systems/SoundManager.js */ "./src/client/systems/SoundManager.js");






class MultiplayerController {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.playerIndex = -1;
        this.roomId = null;
        this.cameraCentered = false;
        this.initialStateReceived = false;
        this.gameLost = false;
        this.surrendered = false;
        this.playerDefeated = false;
    }

    connect(url = '/') {
        this.socket = (0,socket_io_client__WEBPACK_IMPORTED_MODULE_0__.io)(url);
        this.setupSocketEvents();
        window.multiplayer = this;
    }

    surrender() {
        if (this.socket && this.connected && !this.surrendered) {
            this.surrendered = true;
            this.socket.emit('surrender');
            alert('Te has rendido. Puedes seguir jugando mientras esperas.');
        }
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            this.connected = true;
            console.log('MultiplayerController connected to server');
            this.socket.emit('listRooms');

            const name = localStorage.getItem('nanowar_nickname');
            if (name) this.socket.emit('setNickname', name);
        });

        this.socket.on('roomList', (rooms) => {
            if (window.updateRoomListUI) {
                window.updateRoomListUI(rooms);
            }
        });

        this.socket.on('lobbyUpdate', (data) => {
            console.log('Lobby Update:', data);
            if (window.updateLobbyUI) {
                window.updateLobbyUI(data.players);
            }
        });

        this.socket.on('gameStart', (initialState) => {
            console.log('Game starting!');

            // Clear existing state and initialize from server
            this.game.state = new _shared_GameState_js__WEBPACK_IMPORTED_MODULE_3__.GameState();
            this.game.state.nodes = [];
            this.game.state.entities = [];
            this.game.state.playerCount = initialState.playerCount || this.game.state.playerCount;

            // Apply initial state
            if (initialState.nodes) {
                initialState.nodes.forEach(sn => {
                    const node = new _shared_Node_js__WEBPACK_IMPORTED_MODULE_2__.Node(sn.id, sn.x, sn.y, sn.owner, sn.type);
                    node.baseHp = sn.baseHp;
                    node.maxHp = sn.maxHp;
                    node.stock = sn.stock;
                    node.maxStock = sn.maxStock;
                    node.spawnProgress = sn.spawnProgress;
                    if (sn.rallyPoint) node.rallyPoint = sn.rallyPoint;
                    this.game.state.nodes.push(node);
                });
            }

            // Spawn initial entities for all players - MORE units for multiplayer
            this.game.state.nodes.forEach(node => {
                if (node.owner !== -1) {
                    for (let i = 0; i < 20; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = node.radius + 30;
                        const ent = new _shared_Entity_js__WEBPACK_IMPORTED_MODULE_1__.Entity(
                            node.x + Math.cos(angle) * dist,
                            node.y + Math.sin(angle) * dist,
                            node.owner,
                            Date.now() + i + (node.owner * 1000)
                        );
                        this.game.state.entities.push(ent);
                    }
                }
            });

            const lobby = document.getElementById('lobby-screen');
            const gameScreen = document.getElementById('game-screen');
            if (lobby) lobby.style.display = 'none';
            if (gameScreen) gameScreen.style.display = 'block';

            this.game.resize();
            this.game.start();
        });

        this.socket.on('playerDefeated', (data) => {
            const isMe = data.playerIndex === this.playerIndex;

            if (isMe) {
                this.playerDefeated = true;
                // Show small notification
                const notif = document.createElement('div');
                notif.style.cssText = `
                    position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
                    background: rgba(244,67,54,0.9); color: white; padding: 10px 20px;
                    border-radius: 4px; z-index: 100; font-family: monospace;
                `;
                notif.textContent = data.surrendered ? 'TE RENDISTE - Solo puedes mover y atacar' : 'SIN NODOS - Solo puedes mover y atacar';
                document.body.appendChild(notif);
                setTimeout(() => notif.remove(), 3000);
            }
        });

        this.socket.on('gameState', (serverState) => {
            // Stop syncing after game over
            if (this.game.gameOverShown) return;

            // Keep syncing always for defeated players who can still play
            if (this.game.running || this.playerDefeated) {
                this.syncState(serverState);
            }
        });

        this.socket.on('gameOver', (data) => {
            const won = data.winner === this.playerIndex;
            const lost = data.winner !== -1 && data.winner !== this.playerIndex;

            // Keep game running even if lost - players can still move units
            this.gameLost = lost;

            // Mark game as over to stop receiving states
            if (this.game) this.game.gameOverShown = true;

            // Play win/lose sound
            if (won) {
                _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_4__.sounds.playWin();
            } else {
                _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_4__.sounds.playLose();
            }

            // Show overlay
            const msg = won ? '¡VICTORIA!' : (data.winner === -1 ? 'EMPATE' : 'DERROTA');
            const color = won ? '#4CAF50' : '#f44336';

            const playerColors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4'];

            // Generate stats HTML
            let statsHTML = '<div style="margin: 20px 0; text-align: left; font-size: 12px;">';

            const stats = data.stats || this.game.state.getStats();

            if (stats && stats.produced) {
                statsHTML += `<p style="color: #888; margin-bottom: 10px;">Duración: ${Math.floor(stats.elapsed)}m ${Math.floor((stats.elapsed % 1) * 60)}s</p>`;

                for (let pid in stats.produced) {
                    const p = parseInt(pid);
                    const pColor = playerColors[p % playerColors.length];
                    const pName = p === this.playerIndex ? 'TÚ' : `Jugador ${p + 1}`;
                    const produced = stats.produced[pid]?.total || 0;
                    const lostUnits = stats.lost[pid]?.total || 0;
                    const current = stats.current[pid] || 0;
                    const prodPerMin = stats.produced[pid]?.perMinute || 0;

                    const captured = stats.captured[pid] || 0;

                    statsHTML += `
                        <div style="color: ${pColor}; margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid ${pColor};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <strong style="font-size: 14px;">${pName}</strong>
                                <span style="font-size: 10px; opacity: 0.7;">CAPTURAS: ${captured}</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 11px; opacity: 0.8;">
                                <span>Producidas: ${produced}</span>
                                <span>Promedio: ${prodPerMin}/m</span>
                                <span>Perdidas: ${lostUnits}</span>
                                <span>Actuales: ${current}</span>
                            </div>
                        </div>
                    `;
                }
            }
            statsHTML += '</div>';

            // Generate graph UI
            const graphWidth = 500;
            const graphHeight = 200;

            let graphUI = `
                <div style="margin: 15px 0;">
                    <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 10px;">
                        <button id="btn-graph-prod" onclick="window.updateGraph('production')" style="background: rgba(255,255,255,0.1); border: 1px solid #444; color: #888; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Producción</button>
                        <button id="btn-graph-units" onclick="window.updateGraph('units')" style="background: rgba(255,255,255,0.1); border: 1px solid #444; color: #888; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Unidades</button>
                        <button id="btn-graph-nodes" onclick="window.updateGraph('nodes')" style="background: rgba(255,255,255,0.1); border: 1px solid #444; color: #888; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Territorio</button>
                    </div>
                    <div style="position: relative;">
                        <canvas id="stats-graph" width="${graphWidth}" height="${graphHeight}" style="border: 1px solid #333; background: rgba(0,0,0,0.3); border-radius: 4px;"></canvas>
                        <button onclick="window.downloadGraph()" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 3px; font-size: 10px; padding: 4px 8px; cursor: pointer;">⬇️ IMG</button>
                    </div>
                </div>
            `;

            const overlay = document.createElement('div');
            overlay.id = 'game-over-overlay';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.85); display: flex;
                justify-content: center; align-items: center; z-index: 1000;
            `;

            const box = document.createElement('div');
            box.style.cssText = `
                padding: 40px 60px; background: #141419;
                border: 3px solid ${color}; border-radius: 12px;
                text-align: center; position: relative;
            `;

            box.innerHTML = `
                <button onclick="this.parentElement.parentElement.remove(); location.href='index.html';" style="
                    position: absolute; top: 10px; right: 15px;
                    background: none; border: none; color: #888;
                    font-size: 24px; cursor: pointer; line-height: 1;
                ">&times;</button>
                <h1 style="color: ${color}; font-size: 48px; margin: 0 0 20px 0; letter-spacing: 4px;">${msg}</h1>
                ${graphUI}
                ${statsHTML}
                <p style="color: #888; margin-bottom: 20px;">${lost ? 'Puedes seguir jugando mientras esperas...' : ''}</p>
                <button id="restart-btn" style="
                    background: ${color}; color: white; border: none;
                    padding: 12px 30px; font-size: 16px; cursor: pointer;
                    border-radius: 4px; font-family: 'Courier New', monospace;
                ">VOLVER AL MENU</button>
            `;

            overlay.appendChild(box);
            document.body.appendChild(overlay);

            // Define graph update function globally so buttons can call it
            window.updateGraph = (type) => {
                const canvas = document.getElementById('stats-graph');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const w = canvas.width;
                const h = canvas.height;

                ctx.clearRect(0, 0, w, h);

                let dataArray = [];
                let title = '';
                let timeScale = 1; // Divide time by this to get minutes

                // Update active button style
                ['prod', 'units', 'nodes'].forEach(t => {
                    const btn = document.getElementById(`btn-graph-${t}`);
                    if (btn) btn.style.borderColor = t === type ? color : '#444';
                    if (btn) btn.style.color = t === type ? color : '#888';
                });

                if (type === 'production') {
                    dataArray = stats.productionHistory || [];
                    title = 'PRODUCCIÓN (Unidades/Min)';
                    timeScale = 1; // Already in minutes
                } else if (type === 'units') {
                    dataArray = stats.history || [];
                    title = 'EJÉRCITO TOTAL';
                    timeScale = 60; // Seconds to minutes
                } else if (type === 'nodes') {
                    dataArray = stats.nodeHistory || [];
                    title = 'TERRITORIO (Nodos)';
                    timeScale = 60; // Seconds to minutes
                }

                if (!dataArray || dataArray.length === 0) {
                    ctx.fillStyle = '#444';
                    ctx.textAlign = 'center';
                    ctx.fillText('No hay datos disponibles', w / 2, h / 2);
                    return;
                }

                // Find max value
                let maxVal = 0;
                dataArray.forEach(p => {
                    const val = p.rate !== undefined ? p.rate : p.count;
                    if (val > maxVal) maxVal = val;
                });
                maxVal = Math.ceil(Math.max(maxVal, 5) * 1.1); // Min 5, 10% padding

                // Draw Grid
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let i = 0; i <= 4; i++) {
                    const y = h - (i / 4) * h * 0.9 - 5;
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.font = '10px monospace';
                    ctx.fillText(Math.round((i / 4) * maxVal), 5, y - 2);
                }
                ctx.stroke();

                // Group by player
                const playerData = {};
                dataArray.forEach(p => {
                    if (!playerData[p.playerId]) playerData[p.playerId] = [];
                    playerData[p.playerId].push(p);
                });

                // Draw Lines
                const playerColors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4'];

                for (let pid in playerData) {
                    const data = playerData[pid];
                    data.sort((a, b) => a.time - b.time);

                    const pC = playerColors[parseInt(pid) % playerColors.length];
                    ctx.strokeStyle = pC;
                    ctx.lineWidth = 2;
                    ctx.lineJoin = 'round';
                    ctx.beginPath();

                    data.forEach((p, i) => {
                        const val = p.rate !== undefined ? p.rate : p.count;
                        const t = (p.time / timeScale);
                        const x = (t / (stats.elapsed || 1)) * w;
                        const y = h - (val / maxVal) * h * 0.9 - 5;

                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });
                    ctx.stroke();

                    if (data.length < 50) {
                        ctx.fillStyle = pC;
                        data.forEach(p => {
                            const val = p.rate !== undefined ? p.rate : p.count;
                            const t = (p.time / timeScale);
                            const x = (t / (stats.elapsed || 1)) * w;
                            const y = h - (val / maxVal) * h * 0.9 - 5;
                            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
                        });
                    }
                }

                // Title
                ctx.fillStyle = '#888';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(title, w / 2, 15);
            };

            window.downloadGraph = () => {
                const canvas = document.getElementById('stats-graph');
                if (canvas) {
                    const link = document.createElement('a');
                    link.download = `nanowar-stats-${Date.now()}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                }
            };

            // Draw initial graph
            setTimeout(() => {
                window.updateGraph('production');
            }, 100);

            // Click outside to close
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    location.href = 'index.html';
                }
            });

            document.getElementById('restart-btn').addEventListener('click', () => {
                overlay.remove();
                location.reload();
            });
        });

        this.socket.on('disconnect', () => {
            this.connected = false;
        });
    }

    createRoom(maxPlayers = 4) {
        this.socket.emit('createRoom', { maxPlayers }, (response) => {
            if (response.success) {
                this.roomId = response.roomId;
                this.playerIndex = response.playerIndex;
                this.showLobby();
            }
        });
    }

    joinRoom(roomId) {
        this.socket.emit('joinRoom', { roomId }, (response) => {
            if (response.success) {
                this.roomId = roomId;
                this.playerIndex = response.playerIndex;
                this.showLobby();
            } else {
                alert('Error: ' + response.message);
            }
        });
    }

    toggleReady() {
        // Get settings from lobby UI
        const speedSetting = document.getElementById('speed-setting');

        const productionSetting = document.getElementById('production-setting');

        const settings = {
            speedMultiplier: speedSetting ? parseFloat(speedSetting.value) : 1,
            acceleration: false,
            showProduction: productionSetting ? productionSetting.checked : true
        };

        if (this.socket) this.socket.emit('toggleReady', settings);
    }

    showLobby() {
        const lobby = document.getElementById('lobby-screen');
        const menu = document.getElementById('menu-screen');
        if (lobby) lobby.style.display = 'block';
        if (menu) menu.style.display = 'none';
    }

    sendAction(action) {
        if (this.socket && this.connected) {
            this.socket.emit('gameAction', action);
        }
    }

    syncState(serverState) {
        // Sync nodes
        serverState.nodes.forEach(sn => {
            let clientNode = this.game.state.nodes.find(cn => cn.id === sn.id);
            if (!clientNode) {
                clientNode = new _shared_Node_js__WEBPACK_IMPORTED_MODULE_2__.Node(sn.id, sn.x, sn.y, sn.owner, sn.type);
                this.game.state.nodes.push(clientNode);
            }

            // Check if node was captured
            const oldOwner = clientNode.owner;

            // Update properties from server (ensure maxHp is synced to fix visual fill issues)
            clientNode.owner = sn.owner;
            clientNode.baseHp = sn.baseHp;
            clientNode.maxHp = sn.maxHp;
            clientNode.radius = sn.radius;
            clientNode.influenceRadius = sn.influenceRadius;
            clientNode.stock = sn.stock;
            clientNode.spawnProgress = sn.spawnProgress;
            clientNode.hitFlash = sn.hitFlash;
            clientNode.spawnEffect = sn.spawnEffect;
            clientNode.enemyPressure = sn.enemyPressure;
            if (sn.rallyPoint) {
                clientNode.rallyPoint = sn.rallyPoint;
            }

            // Play capture sound ONLY if WE captured it
            if (oldOwner !== sn.owner && sn.owner === this.playerIndex) {
                _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_4__.sounds.playCapture();
            }
        });

        // Center camera on player's starting node
        if (!this.cameraCentered && this.playerIndex !== -1 && this.game.state.nodes.length > 0) {
            const startNode = this.game.state.nodes.find(n => n.owner === this.playerIndex);
            if (startNode) {
                this.game.camera.centerOn(startNode.x, startNode.y, this.game.canvas.width, this.game.canvas.height);
                this.cameraCentered = true;
            }
        }

        // Sync entities - update existing ones
        const entityMap = new Map();
        this.game.state.entities.forEach(e => entityMap.set(e.id, e));

        serverState.entities.forEach(se => {
            let ent = entityMap.get(se.id);
            if (!ent) {
                ent = new _shared_Entity_js__WEBPACK_IMPORTED_MODULE_1__.Entity(se.x, se.y, se.owner, se.id);
                this.game.state.entities.push(ent);
            }

            // Update from server (authoritative)
            ent.x = se.x;
            ent.y = se.y;
            ent.vx = se.vx;
            ent.vy = se.vy;
            ent.owner = se.owner;
            ent.dying = se.dying;
            ent.deathType = se.deathType;
            ent.deathTime = se.deathTime;

            entityMap.set(se.id, ent);
        });

        // Remove entities that no longer exist on server
        const serverEntityIds = new Set(serverState.entities.map(e => e.id));
        this.game.state.entities = this.game.state.entities.filter(e => serverEntityIds.has(e.id));

        // Sync elapsed time
        if (serverState.elapsedTime !== undefined) {
            this.game.state.elapsedTime = serverState.elapsedTime;
        }

        // Sync game settings
        if (serverState.speedMultiplier !== undefined) {
            this.game.state.speedMultiplier = serverState.speedMultiplier;
        }
        if (serverState.accelerationEnabled !== undefined) {
            this.game.state.accelerationEnabled = serverState.accelerationEnabled;
        }
        if (serverState.showProduction !== undefined) {
            this.game.state.showProduction = serverState.showProduction;
        }
    }
}


/***/ },

/***/ "./src/client/modes/SingleplayerController.js"
/*!****************************************************!*\
  !*** ./src/client/modes/SingleplayerController.js ***!
  \****************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SingleplayerController: () => (/* binding */ SingleplayerController)
/* harmony export */ });
/* harmony import */ var _shared_AIController_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../shared/AIController.js */ "./src/shared/AIController.js");
/* harmony import */ var _shared_Node_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/Node.js */ "./src/shared/Node.js");
/* harmony import */ var _shared_Entity_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../shared/Entity.js */ "./src/shared/Entity.js");
/* harmony import */ var _shared_MapGenerator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/MapGenerator.js */ "./src/shared/MapGenerator.js");
/* harmony import */ var _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../systems/SoundManager.js */ "./src/client/systems/SoundManager.js");






class SingleplayerController {
    constructor(game) {
        this.game = game;
        this.ais = [];
        this.gameOverShown = false;
    }

    setup(playerCount = 1, difficulty = 'intermediate', testMode = false) {
        this.game.state.playerCount = playerCount;

        // In test mode, force 4 players (1 human + 3 AI) on easy
        if (testMode) {
            this.game.state.playerCount = 4;
            difficulty = 'easy';
        }

        this.game.state.difficulty = difficulty;
        this.testMode = testMode;
        this.playerIndex = 0;
        this.createLevel();
        this.createInitialEntities(testMode);

        const difficultyMap = {
            'easy': 'Easy',
            'intermediate': 'Normal',
            'hard': 'Hard',
            'expert': 'Nightmare'
        };

        // Create AIs for CPUs (indices > 0)
        for (let i = 1; i < playerCount; i++) {
            const aiDifficulty = difficultyMap[difficulty] || 'Normal';
            this.ais.push(new _shared_AIController_js__WEBPACK_IMPORTED_MODULE_0__.AIController(this.game, i, aiDifficulty));
        }
    }

    createLevel() {
        const width = this.game.state.worldWidth;
        const height = this.game.state.worldHeight;
        this.game.state.nodes = _shared_MapGenerator_js__WEBPACK_IMPORTED_MODULE_3__.MapGenerator.generate(this.game.state.playerCount, width, height);
    }

    createInitialEntities(testMode = false) {
        const initialCount = testMode ? 1000 : 15;

        this.game.state.nodes.forEach(node => {
            if (node.owner !== -1) {
                for (let i = 0; i < initialCount; i++) {
                    // Spawn units tightly clustered around the node center
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * (node.radius + 20);
                    const ent = new _shared_Entity_js__WEBPACK_IMPORTED_MODULE_2__.Entity(
                        node.x + Math.cos(angle) * dist,
                        node.y + Math.sin(angle) * dist,
                        node.owner,
                        Date.now() + i + (node.owner * 10000)
                    );
                    this.game.state.entities.push(ent);
                }
            }
        });
    }

    update(dt) {
        this.ais.forEach(ai => ai.update(dt));

        if (this.gameOverShown) return;

        const playerNodes = this.game.state.nodes.filter(n => n.owner === 0);
        const enemyNodes = this.game.state.nodes.filter(n => n.owner > 0);

        // Victory/defeat based on nodes only (units don't matter)
        const playerHasNodes = playerNodes.length > 0;
        const enemiesHaveNodes = enemyNodes.length > 0;

        if (!playerHasNodes) {
            this.showGameOver(false);
        } else if (!enemiesHaveNodes) {
            this.showGameOver(true);
        }
    }

    showGameOver(won) {
        this.gameOverShown = true;
        this.game.gameOverShown = true;

        if (won) {
            _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_4__.sounds.playWin();
        } else {
            _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_4__.sounds.playLose();
        }

        const msg = won ? '¡VICTORIA!' : 'DERROTA';
        const color = won ? '#4CAF50' : '#f44336';
        const playerColors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];

        // Generate stats HTML
        let statsHTML = '<div style="margin: 20px 0; text-align: left; font-size: 12px; max-height: 200px; overflow-y: auto;">';

        const stats = this.game.state.getStats();

        if (stats && stats.produced) {
            statsHTML += `<p style="color: #888; margin-bottom: 10px;">Duración: ${Math.floor(stats.elapsed)}m ${Math.floor((stats.elapsed % 1) * 60)}s</p>`;

            for (let pid in stats.produced) {
                const p = parseInt(pid);
                const pColor = playerColors[p % playerColors.length];
                const pName = p === 0 ? 'TÚ' : `CPU ${p}`;
                const produced = stats.produced[pid]?.total || 0;
                const lostUnits = stats.lost[pid]?.total || 0;
                const current = stats.current[pid] || 0;
                const captured = stats.captured[pid] || 0;
                const prodPerMin = stats.produced[pid]?.perMinute || 0;

                statsHTML += `
                    <div style="color: ${pColor}; margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid ${pColor};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <strong style="font-size: 14px;">${pName}</strong>
                            <span style="font-size: 10px; opacity: 0.7;">CAPTURAS: ${captured}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 11px; opacity: 0.8;">
                            <span>Producidas: ${produced}</span>
                            <span>Promedio: ${prodPerMin}/m</span>
                            <span>Perdidas: ${lostUnits}</span>
                            <span>Actuales: ${current}</span>
                        </div>
                    </div>
                `;
            }
        }
        statsHTML += '</div>';

        // Generate graph
        // ... existing stats HTML generation ...

        // Generate graph UI
        const graphWidth = 500;
        const graphHeight = 200;

        let graphUI = `
            <div style="margin: 15px 0;">
                <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 10px;">
                    <button id="btn-graph-prod" onclick="window.updateGraph('production')" style="background: rgba(255,255,255,0.1); border: 1px solid #444; color: #888; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Producción</button>
                    <button id="btn-graph-units" onclick="window.updateGraph('units')" style="background: rgba(255,255,255,0.1); border: 1px solid #444; color: #888; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Unidades</button>
                    <button id="btn-graph-nodes" onclick="window.updateGraph('nodes')" style="background: rgba(255,255,255,0.1); border: 1px solid #444; color: #888; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Territorio</button>
                </div>
                <div style="position: relative;">
                    <canvas id="stats-graph-sp" width="${graphWidth}" height="${graphHeight}" style="border: 1px solid #333; background: rgba(0,0,0,0.3); border-radius: 4px;"></canvas>
                    <button onclick="window.downloadGraph()" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 3px; font-size: 10px; padding: 4px 8px; cursor: pointer;">⬇️ IMG</button>
                </div>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.id = 'game-over-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 1000;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            font-family: 'Courier New', monospace;
            backdrop-filter: blur(5px);
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            padding: 30px 40px; background: #141419;
            border: 2px solid ${color}; border-radius: 12px;
            text-align: center; position: relative;
            max-width: 600px; width: 90%;
            box-shadow: 0 0 50px ${color}40;
        `;

        box.innerHTML = `
            <h1 style="color: ${color}; font-size: 42px; margin: 0 0 10px 0; letter-spacing: 6px; text-shadow: 0 0 20px ${color}60;">${msg}</h1>
            <p style="color: #888; font-size: 12px; margin-bottom: 20px;">${won ? 'Has dominado el mapa' : 'Tus fuerzas han caído'}</p>
            
            ${graphUI}
            ${statsHTML}
            
            <button onclick="location.reload()" style="
                margin-top: 20px; padding: 12px 30px;
                background: ${color}; border: none; border-radius: 4px;
                color: white; font-family: 'Courier New', monospace;
                font-size: 14px; cursor: pointer; letter-spacing: 2px;
                transition: all 0.2s; box-shadow: 0 0 15px ${color}40;">
                JUGAR DE NUEVO
            </button>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // Define graph update function globally so buttons can call it
        window.updateGraph = (type) => {
            const canvas = document.getElementById('stats-graph-sp');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;

            ctx.clearRect(0, 0, w, h);

            let dataArray = [];
            let title = '';
            let timeScale = 1; // Divide time by this to get minutes

            // Update active button style
            ['prod', 'units', 'nodes'].forEach(t => {
                const btn = document.getElementById(`btn-graph-${t}`);
                if (btn) btn.style.borderColor = t === type ? color : '#444';
                if (btn) btn.style.color = t === type ? color : '#888';
            });

            if (type === 'production') {
                dataArray = stats.productionHistory || [];
                title = 'PRODUCCIÓN (Unidades/Min)';
                timeScale = 1; // Already in minutes
            } else if (type === 'units') {
                dataArray = stats.history || [];
                title = 'EJÉRCITO TOTAL';
                timeScale = 60; // Seconds to minutes
            } else if (type === 'nodes') {
                dataArray = stats.nodeHistory || [];
                title = 'TERRITORIO (Nodos)';
                timeScale = 60; // Seconds to minutes
            }

            if (!dataArray || dataArray.length === 0) {
                ctx.fillStyle = '#444';
                ctx.textAlign = 'center';
                ctx.fillText('No hay datos disponibles', w / 2, h / 2);
                return;
            }

            // Find max value
            let maxVal = 0;
            dataArray.forEach(p => {
                const val = p.rate !== undefined ? p.rate : p.count;
                if (val > maxVal) maxVal = val;
            });
            maxVal = Math.ceil(Math.max(maxVal, 5) * 1.1); // Min 5, 10% padding

            // Draw Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i <= 4; i++) {
                const y = h - (i / 4) * h * 0.9 - 5;
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.font = '10px monospace';
                ctx.fillText(Math.round((i / 4) * maxVal), 5, y - 2);
            }
            ctx.stroke();

            // Group by player
            const playerData = {};
            dataArray.forEach(p => {
                if (!playerData[p.playerId]) playerData[p.playerId] = [];
                playerData[p.playerId].push(p);
            });

            // Draw Lines
            for (let pid in playerData) {
                const data = playerData[pid];
                data.sort((a, b) => a.time - b.time);

                const pC = playerColors[parseInt(pid) % playerColors.length];
                ctx.strokeStyle = pC;
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                ctx.beginPath();

                data.forEach((p, i) => {
                    const val = p.rate !== undefined ? p.rate : p.count;
                    const t = (p.time / timeScale);
                    const x = (t / (stats.elapsed || 1)) * w;
                    const y = h - (val / maxVal) * h * 0.9 - 5;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();

                // Dots (optional, maybe too many?)
                // Only draw dots if few points
                if (data.length < 50) {
                    ctx.fillStyle = pC;
                    data.forEach(p => {
                        const val = p.rate !== undefined ? p.rate : p.count;
                        const t = (p.time / timeScale);
                        const x = (t / (stats.elapsed || 1)) * w;
                        const y = h - (val / maxVal) * h * 0.9 - 5;
                        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
                    });
                }
            }

            // Title
            ctx.fillStyle = '#888';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(title, w / 2, 15);
        };

        window.downloadGraph = () => {
            const canvas = document.getElementById('stats-graph-sp');
            if (canvas) {
                const link = document.createElement('a');
                link.download = `nanowar-stats-${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();
            }
        };

        // Draw initial graph
        setTimeout(() => {
            window.updateGraph('production');
        }, 100);
    }
}


/***/ },

/***/ "./src/client/systems/InputManager.js"
/*!********************************************!*\
  !*** ./src/client/systems/InputManager.js ***!
  \********************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   InputManager: () => (/* binding */ InputManager)
/* harmony export */ });
/* harmony import */ var _SoundManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SoundManager.js */ "./src/client/systems/SoundManager.js");


class InputManager {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.mouse = { x: 0, y: 0, down: false, rightDown: false, drag: false };
        this.mouseDownPos = { x: 0, y: 0 };
        this.isPanning = false;
        this.spaceDown = false;
        this.nodeUnderMouse = null; // Track if mouse is over a node
        this.setupEvents();
    }

    setupEvents() {
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.mouseDownPos = { x: this.mouse.x, y: this.mouse.y };

        if (this.spaceDown || e.button === 1) {
            this.isPanning = true;
            return;
        }

        // Check if mouse is over a node
        const worldPos = this.game.camera.screenToWorld(this.mouse.x, this.mouse.y);
        this.nodeUnderMouse = this.game.state.nodes.find(n => {
            const dx = n.x - worldPos.x, dy = n.y - worldPos.y;
            return Math.sqrt(dx * dx + dy * dy) < n.radius + 10;
        }) || null;

        if (e.button === 0) this.mouse.down = true;
        if (e.button === 2) this.mouse.rightDown = true;

        this.game.systems.selection.handleMouseDown(this.mouse, e);
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (this.isPanning) {
            const dx = mx - this.mouse.x;
            const dy = my - this.mouse.y;
            this.game.camera.pan(dx, dy);
        } else if (this.mouse.down || this.mouse.rightDown) {
            const dx = mx - this.mouseDownPos.x;
            const dy = my - this.mouseDownPos.y;
            if (Math.sqrt(dx * dx + dy * dy) > 5) this.mouse.drag = true;
        }

        this.mouse.x = mx;
        this.mouse.y = my;

        if (!this.isPanning) {
            this.game.systems.selection.handleMouseMove(this.mouse, e);
        }
    }

    onMouseUp(e) {
        this.isPanning = false;
        if (e.button === 0) this.mouse.down = false;
        if (e.button === 2) this.mouse.rightDown = false;

        this.game.systems.selection.handleMouseUp(this.mouse, e);
        this.mouse.drag = false;
    }

    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.8 : 1.2; // Increase speed slightly
        this.game.camera.zoomAt(this.mouse.x, this.mouse.y, delta);
    }

    onKeyDown(e) {
        if (e.code === 'Space') {
            this.spaceDown = true;
            e.preventDefault();
        }
        if (e.code === 'KeyT') {
            this.game.systems.selection.rallyMode = true;
        }
        if (e.code === 'KeyS') {
            const sel = this.game.systems.selection;
            if (this.game.controller && this.game.controller.sendAction) {
                this.game.controller.sendAction({
                    type: 'stop',
                    unitIds: Array.from(sel.selectedEntities)
                });
            } else {
                sel.selectedEntities.forEach(id => {
                    const ent = this.game.state.entities.find(e => e.id === id);
                    if (ent) ent.stop();
                });
            }
        }
    }

    onKeyUp(e) {
        if (e.code === 'Space') {
            this.spaceDown = false;
        }
    }

    update(dt) {
    }
}


/***/ },

/***/ "./src/client/systems/SelectionManager.js"
/*!************************************************!*\
  !*** ./src/client/systems/SelectionManager.js ***!
  \************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SelectionManager: () => (/* binding */ SelectionManager)
/* harmony export */ });
/* harmony import */ var _SoundManager_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SoundManager.js */ "./src/client/systems/SoundManager.js");


class SelectionManager {
    constructor(game) {
        this.game = game;
        this.selectedNodes = new Set();
        this.selectedEntities = new Set();
        this.isSelectingBox = false;
        this.boxStart = { x: 0, y: 0 };
        this.currentPath = [];
        this.rallyMode = false;
    }

    isSelected(obj) {
        if (obj.radius > 10) {
            return this.selectedNodes.has(obj.id);
        }
        return this.selectedEntities.has(obj.id);
    }

    handleMouseDown(mouse, event) {
        const worldPos = this.game.camera.screenToWorld(mouse.x, mouse.y);

        if (event.button === 0) { // Left Click
            const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
            if (this.rallyMode && this.selectedNodes.size > 0) {
                const targetNode = this.game.state.nodes.find(n => {
                    const dx = n.x - worldPos.x, dy = n.y - worldPos.y;
                    return Math.sqrt(dx * dx + dy * dy) < n.radius + 10;
                });

                if (this.game.controller.sendAction) {
                    this.game.controller.sendAction({
                        type: 'rally',
                        nodeIds: Array.from(this.selectedNodes),
                        targetX: worldPos.x,
                        targetY: worldPos.y,
                        targetNodeId: targetNode ? targetNode.id : null
                    });
                } else {
                    this.selectedNodes.forEach(id => {
                        const node = this.game.state.nodes.find(n => n.id === id);
                        if (node && node.owner === playerIndex) node.setRallyPoint(worldPos.x, worldPos.y, targetNode);
                    });
                }
                this.rallyMode = false;
                return;
            }

            if (!event.shiftKey) {
                this.clear();
            }
            this.boxStart = { x: mouse.x, y: mouse.y };

            if (event.detail === 2) { // Double click
                this.handleDoubleClick(mouse.x, mouse.y);
                return;
            }
        }

        if (event.button === 2) { // Right Click
            this.currentPath = [worldPos];
            this.handleRightClick(worldPos.x, worldPos.y);
        }
    }

    handleDoubleClick(mx, my) {
        const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
        const clickedNode = this.game.state.nodes.find(n => n.isPointInside(mx, my, this.game.camera));
        if (clickedNode) {
            // Select all nodes of the same owner
            this.game.state.nodes.filter(n => n.owner === clickedNode.owner).forEach(n => {
                this.selectedNodes.add(n.id);
                // Also select units around them if owner is player
                if (n.owner === playerIndex) {
                    this.game.state.entities.forEach(e => {
                        if (e.owner === playerIndex && !e.dead && !e.dying) {
                            const dx = e.x - n.x, dy = e.y - n.y;
                            if (Math.sqrt(dx * dx + dy * dy) <= n.influenceRadius) {
                                this.selectedEntities.add(e.id);
                            }
                        }
                    });
                }
            });
            return;
        }
        const clickedEntity = this.game.state.entities.find(e => !e.dead && !e.dying && e.isPointInside(mx, my, this.game.camera));
        if (clickedEntity) {
            const cam = this.game.camera;

            this.game.state.entities.forEach(e => {
                if (!e.dead && !e.dying && e.owner === clickedEntity.owner) {
                    // Only select if within the current screen view
                    const screen = cam.worldToScreen(e.x, e.y);
                    if (screen.x >= 0 && screen.x <= window.innerWidth && screen.y >= 0 && screen.y <= window.innerHeight) {
                        this.selectedEntities.add(e.id);
                    }
                }
            });
        }
    }

    handleMouseMove(mouse, event) {
        if (mouse.down && mouse.drag) {
            this.isSelectingBox = true;
        }
        if (mouse.rightDown) {
            const worldPos = this.game.camera.screenToWorld(mouse.x, mouse.y);
            // Only add if different enough from last point (30 pixels)
            const lastPoint = this.currentPath[this.currentPath.length - 1];
            const dx = worldPos.x - lastPoint.x;
            const dy = worldPos.y - lastPoint.y;

            if (Math.sqrt(dx * dx + dy * dy) > 30) {
                this.currentPath.push(worldPos);

                // In singleplayer, apply locally. In multiplayer, we might need a specific action.
                // For now, waypoint painting is locally predicted but authoritative on server.
                if (!this.game.controller.sendAction) {
                    this.selectedEntities.forEach(id => {
                        const ent = this.game.state.entities.find(e => e.id === id);
                        if (ent && !ent.dead) {
                            ent.addWaypoint(worldPos.x, worldPos.y);
                        }
                    });
                }
            }
        }
    }


    selectAt(mx, my) {
        const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
        const clickedNode = this.game.state.nodes.find(n => n.isPointInside(mx, my, this.game.camera));
        if (clickedNode) {
            this.selectedNodes.add(clickedNode.id);
            // Also select units in its area if owned by player
            if (clickedNode.owner === playerIndex) {
                this.game.state.entities.forEach(e => {
                    if (e.owner === playerIndex && !e.dead && !e.dying) {
                        const dx = e.x - clickedNode.x, dy = e.y - clickedNode.y;
                        if (Math.sqrt(dx * dx + dy * dy) <= clickedNode.influenceRadius) {
                            this.selectedEntities.add(e.id);
                        }
                    }
                });
            }
            return;
        }

        const clickedEntity = this.game.state.entities.find(e => !e.dead && !e.dying && e.isPointInside(mx, my, this.game.camera));
        if (clickedEntity) {
            this.selectedEntities.add(clickedEntity.id);
            return;
        }
    }

    selectInBox(x1, y1, x2, y2) {
        const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
        this.game.state.entities.forEach(e => {
            if (e.owner === playerIndex && !e.dead && e.isInsideRect(x1, y1, x2, y2, this.game.camera)) {
                this.selectedEntities.add(e.id);
            }
        });
        this.game.state.nodes.forEach(n => {
            if (n.owner === playerIndex && n.isInsideRect(x1, y1, x2, y2, this.game.camera)) {
                this.selectedNodes.add(n.id);
                // Also select units around it
                this.game.state.entities.forEach(e => {
                    if (e.owner === playerIndex && !e.dead && !e.dying) {
                        const dx = e.x - n.x, dy = e.y - n.y;
                        if (Math.sqrt(dx * dx + dy * dy) <= n.influenceRadius) {
                            this.selectedEntities.add(e.id);
                        }
                    }
                });
            }
        });
    }

    handleRightClick(worldX, worldY) {
        const targetNode = this.game.state.nodes.find(n => {
            const dx = n.x - worldX, dy = n.y - worldY;
            return Math.sqrt(dx * dx + dy * dy) < n.radius;
        });

        if (this.selectedEntities.size > 0) {
            this.executeCommand(worldX, worldY, targetNode);
        }
    }

    handleMouseUp(mouse, event) {
        if (event.button === 0) {
            // Check if this was a drag from a selected node to set rally point
            if (mouse.drag && this.selectedNodes.size > 0) {
                // Check if ended on a node (or anywhere - allow setting rally anywhere)
                const worldPos = this.game.camera.screenToWorld(mouse.x, mouse.y);
                const targetNode = this.game.state.nodes.find(n => {
                    const dx = n.x - worldPos.x, dy = n.y - worldPos.y;
                    return Math.sqrt(dx * dx + dy * dy) < n.radius + 15;
                });
                
                const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
                
                // Check if we dragged far enough to be intentional
                const dragDist = Math.sqrt(
                    Math.pow(mouse.x - this.game.systems.input.mouseDownPos.x, 2) +
                    Math.pow(mouse.y - this.game.systems.input.mouseDownPos.y, 2)
                );
                
                if (dragDist > 20) { // Must drag at least 20 pixels
                    if (this.game.controller.sendAction) {
                        this.game.controller.sendAction({
                            type: 'rally',
                            nodeIds: Array.from(this.selectedNodes),
                            targetX: worldPos.x,
                            targetY: worldPos.y,
                            targetNodeId: targetNode ? targetNode.id : null
                        });
                    } else {
                        this.selectedNodes.forEach(id => {
                            const node = this.game.state.nodes.find(n => n.id === id);
                            if (node && node.owner === playerIndex) node.setRallyPoint(worldPos.x, worldPos.y, targetNode);
                        });
                    }
                    this.game.systems.input.nodeUnderMouse = null;
                    this.isSelectingBox = false;
                    return;
                }
            }

            if (this.isSelectingBox) {
                this.selectInBox(
                    this.game.systems.input.mouseDownPos.x,
                    this.game.systems.input.mouseDownPos.y,
                    mouse.x,
                    mouse.y
                );
                this.isSelectingBox = false;
            } else {
                this.selectAt(mouse.x, mouse.y);
            }
            // Play selection sound
            if (this.selectedEntities.size > 0 || this.selectedNodes.size > 0) {
                _SoundManager_js__WEBPACK_IMPORTED_MODULE_0__.sounds.playSelect();
            }
        }
        if (event.button === 2) {
            if (this.currentPath.length > 2 && this.selectedEntities.size > 0) {
                const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
                // Add a visual waypoint line to the game
                this.game.spawnWaypointLine([...this.currentPath], playerIndex);

                if (this.game.controller.sendAction) {
                    this.game.controller.sendAction({
                        type: 'path',
                        unitIds: Array.from(this.selectedEntities),
                        path: this.currentPath
                    });
                }
                _SoundManager_js__WEBPACK_IMPORTED_MODULE_0__.sounds.playMove();
            }
            this.currentPath = [];
        }
        // Clear node under mouse after mouse up
        this.game.systems.input.nodeUnderMouse = null;
    }

    applyPathToSelection() {
        this.selectedEntities.forEach(id => {
            const ent = this.game.state.entities.find(e => e.id === id);
            if (ent && !ent.dead) {
                ent.waypoints = [...this.currentPath];
                ent.currentTarget = null;
            }
        });
    }

    executeCommand(worldX, worldY, targetNode) {
        this.game.spawnCommandIndicator(worldX, worldY, targetNode ? 'attack' : 'move');
        
        // Play sound
        if (targetNode && targetNode.owner !== -1 && targetNode.owner !== (this.game.controller.playerIndex || 0)) {
            _SoundManager_js__WEBPACK_IMPORTED_MODULE_0__.sounds.playAttack();
        } else {
            _SoundManager_js__WEBPACK_IMPORTED_MODULE_0__.sounds.playMove();
        }

        if (this.game.controller.sendAction) {
            // Multiplayer execution via server
            this.game.controller.sendAction({
                type: 'move',
                sourceNodeId: null, // Logic on server handles this if needed or uses IDs directly
                targetNodeId: targetNode ? targetNode.id : null,
                targetX: worldX,
                targetY: worldY,
                unitIds: Array.from(this.selectedEntities)
            });
        } else {
            // Singleplayer local execution
            this.selectedEntities.forEach(id => {
                const ent = this.game.state.entities.find(e => e.id === id);
                if (ent && !ent.dead) {
                    ent.setTarget(worldX, worldY, targetNode);
                }
            });
        }
    }

    clear() {
        this.selectedNodes.clear();
        this.selectedEntities.clear();
        this.rallyMode = false;
    }
}


/***/ },

/***/ "./src/client/systems/SoundManager.js"
/*!********************************************!*\
  !*** ./src/client/systems/SoundManager.js ***!
  \********************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SoundManager: () => (/* binding */ SoundManager),
/* harmony export */   sounds: () => (/* binding */ sounds)
/* harmony export */ });
// Simple Sound Manager using Web Audio API
// No external files needed - generates sounds programmatically

class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.playerIndex = 0; // Default to player 0
        this.init();
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    setPlayerIndex(idx) {
        this.playerIndex = idx;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, duration, type = 'sine', volume = 0.1) {
        if (!this.ctx || !this.enabled) return;
        
        this.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playSelect() {
        this.playTone(700, 0.05, 'triangle', 0.06);
    }

    playMove() {
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        // Quick double blip - rhythmic
        [400, 500].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            const startTime = this.ctx.currentTime + i * 0.05;
            
            gain.gain.setValueAtTime(0.08, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 0.06);
        });
    }

    playAttack() {
        // Harsh descending sound
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playCapture() {
        // Simple satisfying "ding" - not too loud
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        // Single clear tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 880;
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    playNodeHealing(percent) {
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        // Frequency increases with percent: 200Hz at 0%, 900Hz at 100%
        const freq = 200 + percent * 700;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // Satisfying envelope
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playCollision() {
        // Short satisfying "pop" for cell collisions - own cells only
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        // Quick frequency sweep for "pop" effect
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playSpawn() {
        // Quick blip
        this.playTone(600, 0.05, 'sine', 0.04);
    }

    playWin() {
        // Victory fanfare
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'square';
            osc.frequency.value = freq;
            
            const startTime = this.ctx.currentTime + i * 0.15;
            gain.gain.setValueAtTime(0.1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    playLose() {
        // Sad descending
        if (!this.ctx || !this.enabled) return;
        this.resume();
        
        const notes = [400, 350, 300, 250];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            
            const startTime = this.ctx.currentTime + i * 0.2;
            gain.gain.setValueAtTime(0.08, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Global instance
const sounds = new SoundManager();


/***/ },

/***/ "./src/client/systems/UIManager.js"
/*!*****************************************!*\
  !*** ./src/client/systems/UIManager.js ***!
  \*****************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   UIManager: () => (/* binding */ UIManager)
/* harmony export */ });
class UIManager {
    constructor(game) {
        this.game = game;
        this.lastProductionUpdate = 0;
    }

    draw(renderer) {
        const ctx = renderer.ctx;
        const h = this.game.canvas.height;
        const w = this.game.canvas.width;

        const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;

        // --- PLAYER INFO (Bottom Left) ---
        const playerColor = [
            '#4CAF50', '#f44336', '#2196F3', '#FF9800',
            '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'
        ][playerIndex % 8];

        ctx.fillStyle = playerColor;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`ERES JUGADOR ${playerIndex + 1}`, 20, h - 40);

        // Game timer
        const elapsed = this.game.state.elapsedTime || 0;
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(`TIEMPO: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, h - 20);

        // --- SELECTION INFO (Top Right - Below DOM Header) ---
        const selectionCount = this.game.systems.selection.selectedEntities.size;

        // Background for selection (shifted down to avoid top bar buttons)
        const selBoxY = 70;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(w - 220, selBoxY, 210, 40);
        ctx.strokeStyle = playerColor;
        ctx.strokeRect(w - 220, selBoxY, 210, 40);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`SELECCIONADOS: ${selectionCount}`, w - 20, selBoxY + 25);


        // --- STATS PANEL (Bottom Right) ---
        // Combine Production Rates and Unit Counts
        const showProduction = this.game.state.showProduction;
        const playerCount = this.game.state.playerCount;

        // Calculate height based on players
        // Header (30) + Player Rows (24 * count) - Increased spacing
        const panelHeight = 45 + (playerCount * 24);
        const panelWidth = 280; // Wider for larger text
        const panelX = w - panelWidth - 20;
        const panelY = h - panelHeight - 20; // More padding from bottom

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; // Darker
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = '#555';
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Header
        ctx.fillStyle = '#bbb';
        ctx.font = 'bold 13px monospace'; // Larger header
        ctx.textAlign = 'left';
        ctx.fillText('ESTADÍSTICAS (PROD/MIN | TOT)', panelX + 15, panelY + 25);

        // Separator
        ctx.beginPath();
        ctx.moveTo(panelX + 10, panelY + 35);
        ctx.lineTo(panelX + panelWidth - 10, panelY + 35);
        ctx.strokeStyle = '#777';
        ctx.stroke();

        const colors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];

        ctx.font = 'bold 14px monospace'; // Larger body font
        for (let i = 0; i < playerCount; i++) {
            const isMe = i === playerIndex;
            const pColor = colors[i % colors.length];

            // Production Rate
            const rawRate = this.game.state.productionRates?.[i] || 0;
            const ratePerMin = Math.round(rawRate * 60);

            // Total Produced
            const stats = this.game.state.stats;
            const produced = stats?.unitsProduced?.[i]?.total || (typeof stats?.unitsProduced?.[i] === 'number' ? stats.unitsProduced[i] : 0);

            // Current Units (Active)
            const current = stats?.unitsCurrent?.[i] || 0;

            ctx.fillStyle = pColor;
            const label = isMe ? 'TÚ' : `P${i + 1}`;

            // Format: "P1: 120/m | 500 (200)"
            // Rate | Total (Active)
            const text = `${label}: ${ratePerMin}/m | ${produced} (${current})`;

            ctx.fillText(text, panelX + 15, panelY + 58 + (i * 24));
        }

        // --- RALLY MODE ---
        if (this.game.systems.selection.selectedNodes.size > 0) {
            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('MODO RALLY: T para punto de spawn', w / 2, h - 50);
        }
    }
}


/***/ },

/***/ "./src/client/utils/helpers.js"
/*!*************************************!*\
  !*** ./src/client/utils/helpers.js ***!
  \*************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   drawCircle: () => (/* binding */ drawCircle),
/* harmony export */   hexToRgba: () => (/* binding */ hexToRgba)
/* harmony export */ });
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawCircle(ctx, x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}


/***/ },

/***/ "./src/shared/AIController.js"
/*!************************************!*\
  !*** ./src/shared/AIController.js ***!
  \************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AIController: () => (/* binding */ AIController)
/* harmony export */ });
class AIController {
    constructor(game, playerId, difficulty = 'Normal') {
        this.game = game;
        this.playerId = playerId;
        this.timer = 0;
        this.difficulty = difficulty;

        // Personalities: Aggressive, Defensive, Expansive
        const personalities = ['aggressive', 'defensive', 'expansive'];
        if (this.difficulty === 'Easy') {
            // Easy mode always gets defensive personality - less aggressive
            this.personality = 'defensive';
        } else {
            this.personality = personalities[Math.floor(Math.random() * personalities.length)];
        }

        // Set interval based on difficulty - Easy is VERY slow
        const baseIntervals = {
            'Easy': 5.0,
            'Normal': 1.2,
            'Hard': 0.8,
            'Nightmare': 0.4
        };
        this.decisionInterval = baseIntervals[this.difficulty] + (Math.random() * 0.5);

        console.log(`[AI INFO] Player ${playerId} initialized: Difficulty=${this.difficulty}, Personality=${this.personality}`);
    }

    update(dt) {
        this.timer += dt;
        if (this.timer >= this.decisionInterval) {
            this.timer = 0;
            this.makeDecision();
        }
    }

    makeDecision() {
        const myNodes = this.game.state.nodes.filter(n => n.owner === this.playerId);
        const allNodes = this.game.state.nodes;
        const enemyNodes = allNodes.filter(n => n.owner !== this.playerId && n.owner !== -1);
        const neutralNodes = allNodes.filter(n => n.owner === -1);

        if (myNodes.length === 0) return;

        myNodes.forEach(sourceNode => {
            const defenderCount = sourceNode.areaDefenders ? sourceNode.areaDefenders.length : 0;

            // Attack sensitivity based on difficulty and personality
            let minDefendersToStay = 5;
            if (this.difficulty === 'Nightmare') minDefendersToStay = 2;
            if (this.difficulty === 'Hard') minDefendersToStay = 4;
            if (this.difficulty === 'Easy') minDefendersToStay = 18; // Keeps almost all units defending!

            if (this.personality === 'defensive') minDefendersToStay += 5;
            if (this.personality === 'aggressive') minDefendersToStay -= 2;

            // For Easy: prioritize neutrals over attacking
            if (this.difficulty === 'Easy' && neutralNodes.length > 0) {
                // Easy AI focuses on expansion, rarely attacks
                minDefendersToStay = 30; // Super defensive!
            }

            // Heal check for Defensive
            if (this.personality === 'defensive' && sourceNode.hp < sourceNode.maxHp * 0.9) {
                return; // Prioritize healing
            }

            if (defenderCount > minDefendersToStay || (defenderCount > 2 && Math.random() < 0.15)) {
                let bestTarget = null;
                let bestScore = -Infinity;

                allNodes.filter(n => n !== sourceNode).forEach(target => {
                    const dx = target.x - sourceNode.x;
                    const dy = target.y - sourceNode.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Score calculation: higher is better
                    let score = 1000 / dist; // Base proximity score

                    // Ownership modifiers
                    if (target.owner === -1) {
                        // Neutral node
                        let expansionWeight = 1.5;
                        if (this.personality === 'expansive') expansionWeight = 3.0;
                        if (this.difficulty === 'Easy') expansionWeight = 5.0; // Prioritize neutrals!
                        // Reduce priority if we already have many nodes
                        if (myNodes.length > 5) expansionWeight *= 0.5;
                        score *= expansionWeight;
                    } else if (target.owner !== this.playerId) {
                        // Enemy node
                        let attackWeight = 1.0;
                        if (this.personality === 'aggressive') attackWeight = 2.5;
                        if (this.difficulty === 'Nightmare') attackWeight = 3.0;
                        if (this.difficulty === 'Hard') attackWeight = 2.0;
                        if (this.difficulty === 'Easy') attackWeight = 0.1; // Almost never attacks enemies!
                        if (this.difficulty === 'Hard' || this.difficulty === 'Nightmare') {
                            // Target weak enemy nodes
                            if (target.hp < target.maxHp * 0.4) attackWeight *= 2.0;
                        }
                        score *= attackWeight;
                    } else {
                        // Reinforce own node
                        if (this.personality === 'defensive' && target.hp < target.maxHp * 0.5) {
                            score *= 2.0;
                        } else {
                            score *= 0.1; // Low priority to reinforce healthy nodes
                        }
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestTarget = target;
                    }
                });

                if (bestTarget) {
                    this.sendUnits(sourceNode, bestTarget);
                }
            }
        });
    }

    sendUnits(sourceNode, targetNode) {
        const units = this.game.state.entities.filter(e =>
            e.owner === this.playerId &&
            !e.dead &&
            !e.targetNode &&
            Math.sqrt((e.x - sourceNode.x) ** 2 + (e.y - sourceNode.y) ** 2) <= sourceNode.influenceRadius
        );

        if (units.length === 0) return;

        // Attack percentage based on personality/difficulty
        let attackPercent = 0.5;
        if (this.personality === 'aggressive') attackPercent = 0.8;
        if (this.difficulty === 'Nightmare') attackPercent = 0.9;
        if (this.difficulty === 'Hard') attackPercent = 0.65;
        if (this.difficulty === 'Easy') attackPercent = 0.05; // Only 5% of units attack!

        // Sort units by distance to source node (descending)
        // This ensures we send the FURTHEST units first, keeping the CLOSEST ones as defenders
        units.sort((a, b) => {
            const distSqA = (a.x - sourceNode.x) ** 2 + (a.y - sourceNode.y) ** 2;
            const distSqB = (b.x - sourceNode.x) ** 2 + (b.y - sourceNode.y) ** 2;
            return distSqB - distSqA; // Descending order
        });

        const count = Math.ceil(units.length * Math.min(attackPercent, 0.95));
        const attackers = units.slice(0, count);

        attackers.forEach(e => {
            e.setTarget(targetNode.x, targetNode.y, targetNode);
        });
    }
}


/***/ },

/***/ "./src/shared/Entity.js"
/*!******************************!*\
  !*** ./src/shared/Entity.js ***!
  \******************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Entity: () => (/* binding */ Entity)
/* harmony export */ });
/* harmony import */ var _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./GameConfig.js */ "./src/shared/GameConfig.js");


class Entity {
    constructor(x, y, ownerId, id) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.owner = ownerId;

        this.radius = 5;
        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = 50;
        this.speedBoost = 0; // 0 to 1.0 scalar for territorial acceleration
        // Acceleration removed as per request
        this.friction = 0.975;

        this.hp = 1;
        this.damage = 1;
        this.attackCooldown = 0;
        this.selected = false;
        this.dead = false;
        this.dying = false;
        this.deathTime = 0;

        this.waypoints = [];
        this.currentTarget = null;
        this.absorbTarget = null;
        this.targetNode = null;

        this.cohesionRadius = 30;
        this.cohesionForce = 45; // Reduced for more breathing room

        // Map boundary tracking
        this.outsideTime = 0;
        this.outsideWarning = false;
    }

    addWaypoint(x, y) {
        this.waypoints.push({ x, y });
    }

    setTarget(x, y, node = null) {
        this.waypoints = [{ x, y }];
        this.currentTarget = null;
        this.targetNode = node;
    }

    stop() {
        this.waypoints = [];
        this.currentTarget = null;
        this.vx *= 0.3;
        this.vy *= 0.3;
        this.targetNode = null;
    }

    update(dt, spatialGrid, spatialGridNodes, nodes, camera, game) {
        if (this.dying) {
            this.deathTime += dt;
            if (this.deathTime > 0.4) { this.dead = true; }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        this.processWaypoints();
        // Handle physical collisions with other units and nodes
        this.handleCollisionsAndCohesion(spatialGrid, nodes, game);

        // Movement Logic Overhaul
        // 1. Check territory for speed boost
        // 2. Check node proximity for Strict Absorption (target-only)

        let inFriendlyTerritory = false;
        const speedMult = (game?.state?.speedMultiplier) || 1;

        // OPTIMIZATION: Use spatial grid to find nearby nodes instead of iterating all
        // Use a search radius that covers the largest possible influence radius (165px max)
        const nearbyNodes = spatialGridNodes ? spatialGridNodes.retrieveNodes(this.x, this.y, 200) : nodes;

        if (nearbyNodes) {
            for (let node of nearbyNodes) {
                const dx = this.x - node.x;
                const dy = this.y - node.y;
                const distSq = dx * dx + dy * dy;

                // Check territory influence
                if (node.owner === this.owner && node.owner !== -1) {
                    if (distSq < node.influenceRadius * node.influenceRadius) {
                        inFriendlyTerritory = true;
                    }
                }

                // Check proximity interaction (capture/absorb/attack)
                const dist = Math.sqrt(distSq);
                const touchRange = node.radius + this.radius;

                if (dist <= touchRange) {
                    // Neutral node - Capture
                    if (node.owner === -1) {
                        if (!this.dying) {
                            node.receiveAttack(this.owner, 1, game);
                            this.die('attack', node, game);
                        }
                        return; // Unit consumed
                    }

                    // Owned node - Strict Absorption Logic
                    if (node.owner === this.owner && node.owner !== -1) {
                        // Only absorb if explicit target
                        if (this.targetNode === node) {
                            if (node.baseHp < node.maxHp && !this.dying) {
                                node.baseHp += 1;
                                this.die('absorbed', node, game);
                                return; // Unit consumed
                            }
                            // Reached target but full health? Stop and clear target to avoid bouncing
                            this.stop();
                            this.targetNode = null;
                        }
                        // If passing through (no target or different target), doing nothing
                        continue;
                    }

                    // Enemy node - Attack
                    if (node.owner !== this.owner) {
                        if (!this.dying && this.attackCooldown <= 0) {
                            const allDefenders = node.allAreaDefenders || [];

                            // Prioritize defending units first
                            const ownerDefenders = allDefenders.filter(e => e.owner === node.owner && !e.dead && !e.dying);
                            if (ownerDefenders.length > 0) {
                                ownerDefenders[0].die('sacrifice', node, game);
                                this.die('attack', node, game);
                                return;
                            }

                            // Then rival attackers
                            const rivalDefenders = allDefenders.filter(e => e.owner !== this.owner && e.owner !== node.owner && !e.dead && !e.dying);
                            if (rivalDefenders.length > 0) {
                                rivalDefenders[0].die('sacrifice', node, game);
                                this.die('attack', node, game);
                                return;
                            }

                            // Finally hit the node
                            node.receiveAttack(this.owner, 1, game);
                            this.die('attack', node, game);
                            return;
                        }
                    }
                }
            }
        }

        // Random jitter (minimal)
        const randomForce = 10;
        this.vx += (Math.random() - 0.5) * randomForce * dt;
        this.vy += (Math.random() - 0.5) * randomForce * dt;

        // Move towards target (linear force, no ramp-up)
        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                // Strong force for responsive movement
                const moveForce = 800;
                this.vx += (dx / dist) * moveForce * dt;
                this.vy += (dy / dist) * moveForce * dt;
            }
        }

        this.vx *= this.friction;
        this.vy *= this.friction;

        // Calculate max speed with gradual "Acceleration Zone" effect
        if (inFriendlyTerritory) {
            this.speedBoost = Math.min(1.0, this.speedBoost + dt * 2.0); // Ramp up in 0.5s
        } else {
            this.speedBoost = Math.max(0.0, this.speedBoost - dt * 1.0); // Decay in 1.0s
        }

        let currentMaxSpeed = this.maxSpeed * (1 + this.speedBoost * 0.4); // Max 40% boost
        this.hasSpeedBoost = this.speedBoost > 0.1; // Threshold flag for renderer

        currentMaxSpeed *= speedMult;

        // Cap speed
        const speedSq = this.vx * this.vx + this.vy * this.vy;
        const maxSpdSq = currentMaxSpeed * currentMaxSpeed;

        if (speedSq > maxSpdSq) {
            const speed = Math.sqrt(speedSq);
            this.vx = (this.vx / speed) * currentMaxSpeed;
            this.vy = (this.vy / speed) * currentMaxSpeed;
        }

        // Apply movement
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check map boundary - die if outside
        const worldRadius = _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.GAME_SETTINGS.WORLD_RADIUS || 1800;
        const centerX = (_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.GAME_SETTINGS.WORLD_WIDTH || 2400) / 2;
        const centerY = (_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.GAME_SETTINGS.WORLD_HEIGHT || 1800) / 2;
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);

        if (distFromCenter > worldRadius) {
            this.outsideTime += dt;
            this.outsideWarning = true;
            if (this.outsideTime >= (_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.GAME_SETTINGS.OUTSIDE_DEATH_TIME || 5)) {
                this.die('outOfBounds', null, game);
                return;
            }
        } else {
            this.outsideTime = 0;
            this.outsideWarning = false;
        }
    }

    processWaypoints() {
        if (!this.currentTarget && this.waypoints.length > 0) {
            this.currentTarget = this.waypoints.shift();
        }

        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 15) {
                if (this.waypoints.length > 0) {
                    this.currentTarget = this.waypoints.shift();
                } else {
                    this.currentTarget = null;
                }
            }
        }
    }

    handleCollisionsAndCohesion(spatialGrid, nodes, game) {
        // Push entities out of nodes physical radius
        if (nodes) {
            for (let node of nodes) {
                const dx = this.x - node.x;
                const dy = this.y - node.y;
                const distSq = dx * dx + dy * dy;
                const minDist = node.radius + this.radius;

                if (distSq < minDist * minDist && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    this.x += nx * overlap;
                    this.y += ny * overlap;
                    this.vx += nx * 50 * 0.016;
                    this.vy += ny * 50 * 0.016;
                }
            }
        }

        let cohesionX = 0, cohesionY = 0, cohesionCount = 0;
        // Optimized spatial query
        const searchRadius = this.cohesionRadius;
        const neighbors = spatialGrid.retrieve(this.x, this.y, searchRadius);

        // Check if in flock for stronger cohesion
        const inFlock = !!this.flockId;

        for (let other of neighbors) {
            if (other === this || other.dead || other.dying) continue;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > searchRadius * searchRadius) continue;
            const dist = Math.sqrt(distSq);

            // COHESION logic - relaxed to prevent over-stacking
            if (other.owner === this.owner && dist > this.radius * 2.2) {
                if (inFlock && other.flockId === this.flockId) {
                    // Flock: slightly stronger cohesion (1.8x) but less than before
                    cohesionX += (dx / dist) * 1.8;
                    cohesionY += (dy / dist) * 1.8;
                    cohesionCount++;
                } else {
                    // Normal cohesion
                    cohesionX += dx / dist;
                    cohesionY += dy / dist;
                    cohesionCount++;
                }
            }

            // COLLISION logic - intensified to prevent overlapping
            const minDist = this.radius + other.radius;
            if (dist < minDist && dist > 0) {
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                // Push apart more aggressively (0.6 instead of 0.3)
                this.x -= nx * overlap * 0.6;
                this.y -= ny * overlap * 0.6;

                if (this.owner !== other.owner) {
                    this.die('explosion', null, game);
                    other.die('explosion', null, game);
                    return;
                }

                const dvx = other.vx - this.vx;
                const dvy = other.vy - this.vy;
                const velAlongNormal = dvx * nx + dvy * ny;

                if (velAlongNormal > 0) {
                    const j = -(1.3) * velAlongNormal * 0.5;
                    this.vx -= j * nx;
                    this.vy -= j * ny;
                    other.vx += j * nx;
                    other.vy += j * ny;
                }
            }
        }

        if (cohesionCount > 0) {
            cohesionX /= cohesionCount;
            cohesionY /= cohesionCount;
            this.vx += cohesionX * this.cohesionForce * 0.016;
            this.vy += cohesionY * this.cohesionForce * 0.016;
        }

        if (this.currentTarget) this.avoidObstacles(nodes);
    }

    avoidObstacles(nodes) {
        const targetDx = this.currentTarget.x - this.x;
        const targetDy = this.currentTarget.y - this.y;
        const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
        const targetNx = targetDx / targetDist;
        const targetNy = targetDy / targetDist;

        for (let node of nodes) {
            if (this.targetNode === node) continue;
            const dx = node.x - this.x;
            const dy = node.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < node.radius + 60 && dist > 10) {
                const dot = (dx / dist) * targetNx + (dy / dist) * targetNy;
                if (dot > 0.5) {
                    const perpX = -targetNy;
                    const perpY = targetNx;
                    const side = (dx * targetNy - dy * targetNx) > 0 ? 1 : -1;
                    this.vx += perpX * side * 150 * 0.016;
                    this.vy += perpY * side * 150 * 0.016; // Stronger avoidance
                }
            }
        }
    }

    // checkNodeProximity removed as logic is merged into update()

    moveTo(x, y) {
        this.setTarget(x, y);
    }

    getColor() {
        return _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS[this.owner % _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS.length];
    }

    die(type, node = null, game = null) {
        this.dying = true;
        this.deathType = type;
        this.deathTime = 0;
        this.absorbTarget = node;
        const playerColor = this.getColor();
        if (game && game.spawnParticles) {
            if (type === 'explosion' || type === 'absorbed') {
                game.spawnParticles(this.x, this.y, playerColor, 8, 'explosion');
            } else if (type === 'attack') {
                game.spawnParticles(this.x, this.y, playerColor, 5, 'hit');
            }
        }
    }

    isPointInside(mx, my, camera) {
        const screen = camera.worldToScreen(this.x, this.y);
        const dx = mx - screen.x;
        const dy = my - screen.y;
        return Math.sqrt(dx * dx + dy * dy) < (this.radius + 5) * camera.zoom;
    }

    isInsideRect(x1, y1, x2, y2, camera) {
        const screen = camera.worldToScreen(this.x, this.y);
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return screen.x >= minX && screen.x <= maxX && screen.y >= minY && screen.y <= maxY;
    }
}


/***/ },

/***/ "./src/shared/GameConfig.js"
/*!**********************************!*\
  !*** ./src/shared/GameConfig.js ***!
  \**********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GAME_SETTINGS: () => (/* binding */ GAME_SETTINGS),
/* harmony export */   NODE_TYPES: () => (/* binding */ NODE_TYPES),
/* harmony export */   PLAYER_COLORS: () => (/* binding */ PLAYER_COLORS)
/* harmony export */ });
const PLAYER_COLORS = [
    '#4CAF50', '#f44336', '#2196F3', '#FF9800',
    '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'
];

const GAME_SETTINGS = {
    WORLD_WIDTH: 2400,
    WORLD_HEIGHT: 1800,
    WORLD_RADIUS: 1800, // Larger than map - units won't reach it often
    OUTSIDE_DEATH_TIME: 5, // Seconds before unit dies outside boundary
};

const NODE_TYPES = {
    small: { radius: 20, influenceFat: 4, baseHp: 4, maxHp: 12, stockFat: 0.5 },
    medium: { radius: 32, influenceFat: 3.5, baseHp: 7, maxHp: 22, stockFat: 0.5 },
    large: { radius: 55, influenceFat: 3, baseHp: 12, maxHp: 35, stockFat: 0.6 }
};


/***/ },

/***/ "./src/shared/GameState.js"
/*!*********************************!*\
  !*** ./src/shared/GameState.js ***!
  \*********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GameState: () => (/* binding */ GameState)
/* harmony export */ });
/* harmony import */ var _GlobalSpawnTimer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./GlobalSpawnTimer.js */ "./src/shared/GlobalSpawnTimer.js");
/* harmony import */ var _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./GameConfig.js */ "./src/shared/GameConfig.js");
/* harmony import */ var _SpatialGrid_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./SpatialGrid.js */ "./src/shared/SpatialGrid.js");




class GameState {
    constructor() {
        this.nodes = [];
        this.entities = [];
        this.playerCount = 1;
        this.globalSpawnTimer = new _GlobalSpawnTimer_js__WEBPACK_IMPORTED_MODULE_0__.GlobalSpawnTimer(2.5);
        this.worldWidth = _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.WORLD_WIDTH;
        this.worldHeight = _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.WORLD_HEIGHT;
        this.elapsedTime = 0; // Track game time for escalation

        // Game settings (from lobby)
        this.speedMultiplier = 1;
        this.accelerationEnabled = true;
        this.showProduction = true;

        // optimizations
        this.spatialGrid = new _SpatialGrid_js__WEBPACK_IMPORTED_MODULE_2__.SpatialGrid(this.worldWidth, this.worldHeight, 80); // 80px cells for units
        this.spatialGridNodes = new _SpatialGrid_js__WEBPACK_IMPORTED_MODULE_2__.SpatialGrid(this.worldWidth, this.worldHeight, 200); // 200px cells for nodes (larger radius)
        this.maxEntitiesPerPlayer = 1000; // Increased to 1000 per user feedback
        this.unitCounts = {}; // Cache unit counts per player for capping
        this.flockUpdateCounter = 0; // Throttling for flock detection

        // Statistics tracking
        this.stats = {
            startTime: Date.now(),
            unitsProduced: {}, // playerId -> count
            unitsLost: {}, // playerId -> count
            unitsCurrent: {}, // playerId -> current count
            capturedNodes: {}, // playerId -> count
            history: [], // { time, playerId, count }
            productionHistory: [] // { time, playerId, rate, total }
        };
    }

    update(dt, gameInstance) {
        this.elapsedTime += dt;
        this.globalSpawnTimer.update(dt);

        // Apply time-based escalation to spawn intervals
        const timeBonus = Math.min(this.elapsedTime / 120, 1.0); // Max bonus at 2 minutes

        // Populate spatial grid for nodes once (nodes don't move)
        this.spatialGridNodes.clear();
        this.nodes.forEach(node => {
            this.spatialGridNodes.addObject(node);
        });

        // Populate spatial grid once per frame
        this.spatialGrid.clear();
        this.entities.forEach(ent => {
            this.spatialGrid.addObject(ent);
        });

        // --- OPTIMIZACIÓN CPU: THROTTLING DE FLOCKS ---
        // Detectar grupos (flocks) es costoso y no necesita ser frame-perfect.
        // Lo corremos 1 vez cada 15 frames (~4 veces por segundo).
        this.flockUpdateCounter++;
        if (this.flockUpdateCounter >= 15) {
            this._detectFlocks();
            this.flockUpdateCounter = 0;
        }

        // Count units and production rates per player
        this.unitCounts = {};
        this.productionRates = {};
        this.entities.forEach(ent => {
            if (!ent.dead) {
                this.unitCounts[ent.owner] = (this.unitCounts[ent.owner] || 0) + 1;
            }
        });

        this.nodes.forEach(node => {
            // Check cap before spawning
            const canSpawn = (this.unitCounts[node.owner] || 0) < this.maxEntitiesPerPlayer;

            const newEntity = node.update(dt, this.spatialGrid, this.globalSpawnTimer, gameInstance, this.nodes, canSpawn);
            if (newEntity) {
                this.entities.push(newEntity);
                // Track production
                const pid = newEntity.owner;
                this.stats.unitsProduced[pid] = (this.stats.unitsProduced[pid] || 0) + 1;
                this.unitCounts[pid] = (this.unitCounts[pid] || 0) + 1;

                // Add new entity to grid immediately so it interacts
                this.spatialGrid.addObject(newEntity);
            }

            // Track captures
            if (node.justCapturedBy !== undefined) {
                const pid = node.justCapturedBy;
                this.stats.capturedNodes[pid] = (this.stats.capturedNodes[pid] || 0) + 1;
                node.justCapturedBy = undefined;
            }

            // Aggregate production rates
            if (node.owner !== -1) {
                this.productionRates[node.owner] = (this.productionRates[node.owner] || 0) + (node.currentProductionRate || 0);
            }
        });

        const currentUnits = {};
        this.entities.forEach(ent => {
            if (!ent.dead && !ent.dying) {
                currentUnits[ent.owner] = (currentUnits[ent.owner] || 0) + 1;
            }
        });

        // Track unit losses
        this.entities.forEach(ent => {
            if (ent.dead && !ent.lossTracked) {
                ent.lossTracked = true;
                const pid = ent.owner;
                this.stats.unitsLost[pid] = (this.stats.unitsLost[pid] || 0) + 1;
            }
        });

        // Update current counts
        this.stats.unitsCurrent = currentUnits;

        // Record history every second
        const now = Date.now();
        if (now - (this.stats.lastRecord || 0) > 1000) {
            this.stats.lastRecord = now;

            // Count current nodes owned
            const nodesOwned = {};
            this.nodes.forEach(n => {
                if (n.owner !== -1) {
                    nodesOwned[n.owner] = (nodesOwned[n.owner] || 0) + 1;
                }
            });

            const elapsed = (now - this.stats.startTime) / 1000;

            for (let pid in currentUnits) {
                this.stats.history.push({
                    time: elapsed,
                    playerId: parseInt(pid),
                    count: currentUnits[pid]
                });
            }

            // Record node history
            for (let pid in nodesOwned) {
                if (!this.stats.nodeHistory) this.stats.nodeHistory = [];
                this.stats.nodeHistory.push({
                    time: elapsed,
                    playerId: parseInt(pid),
                    count: nodesOwned[pid]
                });
            }
        }

        // Record production rate every 5 seconds (more granular for graph)
        if (now - (this.stats.lastProductionRecord || 0) > 5000) {
            this.stats.lastProductionRecord = now;
            const elapsed = (now - this.stats.startTime) / 60000;
            for (let pid in this.stats.unitsProduced) {
                // Use current production rate from nodes logic (units/sec -> units/min)
                const currentRate = this.productionRates[pid] || 0;
                const ratePerMin = Math.round(currentRate * 60);

                this.stats.productionHistory.push({
                    time: elapsed,
                    playerId: parseInt(pid),
                    rate: ratePerMin,
                    total: this.stats.unitsProduced[pid] || 0
                });
            }
        }

        this.entities.forEach(ent => {
            ent.update(dt, this.spatialGrid, this.spatialGridNodes, this.nodes, null, gameInstance);
        });

        // Clean up dead entities
        this.entities = this.entities.filter(ent => !ent.dead);
    }

    getStats() {
        const elapsed = (Date.now() - this.stats.startTime) / 60000; // minutes
        const result = {
            elapsed: elapsed,
            produced: {},
            lost: {},
            current: {},
            captured: {},
            history: this.stats.history,
            nodeHistory: this.stats.nodeHistory || [],
            productionHistory: this.stats.productionHistory
        };

        for (let pid in this.stats.unitsProduced) {
            result.produced[pid] = {
                total: this.stats.unitsProduced[pid],
                perMinute: elapsed > 0 ? Math.round(this.stats.unitsProduced[pid] / elapsed) : 0
            };
        }

        for (let pid in this.stats.unitsLost) {
            result.lost[pid] = {
                total: this.stats.unitsLost[pid],
                perMinute: elapsed > 0 ? Math.round(this.stats.unitsLost[pid] / elapsed) : 0
            };
        }

        for (let pid in this.stats.unitsCurrent) {
            result.current[pid] = this.stats.unitsCurrent[pid];
        }

        for (let pid in this.stats.capturedNodes) {
            result.captured[pid] = this.stats.capturedNodes[pid];
        }

        return result;
    }

    getState() {
        return {
            nodes: this.nodes.map(n => ({
                id: n.id, x: n.x, y: n.y, owner: n.owner, type: n.type,
                radius: n.radius, influenceRadius: n.influenceRadius,
                baseHp: n.baseHp, maxHp: n.maxHp, stock: n.stock,
                maxStock: n.maxStock, spawnProgress: n.spawnProgress || 0,
                rallyPoint: n.rallyPoint,
                hitFlash: n.hitFlash || 0,
                spawnEffect: n.spawnEffect || 0,
                enemyPressure: n.enemyPressure || false
            })),
            entities: this.entities.map(e => ({
                id: e.id, x: e.x, y: e.y, owner: e.owner, radius: e.radius,
                vx: e.vx, vy: e.vy,
                dying: e.dying, deathType: e.deathType, deathTime: e.deathTime,
                outsideWarning: e.outsideWarning || false
            })),
            playerCount: this.playerCount,
            elapsedTime: this.elapsedTime,
            speedMultiplier: this.speedMultiplier,
            accelerationEnabled: this.accelerationEnabled,
            showProduction: this.showProduction,
            stats: this.getStats(),
            productionRates: this.productionRates
        };
    }

    /**
     * Detect flocks - for medium groups to create intimidating balls
     */
    _detectFlocks() {
        const FLOCK_RADIUS = 45; // Medium radius for ball formation
        const MIN_FLOCK_SIZE = 12; // Minimum units
        const MAX_FLOCK_SIZE = 25; // Max units per flock - creates big intimidating balls

        // Reset flock assignments
        for (const ent of this.entities) {
            if (!ent.dead && !ent.dying) {
                ent.flockId = null;
                ent.isFlockLeader = false;
            }
        }

        // Group entities by owner and mark unassigned units
        const byOwner = {};
        for (const ent of this.entities) {
            if (ent.dead || ent.dying) continue;
            if (!byOwner[ent.owner]) byOwner[ent.owner] = [];
            byOwner[ent.owner].push(ent);
        }

        // For each owner, find flocks using spatial grid
        for (const ownerId in byOwner) {
            const ownerEnts = byOwner[ownerId];
            let flockCounter = 0;

            for (const ent of ownerEnts) {
                // Skip if already assigned to a flock
                if (ent.flockId) continue;

                // Find all units in this potential flock using spatial grid
                const nearby = this.spatialGrid.retrieve(ent.x, ent.y, FLOCK_RADIUS);
                const flock = [];

                for (const other of nearby) {
                    if (other.owner !== parseInt(ownerId)) continue;
                    if (other.flockId) continue;
                    if (other.dead || other.dying) continue;

                    // Check actual distance
                    const dx = other.x - ent.x;
                    const dy = other.y - ent.y;
                    if (dx * dx + dy * dy <= FLOCK_RADIUS * FLOCK_RADIUS) {
                        flock.push(other);
                        if (flock.length >= MAX_FLOCK_SIZE) break;
                    }
                }

                // If we have enough units, assign flock ID
                if (flock.length >= MIN_FLOCK_SIZE) {
                    const flockId = `flock_${ownerId}_${flockCounter++}`;
                    for (let i = 0; i < flock.length; i++) {
                        flock[i].flockId = flockId;
                        flock[i].isFlockLeader = (i === 0);
                    }
                }
            }
        }
    }
}


/***/ },

/***/ "./src/shared/GlobalSpawnTimer.js"
/*!****************************************!*\
  !*** ./src/shared/GlobalSpawnTimer.js ***!
  \****************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GlobalSpawnTimer: () => (/* binding */ GlobalSpawnTimer)
/* harmony export */ });
class GlobalSpawnTimer {
    constructor(interval = 2.5) {
        this.interval = interval;
        this.timer = 0;
        this.shouldSpawn = false;
    }
    update(dt) {
        this.timer += dt;
        if (this.timer >= this.interval) {
            this.timer = 0;
            this.shouldSpawn = true;
            return true;
        }
        this.shouldSpawn = false;
        return false;
    }
}


/***/ },

/***/ "./src/shared/MapGenerator.js"
/*!************************************!*\
  !*** ./src/shared/MapGenerator.js ***!
  \************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MapGenerator: () => (/* binding */ MapGenerator)
/* harmony export */ });
/* harmony import */ var _Node_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Node.js */ "./src/shared/Node.js");


class MapGenerator {
    static generate(playerCount, worldWidth, worldHeight) {
        const nodes = [];
        let idCounter = 0;

        const centerX = worldWidth / 2;
        const centerY = worldHeight / 2;

        // 1. Symmetrical Starting Positions for up to 4 players
        const margin = 250;
        const playerPositions = [
            { x: margin, y: margin }, // Player 0 (Top Left)
            { x: worldWidth - margin, y: worldHeight - margin }, // Player 1 (Bottom Right)
            { x: worldWidth - margin, y: margin }, // Player 2 (Top Right)
            { x: margin, y: worldHeight - margin } // Player 3 (Bottom Left)
        ];

        for (let i = 0; i < playerCount; i++) {
            const pos = playerPositions[i] || { 
                x: centerX + (Math.random() - 0.5) * 400, 
                y: centerY + (Math.random() - 0.5) * 400 
            };
            nodes.push(new _Node_js__WEBPACK_IMPORTED_MODULE_0__.Node(idCounter++, pos.x, pos.y, i, 'large'));
        }

        // 2. Central Conflict Node (Guaranteed large)
        nodes.push(new _Node_js__WEBPACK_IMPORTED_MODULE_0__.Node(idCounter++, centerX, centerY, -1, 'large'));

        // Collision helper (ensures nodes don't overlap or get too close)
        const canPlace = (x, y, r, existing) => {
            for (let n of existing) {
                const dx = x - (n.x || 0), dy = y - (n.y || 0);
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDistance = r + (n.radius || 0) + 140; // Increased padding for better distribution
                if (dist < minDistance) return false;
            }
            return true;
        };

        // 3. Mirror-based Node Generation for fairness
        // Each quadrant will contribute a proportional amount of nodes
        // Range: 5 to 8 nodes per player total.
        const totalNeutralsGoal = Math.floor(playerCount * (5 + Math.random() * 3));
        // Divided by 4 quadrants (rounded up)
        const nodesPerQuadrant = Math.max(1, Math.ceil(totalNeutralsGoal / 4));

        const quadrantNodes = [];
        const tempAll = [...nodes];

        for (let i = 0; i < nodesPerQuadrant; i++) {
            let placed = false;
            const typeProb = Math.random();
            const type = typeProb > 0.8 ? 'large' : typeProb > 0.4 ? 'medium' : 'small';
            const radius = type === 'large' ? 60 : type === 'medium' ? 35 : 20;

            for (let attempt = 0; attempt < 100; attempt++) {
                // Random position in the Top-Left quadrant
                const x = 150 + Math.random() * (centerX - 300);
                const y = 150 + Math.random() * (centerY - 300);

                if (canPlace(x, y, radius, tempAll)) {
                    quadrantNodes.push({ x, y, type, radius });
                    tempAll.push({ x, y, radius });
                    placed = true;
                    break;
                }
            }
        }

        // Mirror the quadrant nodes symmetrically
        quadrantNodes.forEach(q => {
            nodes.push(new _Node_js__WEBPACK_IMPORTED_MODULE_0__.Node(idCounter++, q.x, q.y, -1, q.type)); // Top-Left
            nodes.push(new _Node_js__WEBPACK_IMPORTED_MODULE_0__.Node(idCounter++, worldWidth - q.x, q.y, -1, q.type)); // Top-Right
            nodes.push(new _Node_js__WEBPACK_IMPORTED_MODULE_0__.Node(idCounter++, q.x, worldHeight - q.y, -1, q.type)); // Bottom-Left
            nodes.push(new _Node_js__WEBPACK_IMPORTED_MODULE_0__.Node(idCounter++, worldWidth - q.x, worldHeight - q.y, -1, q.type)); // Bottom-Right
        });

        return nodes;
    }
}


/***/ },

/***/ "./src/shared/Node.js"
/*!****************************!*\
  !*** ./src/shared/Node.js ***!
  \****************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Node: () => (/* binding */ Node)
/* harmony export */ });
/* harmony import */ var _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./GameConfig.js */ "./src/shared/GameConfig.js");
/* harmony import */ var _Entity_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Entity.js */ "./src/shared/Entity.js");

 // Circular dependency if Entity imports Node? Node doesn't import Entity class, but uses it in JSDoc maybe.
// Actually Node creates new Entity in update(). So it needs to import Entity.

class Node {
    constructor(id, x, y, ownerId, type = 'medium') {
        this.id = id; this.x = x; this.y = y; this.owner = ownerId; this.type = type;

        if (type === 'small') {
            this.radius = 20 + Math.random() * 5;
            this.influenceRadius = this.radius * 4;
            this.maxHp = 40; // Was 50
            this.spawnInterval = 4.5; // Was 4.0 - Slower
        }
        else if (type === 'large') {
            this.radius = 55 + Math.random() * 15;
            this.influenceRadius = this.radius * 3;
            this.maxHp = 150; // Was 180
            this.spawnInterval = 2.4; // Was 2.0 - Slower
        }
        else {
            this.radius = 35 + Math.random() * 8;
            this.influenceRadius = this.radius * 3.5;
            this.maxHp = 80; // Was 100
            this.spawnInterval = 3.5; // Was 3.0 - Slower
        }

        // Neutral nodes start at 10% health (same)
        // Owned nodes (starter) start at 50% health (Was 33%) -> Stronger start
        this.baseHp = (this.owner === -1) ? (this.maxHp * 0.1) : (this.maxHp * 0.50);
        this.stock = 0;

        this.spawnEffect = 0;
        this.spawnTimer = 0;
        this.spawnProgress = 0;
        this.defendersInside = 0; this.defenderCounts = {}; this.hitFlash = 0; this.selected = false; this.hasSpawnedThisCycle = false; this.rallyPoint = null; this.enemyPressure = false;
        this.areaDefenders = []; this.allAreaDefenders = [];
    }

    getColor() { return this.owner === -1 ? '#757575' : _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS[this.owner % _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS.length]; }

    setRallyPoint(x, y, targetNode = null) {
        this.rallyPoint = { x, y };
        this.rallyTargetNode = targetNode;
    }

    calculateDefenders(spatialGrid) {
        this.defendersInside = 0;
        this.stockDefenders = 0;
        this.defenderCounts = {};
        this.defendingEntities = [];
        this.allAreaDefenders = [];

        // Use spatial grid to find nearby entities
        // Influence radius is the max check distance
        const nearbyEntities = spatialGrid.retrieve(this.x, this.y, this.influenceRadius);

        for (let e of nearbyEntities) {
            if (e.dead || e.dying) continue;

            // Squared distance check is faster
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const distSq = dx * dx + dy * dy;

            // Area de influencia
            const influenceRadSq = this.influenceRadius * this.influenceRadius;
            if (distSq <= influenceRadSq) {
                this.defenderCounts[e.owner] = (this.defenderCounts[e.owner] || 0) + 1;
                this.allAreaDefenders.push(e);
                if (e.owner === this.owner) {
                    this.areaDefenders.push(e);
                }
            }

            // Dentro del nodo para stock
            // Approximate radius check to avoid sqrt if possible, or just do it
            const stockRad = this.radius + e.radius + 5;
            if (distSq <= stockRad * stockRad) {
                if (e.owner === this.owner) {
                    this.defendersInside++;
                    this.stockDefenders++;
                    this.defendingEntities.push(e);
                }
            }
        }
    }

    getTotalHp() {
        return Math.min(this.maxHp, this.baseHp);
    }

    receiveAttack(attackerId, damage, game) {
        // Don't allow defeated players to capture nodes
        if (game && game.playerSockets) {
            const player = game.playerSockets[attackerId];
            if (player && player.defeated) {
                return false; // Can't capture nodes
            }
        }

        this.hitFlash = 0.3;
        const attackerColor = _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS[attackerId % _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS.length];
        if (game) game.spawnParticles(this.x, this.y, attackerColor, 3, 'hit');

        this.baseHp -= damage;
        if (this.baseHp <= 0) {
            this.owner = attackerId;
            // Captured nodes start at 10% health
            this.baseHp = this.maxHp * 0.1;
            this.stock = 0;
            this.hasSpawnedThisCycle = false;
            this.rallyPoint = null;
            this.justCapturedBy = attackerId; // Flag for GameState stats
            if (game) game.spawnParticles(this.x, this.y, _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS[attackerId % _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS.length], 20, 'explosion');
            return true;
        }
        return false;
    }

    update(dt, spatialGrid, globalSpawnTimer, game, allNodes, canSpawn = true) {
        this.calculateDefenders(spatialGrid);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.spawnEffect > 0) this.spawnEffect -= dt;

        // Check if enemies outnumber us in area - pause spawning
        this.enemyPressure = false;
        if (this.owner !== -1 && this.areaDefenders) {
            const myDefenders = this.areaDefenders.length;
            let enemyInArea = 0;
            for (let e of this.allAreaDefenders) {
                if (e.owner !== this.owner) enemyInArea++;
            }
            // If enemies outnumber us, pause spawn
            if (enemyInArea > myDefenders) {
                this.enemyPressure = true;
            }
        }

        if (this.owner !== -1) {
            // Heal node slowly if not at max
            const healRate = 0.5;
            if (this.baseHp < this.maxHp) {
                this.baseHp += healRate * dt;
            }

            // Check if node is full (100%+ health = bonus production)
            const isFull = this.baseHp >= this.maxHp;

            this.spawnTimer += dt;
            const healthPercent = Math.min(this.baseHp / this.maxHp, 1.0);

            // Base generation: 0.5 at 0% HP, up to 1.5 at 100% HP (3x faster)
            let healthScaling = 0.5 + healthPercent * 1.0;

            // Extra bonus at full health (0.5 extra = up to 2x total)
            if (isFull) {
                healthScaling += 0.5;
            }

            // Type bonus: large nodes produce more
            if (this.type === 'large') {
                healthScaling += 0.5; // Large nodes get +50% production (reduced from 100%)
            }

            // Cluster bonus: more defenders = more production
            const defenderCount = this.areaDefenders ? this.areaDefenders.length : 0;
            const clusterBonus = Math.min(defenderCount * 0.1, 0.5); // Up to 0.5 extra with 5+ defenders
            healthScaling += clusterBonus;

            const spawnThreshold = this.spawnInterval / healthScaling;

            // Store current production rate for UI (units per second)
            // If neutral, production is effectively 0 for player stats
            this.currentProductionRate = (this.owner !== -1) ? (1 / spawnThreshold) : 0;
            // Player must click to spawn units
            if (!this.manualSpawnReady && this.spawnTimer >= spawnThreshold && this.baseHp > (this.maxHp * 0.1)) {
                // Auto spawn is disabled - just reset timer and show progress
                this.manualSpawnReady = true;
            }

            // Manual spawn - when player clicks on node
            // Added check for canSpawn to implement entity cap
            if (canSpawn && this.manualSpawnReady && this.spawnTimer >= spawnThreshold && this.baseHp > (this.maxHp * 0.1)) {
                this.spawnTimer = 0;
                this.manualSpawnReady = false;

                // Spawn at middle of influence radius (not too close to edge, not too close to center)
                const angle = Math.random() * Math.PI * 2;
                const spawnDist = this.influenceRadius * 0.6; // 60% from center
                const ex = this.x + Math.cos(angle) * spawnDist, ey = this.y + Math.sin(angle) * spawnDist;
                const entity = new _Entity_js__WEBPACK_IMPORTED_MODULE_1__.Entity(ex, ey, this.owner, Date.now() + Math.random());

                // If no rally point, just stay there floating (no target)
                if (!this.rallyPoint) {
                    // No target - will float in place with random movement
                } else {
                    entity.setTarget(this.rallyPoint.x, this.rallyPoint.y, this.rallyTargetNode);
                }

                this.spawnEffect = 0.4;
                if (game) game.spawnParticles(this.x, this.y, this.getColor(), 6, 'explosion');
                return entity;
            }

            // Show progress
            this.spawnProgress = this.spawnTimer / spawnThreshold;
        } else {
            this.spawnTimer = 0;
            this.spawnProgress = 0;
        }
        return null;
    }
    isPointInside(mx, my, camera) {
        const screen = camera.worldToScreen(this.x, this.y);
        const dx = mx - screen.x;
        const dy = my - screen.y;
        return Math.sqrt(dx * dx + dy * dy) < (this.radius + 10) * camera.zoom;
    }

    isInsideRect(x1, y1, x2, y2, camera) {
        const screen = camera.worldToScreen(this.x, this.y);
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return screen.x >= minX && screen.x <= maxX && screen.y >= minY && screen.y <= maxY;
    }
}


/***/ },

/***/ "./src/shared/SpatialGrid.js"
/*!***********************************!*\
  !*** ./src/shared/SpatialGrid.js ***!
  \***********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SpatialGrid: () => (/* binding */ SpatialGrid)
/* harmony export */ });
class SpatialGrid {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.cells = new Map();
        this.queryIds = 0;
        
        // Pre-allocated array for retrieve() to avoid GC
        this._resultArray = [];
        this._resultLength = 0;
    }

    clear() {
        this.cells.clear();
    }

    _getKey(col, row) {
        return col + "," + row;
    }

    addObject(obj) {
        const col = Math.floor(obj.x / this.cellSize);
        const row = Math.floor(obj.y / this.cellSize);

        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const key = this._getKey(col, row);
            if (!this.cells.has(key)) {
                this.cells.set(key, []);
            }
            this.cells.get(key).push(obj);
        }
    }

    // Retrieve objects - optimized with pre-allocated array
    retrieve(x, y, radius) {
        // Reset result array without allocation
        this._resultLength = 0;
        
        const startCol = Math.floor((x - radius) / this.cellSize);
        const endCol = Math.floor((x + radius) / this.cellSize);
        const startRow = Math.floor((y - radius) / this.cellSize);
        const endRow = Math.floor((y + radius) / this.cellSize);

        for (let c = startCol; c <= endCol; c++) {
            if (c < 0 || c >= this.cols) continue;
            for (let r = startRow; r <= endRow; r++) {
                if (r < 0 || r >= this.rows) continue;

                const key = this._getKey(c, r);
                const cellObjects = this.cells.get(key);
                if (cellObjects) {
                    for (let i = 0; i < cellObjects.length; i++) {
                        this._resultArray[this._resultLength++] = cellObjects[i];
                    }
                }
            }
        }
        return this._resultArray;
    }

    // Callback-based query - most efficient, no allocations
    query(x, y, radius, callback) {
        const startCol = Math.floor((x - radius) / this.cellSize);
        const endCol = Math.floor((x + radius) / this.cellSize);
        const startRow = Math.floor((y - radius) / this.cellSize);
        const endRow = Math.floor((y + radius) / this.cellSize);

        for (let c = startCol; c <= endCol; c++) {
            if (c < 0 || c >= this.cols) continue;
            for (let r = startRow; r <= endRow; r++) {
                if (r < 0 || r >= this.rows) continue;

                const key = this._getKey(c, r);
                const cellObjects = this.cells.get(key);
                if (cellObjects) {
                    for (let i = 0; i < cellObjects.length; i++) {
                        callback(cellObjects[i]);
                    }
                }
            }
        }
    }

    // Retrieve only nodes - also optimized
    retrieveNodes(x, y, searchRadius) {
        this._resultLength = 0;
        
        const startCol = Math.floor((x - searchRadius) / this.cellSize);
        const endCol = Math.floor((x + searchRadius) / this.cellSize);
        const startRow = Math.floor((y - searchRadius) / this.cellSize);
        const endRow = Math.floor((y + searchRadius) / this.cellSize);

        for (let c = startCol; c <= endCol; c++) {
            if (c < 0 || c >= this.cols) continue;
            for (let r = startRow; r <= endRow; r++) {
                if (r < 0 || r >= this.rows) continue;

                const key = this._getKey(c, r);
                const cellObjects = this.cells.get(key);
                if (cellObjects) {
                    for (let i = 0; i < cellObjects.length; i++) {
                        const node = cellObjects[i];
                        if (node && node.influenceRadius !== undefined) {
                            this._resultArray[this._resultLength++] = node;
                        }
                    }
                }
            }
        }
        return this._resultArray;
    }
}


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!****************************!*\
  !*** ./src/client/main.js ***!
  \****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _core_Game_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core/Game.js */ "./src/client/core/Game.js");
/* harmony import */ var _systems_InputManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./systems/InputManager.js */ "./src/client/systems/InputManager.js");
/* harmony import */ var _systems_SelectionManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./systems/SelectionManager.js */ "./src/client/systems/SelectionManager.js");
/* harmony import */ var _systems_UIManager_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./systems/UIManager.js */ "./src/client/systems/UIManager.js");
/* harmony import */ var _modes_SingleplayerController_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./modes/SingleplayerController.js */ "./src/client/modes/SingleplayerController.js");
/* harmony import */ var _modes_MultiplayerController_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./modes/MultiplayerController.js */ "./src/client/modes/MultiplayerController.js");
/* harmony import */ var _shared_GameState_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../shared/GameState.js */ "./src/shared/GameState.js");
/* harmony import */ var _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./systems/SoundManager.js */ "./src/client/systems/SoundManager.js");









window.initGame = (mode) => {
    const game = new _core_Game_js__WEBPACK_IMPORTED_MODULE_0__.Game('game-canvas');

    // Initialize Systems
    game.systems = {
        selection: new _systems_SelectionManager_js__WEBPACK_IMPORTED_MODULE_2__.SelectionManager(game),
        ui: new _systems_UIManager_js__WEBPACK_IMPORTED_MODULE_3__.UIManager(game)
    };
    game.systems.input = new _systems_InputManager_js__WEBPACK_IMPORTED_MODULE_1__.InputManager(game);

    // Initialize Mode
    if (mode === 'singleplayer') {
        const urlParams = new URLSearchParams(window.location.search);
        const playerCount = parseInt(urlParams.get('players')) || 2;
        const difficulty = urlParams.get('difficulty') || 'intermediate';
        const testMode = urlParams.get('test') === '1';
        
        game.controller = new _modes_SingleplayerController_js__WEBPACK_IMPORTED_MODULE_4__.SingleplayerController(game);
        game.controller.setup(playerCount, difficulty, testMode);
        
        // Show game UI and screen
        const ui = document.getElementById('ui');
        const menu = document.getElementById('menu-screen');
        if (ui) ui.style.display = 'block';
        if (menu) menu.style.display = 'none';
        
        game.resize();
        game.start();
    } else {
        // Multiplayer - controller is set up when connecting
        game.controller = new _modes_MultiplayerController_js__WEBPACK_IMPORTED_MODULE_5__.MultiplayerController(game);
        game.controller.connect();
    }

    // Setup menu button
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            game.running = false;
            location.href = 'index.html';
        });
    }

    // Setup mute button
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            const enabled = _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_7__.sounds.toggle();
            muteBtn.textContent = enabled ? '🔊' : '🔇';
            muteBtn.style.background = enabled ? 'rgba(76,175,80,0.8)' : 'rgba(244,67,54,0.8)';
            muteBtn.style.borderColor = enabled ? '#4CAF50' : '#f44336';
        });
    }

    // Show surrender button only in multiplayer
    if (mode === 'multiplayer') {
        const surrenderBtn = document.getElementById('surrender-btn');
        const resetBtn = document.getElementById('reset-btn');
        if (surrenderBtn) surrenderBtn.style.display = 'block';
        if (resetBtn) resetBtn.style.display = 'none';
    }

    // Setup reset button for singleplayer
    if (mode === 'singleplayer') {
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const urlParams = new URLSearchParams(window.location.search);
                const playerCount = parseInt(urlParams.get('players')) || 2;
                const difficulty = urlParams.get('difficulty') || 'intermediate';
                const testMode = urlParams.get('test') === '1';
                
                // Stop current game properly
                game.stop();
                game.gameOverShown = false;
                
                // Clear state - create fresh GameState
                game.state = new _shared_GameState_js__WEBPACK_IMPORTED_MODULE_6__.GameState();
                game.state.playerCount = game.controller.ais.length + 1;
                game.particles = [];
                game.commandIndicators = [];
                game.waypointLines = [];
                game.systems.selection.clear();
                
                // Re-setup with new map
                game.controller.setup(playerCount, difficulty, testMode);
                game.start();
            });
        }
    }

    // Setup surrender button for multiplayer
    if (mode === 'multiplayer') {
        const surrenderBtn = document.getElementById('surrender-btn');
        if (surrenderBtn) {
            surrenderBtn.addEventListener('click', () => {
                if (game.controller && game.controller.surrender) {
                    game.controller.surrender();
                }
            });
        }
    }

    return game;
};

// Auto-init based on page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('game-canvas')) {
        // Check if singleplayer by path or by URL params
        const isSingle = window.location.pathname.includes('singleplayer') || 
                         new URLSearchParams(window.location.search).has('players');
        window.initGame(isSingle ? 'singleplayer' : 'multiplayer');
    }
});

})();

/******/ })()
;
//# sourceMappingURL=bundle.js.map