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

/***/ "./src/client/CampaignManager.js"
/*!***************************************!*\
  !*** ./src/client/CampaignManager.js ***!
  \***************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CampaignManager: () => (/* binding */ CampaignManager)
/* harmony export */ });
// client/CampaignManager.js

class CampaignManager {
    static STORAGE_KEY = 'nanowar_campaign_progress';

    static getUnlockedLevel() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            return parseInt(saved, 10);
        }
        return 0; // 0 represents the tutorial level
    }

    static completeLevel(completedLevelId) {
        const currentUnlocked = this.getUnlockedLevel();
        if (completedLevelId >= currentUnlocked) {
            localStorage.setItem(this.STORAGE_KEY, (completedLevelId + 1).toString());
        }
    }

    static resetProgress() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
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
/* harmony import */ var _shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../shared/SharedMemory.js */ "./src/shared/SharedMemory.js");
/* harmony import */ var _shared_SharedView_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../shared/SharedView.js */ "./src/shared/SharedView.js");
/* harmony import */ var _shared_Entity_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../shared/Entity.js */ "./src/shared/Entity.js");
/* harmony import */ var _shared_EntityData_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../shared/EntityData.js */ "./src/shared/EntityData.js");
/* harmony import */ var _shared_NodeData_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../shared/NodeData.js */ "./src/shared/NodeData.js");
/* harmony import */ var _shared_GameEngine_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../shared/GameEngine.js */ "./src/shared/GameEngine.js");












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
        this.healSoundDelay = 5;

        this.useWorker = false;
        this.worker = null;
        this.sharedView = null;
        this.workerRunning = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.camera.zoomToFit(this.state.worldWidth, this.state.worldHeight, this.canvas.width, this.canvas.height);
    }

    async initWorker() {
        if (typeof SharedArrayBuffer === 'undefined') {
            console.warn('SharedArrayBuffer not supported, falling back to main thread');
            return false;
        }

        if (window.multiplayer && window.multiplayer.connected) {
            console.log('Multiplayer active, disabling local GameWorker simulation to prevent desync.');
            return false;
        }

        try {
            if (this.worker) {
                this.worker.terminate();
                this.worker = null;
            }

            const bufferSize = (0,_shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_6__.calculateBufferSize)();
            const sharedBuffer = new SharedArrayBuffer(bufferSize);

            this.sharedView = new _shared_SharedView_js__WEBPACK_IMPORTED_MODULE_7__.SharedView(sharedBuffer);
            this.sharedMemory = new _shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_6__.SharedMemory(sharedBuffer);

            this.worker = new Worker(
                new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u("src_client_workers_GameWorker_js"), __webpack_require__.b),
                { type: undefined }
            );

            const self = this;

            this.worker.onmessage = function (e) {
                const { type, data } = e.data;
                if (type === 'initialized') {
                    self.useWorker = true;
                    self.syncStateToWorker();
                } else if (type === 'workerReady') {
                    self.startWorkerLoop();
                } else if (type === 'frameComplete') {
                    self.workerRunning = true;
                }
            };

            this.worker.postMessage({
                type: 'init',
                data: { sharedBuffer: sharedBuffer }
            });

            return true;
        } catch (err) {
            console.error('Failed to init worker:', err);
            return false;
        }
    }

    syncStateToWorker() {
        if (!this.worker || !this.useWorker) return;

        // Force recreation of NodeData to guarantee it points to the new fresh buffer
        this.sharedNodeData = new _shared_NodeData_js__WEBPACK_IMPORTED_MODULE_10__.NodeData(this.sharedView.memory);

        for (let i = 0; i < this.state.nodes.length; i++) {
            const node = this.state.nodes[i];
            node.nodeIndex = i;
            node.sharedNodeData = this.sharedNodeData;

            this.worker.postMessage({
                type: 'addNode',
                data: {
                    x: node.x,
                    y: node.y,
                    owner: node.owner,
                    type: node.type,
                    id: node.id
                }
            });
        }

        for (const entity of this.state.entities) {
            this.worker.postMessage({
                type: 'spawnEntity',
                data: {
                    x: entity.x,
                    y: entity.y,
                    owner: entity.owner,
                    targetX: entity.currentTarget ? entity.currentTarget.x : 0,
                    targetY: entity.currentTarget ? entity.currentTarget.y : 0,
                    targetNodeId: entity.targetNode ? entity.targetNode.id : -1,
                    id: entity.id
                }
            });
        }

        this.worker.postMessage({
            type: 'setGameSettings',
            data: {
                speedMultiplier: this.state.speedMultiplier,
                maxEntitiesPerPlayer: this.state.maxEntitiesPerPlayer
            }
        });

        setTimeout(() => {
            if (this.worker) {
                this.worker.postMessage({ type: 'syncComplete' });
            }
        }, 100);
    }

    startWorkerLoop() {
        const self = this;

        const workerLoop = () => {
            if (!self.useWorker || !self.running) return;

            const dt = 1 / 60;
            self.worker.postMessage({ type: 'update', data: { dt } });
        };

        this.workerLoop = workerLoop;
        this.lastWorkerUpdate = 0;
        workerLoop();
    }

    updateWorkerLoop() {
        if (!this.useWorker || !this.running) return;

        const now = performance.now();
        const elapsed = now - this.lastWorkerUpdate;

        if (elapsed >= 16) {
            this.lastWorkerUpdate = now;
            const dt = Math.min(elapsed / 1000, 0.05);
            this.worker.postMessage({ type: 'update', data: { dt } });
        }
    }

    spawnEntityInWorker(x, y, owner, targetX, targetY, targetNodeId, entityId) {
        if (!this.worker || !this.useWorker) return;

        this.worker.postMessage({
            type: 'spawnEntity',
            data: {
                x, y, owner, targetX, targetY, targetNodeId,
                id: entityId || (Date.now() + Math.random())
            }
        });
    }

    setEntityTarget(entityId, targetX, targetY, targetNodeId) {
        const ent = this.state.entities.find(e => e.id === entityId);
        if (ent) {
            ent.currentTarget = { x: targetX, y: targetY };
            ent.waypoints = [];
            if (targetNodeId) {
                const targetNode = this.state.nodes.find(n => n.id === targetNodeId);
                ent.targetNode = targetNode || null;
            } else {
                ent.targetNode = null;
            }
        }

        if (this.worker && this.useWorker) {
            this.worker.postMessage({
                type: 'setEntityTargetById',
                data: { entityId, targetX, targetY, targetNodeId }
            });
        }
    }

    setMultipleEntityTargets(entityIds, targetX, targetY, targetNodeId) {
        // Actualizar el estado legacy
        entityIds.forEach(id => {
            const ent = this.state.entities.find(e => e.id === id);
            if (ent) {
                ent.currentTarget = { x: targetX, y: targetY };
                ent.waypoints = [];
                ent.targetNode = (targetNodeId !== null && targetNodeId !== undefined) ? this.state.nodes.find(n => n.id === targetNodeId) : null;
            }
        });

        // Enviar al Worker un ÚNICO postMessage
        if (this.worker && this.useWorker) {
            this.worker.postMessage({
                type: 'setMultipleEntityTargets',
                data: { entityIds, targetX, targetY, targetNodeId }
            });
        }
    }

    setEntityTargetInWorker(entityIndex, targetX, targetY, targetNodeId) {
        if (!this.worker || !this.useWorker) return;

        this.worker.postMessage({
            type: 'setEntityTarget',
            data: { entityIndex, targetX, targetY, targetNodeId }
        });
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
        this.healSoundDelay = 5;

        this.initWorker();

        const game = this;
        const loop = (now) => {
            if (!game.running) return;

            // If more than 100ms passed, the tab was likely backgrounded.
            // Don't try to simulate the massive time gap, rely on server sync.
            const elapsed = now - game.lastTime;
            game.lastTime = now;

            if (elapsed < 500) { // Only update if gap is reasonable
                const dt = Math.min(elapsed / 1000, 0.05);
                game.update(dt);
            }

            game.draw(0.016); // Always draw with a standard small tick

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

        // Clear DO engine memory so restarts get a fresh buffer instead of ghost entities
        this.sharedMemory = null;
        this.sharedView = null;
        this.sharedEngine = null;
        this.sharedNodeData = null;
    }

    update(dt) {
        const playerIdx = this.controller?.playerIndex ?? 0;
        _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_5__.sounds.setPlayerIndex(playerIdx);

        if (this.useWorker && this.sharedView) {
            this.updateWorkerLoop();
            this.updateFromWorker(dt, playerIdx);
        } else if (this.isMultiplayerDO && this.sharedView) {
            // No local physics simulation, just visuals and sounds for DO payload
            this.updateFromMultiplayerDO(dt, playerIdx);
        } else {
            this.updateLegacy(dt, playerIdx);
        }

        if (this.controller && this.controller.update) {
            this.controller.update(dt);
        }
        if (this.systems && this.systems.input) {
            this.systems.input.update(dt);
        }
        this.particles = this.particles.filter(p => p.update(dt));
        this.commandIndicators = this.commandIndicators.filter(ci => ci.update(dt));
        this.waypointLines = this.waypointLines.filter(wl => wl.update(dt));
    }

    updateFromWorker(dt, playerIdx) {
        const view = this.sharedView;

        const deathCount = view.getDeathEventsCount();
        for (let i = 0; i < deathCount; i++) {
            const event = view.getDeathEvent(i);
            if (event) {
                const color = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__.PLAYER_COLORS[event.owner % _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__.PLAYER_COLORS.length];
                if (event.type === 2) {
                    this.spawnParticles(event.x, event.y, color, 8, 'explosion');
                } else if (event.type === 1) {
                    this.spawnParticles(event.x, event.y, color, 5, 'hit');
                } else if (event.type === 3) {
                    for (let j = 0; j < 4; j++) {
                        this.particles.push(new _Particle_js__WEBPACK_IMPORTED_MODULE_4__.Particle(event.x, event.y, color, 2, 'absorb', event.targetX, event.targetY));
                    }
                } else if (event.type === 4) {
                    for (let j = 0; j < 4; j++) {
                        this.particles.push(new _Particle_js__WEBPACK_IMPORTED_MODULE_4__.Particle(event.x, event.y, color, 1.5, 'sacrifice', event.targetX, event.targetY));
                    }
                }
                if (event.type === 1 || event.type === 2) {
                    _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_5__.sounds.playCollision();
                }

                // Cleanup selection
                if (this.systems && this.systems.selection) {
                    this.systems.selection.onEntityDead(event.entityIndex);
                }
            }
        }

        if (!this.state.spawnCounts) this.state.spawnCounts = {};

        const spawnCount = view.getSpawnEventsCount();
        for (let i = 0; i < spawnCount; i++) {
            const event = view.getSpawnEvent(i);
            if (event) {
                const color = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__.PLAYER_COLORS[event.owner % _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__.PLAYER_COLORS.length];
                this.spawnParticles(event.x, event.y, color, 6, 'explosion');

                // Accumulate spawn counts for UIManager prod/min tracking
                this.state.spawnCounts[event.owner] = (this.state.spawnCounts[event.owner] || 0) + 1;

                let tx = event.targetX;
                let ty = event.targetY;
                let tnodeId = event.targetNodeId;

                const newId = ++_shared_Entity_js__WEBPACK_IMPORTED_MODULE_8__.Entity.idCounter;
                const ent = new _shared_Entity_js__WEBPACK_IMPORTED_MODULE_8__.Entity(event.x, event.y, event.owner, newId);

                if (tx !== 0 || ty !== 0 || tnodeId !== -1) {
                    const targetNodeObj = tnodeId !== -1 ? this.state.nodes.find(n => n.id === tnodeId) : null;
                    ent.setTarget(tx, ty, targetNodeObj);
                }

                this.state.entities.push(ent);
                this.spawnEntityInWorker(event.x, event.y, event.owner, tx, ty, tnodeId, newId);
            }
        }

        // SYNC LOCAL ENTITIES WITH WORKER STATE
        // Only remove entities that are EXPLICITLY marked dead in the worker
        this.state.entities = this.state.entities.filter(ent => {
            const idx = view.findEntityById(ent.id);
            if (idx === -1) return true; // Keep it, might be newly spawned and not in worker yet
            return !view.isEntityDead(idx);
        });

        const isValidPlayer = playerIdx >= 0;
        if (isValidPlayer) {
            view.iterateNodes((nodeIndex) => {
                const owner = view.getNodeOwner(nodeIndex);
                const prevOwner = this.workerNodeOwners?.[nodeIndex];
                if (prevOwner === -1 && owner === playerIdx) {
                    _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_5__.sounds.playCapture();
                }
            });
        }

        if (!this.workerNodeOwners) {
            this.workerNodeOwners = new Array(view.getNodeCount()).fill(-1);
        }
        view.iterateNodes((nodeIndex) => {
            this.workerNodeOwners[nodeIndex] = view.getNodeOwner(nodeIndex);
        });

        // --- CÓDIGO NUEVO AQUÍ ---
        // Limpiamos los eventos AHORA, después de haberlos leído con seguridad
        view.memory.clearDeathEvents();
        view.memory.clearSpawnEvents();
    } // Fin de updateFromWorker

    updateFromMultiplayerDO(dt, playerIdx) {
        const view = this.sharedView;
        if (!view) return;

        // Run local physics interpolation so movement is smooth 60fps
        // instead of snapping to 30fps server ticks
        if (!this.sharedEngine) {
            this.sharedEngine = new _shared_GameEngine_js__WEBPACK_IMPORTED_MODULE_11__.GameEngine(
                view.memory,
                new _shared_EntityData_js__WEBPACK_IMPORTED_MODULE_9__.EntityData(view.memory),
                new _shared_NodeData_js__WEBPACK_IMPORTED_MODULE_10__.NodeData(view.memory),
                { speedMultiplier: 1 }
            );
        }
        this.sharedEngine.step(dt);

        // Process death events for particles/sounds
        const deathCount = view.getDeathEventsCount();
        for (let i = 0; i < deathCount; i++) {
            const event = view.getDeathEvent(i);
            if (event) {
                const color = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__.PLAYER_COLORS[event.owner % _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__.PLAYER_COLORS.length];
                if (event.type === 2) {
                    this.spawnParticles(event.x, event.y, color, 8, 'explosion');
                    _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_5__.sounds.playCollision();
                } else if (event.type === 1) {
                    this.spawnParticles(event.x, event.y, color, 4, 'hit');
                    _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_5__.sounds.playCollision();
                } else if (event.type === 3) {
                    for (let j = 0; j < 3; j++) {
                        this.particles.push(new _Particle_js__WEBPACK_IMPORTED_MODULE_4__.Particle(event.x, event.y, color, 2, 'absorb', event.targetX, event.targetY));
                    }
                } else if (event.type === 4) {
                    for (let j = 0; j < 3; j++) {
                        this.particles.push(new _Particle_js__WEBPACK_IMPORTED_MODULE_4__.Particle(event.x, event.y, color, 1.5, 'sacrifice', event.targetX, event.targetY));
                    }
                }
                
                // Cleanup selection
                if (this.systems && this.systems.selection) {
                    this.systems.selection.onEntityDead(event.entityIndex);
                }
            }
        }

        // Track node owners for capture sound (handled by MultiplayerController.syncStateDO)
        if (!this.workerNodeOwners) {
            this.workerNodeOwners = new Array(Math.max(view.getNodeCount(), 64)).fill(-1);
        }
        view.iterateNodes((nodeIndex) => {
            this.workerNodeOwners[nodeIndex] = view.getNodeOwner(nodeIndex);
        });

        // IMPORTANT: clear events after reading — else they fire every frame
        view.memory.clearDeathEvents();
        view.memory.clearSpawnEvents();
    }

    updateLegacy(dt, playerIdx) {
        const nodeOwnersBefore = new Map();
        const nodeHpBefore = new Map();

        this.state.nodes.forEach(n => {
            nodeOwnersBefore.set(n.id, n.owner);
            nodeHpBefore.set(n.id, n.baseHp);
        });

        const playerEntitiesBefore = this.state.unitCounts ? (this.state.unitCounts[playerIdx] || 0) : 0;

        this.state.update(dt, this);

        const isValidPlayer = playerIdx >= 0;

        this.state.nodes.forEach(n => {
            const oldOwner = nodeOwnersBefore.get(n.id);
            if (isValidPlayer && oldOwner !== undefined && oldOwner === -1 && n.owner === playerIdx) {
                _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_5__.sounds.playCapture();
            }
        });

        const playerEntitiesNow = this.state.unitCounts ? (this.state.unitCounts[playerIdx] || 0) : 0;

        if (playerEntitiesNow < playerEntitiesBefore && isValidPlayer) {
            _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_5__.sounds.playCollision();
        }
    }

    draw(dt) {
        const playerIdx = this.controller?.playerIndex ?? 0;
        this.renderer.setPlayerIndex(playerIdx);

        this.renderer.clear(this.canvas.width, this.canvas.height);
        this.renderer.drawGrid(this.canvas.width, this.canvas.height, this.camera);

        if (this.useWorker && this.sharedView) {
            this.drawFromWorker();
        } else if (this.isMultiplayerDO && this.sharedView) {
            this.drawFromWorker();
        } else {
            this.drawLegacy(dt);
        }

        this.particles.forEach(p => this.renderer.drawParticle(p, this.camera));
        this.commandIndicators.forEach(ci => this.renderer.drawCommandIndicator(ci, this.camera));

        this.waypointLines.filter(wl => wl.owner === playerIdx).forEach(wl => this.renderer.drawWaypointLine(wl, this.camera));

        if (this.systems.selection.isSelectingBox) {
            const input = this.systems.input;
            this.renderer.drawSelectionBox(
                this.systems.selection.boxStart.x,
                this.systems.selection.boxStart.y,
                input.mouse.x,
                input.mouse.y
            );
        }

        if (this.systems.selection.currentPath.length > 0) {
            this.renderer.drawPath(this.systems.selection.currentPath, this.camera, 'rgba(255, 255, 255, 0.6)', 3);
        }

        if (this.systems && this.systems.ui) {
            this.systems.ui.draw(this.renderer);
        }
    }

    drawFromWorker() {
        const view = this.sharedView;
        const camera = this.camera;

        view.iterateNodes((nodeIndex) => {
            const owner = view.getNodeOwner(nodeIndex);
            const baseHp = view.getNodeBaseHp(nodeIndex);
            const maxHp = view.getNodeMaxHp(nodeIndex);

            const rX = view.getNodeRallyX(nodeIndex);
            const rY = view.getNodeRallyY(nodeIndex);
            const rallyTargetNodeId = view.getNodeRallyTargetNodeId(nodeIndex);
            let rallyPoint = null;
            let rallyTargetNode = null;

            if (rX !== 0 || rY !== 0) {
                rallyPoint = { x: rX, y: rY };
            }
            if (rallyTargetNodeId !== -1) {
                rallyTargetNode = this.state.nodes.find(n => n.id === rallyTargetNodeId) || null;
            }

            const node = {
                x: view.getNodeX(nodeIndex),
                y: view.getNodeY(nodeIndex),
                owner: owner,
                radius: view.getNodeRadius(nodeIndex),
                influenceRadius: view.getNodeInfluenceRadius(nodeIndex),
                baseHp: baseHp,
                maxHp: maxHp,
                spawnProgress: view.getNodeSpawnProgress(nodeIndex),
                hitFlash: view.getNodeHitFlash(nodeIndex),
                spawnEffect: view.getNodeSpawnEffect(nodeIndex),
                id: view.getNodeId(nodeIndex),
                rallyPoint: rallyPoint,
                rallyTargetNode: rallyTargetNode,
                getColor: () => owner === -1 ? '#757575' : _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__.PLAYER_COLORS[owner % _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__.PLAYER_COLORS.length],
                getTotalHp: () => Math.min(maxHp, baseHp),
            };
            const isSelected = this.systems?.selection?.isSelected(node);
            this.renderer.drawNode(node, camera, isSelected);
        });

        // Creamos un objeto "fantasma" reutilizable para no saturar la memoria
        if (!this._dummyEntity) this._dummyEntity = { getColor: function () { return _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__.PLAYER_COLORS[this.owner % _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__.PLAYER_COLORS.length]; } };
        const entity = this._dummyEntity;

        view.iterateEntities((entityIndex) => {
            const owner = view.getEntityOwner(entityIndex);

            // Reutilizamos el mismo objeto para todas las células
            entity.x = view.getEntityX(entityIndex);
            entity.y = view.getEntityY(entityIndex);
            entity.owner = owner;
            entity.radius = view.getEntityRadius(entityIndex);
            entity.dying = view.isEntityDying(entityIndex);
            entity.dead = view.isEntityDead(entityIndex);
            entity.deathTime = view.getEntityDeathTime(entityIndex);
            entity.deathType = view.getEntityDeathType(entityIndex);
            entity.selected = view.isEntitySelected(entityIndex);
            entity.outsideWarning = view.hasEntityOutsideWarning(entityIndex);
            entity.id = view.getEntityId(entityIndex);
            // Recuperar el speedBoost para el brillo de velocidad
            entity.speedBoost = view.memory.entities.speedBoost[entityIndex] || 0;

            const isSelected = this.systems?.selection?.isSelected(entity);
            this.renderer.drawEntity(entity, camera, isSelected);
        });

        // Death events are handled in updateFromWorker and cleared there.
        // Do NOT read them here — they would double-fire particles/sounds.
    }

    drawLegacy(dt) {
        const playerIdx = this.controller?.playerIndex ?? 0;

        this.state.nodes.forEach(node => {
            const isSelected = this.systems?.selection?.isSelected(node);
            this.renderer.drawNode(node, this.camera, isSelected);
        });

        this.state.entities.forEach(entity => {
            const isSelected = this.systems?.selection?.isSelected(entity);
            this.renderer.drawEntity(entity, this.camera, isSelected);
        });
        this.renderer.renderTrails(this.camera, dt);

        this.state.entities.filter(e => e.owner === playerIdx).forEach(e => {
            if (this.systems.selection.isSelected(e) && e.waypoints.length > 0) {
                this.renderer.drawPath([e, ...e.waypoints], this.camera, 'rgba(255, 255, 255, 0.15)', 1.2, true);

                const target = e.currentTarget || e.waypoints[0];
                const screen = this.camera.worldToScreen(target.x, target.y);
                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, 2 * this.camera.zoom, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fill();
            }
        });
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
    constructor(x, y, color, size, type, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.type = type;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.targetX = targetX;
        this.targetY = targetY;
        
        if (type === 'hit') {
            this.life = 0.3;
            this.maxLife = 0.3;
            this.vx = (Math.random() - 0.5) * 80;
            this.vy = (Math.random() - 0.5) * 80;
        } else if (type === 'absorb') {
            this.life = 0.5;
            this.maxLife = 0.5;
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 15;
            this.x = x + Math.cos(angle) * dist;
            this.y = y + Math.sin(angle) * dist;
            this.vx = 0;
            this.vy = 0;
        } else if (type === 'sacrifice') {
            this.life = 0.4;
            this.maxLife = 0.4;
            this.vx = 0;
            this.vy = 0;
        } else if (type === 'explosion') {
            this.life = 0.6;
            this.maxLife = 0.6;
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 80;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        } else {
            this.vx = (Math.random() - 0.5) * 100;
            this.vy = (Math.random() - 0.5) * 100;
        }
    }

    update(dt) {
        if (this.type === 'absorb' && this.targetX !== undefined && this.targetY !== undefined) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 3) {
                const speed = 120;
                this.x += (dx / dist) * speed * dt;
                this.y += (dy / dist) * speed * dt;
            }
        } else if (this.type === 'sacrifice' && this.targetX !== undefined && this.targetY !== undefined) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 3) {
                const speed = 150;
                this.x += (dx / dist) * speed * dt;
                this.y += (dy / dist) * speed * dt;
            }
        } else {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
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



const DEATH_TYPES = ['none', 'attack', 'explosion', 'absorbed', 'sacrifice', 'outOfBounds'];

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

        let colorCache = this.unitSpriteCache.get(color);
        if (!colorCache) {
            colorCache = new Map();
            this.unitSpriteCache.set(color, colorCache);
        }

        let sprite = colorCache.get(r);
        if (sprite) {
            return sprite;
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

        colorCache.set(r, canvas);
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
        if (!color || typeof color !== 'string' || !color.startsWith('#') || color.length < 7) {
            return null;
        }

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
            const boundaryRadius = Math.max(0, worldRadius * camera.zoom);

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
        const screenX = (node.x - camera.x) * camera.zoom;
        const screenY = (node.y - camera.y) * camera.zoom;
        const sr = Math.max(0, node.radius * camera.zoom);
        const sir = Math.max(0, node.influenceRadius * camera.zoom);

        // Culling for nodes - skip if completely off screen
        const margin = sir * 2;
        if (this.width && (screenX < -margin || screenX > this.width + margin || screenY < -margin || screenY > this.height + margin)) {
            return;
        }

        const baseColor = node.getColor();

        const c = baseColor.slice(1);
        const areaColor = [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)].join(',');

        // Aura - solid fill for territory visibility (no fade out)
        if (node.owner !== -1) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.15;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, sir, 0, Math.PI * 2);
            this.ctx.fillStyle = baseColor;
            this.ctx.fill();
            this.ctx.restore();
        }

        // Dashed border - stronger for territory visibility
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, sir, 0, Math.PI * 2);
        this.ctx.strokeStyle = node.owner !== -1 ? `rgba(${areaColor},0.5)` : `rgba(${areaColor},0.15)`;
        this.ctx.lineWidth = 2 * camera.zoom;
        this.ctx.setLineDash([8 * camera.zoom, 6 * camera.zoom]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Rally Line - only show for our own nodes
        if (node.rallyPoint && node.owner !== -1 && node.owner === this.playerIndex) {
            const rx = (node.rallyPoint.x - camera.x) * camera.zoom;
            const ry = (node.rallyPoint.y - camera.y) * camera.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, screenY);
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

            // Cap at [0, 1.0] to prevent visual overflow/looping
            let progress = Math.max(0.0, Math.min(1.0, node.spawnProgress));

            // VISUAL FIX: If node just spawned (spawnEffect high), show full ring
            // This prevents the "99% -> 0%" visual gap, making it feel perfectly synced
            if (node.spawnEffect > 0.3) {
                progress = 1.0;
            }

            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, Math.max(0, sr + 5 * camera.zoom), -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            this.ctx.strokeStyle = progressColor;
            this.ctx.lineWidth = lineWidth;
            this.ctx.stroke();
        }

        // Node Body (Radial Fill)
        const totalHp = node.getTotalHp();
        const hpPercent = Math.max(0, Math.min(1, totalHp / node.maxHp));
        const currentRadius = Math.max(0, sr * hpPercent);

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
        this.ctx.arc(screenX, screenY, Math.max(0, sr), 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(40,40,40,0.4)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.lineWidth = 1 * camera.zoom;
        this.ctx.stroke();

        if (hpPercent > 0) {
            const grad = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, currentRadius);
            grad.addColorStop(0, `rgba(${r * 0.8}, ${g * 0.8}, ${b * 0.8}, 1)`);
            grad.addColorStop(1, brightColor);

            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, currentRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = grad;
            this.ctx.fill();
        }

        const borderColorStr = isSelected ? 'rgba(255,255,255,0.9)' : `rgba(${areaColor},0.5)`;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, Math.max(0, sr), 0, Math.PI * 2);
        this.ctx.strokeStyle = borderColorStr;
        this.ctx.lineWidth = isSelected ? 3 * camera.zoom : 1.5 * camera.zoom;
        this.ctx.stroke();

        if (node.hitFlash > 0) {
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, Math.max(0, sr), 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255,100,100,${node.hitFlash})`;
            this.ctx.lineWidth = 5 * camera.zoom;
            this.ctx.stroke();
        }
        if (node.spawnEffect > 0) {
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, Math.max(0, sr * (1.3 + (0.5 - node.spawnEffect) * 0.6)), 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255,255,255,${node.spawnEffect * 1.5})`;
            this.ctx.lineWidth = 3 * camera.zoom;
            this.ctx.stroke();
        }
    }

    drawEntity(entity, camera, isSelected = false) {
        if (entity.dead) return;
        const screenX = (entity.x - camera.x) * camera.zoom;
        const screenY = (entity.y - camera.y) * camera.zoom;
        const margin = entity.radius * camera.zoom + 5;

        // Culling: If off screen, skip drawing (Performance)
        if (this.width && (
            screenX < -margin || screenX > this.width + margin ||
            screenY < -margin || screenY > this.height + margin
        )) {
            return;
        }

        const deathType = entity.deathType;
        const deathTypeStr = typeof deathType === 'number' ? DEATH_TYPES[deathType] : deathType;

        // Dying animation handling
        if (entity.dying) {
            const progress = Math.min(1.0, entity.deathTime / 0.4);
            const sr = Math.max(0, entity.radius * camera.zoom);
            if (deathTypeStr === 'explosion') {
                const maxRadius = sr * 4;
                const currentRadius = sr + (maxRadius - sr) * progress;
                const alpha = 1 - progress;

                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, Math.max(0, currentRadius), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.3})`;
                this.ctx.fill();

                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, Math.max(0, sr * (1 - progress * 0.8)), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
                this.ctx.fill();
            } else if (deathTypeStr === 'attack') {
                const flash = Math.sin(progress * Math.PI * 6) * 0.5 + 0.5;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, Math.max(0, sr * (1 + progress * 2)), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 100, 100, ${flash * 0.4 * (1 - progress)})`;
                this.ctx.fill();
            } else if (deathTypeStr === 'sacrifice' || deathTypeStr === 'absorbed') {
                const alpha = 1 - progress;
                const playerColor = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS[entity.owner % _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS.length] || '#FFFFFF';

                // Violent vibration
                const vibX = (Math.random() - 0.5) * 4 * progress;
                const vibY = (Math.random() - 0.5) * 4 * progress;

                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, alpha);
                this.ctx.beginPath();
                this.ctx.arc(screenX + vibX, screenY + vibY, Math.max(0, sr * (1 - progress * 0.5)), 0, Math.PI * 2);
                this.ctx.fillStyle = playerColor;
                this.ctx.fill();

                // Bright core
                this.ctx.beginPath();
                this.ctx.arc(screenX + vibX, screenY + vibY, Math.max(0, sr * (0.3 * (1 - progress))), 0, Math.PI * 2);
                this.ctx.fillStyle = 'white';
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
        this.ctx.drawImage(sprite, (screenX - offset) | 0, (screenY - offset) | 0);

        // Selection circle
        if (isSelected) {
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, Math.max(0, renderRadius + 4 * camera.zoom), 0, Math.PI * 2);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2 * camera.zoom;
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
                screenX - glowRadius,
                screenY - glowRadius,
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
        const screenX = (p.x - camera.x) * camera.zoom;
        const screenY = (p.y - camera.y) * camera.zoom;

        // Culling
        if (this.width && (screenX < -20 || screenX > this.width + 20 || screenY < -20 || screenY > this.height + 20)) {
            return;
        }

        this.ctx.globalAlpha = p.life / p.maxLife;

        if (p.type === 'hit') {
            // Hit particles are lines, keeping vector for now as they are few, 
            // but optimized with globalAlpha
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, screenY);
            this.ctx.lineTo(screenX - p.vx * 0.1, screenY - p.vy * 0.1);
            this.ctx.strokeStyle = p.color;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.stroke();
        } else {
            // Explosions/Death particles: Sprite-based
            const sprite = this._getOrCreateParticleSprite(p.color);
            const renderSize = p.size * 1.2 * camera.zoom;

            // Speed-based particle glow (Restore requested beauty)
            const speedSq = p.vx * p.vx + p.vy * p.vy;
            if (speedSq > 4000 && p.color) {
                const glowData = this._getOrCreateGlow(p.color);
                if (glowData) {
                    const glowRadius = renderSize * 2.5;
                    this.ctx.save();
                    this.ctx.globalCompositeOperation = 'lighter';
                    this.ctx.globalAlpha = (p.life / p.maxLife) * 0.4;
                    this.ctx.drawImage(
                        glowData.canvas,
                        screenX - glowRadius,
                        screenY - glowRadius,
                        glowRadius * 2,
                        glowRadius * 2
                    );
                    this.ctx.restore();
                }
            }

            // Fast bit blit
            this.ctx.drawImage(
                sprite,
                screenX - renderSize / 2,
                screenY - renderSize / 2,
                renderSize,
                renderSize
            );
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawCommandIndicator(ci, camera) {
        const screenX = (ci.x - camera.x) * camera.zoom;
        const screenY = (ci.y - camera.y) * camera.zoom;
        const alpha = Math.max(0, Math.min(1.0, ci.life / ci.maxLife));
        const size = 10 * camera.zoom;

        if (ci.type === 'attack') {
            this.ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX - size, screenY - size);
            this.ctx.lineTo(screenX + size, screenY + size);
            this.ctx.moveTo(screenX + size, screenY - size);
            this.ctx.lineTo(screenX - size, screenY + size);
            this.ctx.stroke();
        } else {
            this.ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, Math.max(0, size * (1 - alpha)), 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawSelectionBox(x1, y1, x2, y2) {
        const x = Math.min(x1, x2), y = Math.min(y1, y2);
        const w = Math.abs(x1 - x2), h = Math.abs(y1 - y2);

        // Use player color for selection box
        const playerColor = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS[this.playerIndex % _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS.length];

        this.ctx.fillStyle = playerColor + '1A'; // 0.1 alpha
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = playerColor + '80'; // 0.5 alpha
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(x, y, w, h);
    }

    drawPath(points, camera, color = 'rgba(255, 255, 255, 0.4)', lineWidth = 2, dashed = false) {
        if (points.length < 2) return;
        this.ctx.beginPath();
        const startX = (points[0].x - camera.x) * camera.zoom;
        const startY = (points[0].y - camera.y) * camera.zoom;
        this.ctx.moveTo(startX, startY);
        for (let i = 1; i < points.length; i++) {
            const px = (points[i].x - camera.x) * camera.zoom;
            const py = (points[i].y - camera.y) * camera.zoom;
            this.ctx.lineTo(px, py);
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
        const startX = (wl.points[0].x - camera.x) * camera.zoom;
        const startY = (wl.points[0].y - camera.y) * camera.zoom;
        this.ctx.moveTo(startX, startY);

        for (let i = 1; i < wl.points.length; i++) {
            const px = (wl.points[i].x - camera.x) * camera.zoom;
            const py = (wl.points[i].y - camera.y) * camera.zoom;
            this.ctx.lineTo(px, py);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        wl.points.forEach((point, i) => {
            const sx = (point.x - camera.x) * camera.zoom;
            const sy = (point.y - camera.y) * camera.zoom;
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, (i === wl.points.length - 1 ? 6 : 3) * camera.zoom, 0, Math.PI * 2);
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
/* harmony import */ var _shared_GameState_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../shared/GameState.js */ "./src/shared/GameState.js");
/* harmony import */ var _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../systems/SoundManager.js */ "./src/client/systems/SoundManager.js");
/* harmony import */ var _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/GameConfig.js */ "./src/shared/GameConfig.js");
/* harmony import */ var _shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../shared/SharedMemory.js */ "./src/shared/SharedMemory.js");
/* harmony import */ var _shared_SharedView_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../shared/SharedView.js */ "./src/shared/SharedView.js");








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
            
            // Update our player index based on our position in the players array
            const myIndex = data.players.findIndex(p => p.id === this.socket.id);
            if (myIndex !== -1) {
                this.playerIndex = myIndex;
                console.log('Updated player index to:', this.playerIndex);
            }

            if (window.updateLobbyUI) {
                window.updateLobbyUI(data.players, this.roomId);
            }
        });

        this.socket.on('gameStart', (initialState) => {
            console.log('Game starting!', initialState);

            if (initialState.playerColors) {
                const defaultColors = [..._shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__.PLAYER_COLORS];
                initialState.playerColors.forEach((colorIdx, i) => {
                    if (colorIdx !== -1 && colorIdx !== undefined) {
                        _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_3__.PLAYER_COLORS[i] = defaultColors[colorIdx % defaultColors.length];
                    }
                });
            }

            // Initialize a fresh GameState (needed for elapsedTime, stats, etc.)
            this.game.state = new _shared_GameState_js__WEBPACK_IMPORTED_MODULE_1__.GameState();
            this.game.state.nodes = [];
            this.game.state.entities = [];
            this.game.state.playerCount = initialState.playerCount || 2;
            this.game.state.isClient = true;

            // PRE-ALLOCATE SharedMemory and SharedView immediately.
            // drawFromWorker will be called from game.start() and needs sharedView to exist.
            // The actual data will arrive via syncStateDO shortly after.
            if (!this.game.sharedMemory) {
                const buffer = new ArrayBuffer(_shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_4__.MEMORY_LAYOUT.TOTAL_SIZE);
                this.game.sharedMemory = new _shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_4__.SharedMemory(buffer);
                this.game.sharedView = new _shared_SharedView_js__WEBPACK_IMPORTED_MODULE_5__.SharedView(buffer);
            }
            this.game.isMultiplayerDO = true;
            this.cameraCentered = false;

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
                notif.textContent = data.surrendered ? 'TE RENDISTE - Ya no puedes controlar unidades' : 'ELIMINADO - Te has quedado sin tropas ni nodos';
                document.body.appendChild(notif);
                setTimeout(() => notif.remove(), 4000);
            }
        });

        this.socket.on('playerLostNodes', () => {
            // Show small non-fatal notification
            const notif = document.createElement('div');
            notif.style.cssText = `
                position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
                background: rgba(255,152,0,0.9); color: white; padding: 10px 20px;
                border-radius: 4px; z-index: 100; font-family: monospace; font-weight: bold;
            `;
            notif.textContent = 'SIN NODOS - Tus unidades están pereciendo. Captura un nodo rápido!';
            document.body.appendChild(notif);
            setTimeout(() => notif.remove(), 5000);
        });

        this.socket.on('syncStateDO', (serverState) => {
            if (this.game.gameOverShown) return;

            if (this.game.running || this.playerDefeated) {
                this.syncStateDO(serverState);

                if (document.hidden && this.game.running) {
                    this.game.lastTime = performance.now();
                }
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
                _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_2__.sounds.playWin();
            } else {
                _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_2__.sounds.playLose();
            }

            // Show overlay
            const msg = won ? '¡VICTORIA!' : (data.winner === -1 ? 'EMPATE' : 'DERROTA');
            const color = won ? '#4CAF50' : '#f44336';

            const playerColors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];

            // Generate stats HTML
            let statsHTML = '<div style="margin: 20px 0; text-align: left; font-size: 12px; max-height: 200px; overflow-y: auto;">';

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
                        <div style="color: ${pColor}; margin: 10px 0; padding: 12px 15px; background: rgba(255,255,255,0.03); border-radius: 6px; border-left: 4px solid ${pColor}; display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                <strong style="font-size: 15px; letter-spacing: 1px;">${pName}</strong>
                                <span style="font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 1px;">CAPTURAS: ${captured}</span>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 11px; color: rgba(255,255,255,0.6);">
                                <div style="display: flex; flex-direction: column;"><span style="font-size: 9px; opacity: 0.5;">PROD</span><span>${produced}</span></div>
                                <div style="display: flex; flex-direction: column;"><span style="font-size: 9px; opacity: 0.5;">RITMO</span><span>${prodPerMin}/m</span></div>
                                <div style="display: flex; flex-direction: column;"><span style="font-size: 9px; opacity: 0.5;">BAJAS</span><span>${lostUnits}</span></div>
                                <div style="display: flex; flex-direction: column;"><span style="font-size: 9px; opacity: 0.5;">VIVO</span><span>${current}</span></div>
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
                <div style="margin: 20px 0;">
                    <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 15px;">
                        <button id="btn-graph-prod" onclick="window.updateGraph('production')" style="background: transparent; border: 1px solid #333; color: #666; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 11px; transition: all 0.2s;">PRODUCCIÓN</button>
                        <button id="btn-graph-units" onclick="window.updateGraph('units')" style="background: transparent; border: 1px solid #333; color: #666; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 11px; transition: all 0.2s;">UNIDADES</button>
                        <button id="btn-graph-nodes" onclick="window.updateGraph('nodes')" style="background: transparent; border: 1px solid #333; color: #666; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 11px; transition: all 0.2s;">TERRITORIO</button>
                    </div>
                    <div style="position: relative;">
                        <canvas id="stats-graph" width="${graphWidth}" height="${graphHeight}" style="border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); border-radius: 4px; cursor: crosshair;"></canvas>
                        <button onclick="window.downloadGraph()" style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.05); color: #666; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; font-size: 9px; padding: 4px 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.color='#fff';this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='#666';this.style.background='rgba(255,255,255,0.05)'">EXPORTAR PNG</button>
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
                padding: 40px 50px; background: #0e0e12;
                border: 1px solid rgba(255,255,255,0.1); border-top: 4px solid ${color};
                border-radius: 8px; text-align: center; position: relative;
                max-width: 650px; width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
            `;

            box.innerHTML = `
                <button onclick="this.parentElement.parentElement.remove(); location.href='index.html';" style="
                    position: absolute; top: 15px; right: 20px;
                    background: none; border: none; color: #444;
                    font-size: 24px; cursor: pointer; line-height: 1; transition: color 0.2s;
                " onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#444'">&times;</button>
                <h1 style="color: ${color}; font-size: 48px; margin: 0 0 5px 0; letter-spacing: 8px; font-weight: 900; text-shadow: 0 0 30px ${color}44;">${msg}</h1>
                <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin-bottom: 30px; letter-spacing: 4px; text-transform: uppercase;">REGISTRO DE COMBATE FINALIZADO</p>
                
                ${graphUI}
                <div style="height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent); margin: 25px 0;"></div>
                ${statsHTML}
                
                <p style="color: #666; font-size: 11px; margin-bottom: 20px;">${lost ? 'OPERACIÓN FALLIDA - PUEDES OBSERVAR EL DESENLACE' : ''}</p>
                <button id="restart-btn" style="
                    padding: 14px 35px; background: ${color}; border: none; border-radius: 4px;
                    color: white; font-family: 'Courier New', monospace; font-weight: bold;
                    font-size: 13px; cursor: pointer; letter-spacing: 2px;
                    transition: all 0.2s; box-shadow: 0 4px 15px ${color}33;">
                    VOLVER AL MENÚ
                </button>
            `;

            overlay.appendChild(box);
            document.body.appendChild(overlay);

            // Initial graph state
            this.graphState = {
                offset: 0,
                scale: 1.0,
                type: 'production'
            };

            // Define graph update function globally so buttons can call it
            window.updateGraph = (type) => {
                if (type) this.graphState.type = type;
                const canvas = document.getElementById('stats-graph');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const w = canvas.width;
                const h = canvas.height;
                const padTop = 30;
                const padBottom = 25;
                const padLeft = 40;
                const padRight = 20;
                const graphW = w - padLeft - padRight;
                const graphH = h - padTop - padBottom;

                ctx.clearRect(0, 0, w, h);

                let dataArray = [];
                let title = '';
                let timeScale = 1; 

                // Update active button style
                ['prod', 'units', 'nodes'].forEach(t => {
                    const btn = document.getElementById(`btn-graph-${t}`);
                    const fullType = t === 'prod' ? 'production' : (t === 'units' ? 'units' : 'nodes');
                    if (btn) {
                        btn.style.background = fullType === this.graphState.type ? color + '22' : 'transparent';
                        btn.style.borderColor = fullType === this.graphState.type ? color : '#333';
                        btn.style.color = fullType === this.graphState.type ? color : '#666';
                    }
                });

                if (this.graphState.type === 'production') {
                    dataArray = stats.productionHistory || [];
                    title = 'PRODUCCIÓN (UNID/MIN)';
                    timeScale = 1;
                } else if (this.graphState.type === 'units') {
                    dataArray = stats.history || [];
                    title = 'EJÉRCITO TOTAL';
                    timeScale = 60;
                } else if (this.graphState.type === 'nodes') {
                    dataArray = stats.nodeHistory || [];
                    title = 'TERRITORIO (NODOS)';
                    timeScale = 60;
                }

                if (!dataArray || dataArray.length < 2) {
                    if (dataArray.length === 0) {
                        ctx.fillStyle = '#444';
                        ctx.textAlign = 'center';
                        ctx.font = '12px "Courier New"';
                        ctx.fillText('DATOS INSUFICIENTES', w / 2, h / 2);
                        return;
                    }
                }

                // Find max value
                let maxVal = 0;
                dataArray.forEach(p => {
                    const val = p.rate !== undefined ? p.rate : p.count;
                    if (val > maxVal) maxVal = val;
                });

                // Smart scaling
                if (this.graphState.type === 'nodes') maxVal = Math.ceil(Math.max(maxVal, 5) * 1.2);
                else if (maxVal > 100) {
                    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
                    maxVal = Math.ceil((maxVal * 1.1) / magnitude) * magnitude;
                } else {
                    maxVal = Math.ceil(Math.max(maxVal, 10) * 1.2);
                }

                ctx.save();

                // Background grid
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 1;
                ctx.textAlign = 'right';
                ctx.font = '10px "Courier New"';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';

                for (let i = 0; i <= 4; i++) {
                    const y = padTop + graphH - (i / 4) * graphH;
                    ctx.beginPath();
                    ctx.moveTo(padLeft, y);
                    ctx.lineTo(padLeft + graphW, y);
                    ctx.stroke();
                    ctx.fillText(Math.round((i / 4) * maxVal), padLeft - 8, y + 3);
                }

                const totalTime = Math.max(stats.elapsed || 0, 0.1); // Min 6 seconds scale
                const timeToX = (t) => padLeft + (t * (graphW / totalTime) * this.graphState.scale) + this.graphState.offset;

                // Clip for scrolling
                ctx.beginPath();
                ctx.rect(padLeft, 0, graphW, h);
                ctx.clip();

                // Draw events markers
                if (stats.events) {
                    stats.events.forEach(ev => {
                        const t = ev.time / (this.graphState.type === 'production' ? 60 : 1);
                        const x = timeToX(t / (timeScale === 60 ? 60 : 1));
                        if (x < padLeft || x > padLeft + graphW) return;

                        ctx.setLineDash([5, 5]);
                        ctx.strokeStyle = ev.type === 'big_battle' ? 'rgba(255,50,50,0.3)' : 'rgba(255,255,255,0.1)';
                        ctx.beginPath();
                        ctx.moveTo(x, padTop);
                        ctx.lineTo(x, padTop + graphH);
                        ctx.stroke();
                        ctx.setLineDash([]);

                        ctx.font = '12px serif';
                        if (ev.type === 'big_battle') ctx.fillText('⚔️', x + 5, padTop + 15);
                        else if (ev.type === 'capture') {
                            ctx.fillStyle = playerColors[ev.playerId % playerColors.length];
                            ctx.fillText('🚩', x + 5, padTop + 30);
                        }
                    });
                }

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
                    ctx.lineWidth = 3;
                    ctx.lineJoin = 'round';
                    ctx.lineCap = 'round';

                    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + graphH);
                    gradient.addColorStop(0, pC + '33');
                    gradient.addColorStop(1, pC + '00');

                    ctx.beginPath();
                    data.forEach((p, i) => {
                        const val = p.rate !== undefined ? p.rate : p.count;
                        const x = timeToX(p.time / (timeScale === 60 ? 60 : 1));
                        const y = padTop + graphH - (val / maxVal) * graphH;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });
                    ctx.stroke();

                    if (data.length > 0) {
                        ctx.lineTo(timeToX(data[data.length - 1].time / (timeScale === 60 ? 60 : 1)), padTop + graphH);
                        ctx.lineTo(timeToX(data[0].time / (timeScale === 60 ? 60 : 1)), padTop + graphH);
                        ctx.fillStyle = gradient;
                        ctx.fill();
                    }
                }

                ctx.restore();

                // Title and labels
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 13px "Courier New"';
                ctx.textAlign = 'center';
                ctx.fillText(title, w / 2, 18);
                
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.font = '9px "Courier New"';
                ctx.fillText('SCROLL: ZOOM • DRAG: PAN', w / 2, h - 8);
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

            // Interaction logic
            setTimeout(() => {
                const canvas = document.getElementById('stats-graph');
                if (!canvas) return;

                let isDragging = false;
                let lastX = 0;

                canvas.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    lastX = e.clientX;
                });

                window.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    const dx = e.clientX - lastX;
                    this.graphState.offset += dx;
                    lastX = e.clientX;
                    window.updateGraph();
                });

                window.addEventListener('mouseup', () => {
                    isDragging = false;
                });

                canvas.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
                    this.graphState.scale *= zoomFactor;
                    this.graphState.scale = Math.max(1.0, Math.min(this.graphState.scale, 10));
                    if (this.graphState.scale === 1.0) this.graphState.offset = 0;
                    window.updateGraph();
                });

                window.updateGraph('production');
            }, 100);

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
        const speedSetting = document.getElementById('lobby-speed');

        const settings = {
            speedMultiplier: speedSetting ? parseFloat(speedSetting.value) : 1,
            acceleration: false,
            showProduction: true
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

    syncStateDO(serverState) {
        if (!this.game.sharedMemory) {
            const buffer = new ArrayBuffer(_shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_4__.MEMORY_LAYOUT.TOTAL_SIZE);
            this.game.sharedMemory = new _shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_4__.SharedMemory(buffer);
            this.game.sharedView = new _shared_SharedView_js__WEBPACK_IMPORTED_MODULE_5__.SharedView(buffer);
            this.game.isMultiplayerDO = true;
        }

        const view = this.game.sharedView;

        // Remember node owners before overwriting memory to play capture sounds
        const prevOwners = [];
        const nodeCount = view.getNodeCount();
        for (let i = 0; i < nodeCount; i++) {
            prevOwners[i] = view.getNodeOwner(i);
        }

        // Copy the full server buffer (header + node SOA) into client memory, 
        // but softly interpolate entity positions to avoid stuttering against client-side prediction.
        if (serverState.syncBuffer) {
            // The server sends a truncated buffer (header + entities + nodes) to save bandwidth.
            // SharedView expects the full TOTAL_SIZE buffer, so we pad it.
            const fullTempBuf = new ArrayBuffer(_shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_4__.MEMORY_LAYOUT.TOTAL_SIZE);
            const tempDest = new Uint8Array(fullTempBuf);
            tempDest.set(new Uint8Array(serverState.syncBuffer));
            const srcView = new _shared_SharedView_js__WEBPACK_IMPORTED_MODULE_5__.SharedView(fullTempBuf);

            // 1. Copy Nodes directly (they don't move)
            const nodeBytes = 19 * 4 * _shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_4__.MEMORY_LAYOUT.MAX_NODES; // 19 fields * 4 bytes
            const nodeDest = new Uint8Array(this.game.sharedMemory.buffer, _shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_4__.MEMORY_LAYOUT.NODE_DATA_START, nodeBytes);
            const nodeSrc = new Uint8Array(fullTempBuf, _shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_4__.MEMORY_LAYOUT.NODE_DATA_START, nodeBytes);
            nodeDest.set(nodeSrc);

            // 2. Softly sync Entities (lerp positions if close, snap if far)
            const serverEntityCount = srcView.getEntityCount();

            // The header in syncBuffer already has correct counts, update them
            this.game.sharedMemory.setEntityCount(serverEntityCount);
            this.game.sharedMemory.setNodeCount(serverState.nodeCount);

            // Make sure the local Engine uses the new count
            if (this.game.sharedEngine && this.game.sharedEngine.entityData) {
                this.game.sharedEngine.entityData.syncCount();
            }

            for (let i = 0; i < serverEntityCount; i++) {
                const sDead = srcView.isEntityDead(i);
                view.memory.setDead(i, sDead);
                if (sDead) continue;

                const sX = srcView.getEntityX(i);
                const sY = srcView.getEntityY(i);
                const sVx = srcView.getEntityVx(i);
                const sVy = srcView.getEntityVy(i);

                const cX = view.getEntityX(i);
                const cY = view.getEntityY(i);

                // If local predicts it's close to server, smoothly blend. If far (e.g. new spawn or teleport), snap.
                const dx = sX - cX;
                const dy = sY - cY;
                const distSq = dx * dx + dy * dy;

                if (distSq > 400 || cX === 0 || cY === 0) { // 20px diff
                    view.memory.entities.x[i] = sX;
                    view.memory.entities.y[i] = sY;
                } else {
                    view.memory.entities.x[i] = cX + dx * 0.3; // Soft lerp
                    view.memory.entities.y[i] = cY + dy * 0.3;
                }

                // Always take server velocity, targets and states
                view.memory.entities.vx[i] = sVx;
                view.memory.entities.vy[i] = sVy;
                view.memory.entities.owner[i] = srcView.getEntityOwner(i);
                view.memory.entities.radius[i] = srcView.getEntityRadius(i);
                view.memory.entities.maxSpeed[i] = srcView.getEntityMaxSpeed(i);
                view.memory.entities.friction[i] = srcView.getEntityFriction(i);
                view.memory.entities.hp[i] = srcView.getEntityHp(i);
                view.memory.entities.speedBoost[i] = srcView.getEntitySpeedBoost(i);
                view.memory.entities.flags[i] = srcView.memory.entities.flags[i];
                view.memory.entities.deathTime[i] = srcView.getEntityDeathTime(i);
                view.memory.entities.deathType[i] = srcView.getEntityDeathType(i);
                view.memory.entities.targetX[i] = srcView.getEntityTargetX(i);
                view.memory.entities.targetY[i] = srcView.getEntityTargetY(i);
                view.memory.entities.targetNodeId[i] = srcView.getEntityTargetNodeId(i);
                view.memory.entities.id[i] = srcView.getEntityId(i);
            }
        }

        // Check for node captures to play sound
        const newNodeCount = view.getNodeCount();
        for (let i = 0; i < newNodeCount; i++) {
            const newOwner = view.getNodeOwner(i);
            const prevOwner = prevOwners[i] !== undefined ? prevOwners[i] : -1;
            if (prevOwner !== newOwner && newOwner === this.playerIndex) {
                _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_2__.sounds.playCapture();
            }
        }

        // Center camera on player's starting node once
        if (!this.cameraCentered && this.playerIndex !== -1 && newNodeCount > 0) {
            for (let i = 0; i < newNodeCount; i++) {
                if (view.getNodeOwner(i) === this.playerIndex) {
                    this.game.camera.zoom = 0.45; // Start zoomed out for a wide tactical view of the local node system
                    this.game.camera.centerOn(view.getNodeX(i), view.getNodeY(i), this.game.canvas.width, this.game.canvas.height);
                    this.cameraCentered = true;
                    break;
                }
            }
        }

        // Restore game settings / state globals
        if (serverState.elapsedTime !== undefined) {
            this.game.state.elapsedTime = serverState.elapsedTime;
        }

        if (serverState.gameSettings) {
            this.game.state.speedMultiplier = serverState.gameSettings.speedMultiplier;
            this.game.state.accelerationEnabled = serverState.gameSettings.accelerationEnabled;
            this.game.state.showProduction = serverState.gameSettings.showProduction;
        }

        if (serverState.stats) {
            this.game.state.stats = serverState.stats;
            // Hack to provide legacy unitCounts map to UI
            this.game.state.unitCounts = serverState.stats.current || {};
        }

        // Map events from Server (explosions etc) directly since Server processEvents clears them
        // Wait, for visuals we can just rely on the GameClient doing simple prediction or nothing
        // Server DO Engine currently drops events into the server's sharedMemory, then processEvents clears them.
        // So client won't see them. We can ignore particles for now or fix later.
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
/* harmony import */ var _shared_CampaignConfig_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../shared/CampaignConfig.js */ "./src/shared/CampaignConfig.js");
/* harmony import */ var _CampaignManager_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../CampaignManager.js */ "./src/client/CampaignManager.js");








class SingleplayerController {
    constructor(game) {
        this.game = game;
        this.ais = [];
        this.gameOverShown = false;

        // Tutorial State
        this.tutorialSteps = [];
        this.currentTutorialStep = 0;
        this.tutorialTimer = 0;
        this.tutorialActive = false;
        this.winCondition = null;
        this.actionsPerformed = new Set();
    }

    setup(playerCount = 1, difficulty = 'intermediate', testMode = false, campaignId = null) {
        this.campaignId = campaignId;
        this.isCampaign = campaignId !== null;
        let campaignConfig = null;

        if (this.isCampaign) {
            campaignConfig = (0,_shared_CampaignConfig_js__WEBPACK_IMPORTED_MODULE_5__.getCampaignLevel)(parseInt(this.campaignId));
            if (!campaignConfig) {
                console.error("Campaign level not found. Falling back to default.");
                this.isCampaign = false;
            } else {
                playerCount = 1 + campaignConfig.enemies.length;
            }
        }

        this.game.state.playerCount = playerCount;

        // In test mode, force easy difficulty but respect player count
        if (testMode) {
            difficulty = 'easy';
        }

        this.game.state.difficulty = difficulty;
        this.testMode = testMode;
        this.playerIndex = 0;
        this.createLevel(campaignConfig);
        this.createInitialEntities(testMode);

        // Center camera on human player's home node
        const homeNode = this.game.state.nodes.find(n => n.owner === this.playerIndex);
        if (homeNode && !this.game.skipCameraReset) {
            this.game.camera.zoom = 0.45; // Start zoomed out for a wide tactical view of the local node system
            this.game.camera.centerOn(homeNode.x, homeNode.y, this.game.canvas.width, this.game.canvas.height);
        }

        const difficultyMap = {
            'easy': 'Easy',
            'intermediate': 'Intermediate',
            'normal': 'Normal',
            'hard': 'Hard',
            'expert': 'Expert',
            'impossible': 'Impossible'
        };

        if (this.isCampaign) {
            // Load specific AIs
            campaignConfig.enemies.forEach(enemy => {
                const ai = new _shared_AIController_js__WEBPACK_IMPORTED_MODULE_0__.AIController(this.game, enemy.id, enemy.difficulty);
                ai.personality = enemy.personality; // Override personality if set
                this.ais.push(ai);
            });

            if (campaignConfig.tutorialSteps) {
                this.tutorialSteps = campaignConfig.tutorialSteps;
                this.tutorialActive = true;
                this.currentTutorialStep = 0;
                this.tutorialTimer = 0;
            }

            if (campaignConfig.winCondition) {
                this.winCondition = campaignConfig.winCondition;
            }
        } else {
            // Create AIs for CPUs (indices > 0)
            for (let i = 1; i < playerCount; i++) {
                const aiDifficulty = difficultyMap[difficulty] || 'Normal';
                this.ais.push(new _shared_AIController_js__WEBPACK_IMPORTED_MODULE_0__.AIController(this.game, i, aiDifficulty));
            }
        }
    }

    createLevel(campaignConfig = null) {
        let width = this.game.state.worldWidth;
        let height = this.game.state.worldHeight;

        if (campaignConfig && campaignConfig.mapConfig) {
            // Override with campaign configs
            const sizeMap = {
                'small': { w: 1500, h: 1000 },
                'medium': { w: 2500, h: 1800 },
                'large': { w: 4000, h: 3000 },
                'epic': { w: 6000, h: 4500 }
            };

            const sz = sizeMap[campaignConfig.mapConfig.size];
            if (sz) {
                width = sz.w;
                height = sz.h;
                this.game.state.worldWidth = width;
                this.game.state.worldHeight = height;
            }

            // Fixed nodes override
            const fixedNodes = campaignConfig.mapConfig ? campaignConfig.mapConfig.fixedNodes : null;

            // Otherwise generate random map but with config parameters
            this.game.state.nodes = _shared_MapGenerator_js__WEBPACK_IMPORTED_MODULE_3__.MapGenerator.generate(
                this.game.state.playerCount,
                width,
                height,
                fixedNodes || null
            );

            // Spawn initial tutorial entities if defined
            if (campaignConfig.mapConfig.initialEntities) {
                campaignConfig.mapConfig.initialEntities.forEach(group => {
                    for (let i = 0; i < group.count; i++) {
                        // Offset slightly
                        const angle = Math.random() * Math.PI * 2;
                        const dist = Math.random() * 50;
                        const ent = new _shared_Entity_js__WEBPACK_IMPORTED_MODULE_2__.Entity(
                            group.x + Math.cos(angle) * dist,
                            group.y + Math.sin(angle) * dist,
                            group.owner
                        );
                        this.game.state.entities.push(ent);
                    }
                });
            }
        } else {
            this.game.state.nodes = _shared_MapGenerator_js__WEBPACK_IMPORTED_MODULE_3__.MapGenerator.generate(this.game.state.playerCount, width, height);
        }
    }

    createInitialEntities(testMode = false) {
        const initialCount = testMode ? 500 : 15;

        this.game.state.nodes.forEach(node => {
            if (node.owner !== -1) {
                for (let i = 0; i < initialCount; i++) {
                    // Spawn units tightly clustered around the node center
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * (node.radius + 20);
                    const ent = new _shared_Entity_js__WEBPACK_IMPORTED_MODULE_2__.Entity(
                        node.x + Math.cos(angle) * dist,
                        node.y + Math.sin(angle) * dist,
                        node.owner
                    );
                    this.game.state.entities.push(ent);
                }
            }
        });
    }

    onAction(action) {
        if (!this.actionsPerformed) this.actionsPerformed = new Set();
        this.actionsPerformed.add(action);
        // Compatibility for different action names
        if (action === 'move') this.actionsPerformed.add('moved');
    }

    surrender() {
        if (!this.gameOverShown) {
            this.showGameOver(false);
        }
    }

    sendAction(action) {
        const { type, unitIds, nodeIds, targetX, targetY, targetNodeId, path } = action;

        if (type === 'path' && path && unitIds) {
            unitIds.forEach(id => {
                const ent = this.game.state.entities.find(e => e.id === id);
                if (ent) {
                    ent.waypoints = [...path];
                    ent.targetNode = targetNodeId ? this.game.state.nodes.find(n => n.id === targetNodeId) : null;
                    // Start moving to first waypoint immediately
                    const first = ent.waypoints[0];
                    this.game.setEntityTarget(id, first.x, first.y, ent.targetNode ? ent.targetNode.id : -1);
                }
            });
        } else if (type === 'move' && unitIds) {
            unitIds.forEach(id => {
                const ent = this.game.state.entities.find(e => e.id === id);
                if (ent) {
                    ent.waypoints = []; // Clear previous path
                    ent.targetNode = targetNodeId ? this.game.state.nodes.find(n => n.id === targetNodeId) : null;
                    this.game.setEntityTarget(id, targetX, targetY, targetNodeId || -1);
                }
            });
        } else if (type === 'rally' && nodeIds) {
            nodeIds.forEach(id => {
                const node = this.game.state.nodes.find(n => n.id === id);
                if (node) {
                    const targetNode = targetNodeId ? this.game.state.nodes.find(n => n.id === targetNodeId) : null;
                    node.setRallyPoint(targetX, targetY, targetNode);
                }
            });
        } else if (type === 'stop' && unitIds) {
            unitIds.forEach(id => {
                const ent = this.game.state.entities.find(e => e.id === id);
                if (ent) {
                    ent.stop();
                    this.game.setEntityTarget(id, 0, 0, -1);
                }
            });
        }
    }

    handleTutorial(dt) {
        const step = this.tutorialSteps[this.currentTutorialStep];
        if (!step) return;

        let completed = false;

        if (step.trigger === 'time') {
            this.tutorialTimer += dt * 1000; // ms
            if (this.tutorialTimer >= step.delay) {
                completed = true;
            }
        } else if (step.trigger === 'units') {
            const playerUnits = this.game.state.entities.filter(e => !e.dead && !e.dying && e.owner === 0).length;
            if (playerUnits >= step.count) {
                completed = true;
            }
        } else if (step.trigger === 'nodes') {
            const playerNodes = this.game.state.nodes.filter(n => n.owner === 0).length;
            if (playerNodes >= step.count) {
                completed = true;
            }
        }

        // Display current step text if it has one and we are waiting
        const msgEl = document.getElementById('tutorial-message');
        if (msgEl) {
            if (step.text) {
                msgEl.style.display = 'block';
                msgEl.textContent = step.text;
            } else {
                msgEl.style.display = 'none';
            }
        }

        if (completed) {
            this.currentTutorialStep++;
            this.tutorialTimer = 0;
            if (this.currentTutorialStep >= this.tutorialSteps.length) {
                this.tutorialActive = false;
                if (msgEl) msgEl.style.display = 'none';
            }
        }
    }

    update(dt) {
        this.ais.forEach(ai => ai.update(dt));

        if (this.tutorialActive && this.currentTutorialStep < this.tutorialSteps.length) {
            this.handleTutorial(dt);
        }

        // Path-following logic for singleplayer (feeder for worker)
        if (this.game.useWorker) {
            this.game.state.entities.forEach(ent => {
                if (!ent.dead && !ent.dying && ent.waypoints && ent.waypoints.length > 0) {
                    // If entity has no current target in worker or is very close to current target, feed next waypoint
                    const dx = ent.x - ent.waypoints[0].x;
                    const dy = ent.y - ent.waypoints[0].y;
                    const distSq = dx * dx + dy * dy;

                    // If reached waypoint (within 20px)
                    if (distSq < 400) {
                        ent.waypoints.shift();
                        if (ent.waypoints.length > 0) {
                            const next = ent.waypoints[0];
                            this.game.setEntityTarget(ent.id, next.x, next.y, ent.targetNode ? ent.targetNode.id : -1);
                        } else {
                            // Path finished, let it settle or continue to target node
                            if (!ent.targetNode) {
                                // No node target, stop at last point
                            }
                        }
                    }
                }
            });
        }

        if (this.gameOverShown) return;

        const playerNodes = this.game.state.nodes.filter(n => n.owner === 0);
        const enemyNodes = this.game.state.nodes.filter(n => n.owner > 0);

        const playerUnits = this.game.state.entities.filter(e => !e.dead && !e.dying && e.owner === 0);
        const enemyUnits = this.game.state.entities.filter(e => !e.dead && !e.dying && e.owner > 0);

        const playerHasNodes = playerNodes.length > 0;
        const enemiesHaveNodes = enemyNodes.length > 0;

        // Custom Win Condition Check
        if (this.winCondition) {
            if (this.winCondition.type === 'unitsToGoal') {
                const targetNode = this.game.state.nodes.find(n => n.id === this.winCondition.nodeId);
                if (targetNode && targetNode.defendersInside >= this.winCondition.goal) {
                    this.showGameOver(true);
                    return;
                }
            } else if (this.winCondition.type === 'actionsComplete') {
                const allDone = this.winCondition.actions.every(action => this.actionsPerformed.has(action));
                if (allDone) {
                    this.showGameOver(true);
                    return;
                }
            } else if (this.winCondition.type === 'nodes') {
                const pNodes = this.game.state.nodes.filter(n => n.owner === this.playerIndex).length;
                if (pNodes >= this.winCondition.count) {
                    this.showGameOver(true);
                    return;
                }
            }
        }

        // Standard win condition check (only if no custom win condition, or explicitly standard)
        const isStandardWin = !this.winCondition || this.winCondition.type === 'standard';

        if (isStandardWin && !this.gameOverShown) {
            const playersWithNodes = new Set(this.game.state.nodes.filter(n => n.owner !== -1).map(n => n.owner));

            // In tutorials without enemies, don't trigger standard victory automatically
            const hasEnemiesInConfig = this.isCampaign && (0,_shared_CampaignConfig_js__WEBPACK_IMPORTED_MODULE_5__.getCampaignLevel)(parseInt(this.campaignId))?.enemies?.length > 0;
            const isFreePlay = !this.isCampaign;

            if (isFreePlay || hasEnemiesInConfig || (this.winCondition && this.winCondition.type === 'standard')) {
                if (playersWithNodes.size <= 1) {
                    const winner = Array.from(playersWithNodes)[0];
                    if (winner !== undefined) {
                        this.showGameOver(winner === this.playerIndex);
                    } else {
                        // All nodes lost
                        this.showGameOver(false);
                    }
                    return;
                }
            }
        }

        // Final absolute defeat check
        if (!playerAlive && !this.gameOverShown) {
            this.showGameOver(false);
            return;
        }

        // Final absolute victory check (only for standard mode with enemies)
        if (isStandardWin && !enemiesAlive && !this.gameOverShown) {
            const hasEnemiesInConfig = this.isCampaign && (0,_shared_CampaignConfig_js__WEBPACK_IMPORTED_MODULE_5__.getCampaignLevel)(parseInt(this.campaignId))?.enemies?.length > 0;
            if (hasEnemiesInConfig || !this.isCampaign) {
                this.showGameOver(true);
                return;
            }
        }

        const playerAlive = playerHasNodes || playerUnits.length > 0;
        const enemiesAlive = enemiesHaveNodes || enemyUnits.length > 0;

        if (!playerHasNodes && playerAlive) {
            if (!this.playerLostNodesWarning) {
                this.playerLostNodesWarning = true;
                const notif = document.createElement('div');
                notif.style.cssText = `
                    position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
                    background: rgba(255,152,0,0.9); color: white; padding: 10px 20px;
                    border-radius: 4px; z-index: 100; font-family: monospace; font-weight: bold;
                `;
                notif.textContent = 'SIN NODOS - Tus unidades están pereciendo. Captura un nodo rápido!';
                document.body.appendChild(notif);
                setTimeout(() => notif.remove(), 5000);
            }
        } else if (playerHasNodes) {
            this.playerLostNodesWarning = false;
        }
    }

    showGameOver(won) {
        this.gameOverShown = true;
        this.game.gameOverShown = true;

        if (won) {
            _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_4__.sounds.playWin();
            if (this.isCampaign) {
                _CampaignManager_js__WEBPACK_IMPORTED_MODULE_6__.CampaignManager.completeLevel(parseInt(this.campaignId));
            }
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
                    <div style="color: ${pColor}; margin: 10px 0; padding: 12px 15px; background: rgba(255,255,255,0.03); border-radius: 6px; border-left: 4px solid ${pColor}; display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <strong style="font-size: 15px; letter-spacing: 1px;">${pName}</strong>
                            <span style="font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 1px;">NODOS: ${captured}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 11px; color: rgba(255,255,255,0.6);">
                            <div style="display: flex; flex-direction: column;"><span style="font-size: 9px; opacity: 0.5;">PROD</span><span>${produced}</span></div>
                            <div style="display: flex; flex-direction: column;"><span style="font-size: 9px; opacity: 0.5;">RITMO</span><span>${prodPerMin}/m</span></div>
                            <div style="display: flex; flex-direction: column;"><span style="font-size: 9px; opacity: 0.5;">BAJAS</span><span>${lostUnits}</span></div>
                            <div style="display: flex; flex-direction: column;"><span style="font-size: 9px; opacity: 0.5;">VIVO</span><span>${current}</span></div>
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
            <div style="margin: 20px 0;">
                <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 15px;">
                    <button id="btn-graph-prod" onclick="window.updateGraph('production')" style="background: transparent; border: 1px solid #333; color: #666; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 11px; transition: all 0.2s;">PRODUCCIÓN</button>
                    <button id="btn-graph-units" onclick="window.updateGraph('units')" style="background: transparent; border: 1px solid #333; color: #666; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 11px; transition: all 0.2s;">UNIDADES</button>
                    <button id="btn-graph-nodes" onclick="window.updateGraph('nodes')" style="background: transparent; border: 1px solid #333; color: #666; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 11px; transition: all 0.2s;">TERRITORIO</button>
                </div>
                <div style="position: relative;">
                    <canvas id="stats-graph-sp" width="${graphWidth}" height="${graphHeight}" style="border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); border-radius: 4px; cursor: crosshair;"></canvas>
                    <button onclick="window.downloadGraph()" style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.05); color: #666; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; font-size: 9px; padding: 4px 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.color='#fff';this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='#666';this.style.background='rgba(255,255,255,0.05)'">EXPORTAR PNG</button>
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
            padding: 40px 50px; background: #0e0e12;
            border: 1px solid rgba(255,255,255,0.1); border-top: 4px solid ${color};
            border-radius: 8px; text-align: center; position: relative;
            max-width: 650px; width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8);
        `;

        box.innerHTML = `
            <h1 style="color: ${color}; font-size: 48px; margin: 0 0 5px 0; letter-spacing: 8px; font-weight: 900; text-shadow: 0 0 30px ${color}44;">${msg}</h1>
            <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin-bottom: 30px; letter-spacing: 4px; text-transform: uppercase;">REGISTRO DE OPERACIONES COMPLETADO</p>
            
            ${graphUI}
            <div style="height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent); margin: 25px 0;"></div>
            ${statsHTML}
            
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                ${this.isCampaign && won && parseInt(this.campaignId) < _shared_CampaignConfig_js__WEBPACK_IMPORTED_MODULE_5__.CampaignLevels.length - 1 ?
                `<button onclick="window.location.href='singleplayer.html?campaign=${parseInt(this.campaignId) + 1}'" style="
                    padding: 14px 35px; background: ${color}; border: none; border-radius: 4px;
                    color: white; font-family: 'Courier New', monospace; font-weight: bold;
                    font-size: 13px; cursor: pointer; letter-spacing: 2px;
                    transition: all 0.2s; box-shadow: 0 4px 15px ${color}33;">
                    SIGUIENTE NIVEL
                </button>` :
                `<button onclick="location.reload()" style="
                    padding: 14px 35px; background: ${color}; border: none; border-radius: 4px;
                    color: white; font-family: 'Courier New', monospace; font-weight: bold;
                    font-size: 13px; cursor: pointer; letter-spacing: 2px;
                    transition: all 0.2s; box-shadow: 0 4px 15px ${color}33;">
                    REINTENTAR
                </button>`}
                <button onclick="location.href='index.html'" style="
                    padding: 14px 35px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 4px; color: #aaa; font-family: 'Courier New', monospace;
                    font-size: 13px; cursor: pointer; letter-spacing: 2px;
                    transition: all 0.2s;">
                    SALIR
                </button>
            </div>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // Initial graph state
        this.graphState = {
            offset: 0,
            scale: 1.0,
            type: 'production'
        };

        // Define graph update function globally so buttons can call it
        window.updateGraph = (type) => {
            if (type) this.graphState.type = type;
            const canvas = document.getElementById('stats-graph-sp');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            const padTop = 30;
            const padBottom = 25;
            const padLeft = 40;
            const padRight = 20;
            const graphW = w - padLeft - padRight;
            const graphH = h - padTop - padBottom;

            ctx.clearRect(0, 0, w, h);

            let dataArray = [];
            let title = '';
            let timeScale = 1;

            // Update active button style
            ['prod', 'units', 'nodes'].forEach(t => {
                const btn = document.getElementById(`btn-graph-${t}`);
                const fullType = t === 'prod' ? 'production' : (t === 'units' ? 'units' : 'nodes');
                if (btn) {
                    btn.style.background = fullType === this.graphState.type ? color + '22' : 'transparent';
                    btn.style.borderColor = fullType === this.graphState.type ? color : '#333';
                    btn.style.color = fullType === this.graphState.type ? color : '#666';
                }
            });

            if (this.graphState.type === 'production') {
                dataArray = stats.productionHistory || [];
                title = 'PRODUCCIÓN (UNID/MIN)';
                timeScale = 1;
            } else if (this.graphState.type === 'units') {
                dataArray = stats.history || [];
                title = 'EJÉRCITO TOTAL';
                timeScale = 60;
            } else if (this.graphState.type === 'nodes') {
                dataArray = stats.nodeHistory || [];
                title = 'TERRITORIO (NODOS)';
                timeScale = 60;
            }

            if (!dataArray || dataArray.length < 2) {
                // Try to show at least one point if exists
                if (dataArray.length === 0) {
                    ctx.fillStyle = '#444';
                    ctx.textAlign = 'center';
                    ctx.fillText('DATOS INSUFICIENTES', w / 2, h / 2);
                    return;
                }
            }

            // Find max value
            let maxVal = 0;
            dataArray.forEach(p => {
                const val = p.rate !== undefined ? p.rate : p.count;
                if (val > maxVal) maxVal = val;
            });

            // Smart scaling
            if (this.graphState.type === 'nodes') maxVal = Math.ceil(Math.max(maxVal, 5) * 1.2);
            else if (maxVal > 100) {
                const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
                maxVal = Math.ceil((maxVal * 1.1) / magnitude) * magnitude;
            } else {
                maxVal = Math.ceil(Math.max(maxVal, 10) * 1.2);
            }

            ctx.save();

            // Background grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.textAlign = 'right';
            ctx.font = '10px "Courier New"';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';

            for (let i = 0; i <= 4; i++) {
                const y = padTop + graphH - (i / 4) * graphH;
                ctx.beginPath();
                ctx.moveTo(padLeft, y);
                ctx.lineTo(padLeft + graphW, y);
                ctx.stroke();
                ctx.fillText(Math.round((i / 4) * maxVal), padLeft - 8, y + 3);
            }

            // TOTAL TIME in MINUTES for scaling
            const totalTime = Math.max(stats.elapsed || 0, 0.1); // Min 6 seconds scale
            const timeToX = (t) => padLeft + (t * (graphW / totalTime) * this.graphState.scale) + this.graphState.offset;

            // Clip for scrolling
            ctx.beginPath();
            ctx.rect(padLeft, 0, graphW, h);
            ctx.clip();

            // Draw events markers
            if (stats.events) {
                stats.events.forEach(ev => {
                    const t = ev.time / (this.graphState.type === 'production' ? 60 : 1);
                    const x = timeToX(t / (timeScale === 60 ? 60 : 1));
                    if (x < padLeft || x > padLeft + graphW) return;

                    ctx.setLineDash([5, 5]);
                    ctx.strokeStyle = ev.type === 'big_battle' ? 'rgba(255,50,50,0.3)' : 'rgba(255,255,255,0.1)';
                    ctx.beginPath();
                    ctx.moveTo(x, padTop);
                    ctx.lineTo(x, padTop + graphH);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.font = '12px serif';
                    if (ev.type === 'big_battle') ctx.fillText('⚔️', x + 10, padTop + 15);
                    else if (ev.type === 'capture') {
                        ctx.fillStyle = playerColors[ev.playerId % playerColors.length];
                        ctx.fillText('🚩', x + 10, padTop + 30);
                    }
                });
            }

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
                ctx.lineWidth = 3;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';

                const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + graphH);
                gradient.addColorStop(0, pC + '33');
                gradient.addColorStop(1, pC + '00');

                ctx.beginPath();
                data.forEach((p, i) => {
                    const val = p.rate !== undefined ? p.rate : p.count;
                    const x = timeToX(p.time / (timeScale === 60 ? 60 : 1));
                    const y = padTop + graphH - (val / maxVal) * graphH;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();

                // Fill area
                if (data.length > 0) {
                    ctx.lineTo(timeToX(data[data.length - 1].time / (timeScale === 60 ? 60 : 1)), padTop + graphH);
                    ctx.lineTo(timeToX(data[0].time / (timeScale === 60 ? 60 : 1)), padTop + graphH);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                }
            }

            ctx.restore();

            // Title and labels
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 13px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText(title, w / 2, 18);

            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = '9px "Courier New"';
            ctx.fillText('SCROLL: ZOOM • DRAG: PAN', w / 2, h - 8);
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

        // Interaction logic
        setTimeout(() => {
            const canvas = document.getElementById('stats-graph-sp');
            if (!canvas) return;

            let isDragging = false;
            let lastX = 0;

            canvas.addEventListener('mousedown', (e) => {
                isDragging = true;
                lastX = e.clientX;
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - lastX;
                this.graphState.offset += dx;
                lastX = e.clientX;
                window.updateGraph();
            });

            window.addEventListener('mouseup', () => {
                isDragging = false;
            });

            canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

                // Zoom relative to center or mouse? Let's do simple center
                const oldScale = this.graphState.scale;
                this.graphState.scale *= zoomFactor;
                this.graphState.scale = Math.max(1.0, Math.min(this.graphState.scale, 10));

                // Adjust offset to keep same point under mouse?
                // For now, just scale. User can pan.
                if (this.graphState.scale === 1.0) this.graphState.offset = 0;

                window.updateGraph();
            });

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
        this.keys = {}; // Track active keys for continuous movement
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

        // Check if mouse is over a node using selection manager's method
        const worldPos = this.game.camera.screenToWorld(this.mouse.x, this.mouse.y);
        const nodeIdx = this.game.systems.selection.findNodeAtWorld(worldPos.x, worldPos.y, 10);
        if (nodeIdx >= 0) {
            const view = this.game.sharedView;
            if (view) {
                const nodeId = view.getNodeId(nodeIdx);
                this.nodeUnderMouse = this.game.state.nodes.find(n => n.id === nodeId) || null;
            } else {
                this.nodeUnderMouse = this.game.state.nodes[nodeIdx] || null;
            }
        } else {
            this.nodeUnderMouse = null;
        }

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
        this.keys[e.code] = true;

        if (e.code === 'Space') {
            this.spaceDown = true;
            e.preventDefault();
        }
        
        // Rally point with T or E - only if we have nodes selected
        if (e.code === 'KeyT' || e.code === 'KeyE') {
            const sel = this.game.systems.selection;
            if (sel.selectedNodes.size > 0) {
                sel.rallyMode = true;
            }
        }

        // Escape - cancel selection and rally mode
        if (e.code === 'Escape') {
            const sel = this.game.systems.selection;
            sel.clear();
            sel.rallyMode = false;
        }

        // Q - Select all units on screen
        if (e.code === 'KeyQ') {
            const sel = this.game.systems.selection;
            const playerIdx = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
            
            // Get all units currently in view
            const entitiesInView = sel.getEntitiesInViewScreenRect(0, 0, window.innerWidth, window.innerHeight, playerIdx);
            
            if (entitiesInView.length > 0) {
                // Clear existing selection first? (Standard RTS behavior is Q selects all units)
                if (!e.shiftKey) sel.clear();
                
                for (const eIdx of entitiesInView) {
                    sel.selectedEntities.add(sel.getEntityId(eIdx));
                }
                _SoundManager_js__WEBPACK_IMPORTED_MODULE_0__.sounds.playSelect();
            }
        }
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
        if (e.code === 'Space') {
            this.spaceDown = false;
        }
    }

    update(dt) {
        // WASD Camera movement
        const panSpeed = 800 * dt; // Adjust speed as needed
        let dx = 0;
        let dy = 0;

        if (this.keys['KeyW']) dy += panSpeed;
        if (this.keys['KeyS']) dy -= panSpeed;
        if (this.keys['KeyA']) dx += panSpeed;
        if (this.keys['KeyD']) dx -= panSpeed;

        if (dx !== 0 || dy !== 0) {
            this.game.camera.pan(dx, dy);
        }
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
        this._rallyMode = false;
    }

    get rallyMode() {
        return this._rallyMode;
    }

    set rallyMode(value) {
        this._rallyMode = value;
        if (this.game.canvas) {
            this.game.canvas.style.cursor = value ? 'crosshair' : 'default';
        }
    }

    get view() {
        return this.game.sharedView || null;
    }

    getNodeCount() {
        const view = this.view;
        return view ? view.getNodeCount() : this.game.state.nodes.length;
    }

    getEntityCount() {
        const view = this.view;
        return view ? view.getEntityCount() : this.game.state.entities.length;
    }

    getNodeOwner(idx) {
        const view = this.view;
        return view ? view.getNodeOwner(idx) : this.game.state.nodes[idx].owner;
    }

    getNodeX(idx) {
        const view = this.view;
        return view ? view.getNodeX(idx) : this.game.state.nodes[idx].x;
    }

    getNodeY(idx) {
        const view = this.view;
        return view ? view.getNodeY(idx) : this.game.state.nodes[idx].y;
    }

    getNodeRadius(idx) {
        const view = this.view;
        return view ? view.getNodeRadius(idx) : this.game.state.nodes[idx].radius;
    }

    getNodeInfluenceRadius(idx) {
        const view = this.view;
        return view ? view.getNodeInfluenceRadius(idx) : this.game.state.nodes[idx].influenceRadius;
    }

    getNodeId(idx) {
        const view = this.view;
        return view ? view.getNodeId(idx) : this.game.state.nodes[idx].id;
    }

    getEntityOwner(idx) {
        const view = this.view;
        return view ? view.getEntityOwner(idx) : this.game.state.entities[idx].owner;
    }

    getEntityX(idx) {
        const view = this.view;
        return view ? view.getEntityX(idx) : this.game.state.entities[idx].x;
    }

    getEntityY(idx) {
        const view = this.view;
        return view ? view.getEntityY(idx) : this.game.state.entities[idx].y;
    }

    getEntityRadius(idx) {
        const view = this.view;
        return view ? view.getEntityRadius(idx) : this.game.state.entities[idx].radius;
    }

    getEntityId(idx) {
        const view = this.view;
        return view ? view.getEntityId(idx) : this.game.state.entities[idx].id;
    }

    isEntityDead(idx) {
        const view = this.view;
        return view ? view.isEntityDead(idx) : this.game.state.entities[idx].dead;
    }

    isEntityDying(idx) {
        const view = this.view;
        return view ? view.isEntityDying(idx) : this.game.state.entities[idx].dying;
    }

    findNodeAtScreen(mx, my) {
        const camera = this.game.camera;
        const count = this.getNodeCount();
        const worldPos = camera.screenToWorld(mx, my);

        for (let i = 0; i < count; i++) {
            const nx = this.getNodeX(i);
            const ny = this.getNodeY(i);
            const radius = this.getNodeRadius(i);
            const dx = worldPos.x - nx;
            const dy = worldPos.y - ny;
            if (dx * dx + dy * dy < radius * radius) {
                return i;
            }
        }
        return -1;
    }

    findEntityAtScreen(mx, my) {
        const camera = this.game.camera;
        const count = this.getEntityCount();
        const worldPos = camera.screenToWorld(mx, my);

        for (let i = 0; i < count; i++) {
            if (this.isEntityDead(i) || this.isEntityDying(i)) continue;
            const ex = this.getEntityX(i);
            const ey = this.getEntityY(i);
            // In screen space, radius was (r + 5) * zoom.
            // In world space, the hit radius equivalent is just (r + 5).
            const radius = this.getEntityRadius(i) + 5;

            const dx = worldPos.x - ex;
            const dy = worldPos.y - ey;

            if (dx * dx + dy * dy < radius * radius) {
                return i;
            }
        }
        return -1;
    }

    findNodeAtWorld(x, y, radius) {
        const view = this.view;
        if (view) {
            return view.findNodeByPosition(x, y, radius);
        }
        const node = this.game.state.nodes.find(n => {
            const dx = n.x - x, dy = n.y - y;
            return Math.sqrt(dx * dx + dy * dy) < n.radius + radius;
        });
        return node ? this.game.state.nodes.indexOf(node) : -1;
    }

    getEntitiesInNodeArea(nodeIdx) {
        const view = this.view;
        const nx = this.getNodeX(nodeIdx);
        const ny = this.getNodeY(nodeIdx);
        const radius = this.getNodeInfluenceRadius(nodeIdx);
        const owner = this.getNodeOwner(nodeIdx);

        if (view) {
            return view.getEntitiesInRadius(nx, ny, radius, owner);
        }

        const result = [];
        this.game.state.entities.forEach((e, i) => {
            if (e.owner === owner && !e.dead && !e.dying) {
                const dx = e.x - nx, dy = e.y - ny;
                if (dx * dx + dy * dy <= radius * radius) {
                    result.push(i);
                }
            }
        });
        return result;
    }

    getEntitiesInScreenRect(x1, y1, x2, y2, owner) {
        const view = this.view;
        const camera = this.game.camera;

        const w1 = camera.screenToWorld(x1, y1);
        const w2 = camera.screenToWorld(x2, y2);
        const minX = Math.min(w1.x, w2.x);
        const maxX = Math.max(w1.x, w2.x);
        const minY = Math.min(w1.y, w2.y);
        const maxY = Math.max(w1.y, w2.y);

        if (view) {
            return view.getEntitiesInRect(minX, minY, maxX, maxY, owner);
        }

        const result = [];
        this.game.state.entities.forEach((e, i) => {
            if (owner !== undefined && e.owner !== owner) return;
            if (e.dead || e.dying) return;
            const radius = e.radius + 5;
            if (e.x + radius >= minX && e.x - radius <= maxX &&
                e.y + radius >= minY && e.y - radius <= maxY) {
                result.push(i);
            }
        });
        return result;
    }

    getEntitiesInViewScreenRect(x1, y1, x2, y2, owner) {
        const camera = this.game.camera;
        const result = [];

        const w1 = camera.screenToWorld(x1, y1);
        const w2 = camera.screenToWorld(x2, y2);
        const minX = Math.min(w1.x, w2.x);
        const maxX = Math.max(w1.x, w2.x);
        const minY = Math.min(w1.y, w2.y);
        const maxY = Math.max(w1.y, w2.y);

        const count = this.getEntityCount();
        for (let i = 0; i < count; i++) {
            if (this.isEntityDead(i) || this.isEntityDying(i)) continue;
            if (owner !== undefined && this.getEntityOwner(i) !== owner) continue;

            const ex = this.getEntityX(i);
            const ey = this.getEntityY(i);
            const radius = this.getEntityRadius(i) + 5;

            if (ex + radius >= minX && ex - radius <= maxX && ey + radius >= minY && ey - radius <= maxY) {
                result.push(i);
            }
        }
        return result;
    }

    getNodesInRect(x1, y1, x2, y2) {
        const camera = this.game.camera;
        const count = this.getNodeCount();
        const result = [];

        const w1 = camera.screenToWorld(x1, y1);
        const w2 = camera.screenToWorld(x2, y2);
        const minX = Math.min(w1.x, w2.x);
        const maxX = Math.max(w1.x, w2.x);
        const minY = Math.min(w1.y, w2.y);
        const maxY = Math.max(w1.y, w2.y);

        for (let i = 0; i < count; i++) {
            const nx = this.getNodeX(i);
            const ny = this.getNodeY(i);
            const radius = this.getNodeRadius(i);
            if (nx + radius >= minX && nx - radius <= maxX &&
                ny + radius >= minY && ny - radius <= maxY) {
                result.push(this.getNodeId(i));
            }
        }
        return result;
    }

    isSelected(obj) {
        if (obj.radius > 10) {
            return this.selectedNodes.has(obj.id);
        }
        return this.selectedEntities.has(obj.id);
    }

    handleMouseDown(mouse, event) {
        const worldPos = this.game.camera.screenToWorld(mouse.x, mouse.y);

        if (event.button === 0) {
            const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
            if (this.rallyMode && this.selectedNodes.size > 0) {
                const targetNodeIdx = this.findNodeAtWorld(worldPos.x, worldPos.y, 10);
                const targetNodeId = targetNodeIdx >= 0 ? this.getNodeId(targetNodeIdx) : null;

                if (this.game.controller.sendAction) {
                    this.game.controller.sendAction({
                        type: 'rally',
                        nodeIds: Array.from(this.selectedNodes),
                        targetX: worldPos.x,
                        targetY: worldPos.y,
                        targetNodeId: targetNodeId
                    });
                } else {
                    this.selectedNodes.forEach(id => {
                        const node = this.game.state.nodes.find(n => n.id === id);
                        if (node && node.sharedNodeData) {
                            const targetNode = targetNodeIdx >= 0 ? this.game.state.nodes.find(n => n.id === this.getNodeId(targetNodeIdx)) : null;
                            node.setRallyPoint(worldPos.x, worldPos.y, targetNode);
                        } else if (node) {
                            const targetNode = targetNodeIdx >= 0 ? this.game.state.nodes.find(n => n.id === this.getNodeId(targetNodeIdx)) : null;
                            node.rallyPoint = { x: worldPos.x, y: worldPos.y };
                            node.rallyTargetNode = targetNode;
                        }
                    });
                }
                if (this.game.controller && this.game.controller.onAction) {
                    this.game.controller.onAction('rally');
                }
                this.rallyMode = false;
                return;
            }

            if (!event.shiftKey) {
                this.clear();
            }
            this.boxStart = { x: mouse.x, y: mouse.y };

            if (event.detail === 2) {
                this.handleDoubleClick(mouse.x, mouse.y);
                return;
            }
        }

        if (event.button === 2) {
            this.currentPath = [worldPos];
            this.handleRightClick(worldPos.x, worldPos.y);
        }
    }

    findNodeById(id) {
        const view = this.view;
        if (view) {
            return view.findNodeById(id);
        }
        const node = this.game.state.nodes.find(n => n.id === id);
        return node ? this.game.state.nodes.indexOf(node) : -1;
    }

    findEntityById(id) {
        const view = this.view;
        if (view) {
            return view.findEntityById(id);
        }
        const entity = this.game.state.entities.find(e => e.id === id);
        return entity ? this.game.state.entities.indexOf(entity) : -1;
    }

    handleDoubleClick(mx, my) {
        const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
        const clickedNodeIdx = this.findNodeAtScreen(mx, my);

        if (clickedNodeIdx >= 0) {
            const owner = this.getNodeOwner(clickedNodeIdx);
            const count = this.getNodeCount();
            for (let i = 0; i < count; i++) {
                if (this.getNodeOwner(i) === owner) {
                    this.selectedNodes.add(this.getNodeId(i));
                    if (owner === playerIndex) {
                        const entityIdxs = this.getEntitiesInNodeArea(i);
                        for (const eIdx of entityIdxs) {
                            this.selectedEntities.add(this.getEntityId(eIdx));
                        }
                    }
                }
            }
            return;
        }

        const clickedEntityIdx = this.findEntityAtScreen(mx, my);
        if (clickedEntityIdx >= 0) {
            const owner = this.getEntityOwner(clickedEntityIdx);
            if (owner === playerIndex) {
                const entityIdxs = this.getEntitiesInViewScreenRect(0, 0, window.innerWidth, window.innerHeight, owner);
                for (const eIdx of entityIdxs) {
                    this.selectedEntities.add(this.getEntityId(eIdx));
                }
            }
        }
    }

    handleMouseMove(mouse, event) {
        if (mouse.down && mouse.drag) {
            this.isSelectingBox = true;
        }
        if (mouse.rightDown) {
            const worldPos = this.game.camera.screenToWorld(mouse.x, mouse.y);
            const lastPoint = this.currentPath[this.currentPath.length - 1];
            if (lastPoint) {
                const dx = worldPos.x - lastPoint.x;
                const dy = worldPos.y - lastPoint.y;

                if (Math.sqrt(dx * dx + dy * dy) > 30) {
                    this.currentPath.push(worldPos);
                }
            }
        }
    }

    selectAt(mx, my) {
        const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
        const clickedNodeIdx = this.findNodeAtScreen(mx, my);

        if (clickedNodeIdx >= 0) {
            this.selectedNodes.add(this.getNodeId(clickedNodeIdx));
            if (this.getNodeOwner(clickedNodeIdx) === playerIndex) {
                const entityIdxs = this.getEntitiesInNodeArea(clickedNodeIdx);
                for (const eIdx of entityIdxs) {
                    this.selectedEntities.add(this.getEntityId(eIdx));
                }
            }
            return;
        }

        const clickedEntityIdx = this.findEntityAtScreen(mx, my);
        if (clickedEntityIdx >= 0) {
            if (this.getEntityOwner(clickedEntityIdx) === playerIndex) {
                this.selectedEntities.add(this.getEntityId(clickedEntityIdx));
            }
            return;
        }
    }

    selectInBox(x1, y1, x2, y2) {
        const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;

        const entityIdxs = this.getEntitiesInScreenRect(x1, y1, x2, y2, playerIndex);
        for (const eIdx of entityIdxs) {
            this.selectedEntities.add(this.getEntityId(eIdx));
        }

        const nodeIds = this.getNodesInRect(x1, y1, x2, y2);
        for (const id of nodeIds) {
            const idx = this.findNodeById(id);
            if (idx >= 0 && this.getNodeOwner(idx) === playerIndex) {
                this.selectedNodes.add(id);
                // We no longer auto-select nested entities for box selections. 
                // Only units explicitly caught in the getEntitiesInScreenRect bounds are selected.
            }
        }
    }

    handleRightClick(worldX, worldY) {
        const targetNodeIdx = this.findNodeAtWorld(worldX, worldY, 20);

        if (this.selectedEntities.size > 0) {
            let targetNode = null;
            if (targetNodeIdx >= 0) {
                targetNode = { id: this.getNodeId(targetNodeIdx), owner: this.getNodeOwner(targetNodeIdx) };
            }
            this.executeCommand(worldX, worldY, targetNode);
        }
    }

    handleMouseUp(mouse, event) {
        if (event.button === 0) {
            if (mouse.drag && this.selectedNodes.size > 0) {
                const worldPos = this.game.camera.screenToWorld(mouse.x, mouse.y);
                const targetNodeIdx = this.findNodeAtWorld(worldPos.x, worldPos.y, 15);
                const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;

                const dragDist = Math.sqrt(
                    Math.pow(mouse.x - this.game.systems.input.mouseDownPos.x, 2) +
                    Math.pow(mouse.y - this.game.systems.input.mouseDownPos.y, 2)
                );

                if (dragDist > 20) {
                    if (this.game.controller.sendAction) {
                        this.game.controller.sendAction({
                            type: 'rally',
                            nodeIds: Array.from(this.selectedNodes),
                            targetX: worldPos.x,
                            targetY: worldPos.y,
                            targetNodeId: targetNodeIdx >= 0 ? this.getNodeId(targetNodeIdx) : null
                        });
                    } else {
                        this.selectedNodes.forEach(id => {
                            const idx = this.findNodeById(id);
                            if (idx >= 0 && this.getNodeOwner(idx) === playerIndex) {
                                const node = this.game.state.nodes.find(n => n.id === id);
                                const targetNode = targetNodeIdx >= 0 ? this.game.state.nodes.find(n => n.id === this.getNodeId(targetNodeIdx)) : null;
                                if (node) node.setRallyPoint(worldPos.x, worldPos.y, targetNode);
                            }
                        });
                    }
                    if (this.game.controller && this.game.controller.onAction) {
                        this.game.controller.onAction('rally');
                    }
                    this.game.systems.input.nodeUnderMouse = null;
                    this.isSelectingBox = false;
                    this.rallyMode = false; // Reset rally mode after drag-setting
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
            if (this.selectedEntities.size > 0 || this.selectedNodes.size > 0) {
                _SoundManager_js__WEBPACK_IMPORTED_MODULE_0__.sounds.playSelect();
            }
        }
        if (event.button === 2) {
            if (this.currentPath.length > 2 && this.selectedEntities.size > 0) {
                const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
                this.game.spawnWaypointLine([...this.currentPath], playerIndex);

                if (this.game.controller.sendAction) {
                    this.game.controller.sendAction({
                        type: 'path',
                        unitIds: Array.from(this.selectedEntities),
                        path: this.currentPath
                    });
                } else {
                    this.selectedEntities.forEach(id => {
                        const entity = this.game.state.entities.find(e => e.id === id);
                        if (entity) {
                            entity.waypoints = [...this.currentPath];
                            entity.currentTarget = null;
                            if (this.game.setEntityTarget) {
                                const target = this.currentPath[this.currentPath.length - 1];
                                this.game.setEntityTarget(id, target.x, target.y, null);
                            }
                        }
                    });
                }
                _SoundManager_js__WEBPACK_IMPORTED_MODULE_0__.sounds.playMove();
            }
            this.currentPath = [];
        }
        this.game.systems.input.nodeUnderMouse = null;
    }

    applyPathToSelection() {
        const ids = Array.from(this.selectedEntities);
        for (const id of ids) {
            const idx = this.findEntityById(id);
            if (idx >= 0 && !this.isEntityDead(idx)) {
                const entity = this.game.state.entities.find(e => e.id === id);
                if (entity) {
                    entity.waypoints = [...this.currentPath];
                    entity.currentTarget = null;
                }
            }
        }
    }

    executeCommand(worldX, worldY, targetNode) {
        this.game.spawnCommandIndicator(worldX, worldY, targetNode ? 'attack' : 'move');

        if (this.game.controller && this.game.controller.onAction) {
            this.game.controller.onAction('move');
        }

        if (targetNode && targetNode.owner !== -1 && targetNode.owner !== (this.game.controller.playerIndex || 0)) {
            _SoundManager_js__WEBPACK_IMPORTED_MODULE_0__.sounds.playAttack();
        } else {
            _SoundManager_js__WEBPACK_IMPORTED_MODULE_0__.sounds.playMove();
        }

        if (this.game.controller.sendAction) {
            this.game.controller.sendAction({
                type: 'move',
                sourceNodeId: null,
                targetNodeId: targetNode ? targetNode.id : null,
                targetX: worldX,
                targetY: worldY,
                unitIds: Array.from(this.selectedEntities)
            });
        } else {
            const targetNodeId = targetNode ? targetNode.id : null;
            if (this.game.setMultipleEntityTargets) {
                this.game.setMultipleEntityTargets(Array.from(this.selectedEntities), worldX, worldY, targetNodeId);
            }
        }
    }

    clear() {
        this.selectedNodes.clear();
        this.selectedEntities.clear();
        this.rallyMode = false;
    }

    onEntityDead(id) {
        this.selectedEntities.delete(id);
    }

    onNodeDead(id) {
        this.selectedNodes.delete(id);
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
/* harmony import */ var _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../shared/GameConfig.js */ "./src/shared/GameConfig.js");


class UIManager {
    constructor(game) {
        this.game = game;
        this._lastCounts = {};
        this._ratesCache = {};
        this._totalProduced = {};
        this._currentCounts = {};
        this._lastSampleTime = 0;
        this.game.state.spawnCounts = {};
        // Animated row positions (lerp by playerId)
        this._rowY = {};
    }

    _countEntitiesPerPlayer() {
        const counts = {};
        const view = this.game.sharedView;
        if (view) {
            const n = view.getEntityCount();
            for (let i = 0; i < n; i++) {
                if (view.isEntityDead(i) || view.isEntityDying(i)) continue;
                const owner = view.getEntityOwner(i);
                counts[owner] = (counts[owner] || 0) + 1;
            }
        } else {
            const entities = this.game.state?.entities;
            if (entities) {
                entities.forEach(e => {
                    if (!e.dead && !e.dying) counts[e.owner] = (counts[e.owner] || 0) + 1;
                });
            }
        }
        return counts;
    }

    _computeProdRates() {
        const SPAWN_INTERVALS = { 0: 4.5, 1: 3.5, 2: 2.4 };
        const rates = {};
        const view = this.game.sharedView;
        if (view) {
            const nodeCount = view.getNodeCount();
            for (let n = 0; n < nodeCount; n++) {
                const owner = view.getNodeOwner(n);
                if (owner < 0) continue;
                const type = view.memory.nodes.type[n];
                const baseInterval = SPAWN_INTERVALS[type] || 3.5;
                const baseHp = view.getNodeBaseHp(n);
                const maxHp = view.getNodeMaxHp(n);
                const hpPct = Math.min(baseHp / maxHp, 1.0);
                const healthScaling = 0.3 + hpPct * 1.2 + (type === 2 ? 0.5 : 0);
                rates[owner] = (rates[owner] || 0) + (60 / (baseInterval / healthScaling));
            }
        } else {
            const serverRates = this.game.state?.productionRates;
            if (serverRates) {
                for (const pid in serverRates) rates[parseInt(pid)] = serverRates[pid] * 60;
            }
        }
        return rates;
    }

    _updateStatsCache() {
        const now = performance.now();
        const dt = (now - this._lastSampleTime) / 1000;
        if (dt < 1) return;

        const currentCounts = this._countEntitiesPerPlayer();
        const playerCount = this.game.state?.playerCount || 2;

        const spawnCounts = this.game.state?.spawnCounts || {};
        for (let i = 0; i < playerCount; i++) {
            this._totalProduced[i] = (this._totalProduced[i] || 0) + (spawnCounts[i] || 0);
        }
        if (this.game.state?.spawnCounts) this.game.state.spawnCounts = {};

        const serverProduced = this.game.state?.stats?.unitsProduced;
        if (serverProduced) {
            for (const pid in serverProduced) this._totalProduced[parseInt(pid)] = serverProduced[pid];
        }

        this._currentCounts = currentCounts;
        this._ratesCache = this._computeProdRates();
        this._lastSampleTime = now;
    }

    draw(renderer) {
        if (this._lastSampleTime === 0) {
            this._currentCounts = this._countEntitiesPerPlayer();
            this._ratesCache = this._computeProdRates();
            this._lastSampleTime = performance.now();
        }
        this._updateStatsCache();

        const ctx = renderer.ctx;
        const cw = this.game.canvas.width;
        const ch = this.game.canvas.height;
        const playerIndex = this.game.controller?.playerIndex ?? 0;
        const playerCount = this.game.state.playerCount || 2;
        const COLORS = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.PLAYER_COLORS;

        // ── SELECTED COUNT (top right) ────────────────────────────────
        const selCount = this.game.systems.selection?.selectedEntities?.size || 0;
        if (selCount > 0) {
            ctx.save();
            ctx.font = 'bold 15px "Courier New", monospace';
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.fillText(`SEL: ${selCount}`, cw - 20, 28);
            ctx.restore();
        }

        // ── STATS PANEL (bottom right) ────────────────────────────────
        const COL_NAME = 0;   // relative to panelX + padding
        const COL_RATE = 120;
        const COL_TOT = 200;
        const COL_CUR = 270;
        const PAD = 18;
        const ROW_H = 30;
        const HEADER_H = 40;
        const panelW = 320;
        const panelH = HEADER_H + playerCount * ROW_H + 16;
        const panelX = cw - panelW - 16;
        const panelY = ch - panelH - 16;

        // Sort players by rate descending
        const sorted = Array.from({ length: playerCount }, (_, i) => i)
            .sort((a, b) => (this._ratesCache[b] || 0) - (this._ratesCache[a] || 0));

        // Lerp animated row Y positions
        sorted.forEach((pid, rank) => {
            const target = HEADER_H + rank * ROW_H;
            if (this._rowY[pid] === undefined) this._rowY[pid] = target;
            this._rowY[pid] += (target - this._rowY[pid]) * 0.1;
        });

        // Panel background
        ctx.save();
        ctx.fillStyle = 'rgba(8, 8, 10, 0.96)';
        ctx.fillRect(panelX, panelY, panelW, panelH);

        // Panel border (1px, all sides)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

        // Header row
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(panelX, panelY, panelW, HEADER_H);

        // Header divider
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(panelX, panelY + HEADER_H);
        ctx.lineTo(panelX + panelW, panelY + HEADER_H);
        ctx.stroke();

        // Header labels
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '13px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('JUGADOR', panelX + PAD, panelY + 25);
        ctx.textAlign = 'right';
        ctx.fillText('PROD/M', panelX + PAD + COL_RATE + 32, panelY + 25);
        ctx.fillText('TOT', panelX + PAD + COL_TOT + 32, panelY + 25);
        ctx.fillText('CAMPO', panelX + panelW - PAD, panelY + 25);

        // Clip to panel for animated rows
        ctx.beginPath();
        ctx.rect(panelX, panelY + HEADER_H, panelW, panelH - HEADER_H);
        ctx.clip();

        // Draw each player row
        for (let i = 0; i < playerCount; i++) {
            const color = COLORS[i % COLORS.length];
            const isMe = i === playerIndex;
            const rate = this._ratesCache[i] || 0;
            const produced = this._totalProduced[i] || 0;
            const current = this._currentCounts?.[i] || 0;
            const label = isMe ? 'TÚ' : `P${i + 1}`;

            const ry = panelY + (this._rowY[i] ?? (HEADER_H + i * ROW_H));
            const mid = ry + ROW_H / 2 + 4;

            // Row highlight for current player
            if (isMe) {
                ctx.fillStyle = color + '14';
                ctx.fillRect(panelX, ry, panelW, ROW_H);
                // Left accent line
                ctx.fillStyle = color;
                ctx.fillRect(panelX, ry + 3, 2, ROW_H - 6);
            }

            // Row divider (subtle)
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(panelX, ry + ROW_H - 0.5);
            ctx.lineTo(panelX + panelW, ry + ROW_H - 0.5);
            ctx.stroke();

            // Color dot (square)
            ctx.fillStyle = color;
            ctx.fillRect(panelX + PAD, mid - 7, 8, 8);

            // Label
            ctx.textAlign = 'left';
            ctx.fillStyle = isMe ? '#fff' : color + 'bb';
            ctx.font = isMe ? 'bold 15px "Courier New", monospace' : '14px "Courier New", monospace';
            ctx.fillText(label, panelX + PAD + 16, mid);

            // Rate
            ctx.textAlign = 'right';
            ctx.fillStyle = isMe ? '#fff' : 'rgba(255,255,255,0.7)';
            ctx.font = '14px "Courier New", monospace';
            ctx.fillText(`${Math.round(rate)}/m`, panelX + PAD + COL_RATE + 32, mid);

            // Total produced
            ctx.fillStyle = isMe ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)';
            ctx.fillText(`${produced}`, panelX + PAD + COL_TOT + 32, mid);

            // Current on field
            ctx.fillText(`${current}`, panelX + panelW - PAD, mid);
        }

        ctx.restore();

        // ── RALLY MODE hint ───────────────────────────────────────────
        if (this.game.systems.selection?.selectedNodes?.size > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(255,220,50,0.9)';
            ctx.font = '15px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('MODO RALLY — T: PUNTO DE SPAWN', cw / 2, ch - 24);
            ctx.restore();
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

        const personalities = ['aggressive', 'defensive', 'expansive'];
        if (this.difficulty === 'Easy') {
            this.personality = 'defensive';
        } else {
            this.personality = personalities[Math.floor(Math.random() * personalities.length)];
        }

        const baseIntervals = {
            'Easy': 6.0,
            'Intermediate': 3.5,
            'Normal': 1.5,
            'Hard': 0.8,
            'Expert': 0.4,
            'Impossible': 0.15
        };
        this.decisionInterval = (baseIntervals[this.difficulty] || 1.5) + (Math.random() * 0.5);

        console.log(`[AI INFO] Player ${playerId} initialized: Difficulty=${this.difficulty}, Personality=${this.personality}`);
    }

    get view() {
        return this.game.sharedView || null;
    }

    getNodeCount() {
        const view = this.view;
        return view ? view.getNodeCount() : this.game.state.nodes.length;
    }

    getEntityCount() {
        const view = this.view;
        return view ? view.getEntityCount() : this.game.state.entities.length;
    }

    getNodeOwner(idx) {
        const view = this.view;
        return view ? view.getNodeOwner(idx) : this.game.state.nodes[idx].owner;
    }

    getNodeX(idx) {
        const view = this.view;
        return view ? view.getNodeX(idx) : this.game.state.nodes[idx].x;
    }

    getNodeY(idx) {
        const view = this.view;
        return view ? view.getNodeY(idx) : this.game.state.nodes[idx].y;
    }

    getNodeId(idx) {
        const view = this.view;
        return view ? view.getNodeId(idx) : this.game.state.nodes[idx].id;
    }

    getNodeInfluenceRadius(idx) {
        const view = this.view;
        return view ? view.getNodeInfluenceRadius(idx) : this.game.state.nodes[idx].influenceRadius;
    }

    getNodeBaseHp(idx) {
        const view = this.view;
        return view ? view.getNodeBaseHp(idx) : this.game.state.nodes[idx].baseHp;
    }

    getNodeMaxHp(idx) {
        const view = this.view;
        return view ? view.getNodeMaxHp(idx) : this.game.state.nodes[idx].maxHp;
    }

    getEntityOwner(idx) {
        const view = this.view;
        return view ? view.getEntityOwner(idx) : this.game.state.entities[idx].owner;
    }

    getEntityX(idx) {
        const view = this.view;
        return view ? view.getEntityX(idx) : this.game.state.entities[idx].x;
    }

    getEntityY(idx) {
        const view = this.view;
        return view ? view.getEntityY(idx) : this.game.state.entities[idx].y;
    }

    getEntityId(idx) {
        const view = this.view;
        return view ? view.getEntityId(idx) : this.game.state.entities[idx].id;
    }

    isEntityDead(idx) {
        const view = this.view;
        return view ? view.isEntityDead(idx) : this.game.state.entities[idx].dead;
    }

    isEntityDying(idx) {
        const view = this.view;
        return view ? view.isEntityDying(idx) : this.game.state.entities[idx].dying;
    }

    getEntityTargetNodeId(idx) {
        const view = this.view;
        return view ? view.getEntityTargetNodeId(idx) : (this.game.state.entities[idx].targetNode ? this.game.state.entities[idx].targetNode.id : -1);
    }

    getNodesByOwner(owner) {
        const view = this.view;
        if (view) {
            return view.getNodesByOwner(owner);
        }
        const result = [];
        this.game.state.nodes.forEach((n, i) => {
            if (n.owner === owner) result.push(i);
        });
        return result;
    }

    getEntitiesInRadius(x, y, radius, owner) {
        const view = this.view;
        if (view) {
            return view.getEntitiesInRadius(x, y, radius, owner);
        }
        const result = [];
        const radiusSq = radius * radius;
        this.game.state.entities.forEach((e, i) => {
            if (e.owner === owner && !e.dead && !e.dying) {
                const dx = x - e.x;
                const dy = y - e.y;
                if (dx * dx + dy * dy <= radiusSq) {
                    result.push(i);
                }
            }
        });
        return result;
    }

    update(dt) {
        this.timer += dt;
        if (this.timer >= this.decisionInterval) {
            this.timer = 0;
            this.makeDecision();
        }
    }

    makeDecision() {
        const myNodeIdxs = this.getNodesByOwner(this.playerId);

        if (myNodeIdxs.length === 0) return;

        for (const sourceIdx of myNodeIdxs) {
            const sourceX = this.getNodeX(sourceIdx);
            const sourceY = this.getNodeY(sourceIdx);
            const sourceInfluence = this.getNodeInfluenceRadius(sourceIdx);
            const nodeBaseHp = this.getNodeBaseHp(sourceIdx);
            const nodeMaxHp = this.getNodeMaxHp(sourceIdx);

            const defenderIdxs = this.getEntitiesInRadius(sourceX, sourceY, sourceInfluence, this.playerId);
            const defenderCount = defenderIdxs.length;

            let minDefendersToStay = 8;
            if (this.difficulty === 'Impossible') minDefendersToStay = 1;
            if (this.difficulty === 'Expert') minDefendersToStay = 3;
            if (this.difficulty === 'Hard') minDefendersToStay = 5;
            if (this.difficulty === 'Normal') minDefendersToStay = 10;
            if (this.difficulty === 'Intermediate') minDefendersToStay = 15;
            if (this.difficulty === 'Easy') minDefendersToStay = 25;

            if (this.personality === 'defensive') minDefendersToStay += 5;
            if (this.personality === 'aggressive') minDefendersToStay -= 2;

            const neutralCount = this.getNodesByOwner(-1).length;
            if (this.difficulty === 'Easy' && neutralCount > 0) {
                minDefendersToStay = 40;
            }

            // Defensive AI strictly waits until its node is FULL before doing anything else
            if (this.personality === 'defensive' && nodeBaseHp < nodeMaxHp) {
                continue;
            }

            // Easy/Intermediate are more likely to stay passive
            let activityThreshold = 0.5;
            if (this.difficulty === 'Easy') activityThreshold = 0.05;
            if (this.difficulty === 'Intermediate') activityThreshold = 0.2;
            if (this.difficulty === 'Normal') activityThreshold = 0.6;
            if (this.difficulty === 'Hard') activityThreshold = 0.8;
            if (this.difficulty === 'Expert' || this.difficulty === 'Impossible') activityThreshold = 1.0;

            if (defenderCount > minDefendersToStay || (defenderCount > 2 && Math.random() < activityThreshold * 0.15)) {
                let bestTargetIdx = -1;
                let bestScore = -Infinity;

                // Check if any of my nodes need help (Defensive Priority)
                let needsDefenseIdx = -1;
                if (this.personality === 'defensive') {
                    for (const myIdx of myNodeIdxs) {
                        if (myIdx === sourceIdx) continue;
                        const hp = this.getNodeBaseHp(myIdx);
                        const maxHp = this.getNodeMaxHp(myIdx);
                        if (hp < maxHp) {
                            needsDefenseIdx = myIdx;
                            break;
                        }
                    }
                }

                if (needsDefenseIdx !== -1) {
                    // Defensive AI immediately helps its own damaged node
                    bestTargetIdx = needsDefenseIdx;
                    bestScore = 99999;
                } else {
                    const nodeCount = this.getNodeCount();
                    for (let targetIdx = 0; targetIdx < nodeCount; targetIdx++) {
                        if (targetIdx === sourceIdx) continue;

                        const targetX = this.getNodeX(targetIdx);
                        const targetY = this.getNodeY(targetIdx);
                        const dx = targetX - sourceX;
                        const dy = targetY - sourceY;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        let score = 1000 / dist;
                        const targetOwner = this.getNodeOwner(targetIdx);
                        const targetBaseHp = this.getNodeBaseHp(targetIdx);
                        const targetMaxHp = this.getNodeMaxHp(targetIdx);

                        if (targetOwner === -1) {
                            let expansionWeight = 1.5;
                            if (this.personality === 'expansive') expansionWeight = 3.0;
                            if (this.difficulty === 'Easy') expansionWeight = 10.0; // Focus ONLY on neutral if easy
                            if (this.difficulty === 'Intermediate') expansionWeight = 5.0;

                            if (myNodeIdxs.length > 5 && this.difficulty !== 'Easy') expansionWeight *= 0.5;
                            score *= expansionWeight;
                        } else if (targetOwner !== this.playerId) {
                            let attackWeight = 1.0;
                            if (this.personality === 'aggressive') attackWeight = 2.5;
                            if (this.difficulty === 'Impossible') attackWeight = 4.0;
                            if (this.difficulty === 'Expert') attackWeight = 3.0;
                            if (this.difficulty === 'Hard') attackWeight = 2.0;
                            if (this.difficulty === 'Intermediate') attackWeight = 0.5;
                            if (this.difficulty === 'Easy') attackWeight = 0.01; // Almost never attack players early

                            if (this.personality === 'defensive') {
                                // Defensive AI only attacks if it has a massive army (e.g. 100+)
                                if (defenderCount < 100) {
                                    attackWeight = 0; // Won't attack enemies at all
                                } else {
                                    attackWeight = 5.0; // Huge counter attack
                                }
                            }

                            if (this.difficulty !== 'Easy' && this.difficulty !== 'Intermediate' && targetBaseHp < targetMaxHp * 0.4) {
                                attackWeight *= 2.0;
                            }
                            score *= attackWeight;
                        } else {
                            if (this.personality === 'defensive' && targetBaseHp < targetMaxHp) {
                                score *= 5.0; // High priority to heal own nodes
                            } else if (this.difficulty === 'Impossible' && targetBaseHp < targetMaxHp * 0.9) {
                                score *= 1.5; // Impossible AI heals its nodes efficiently
                            } else {
                                score *= 0.1;
                            }
                        }

                        // For Defensive AI, heavily penalize distance so they only conquer nearby nodes
                        if (this.personality === 'defensive') {
                            score *= (1000 / Math.max(1000, dist));
                        }

                        // Add "Stupidity" for Intermediate - sometimes choose nodes that are too strong
                        if (this.difficulty === 'Intermediate') {
                            if (targetBaseHp > nodeBaseHp * 1.5) {
                                score *= (0.5 + Math.random() * 2.0); // Randomly overvalue strong nodes
                            }
                        }

                        if (score > bestScore) {
                            bestScore = score;
                            bestTargetIdx = targetIdx;
                        }
                    }

                    if (bestTargetIdx >= 0) {
                        this.sendUnits(sourceIdx, bestTargetIdx);
                    }
                }
            }
        }
    }

    sendUnits(sourceIdx, targetIdx) {
        const sourceX = this.getNodeX(sourceIdx);
        const sourceY = this.getNodeY(sourceIdx);
        const sourceInfluence = this.getNodeInfluenceRadius(sourceIdx);
        const targetX = this.getNodeX(targetIdx);
        const targetY = this.getNodeY(targetIdx);
        const targetId = this.getNodeId(targetIdx);

        const unitIdxs = this.getEntitiesInRadius(sourceX, sourceY, sourceInfluence, this.playerId);

        const filteredUnits = [];
        for (const idx of unitIdxs) {
            if (this.isEntityDead(idx) || this.isEntityDying(idx)) continue;
            if (this.getEntityTargetNodeId(idx) === -1) {
                filteredUnits.push(idx);
            }
        }

        if (filteredUnits.length === 0) return;

        let attackPercent = 0.5;
        if (this.difficulty === 'Impossible') attackPercent = 1.0;
        if (this.difficulty === 'Expert') attackPercent = 0.9;
        if (this.difficulty === 'Hard') attackPercent = 0.7;
        if (this.difficulty === 'Normal') attackPercent = 0.5;
        if (this.difficulty === 'Intermediate') attackPercent = 0.2;
        if (this.difficulty === 'Easy') attackPercent = 0.1;

        if (this.personality === 'aggressive') attackPercent += 0.1;

        filteredUnits.sort((a, b) => {
            const distSqA = (this.getEntityX(a) - sourceX) ** 2 + (this.getEntityY(a) - sourceY) ** 2;
            const distSqB = (this.getEntityX(b) - sourceX) ** 2 + (this.getEntityY(b) - sourceY) ** 2;
            return distSqB - distSqA;
        });

        const count = Math.ceil(filteredUnits.length * Math.min(attackPercent, 1.0));

        for (let i = 0; i < count; i++) {
            const entityIdx = filteredUnits[i];
            const entityId = this.getEntityId(entityIdx);
            this.game.setEntityTarget(entityId, targetX, targetY, targetId);
        }
    }

}


/***/ },

/***/ "./src/shared/CampaignConfig.js"
/*!**************************************!*\
  !*** ./src/shared/CampaignConfig.js ***!
  \**************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CampaignLevels: () => (/* binding */ CampaignLevels),
/* harmony export */   TutorialLevels: () => (/* binding */ TutorialLevels),
/* harmony export */   getCampaignLevel: () => (/* binding */ getCampaignLevel)
/* harmony export */ });
// shared/CampaignConfig.js

const CampaignLevels = [
    // Phase 1: Recluta (0-4)
    { id: 0, name: "Misión 1: Frontera Real", description: "Rojo empieza a moverse. Captura rápido.", mapConfig: { numNodes: 8, size: 'small' }, enemies: [{ id: 1, difficulty: 'Intermediate', personality: 'defensive' }] },
    { id: 1, name: "Misión 2: Escaramuza Rival", description: "Rojo competirá por los neutrales.", mapConfig: { numNodes: 10, size: 'small' }, enemies: [{ id: 1, difficulty: 'Intermediate', personality: 'expansive' }] },
    { id: 2, name: "Misión 3: Paso Estrecho", description: "Controla los cuellos de botella.", mapConfig: { numNodes: 12, size: 'small' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 3, name: "Misión 4: Refuerzos", description: "Rojo tiene reservas ocultas.", mapConfig: { numNodes: 14, size: 'medium' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'defensive' }] },
    { id: 4, name: "Misión 5: Jefe de División", description: "El comandante Rojo se defiende con todo.", mapConfig: { numNodes: 15, size: 'medium' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }] },

    // Phase 2: Expansión (5-14)
    { id: 5, name: "Misión 6: Un Nuevo Enemigo", description: "Aparece un contendiente Azul.", mapConfig: { numNodes: 18, size: 'medium' }, enemies: [{ id: 1, difficulty: 'Easy', personality: 'balanced' }, { id: 2, difficulty: 'Easy', personality: 'balanced' }] },
    { id: 6, name: "Misión 7: Fuego Cruzado", description: "Rojo es agresivo, Azul es defensivo.", mapConfig: { numNodes: 20, size: 'medium' }, enemies: [{ id: 1, difficulty: 'Intermediate', personality: 'aggressive' }, { id: 2, difficulty: 'Intermediate', personality: 'defensive' }] },
    { id: 7, name: "Misión 8: Alianza Oculta", description: "Enfrenta a dos enemigos que cooperan implícitamente.", mapConfig: { numNodes: 20, size: 'medium' }, enemies: [{ id: 1, difficulty: 'Intermediate', personality: 'expansive' }, { id: 2, difficulty: 'Intermediate', personality: 'expansive' }] },
    { id: 8, name: "Misión 9: Expansión Rival", description: "Rojo y Azul buscan apoderarse del mapa.", mapConfig: { numNodes: 25, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'expansive' }, { id: 2, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 9, name: "Misión 10: El Sándwich", description: "Debes sobrevivir a un empuje doble.", mapConfig: { numNodes: 25, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'aggressive' }, { id: 2, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 10, name: "Misión 11: Asimetría", description: "Ellos tienen menos nodos pero más grandes.", mapConfig: { numNodes: 22, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'defensive' }, { id: 2, difficulty: 'Normal', personality: 'defensive' }] },
    { id: 11, name: "Misión 12: El Tesoro", description: "Rojo protege una bóveda, Azul intenta robarla.", mapConfig: { numNodes: 30, size: 'large' }, enemies: [{ id: 1, difficulty: 'Hard', personality: 'defensive' }, { id: 2, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 12, name: "Misión 13: Vacío Estelar", description: "Mapa inmenso, pocos nodos. Largos viajes.", mapConfig: { numNodes: 15, size: 'epic' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'defensive' }, { id: 2, difficulty: 'Normal', personality: 'defensive' }] },
    { id: 13, name: "Misión 14: La Horda Azul", description: "Azul tiene mucha sed de batalla.", mapConfig: { numNodes: 25, size: 'large' }, enemies: [{ id: 2, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 14, name: "Misión 15: Jefes de Sector", description: "Rojo y Azul están decididos a eliminarte.", mapConfig: { numNodes: 30, size: 'large' }, enemies: [{ id: 1, difficulty: 'Hard', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'balanced' }] },

    // Phase 3: Guerra de Facciones (15-24)
    { id: 15, name: "Misión 16: Caos a tres bandas", description: "Se suma Naranja. Multi-gestión obligatoria.", mapConfig: { numNodes: 30, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'aggressive' }, { id: 2, difficulty: 'Normal', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 16, name: "Misión 17: Escalada 1", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 17, name: "Misión 18: Escalada 2", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 18, name: "Misión 19: Escalada 3", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 19, name: "Misión 20: Escalada 4", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 20, name: "Misión 21: Escalada 5", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 21, name: "Misión 22: Escalada 6", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 22, name: "Misión 23: Escalada 7", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 23, name: "Misión 24: Contraataque", description: "Las tres facciones empiezan a acorralarte.", mapConfig: { numNodes: 38, size: 'large' }, enemies: [{ id: 1, difficulty: 'Hard', personality: 'aggressive' }, { id: 2, difficulty: 'Normal', personality: 'defensive' }, { id: 3, difficulty: 'Hard', personality: 'expansive' }] },
    { id: 24, name: "Misión 25: Triunvirato", description: "Tres generales te buscan coordinadamente.", mapConfig: { numNodes: 40, size: 'epic' }, enemies: [{ id: 1, difficulty: 'Hard', personality: 'aggressive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Hard', personality: 'expansive' }] },

    // Phase 4: Tácticas Avanzadas (25-34)
    { id: 25, name: "Misión 26: Desventaja Táctica", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 26, name: "Misión 27: Desventaja Táctica 2", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 27, name: "Misión 28: Desventaja Táctica 3", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 28, name: "Misión 29: Desventaja Táctica 4", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 29, name: "Misión 30: Desventaja Táctica 5", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 30, name: "Misión 31: Desventaja Táctica 6", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 31, name: "Misión 32: Desventaja Táctica 7", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 32, name: "Misión 33: Desventaja Táctica 8", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 33, name: "Misión 34: Desventaja Táctica 9", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 34, name: "Misión 35: General Violeta", description: "Enemigo en dificultad Imposible liderando la defensa.", mapConfig: { numNodes: 50, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Impossible', personality: 'defensive' }] },

    // Phase 5: Maestría (35-44)
    { id: 35, name: "Misión 36: Maestría Total 1", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 36, name: "Misión 37: Maestría Total 2", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 37, name: "Misión 38: Maestría Total 3", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 38, name: "Misión 39: Maestría Total 4", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 39, name: "Misión 40: Maestría Total 5", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 40, name: "Misión 41: Maestría Total 6", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 41, name: "Misión 42: Maestría Total 7", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 42, name: "Misión 43: Maestría Total 8", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 43, name: "Misión 44: Maestría Total 9", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 44, name: "Misión 45: La Guardia de Élite", description: "Comandos Expertos defienden a la guardia dorada.", mapConfig: { numNodes: 70, size: 'epic' }, enemies: [{ id: 1, difficulty: 'Expert', personality: 'aggressive' }, { id: 2, difficulty: 'Expert', personality: 'defensive' }, { id: 3, difficulty: 'Expert', personality: 'expansive' }, { id: 7, difficulty: 'Impossible', personality: 'balanced' }] },

    // Phase 6: El Vacío (45-49)
    { id: 45, name: "Misión 46: El Despertar del Vacío", description: "Aparece una amenaza oscura y letal. El color Negro.", mapConfig: { numNodes: 40, size: 'epic' }, enemies: [{ id: 8, difficulty: 'Expert', personality: 'aggressive' }, { id: 1, difficulty: 'Normal', personality: 'defensive' }, { id: 2, difficulty: 'Normal', personality: 'defensive' }] },
    { id: 46, name: "Misión 47: Oscuridad Creciente", description: "La amenaza consume nodos neutrales rápidamente.", mapConfig: { numNodes: 50, size: 'epic' }, enemies: [{ id: 8, difficulty: 'Expert', personality: 'expansive' }] },
    { id: 47, name: "Misión 48: El Vórtice", description: "Flanqueos masivos requeridos para frenar su avance.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 8, difficulty: 'Impossible', personality: 'aggressive' }] },
    { id: 48, name: "Misión 49: La Última Alianza", description: "Las demás facciones intentan sobrevivir la purga del Vacío.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 8, difficulty: 'Impossible', personality: 'balanced' }, { id: 1, difficulty: 'Easy', personality: 'defensive' }, { id: 2, difficulty: 'Easy', personality: 'defensive' }] },
    {
        id: 49,
        name: "Misión 50: EVENT HORIZON",
        description: "1 vs 1 Definitivo. El Vacío te espera. Sin esperanza.",
        mapConfig: {
            size: "epic",
            fixedNodes: [
                { x: 500, y: 1500, owner: 0, type: 2, baseHp: 100 }, // Player (Strong start, but far away)
                { x: 3500, y: 1000, owner: 8, type: 4, baseHp: 200 }, // AI Boss 1
                { x: 3500, y: 1500, owner: 8, type: 5, baseHp: 300 }, // AI Boss 2 (Mega)
                { x: 3500, y: 2000, owner: 8, type: 4, baseHp: 200 }, // AI Boss 3
                // Defensive wall of neutral nodes for AI
                { x: 3000, y: 1200, owner: -1, type: 3, baseHp: 50 },
                { x: 3000, y: 1500, owner: -1, type: 3, baseHp: 50 },
                { x: 3000, y: 1800, owner: -1, type: 3, baseHp: 50 },
                // Scattered neutral nodes
                { x: 1000, y: 500, owner: -1, type: 1 },
                { x: 1000, y: 2500, owner: -1, type: 1 },
                { x: 2000, y: 1500, owner: -1, type: 2 },
            ],
            numNodes: 15 // Random filler nodes
        },
        enemies: [{ id: 8, difficulty: 'Impossible', personality: 'aggressive' }]
    }
];

const TutorialLevels = [
    {
        id: 100,
        name: "1. Movimiento y Órdenes",
        description: "Aprende a mover tus tropas y a establecer puntos de reunión (Rally Points).",
        isTutorial: true,
        winCondition: { type: 'actionsComplete', actions: ['moved', 'rally'] },
        mapConfig: {
            size: "small",
            fixedNodes: [
                { x: 400, y: 500, owner: 0, type: 2, baseHp: 50 },
                { x: 800, y: 500, owner: -1, type: 1, baseHp: 5 }
            ],
            initialEntities: [
                { x: 400, y: 400, owner: 0, count: 10 }
            ]
        },
        enemies: [],
        tutorialSteps: [
            { trigger: 'time', delay: 1000, text: '¡Bienvenido! Primero, MOVER: Haz click y arrastra desde tu nodo verde a cualquier parte.' },
            { trigger: 'time', delay: 5000, text: 'RALLY POINT: Selecciona tu nodo y presiona [E] sobre el mapa para fijar un punto de salida.' },
            { trigger: 'time', delay: 10000, text: 'Haz ambas acciones para completar este tutorial.' }
        ]
    },
    {
        id: 101,
        name: "2. Conquista Neutral",
        description: "Expande tu territorio capturando nodos grises.",
        isTutorial: true,
        winCondition: { type: 'nodes', count: 2 },
        mapConfig: {
            size: "small",
            fixedNodes: [
                { x: 400, y: 500, owner: 0, type: 2, baseHp: 50 },
                { x: 900, y: 500, owner: -1, type: 1, baseHp: 5 }
            ]
        },
        enemies: [],
        tutorialSteps: [
            { trigger: 'time', delay: 1000, text: 'Captura el nodo gris. Envía suficientes tropas hasta que el HP llegue a cero.' },
            { trigger: 'nodes', count: 2, text: '¡Excelente! Ahora ese nodo te pertenece y generará tropas para ti.' }
        ]
    },
    {
        id: 102,
        name: "3. Sanación de Nodos",
        description: "Envía tropas de vuelta a tus nodos heridos para repararlos.",
        isTutorial: true,
        winCondition: { type: 'unitsToGoal', nodeId: 0, goal: 20 },
        mapConfig: {
            size: "small",
            fixedNodes: [
                { x: 400, y: 500, owner: 0, type: 2, baseHp: 2 }
            ],
            initialEntities: [
                { x: 250, y: 500, owner: 0, count: 25 }
            ]
        },
        enemies: [],
        tutorialSteps: [
            { trigger: 'time', delay: 1000, text: 'Tu nodo tiene poca vida (está parpadeando). Envía tropas de vuelta hacia él.' },
            { trigger: 'time', delay: 5000, text: 'Al entrar, las unidades "curan" el nodo hasta su capacidad máxima.' }
        ]
    },
    {
        id: 103,
        name: "4. Combate y Victoria",
        description: "Vence a las tropas enemigas y captura su base.",
        isTutorial: true,
        winCondition: { type: 'standard' },
        mapConfig: {
            size: "small",
            fixedNodes: [
                { x: 400, y: 500, owner: 0, type: 2, baseHp: 50 },
                { x: 1000, y: 500, owner: 1, type: 2, baseHp: 10, productionDisabled: true }
            ]
        },
        enemies: [{ id: 1, difficulty: 'Easy', personality: 'defensive' }],
        tutorialSteps: [
            { trigger: 'time', delay: 1000, text: 'Para ganar, debes capturar todos los nodos enemigos (Rojos).' },
            { trigger: 'time', delay: 5000, text: 'El enemigo está debilitado. Ataca con todo para tomar su nodo.' }
        ]
    },
    {
        id: 104,
        name: "5. Partida de Formación",
        description: "Una batalla real sencilla contra un oponente básico.",
        isTutorial: true,
        mapConfig: { numNodes: 6, size: 'small' },
        enemies: [{ id: 1, difficulty: 'Easy', personality: 'balanced' }],
        tutorialSteps: [
            { trigger: 'time', delay: 1000, text: 'Aplica todo lo aprendido para derrotar al Comandante Rojo.' }
        ]
    }
];

function getCampaignLevel(id) {
    if (id >= 100) return TutorialLevels.find(l => l.id === id) || null;
    return CampaignLevels.find(level => level.id === id) || null;
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
    static idCounter = 0;
    static resetIdCounter() {
        Entity.idCounter = 0;
    }

    constructor(x, y, ownerId, id) {
        this.id = id !== undefined ? id : ++Entity.idCounter;
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

        this.cohesionRadius = 80;
        this.cohesionForce = 35;
        this.separationRadius = 32;
        this.separationForce = 150;

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
        this.targetNode = null;
        this.vx *= 0.3;
        this.vy *= 0.3;
    }

    update(dt, spatialGrid, spatialGridNodes, nodes, camera, game) {
        if (this.dying) {
            this.deathTime += dt;
            if (this.deathTime > 0.4) { this.dead = true; }

            // Pull towards node center for violent absorption
            if (this.absorbTarget && (this.deathType === 'absorbed' || this.deathType === 'sacrifice')) {
                const pullFactor = Math.pow(this.deathTime / 0.4, 2); // Accelerate into the center
                const dx = this.absorbTarget.x - this.x;
                const dy = this.absorbTarget.y - this.y;
                this.x += dx * pullFactor * 0.5; // Smooth pull
                this.y += dy * pullFactor * 0.5;
            }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        this.processWaypoints();
        this.handleCollisionsAndCohesion(spatialGrid, nodes, game);

        let inFriendlyTerritory = false;
        const speedMult = (game?.state?.speedMultiplier) || 1;

        const nearbyNodes = spatialGridNodes ? spatialGridNodes.retrieveNodes(this.x, this.y, 200) : nodes;

        if (nearbyNodes) {
            for (let node of nearbyNodes) {
                const dx = this.x - node.x;
                const dy = this.y - node.y;
                const distSq = dx * dx + dy * dy;

                if (node.owner === this.owner && node.owner !== -1) {
                    if (distSq < node.influenceRadius * node.influenceRadius) {
                        inFriendlyTerritory = true;
                    }
                }

                const dist = Math.sqrt(distSq);
                // ROBUST CONTACT: Trigger at edge (+8px margin for high speed safety)
                const touchRange = node.radius + this.radius + 8;
                const targetPoint = this.currentTarget || { x: this.x, y: this.y };
                const hasTarget = !!this.currentTarget || this.targetNode !== null;
                const tdx = targetPoint.x - node.x, tdy = targetPoint.y - node.y;
                const distToTargetSq = tdx * tdx + tdy * tdy;
                const isTargetingThisNode = hasTarget && ((this.targetNode === node) || (distToTargetSq < (node.radius + 35) * (node.radius + 35)));

                if (dist < touchRange && dist > 0.001) {
                    const overlap = touchRange - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    if (isTargetingThisNode) {
                        // Accept interaction if we are close enough to touch the node (SENSITIVE)
                        if (node.owner === -1) {
                            if (!this.dying) {
                                node.receiveAttack(this.owner, 1, game);
                                this.die('attack', node, game);
                            }
                            return;
                        }
                        else if (node.owner === this.owner) {
                            if (node.baseHp < node.maxHp && !this.dying) {
                                node.baseHp += 1;
                                node.hitFlash = 0.15;
                                this.die('absorbed', node, game);
                                return;
                            }
                            else {
                                this.stop();
                                this.targetNode = null;

                                this.x += nx * overlap;
                                this.y += ny * overlap;
                            }
                        }
                        else {
                            const allDefenders = node.allAreaDefenders || [];
                            const ownerDefenders = allDefenders.filter(e =>
                                e.owner === node.owner && !e.dead && !e.dying
                            );

                            if (ownerDefenders.length > 0) {
                                // Choose closest defender to node center
                                let closest = ownerDefenders[0];
                                let minDist = Infinity;
                                for (const def of ownerDefenders) {
                                    const ddx = def.x - node.x;
                                    const ddy = def.y - node.y;
                                    const d = ddx * ddx + ddy * ddy;
                                    if (d < minDist) {
                                        minDist = d;
                                        closest = def;
                                    }
                                }
                                closest.die('sacrifice', node, game);
                                this.die('attack', node, game);
                                return;
                            }

                            if (!this.dying) {
                                node.receiveAttack(this.owner, 1, game);
                                this.die('attack', node, game);
                            }
                            return;
                        }
                    }
                    else {
                        // Not targeting this node: only physical collision and evasion
                        this.x += nx * overlap;
                        this.y += ny * overlap;

                        if (this.currentTarget) {
                            const perpX = -ny;
                            const perpY = nx;
                            const targetDx = this.currentTarget.x - this.x;
                            const targetDy = this.currentTarget.y - this.y;
                            const side = (dx * targetDy - dy * targetDx) > 0 ? 1 : -1;

                            // Dynamic evasion force
                            const evasionForce = (1 - (dist / (node.radius + 60))) * 4500;
                            this.vx += perpX * side * evasionForce * 0.016;
                            this.vy += perpY * side * evasionForce * 0.016;
                        }
                    }
                }
            }
        }

        const randomForce = 10;
        this.vx += (Math.random() - 0.5) * randomForce * dt;
        this.vy += (Math.random() - 0.5) * randomForce * dt;

        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
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
            this.currentTarget = this.waypoints[0];
        }

        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const distSq = dx * dx + dy * dy;

            // If heading towards a node, finish waypoint slightly before exact center to avoid getting stuck
            let reachDistSq = 400; // 20px default reach distance
            if (this.targetNode) {
                // Complete the waypoint journey as soon as we touch the node's physical radius + a small margin
                const touchDist = this.targetNode.radius + this.radius + 10;
                reachDistSq = touchDist * touchDist;
            }

            if (distSq < reachDistSq) {
                this.waypoints.shift();
                this.currentTarget = this.waypoints.length > 0 ? this.waypoints[0] : null;
            }
        }
    }

    handleCollisionsAndCohesion(spatialGrid, nodes, game) {
        // Push entities out of nodes physical radius
        if (nodes) {
            for (let node of nodes) {
                const targetPoint = this.currentTarget || { x: this.x, y: this.y };
                const hasTarget = !!this.currentTarget || this.targetNode !== null;
                const tdx = targetPoint.x - node.x, tdy = targetPoint.y - node.y;
                const isTargetingThisNode = hasTarget && ((this.targetNode === node) || (tdx * tdx + tdy * tdy < (node.radius + 35) * (node.radius + 35)));

                if (isTargetingThisNode) continue;

                const dx = this.x - node.x;
                const dy = this.y - node.y;
                const distSq = dx * dx + dy * dy;
                const minDist = node.radius + this.radius;

                if (distSq < minDist * minDist) {
                    const dist = Math.sqrt(distSq);
                    const safeDist = Math.max(0.1, dist);
                    const overlap = minDist - safeDist;
                    const nx = dx / safeDist;
                    const ny = dy / safeDist;

                    const safeOverlap = Math.min(overlap, minDist);
                    this.x += nx * safeOverlap;
                    this.y += ny * safeOverlap;

                    // Limit push force
                    const force = 50 * 0.016;
                    this.vx += nx * force;
                    this.vy += ny * force;
                }
            }
        }

        let cohesionX = 0, cohesionY = 0, cohesionCount = 0;
        let separationX = 0, separationY = 0, separationCount = 0;
        let pushX = 0, pushY = 0;
        // Optimized spatial query
        const searchRadius = this.cohesionRadius;
        const neighbors = spatialGrid.retrieve(this.x, this.y, searchRadius);

        // Check if in flock for stronger cohesion
        const inFlock = !!this.flockId;

        for (let other of neighbors) {
            if (other === this || other.dead || other.dying) continue;

            let dx = other.x - this.x;
            let dy = other.y - this.y;
            let distSq = dx * dx + dy * dy;

            // Critical fix for PERFECT overlaps (e.g mass rally onto the same pixel)
            // Deterministic hash to avoid desyncs between client/server
            if (distSq < 0.0001) {
                const hash = (this.id * 31 + other.id) % 360;
                const angle = (hash * Math.PI) / 180;
                dx = Math.cos(angle) * 0.1;
                dy = Math.sin(angle) * 0.1;
                distSq = 0.01;
            }

            if (distSq > searchRadius * searchRadius) continue;
            const dist = Math.sqrt(distSq);
            const otherOwner = other.owner;

            // COHESION & SEPARATION logic
            if (otherOwner === this.owner) {
                if (dist < this.separationRadius) {
                    // SEPARATION: Push away if too close
                    const safeDist = Math.max(0.1, dist);
                    const force = (1 - safeDist / this.separationRadius);
                    separationX -= (dx / safeDist) * force;
                    separationY -= (dy / safeDist) * force;
                    separationCount++;
                } else if (dist > this.radius * 2.5) {
                    // COHESION: Pull towards if far enough
                    const safeDist = Math.max(0.1, dist);
                    if (inFlock && other.flockId === this.flockId) {
                        cohesionX += (dx / safeDist) * 1.5;
                        cohesionY += (dy / safeDist) * 1.5;
                        cohesionCount++;
                    } else {
                        cohesionX += dx / safeDist;
                        cohesionY += dy / safeDist;
                        cohesionCount++;
                    }
                }
            }

            // COLLISION logic - intensified to prevent overlapping
            const minDist = this.radius + other.radius;
            if (dist < minDist) {
                // Prevent division by zero or near zero
                const safeDist = Math.max(0.01, dist);
                const overlap = minDist - safeDist;
                const nx = dx / safeDist;
                const ny = dy / safeDist;

                // Push apart more aggressively (0.6 instead of 0.3)
                // Cap the overlap to prevent teleporting cross-map
                const safeOverlap = Math.min(overlap, minDist);

                pushX -= nx * safeOverlap * 0.6;
                pushY -= ny * safeOverlap * 0.6;

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
                    // Cap the physics impulse to prevent erratic zooming
                    const maxJ = 100;
                    const safeJ = Math.max(-maxJ, Math.min(maxJ, j));

                    // ONLY modify 'this' to prevent exponential O(N^2) feedback loops
                    // 'other' will update itself during its own update() cycle
                    this.vx -= safeJ * nx;
                    this.vy -= safeJ * ny;
                }
            }
        }

        // Apply accumulated collision pushes with a strict cap per frame
        if (pushX !== 0 || pushY !== 0) {
            const maxPushPerFrame = this.radius * 1.5; // Prevent explosive teleporting (e.g., max 7.5px per frame)
            const pushDist = Math.sqrt(pushX * pushX + pushY * pushY);
            if (pushDist > maxPushPerFrame) {
                pushX = (pushX / pushDist) * maxPushPerFrame;
                pushY = (pushY / pushDist) * maxPushPerFrame;
            }
            this.x += pushX;
            this.y += pushY;
        }

        if (cohesionCount > 0 || separationCount > 0) {
            let fx = 0, fy = 0;
            if (cohesionCount > 0) {
                fx += (cohesionX / cohesionCount) * this.cohesionForce;
                fy += (cohesionY / cohesionCount) * this.cohesionForce;
            }
            if (separationCount > 0) {
                // Diminishing returns after 6 overlapping units, instead of flat average
                const densityMult = Math.min(separationCount, 6) / separationCount;
                fx += (separationX * densityMult) * this.separationForce;
                fy += (separationY * densityMult) * this.separationForce;
            }

            this.vx += fx * 0.016;
            this.vy += fy * 0.016;
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
            // Skip avoidance if this is our target node OR if our target point is inside it
            if (this.targetNode === node) continue;
            const tdx = this.currentTarget.x - node.x, tdy = this.currentTarget.y - node.y;
            if (tdx * tdx + tdy * tdy < (node.radius + 35) * (node.radius + 35)) continue;

            const dx = node.x - this.x;
            const dy = node.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < node.radius + 60 && dist > 10) {
                const dot = (dx / dist) * targetNx + (dy / dist) * targetNy;
                if (dot > 0.1) { // Wider detection angle
                    const perpX = -targetNy;
                    const perpY = targetNx;
                    const side = (dx * targetNy - dy * targetNx) > 0 ? 1 : -1;

                    // Improved avoidance force proportional to proximity
                    const forceMult = (1 - (dist / (node.radius + 60))) * 4500;
                    this.vx += perpX * side * forceMult * 0.016;
                    this.vy += perpY * side * forceMult * 0.016;
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

        if (game && game.state && game.state.recordDeath) {
            game.state.recordDeath(this.owner, this.x, this.y);
        }

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

/***/ "./src/shared/EntityData.js"
/*!**********************************!*\
  !*** ./src/shared/EntityData.js ***!
  \**********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEATH_TYPES: () => (/* binding */ DEATH_TYPES),
/* harmony export */   EntityData: () => (/* binding */ EntityData)
/* harmony export */ });
/* harmony import */ var _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SharedMemory.js */ "./src/shared/SharedMemory.js");
/* harmony import */ var _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./GameConfig.js */ "./src/shared/GameConfig.js");



const DEATH_TYPES = {
    NONE: 0,
    ATTACK: 1,
    EXPLOSION: 2,
    ABSORBED: 3,
    SACRIFICE: 4,
    OUT_OF_BOUNDS: 5,
};

class EntityData {
    constructor(sharedMemory) {
        this.memory = sharedMemory;
        this.entities = sharedMemory.entities;
        // Sync count from shared header so reconstucting is safe when buffer arrives from server
        this.count = sharedMemory.getEntityCount();
    }

    allocate(x, y, owner, id) {
        let idx = -1;

        // Try to find a dead slot to recycle
        for (let i = 0; i < this.count; i++) {
            if (this.entities.flags[i] & 0x01) { // isDead flag
                idx = i;
                break;
            }
        }

        if (idx === -1) {
            idx = this.count;
            if (idx >= _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__.MEMORY_LAYOUT.MAX_ENTITIES) {
                console.warn('Max entities reached');
                return -1;
            }
            this.count++;
            this.memory.setEntityCount(this.count);
        }

        this.entities.x[idx] = x;
        this.entities.y[idx] = y;
        this.entities.vx[idx] = 0;
        this.entities.vy[idx] = 0;
        this.entities.owner[idx] = owner;
        this.entities.radius[idx] = 5;
        this.entities.maxSpeed[idx] = 50;
        this.entities.friction[idx] = 0.975;
        this.entities.hp[idx] = 1;
        this.entities.speedBoost[idx] = 0;

        this.entities.flags[idx] = 0; // Clear all flags including isDead
        this.entities.deathTime[idx] = 0;
        this.entities.deathType[idx] = DEATH_TYPES.NONE;

        this.entities.targetX[idx] = 0;
        this.entities.targetY[idx] = 0;
        this.entities.targetNodeId[idx] = -1;

        this.entities.id[idx] = id || 0;
        this.entities.outsideTime[idx] = 0;

        return idx;
    }

    // Sync count from header (e.g. after server wrote a new entity count via allocateEntity)
    syncCount() {
        this.count = this.memory.getEntityCount();
    }

    getCount() {
        return this.count;
    }

    getX(index) {
        return this.entities.x[index];
    }

    setX(index, value) {
        this.entities.x[index] = value;
    }

    getY(index) {
        return this.entities.y[index];
    }

    setY(index, value) {
        this.entities.y[index] = value;
    }

    getVx(index) {
        return this.entities.vx[index];
    }

    setVx(index, value) {
        this.entities.vx[index] = value;
    }

    getVy(index) {
        return this.entities.vy[index];
    }

    setVy(index, value) {
        this.entities.vy[index] = value;
    }

    getOwner(index) {
        return this.entities.owner[index];
    }

    setOwner(index, value) {
        this.entities.owner[index] = value;
    }

    getRadius(index) {
        return this.entities.radius[index];
    }

    setRadius(index, value) {
        this.entities.radius[index] = value;
    }

    getMaxSpeed(index) {
        return this.entities.maxSpeed[index];
    }

    setMaxSpeed(index, value) {
        this.entities.maxSpeed[index] = value;
    }

    getFriction(index) {
        return this.entities.friction[index];
    }

    setFriction(index, value) {
        this.entities.friction[index] = value;
    }

    getHp(index) {
        return this.entities.hp[index];
    }

    setHp(index, value) {
        this.entities.hp[index] = value;
    }

    getSpeedBoost(index) {
        return this.entities.speedBoost[index];
    }

    setSpeedBoost(index, value) {
        this.entities.speedBoost[index] = value;
    }

    isDead(index) {
        return this.memory.isDead(index);
    }

    setDead(index, value) {
        this.memory.setDead(index, value);
    }

    isDying(index) {
        return this.memory.isDying(index);
    }

    setDying(index, value) {
        this.memory.setDying(index, value);
    }

    isSelected(index) {
        return this.memory.isSelected(index);
    }

    setSelected(index, value) {
        this.memory.setSelected(index, value);
    }

    hasOutsideWarning(index) {
        return this.memory.hasOutsideWarning(index);
    }

    setOutsideWarning(index, value) {
        this.memory.setOutsideWarning(index, value);
    }

    getDeathTime(index) {
        return this.entities.deathTime[index];
    }

    setDeathTime(index, value) {
        this.entities.deathTime[index] = value;
    }

    getDeathType(index) {
        return this.entities.deathType[index];
    }

    setDeathType(index, value) {
        this.entities.deathType[index] = value;
    }

    getTargetX(index) {
        return this.entities.targetX[index];
    }

    setTargetX(index, value) {
        this.entities.targetX[index] = value;
    }

    getTargetY(index) {
        return this.entities.targetY[index];
    }

    setTargetY(index, value) {
        this.entities.targetY[index] = value;
    }

    getTargetNodeId(index) {
        return this.entities.targetNodeId[index];
    }

    setTargetNodeId(index, value) {
        this.entities.targetNodeId[index] = value;
    }

    hasTarget(index) {
        return this.entities.targetNodeId[index] !== -1 ||
            (this.entities.targetX[index] !== 0 || this.entities.targetY[index] !== 0);
    }

    // Used by GameServer to set whether entity has an active target
    // For now this mirrors the hasTarget logic: clear targetX/Y and targetNodeId to unset
    setHasTarget(index, value) {
        if (!value) {
            this.entities.targetX[index] = 0;
            this.entities.targetY[index] = 0;
            this.entities.targetNodeId[index] = -1;
        }
        // If value=true, caller must also set targetX/Y/nodeId separately
    }

    getFlockId(index) {
        return this.entities.flockId[index];
    }

    setFlockId(index, value) {
        this.entities.flockId[index] = value;
    }

    getOutsideTime(index) {
        return this.entities.outsideTime[index];
    }

    setOutsideTime(index, value) {
        this.entities.outsideTime[index] = value;
    }

    getId(index) {
        return this.entities.id[index];
    }

    setId(index, value) {
        this.entities.id[index] = value;
    }

    isValidIndex(index) {
        return index >= 0 && index < this.count;
    }

    getWorldBounds() {
        if (this._worldBoundsOverride) return this._worldBoundsOverride;
        return {
            width: _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.WORLD_WIDTH,
            height: _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.WORLD_HEIGHT,
            worldRadius: _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.WORLD_RADIUS,
            centerX: _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.WORLD_WIDTH / 2,
            centerY: _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.WORLD_HEIGHT / 2,
        };
    }

    setWorldBounds(centerX, centerY, worldRadius) {
        this._worldBoundsOverride = { centerX, centerY, worldRadius, width: worldRadius * 2, height: worldRadius * 2 };
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
/* harmony export */   NODE_CONFIG: () => (/* binding */ NODE_CONFIG),
/* harmony export */   NODE_TYPES: () => (/* binding */ NODE_TYPES),
/* harmony export */   PLAYER_COLORS: () => (/* binding */ PLAYER_COLORS),
/* harmony export */   setPlayerColor: () => (/* binding */ setPlayerColor)
/* harmony export */ });
const DEFAULT_COLORS = [
    '#4CAF50', '#f44336', '#2196F3', '#FF9800',
    '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63', '#000000'
];

let PLAYER_COLORS = [...DEFAULT_COLORS];

function setPlayerColor(index) {
    if (index >= 0 && index < DEFAULT_COLORS.length) {
        // Reset to default first to be idempotent
        PLAYER_COLORS = [...DEFAULT_COLORS];

        if (index > 0) {
            // Swap selected color with first color (Player 0)
            const temp = PLAYER_COLORS[0];
            PLAYER_COLORS[0] = PLAYER_COLORS[index];
            PLAYER_COLORS[index] = temp;
        }
    }
}

const GAME_SETTINGS = {
    WORLD_WIDTH: 4000,
    WORLD_HEIGHT: 3000,
    WORLD_RADIUS: 3000, // Larger than map - units won't reach it often
    OUTSIDE_DEATH_TIME: 5, // Seconds before unit dies outside boundary
    MAX_UNITS_PER_PLAYER: 500, // Global unit cap
};

const NODE_TYPES = {
    SMALL: 0,
    MEDIUM: 1,
    LARGE: 2,
    MEGA: 3,
    ULTRA: 4,
    OMEGA: 5
};

const NODE_CONFIG = {
    [NODE_TYPES.SMALL]: { radius: 22, influenceRadius: 100, baseHp: 6, maxHp: 15, spawnInterval: 4.8 },
    [NODE_TYPES.MEDIUM]: { radius: 40, influenceRadius: 160, baseHp: 12, maxHp: 35, spawnInterval: 3.8 },
    [NODE_TYPES.LARGE]: { radius: 65, influenceRadius: 220, baseHp: 25, maxHp: 70, spawnInterval: 2.7 },
    [NODE_TYPES.MEGA]: { radius: 100, influenceRadius: 300, baseHp: 50, maxHp: 120, spawnInterval: 2.3 },
    [NODE_TYPES.ULTRA]: { radius: 125, influenceRadius: 380, baseHp: 80, maxHp: 200, spawnInterval: 1.9 },
    [NODE_TYPES.OMEGA]: { radius: 160, influenceRadius: 450, baseHp: 120, maxHp: 300, spawnInterval: 1.5 }
};


/***/ },

/***/ "./src/shared/GameEngine.js"
/*!**********************************!*\
  !*** ./src/shared/GameEngine.js ***!
  \**********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GameEngine: () => (/* binding */ GameEngine)
/* harmony export */ });
/* harmony import */ var _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SharedMemory.js */ "./src/shared/SharedMemory.js");
/* harmony import */ var _EntityData_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./EntityData.js */ "./src/shared/EntityData.js");
/* harmony import */ var _GameConfig_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./GameConfig.js */ "./src/shared/GameConfig.js");





class GameEngine {
    constructor(sharedMemory, entityData, nodeData, gameSettings) {
        this.sharedMemory = sharedMemory;
        this.entityData = entityData;
        this.nodeData = nodeData;
        this.gameSettings = gameSettings || { speedMultiplier: 1, maxEntitiesPerPlayer: _GameConfig_js__WEBPACK_IMPORTED_MODULE_2__.GAME_SETTINGS.MAX_UNITS_PER_PLAYER };

        this.CELL_SIZE = 80;
        this.spatialGrid = new Map();

        this.MAX_QUERY_RESULTS = 256;
        this.queryResultArray = new Int32Array(this.MAX_QUERY_RESULTS);

        this.MAX_DEFENDERS_PER_NODE = 64;
        this.defendersPool = [];
        this.defendersCount = [];
    }

    setGameSettings(settings) {
        this.gameSettings = { ...this.gameSettings, ...settings };
    }

    step(dt) {
        // Track which players currently own at least one node
        this.activePlayers = new Set();
        for (let i = 0; i < this.nodeData.getCount(); i++) {
            const owner = this.nodeData.getOwner(i);
            if (owner !== -1) {
                this.activePlayers.add(owner);
            }
        }

        this.handleCollisionsAndCohesion(dt);
        this.handleEntityNodeCollisions(dt);
        this.updateEntities(dt);
        this.updateNodes(dt);
    }

    getCellKey(x, y) {
        const col = Math.floor(x / this.CELL_SIZE);
        const row = Math.floor(y / this.CELL_SIZE);
        return (col << 16) | (row & 0xFFFF);
    }

    buildSpatialGrid() {
        for (const arr of this.spatialGrid.values()) {
            arr.length = 0;
        }

        const count = this.entityData.getCount();
        for (let i = 0; i < count; i++) {
            if (this.entityData.isDead(i) || this.entityData.isDying(i)) continue;
            const x = this.entityData.getX(i);
            const y = this.entityData.getY(i);
            const key = this.getCellKey(x, y);
            if (!this.spatialGrid.has(key)) {
                this.spatialGrid.set(key, []);
            }
            this.spatialGrid.get(key).push(i);
        }
    }

    getNearbyEntities(x, y, radius) {
        let count = 0;
        const startCol = Math.floor((x - radius) / this.CELL_SIZE);
        const endCol = Math.floor((x + radius) / this.CELL_SIZE);
        const startRow = Math.floor((y - radius) / this.CELL_SIZE);
        const endRow = Math.floor((y + radius) / this.CELL_SIZE);

        for (let c = startCol; c <= endCol; c++) {
            for (let r = startRow; r <= endRow; r++) {
                const key = (c << 16) | (r & 0xFFFF);
                const cell = this.spatialGrid.get(key);
                if (cell) {
                    for (let j = 0; j < cell.length && count < this.MAX_QUERY_RESULTS; j++) {
                        this.queryResultArray[count++] = cell[j];
                    }
                }
            }
        }
        return count;
    }

    handleCollisionsAndCohesion(dt) {
        this.buildSpatialGrid();

        const count = this.entityData.getCount();

        // Swarm tuning constants
        // -----------------------------------------------------------
        // SEPARATION: hard push away from overlapping neighbors
        const SEP_RADIUS = 8;     // allow more clumping
        const SEP_FORCE = 300;    // softer separation
        // ALIGNMENT: match velocity with nearby friends (gives the "school of fish" feel)
        const ALI_RADIUS = 90;
        const ALI_FORCE = 25;     // less rigid alignment
        // COHESION: drift toward center of nearby friends
        const COH_RADIUS = 120;
        const COH_FORCE = 18;
        // Enemy repulsion (steer AROUND enemies – not combat, that's handled elsewhere)
        const ENE_RADIUS = 50;
        const ENE_FORCE = 220;
        // Node-body repulsion radius (extra push away from node circles)
        const NODE_BODY_MARGIN = 2; // VERY tight margin so they can dive into nodes

        for (let i = 0; i < count; i++) {
            if (this.entityData.isDead(i) || this.entityData.isDying(i)) continue;

            let x = this.entityData.getX(i);
            let y = this.entityData.getY(i);
            const owner = this.entityData.getOwner(i);
            const radius = this.entityData.getRadius(i);
            let vx = this.entityData.getVx(i);
            let vy = this.entityData.getVy(i);

            // ──────────────────────────────────────
            // 1. Hard push OUT of node bodies
            // ──────────────────────────────────────
            const targetNodeId = this.entityData.getTargetNodeId(i);
            const targetX = this.entityData.getTargetX(i);
            const targetY = this.entityData.getTargetY(i);
            const hasTarget = this.entityData.hasTarget(i);

            for (let n = 0; n < this.nodeData.getCount(); n++) {
                const nodeX = this.nodeData.getX(n);
                const nodeY = this.nodeData.getY(n);
                const nodeRadius = this.nodeData.getRadius(n);
                const nodeId = this.nodeData.getId(n);

                // If this is the node we want to enter, don't push us away physically!
                if (hasTarget && nodeId === targetNodeId) continue;

                // Also skip push if our target point is INSIDE this node (sensitive capture)
                const tdx = targetX - nodeX;
                const tdy = targetY - nodeY;
                if (hasTarget && tdx * tdx + tdy * tdy < (nodeRadius + 35) * (nodeRadius + 35)) continue;

                const minDist = nodeRadius + radius + NODE_BODY_MARGIN;

                const dx = x - nodeX;
                const dy = y - nodeY;
                const distSq = dx * dx + dy * dy;

                if (distSq < minDist * minDist && distSq > 0.001) {
                    const dist = Math.sqrt(distSq);
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    // Positional correction + velocity kick (gentler to allow grazing)
                    x += nx * overlap * 0.4;
                    y += ny * overlap * 0.4;
                    vx += nx * overlap * 3;
                    vy += ny * overlap * 3;
                }
            }
            this.entityData.setX(i, x);
            this.entityData.setY(i, y);

            // ──────────────────────────────────────
            // 2. Reynolds Boids forces
            // ──────────────────────────────────────
            let sepX = 0, sepY = 0, sepN = 0;
            let aliVx = 0, aliVy = 0, aliN = 0;
            let cohX = 0, cohY = 0, cohN = 0;
            let eneX = 0, eneY = 0, eneN = 0;

            const queryR = Math.max(SEP_RADIUS, ALI_RADIUS, COH_RADIUS, ENE_RADIUS);
            const neighborCount = this.getNearbyEntities(x, y, queryR);

            for (let nIdx = 0; nIdx < neighborCount; nIdx++) {
                const other = this.queryResultArray[nIdx];
                if (other === i) continue;
                if (this.entityData.isDead(other) || this.entityData.isDying(other)) continue;

                const ox = this.entityData.getX(other);
                const oy = this.entityData.getY(other);
                const dx = ox - x;
                const dy = oy - y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);

                const otherOwner = this.entityData.getOwner(other);
                const isFriend = (otherOwner === owner);

                // ── Hard collision: entities physically overlapping ──
                const combinedR = radius + this.entityData.getRadius(other);
                if (dist < combinedR && dist > 0.001) {
                    const overlap = combinedR - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    if (isFriend) {
                        // Soft elastic push — let friends overlap heavily
                        const pushFactor = overlap * 0.2;
                        x -= nx * pushFactor;
                        y -= ny * pushFactor;

                        // Velocity exchange (elastic collision, mass=1)
                        const ovx = this.entityData.getVx(other);
                        const ovy = this.entityData.getVy(other);
                        const relV = (vx - ovx) * nx + (vy - ovy) * ny;
                        if (relV > 0) {
                            vx -= relV * nx * 0.4;
                            vy -= relV * ny * 0.4;
                        }
                    } else {
                        // COMBAT: both die — handled by combat pass
                        // But we still do positional correction to avoid z-fighting
                        this.entityData.setDying(i, true);
                        this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.EXPLOSION);
                        this.entityData.setDeathTime(i, 0);
                        this.sharedMemory.addDeathEvent(x, y, owner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.EXPLOSION, i);

                        this.entityData.setDying(other, true);
                        this.entityData.setDeathType(other, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.EXPLOSION);
                        this.entityData.setDeathTime(other, 0);
                        const ox2 = this.entityData.getX(other);
                        const oy2 = this.entityData.getY(other);
                        this.sharedMemory.addDeathEvent(ox2, oy2, otherOwner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.EXPLOSION, other);
                        break;
                    }
                }

                // ── Boids forces (only apply to friends in respective radii) ──
                if (isFriend) {
                    if (dist < SEP_RADIUS && dist > 0.001) {
                        // Separation: exponentially stronger when very close
                        const strength = (1 - dist / SEP_RADIUS) * (1 - dist / SEP_RADIUS);
                        sepX -= (dx / dist) * strength;
                        sepY -= (dy / dist) * strength;
                        sepN++;
                    }
                    if (dist < ALI_RADIUS) {
                        // Alignment: weighted by proximity
                        const w = 1 - dist / ALI_RADIUS;
                        aliVx += this.entityData.getVx(other) * w;
                        aliVy += this.entityData.getVy(other) * w;
                        aliN++;
                    }
                    if (dist < COH_RADIUS) {
                        cohX += ox;
                        cohY += oy;
                        cohN++;
                    }
                } else {
                    // Enemy repulsion (steer around — combat handled separately)
                    if (dist < ENE_RADIUS && dist > 0.001) {
                        const strength = (1 - dist / ENE_RADIUS);
                        eneX -= (dx / dist) * strength;
                        eneY -= (dy / dist) * strength;
                        eneN++;
                    }
                }
            }

            // Apply Boids forces
            let fx = 0, fy = 0;
            if (sepN > 0) {
                fx += (sepX / sepN) * SEP_FORCE;
                fy += (sepY / sepN) * SEP_FORCE;
            }
            if (aliN > 0) {
                // Drive velocity toward flock average
                const targetVx = aliVx / aliN;
                const targetVy = aliVy / aliN;
                fx += (targetVx - vx) * ALI_FORCE * dt;
                fy += (targetVy - vy) * ALI_FORCE * dt;
            }
            if (cohN > 0) {
                const cx = cohX / cohN - x;
                const cy = cohY / cohN - y;
                const cDist = Math.sqrt(cx * cx + cy * cy) || 1;
                fx += (cx / cDist) * COH_FORCE;
                fy += (cy / cDist) * COH_FORCE;
            }
            if (eneN > 0) {
                fx += (eneX / eneN) * ENE_FORCE;
                fy += (eneY / eneN) * ENE_FORCE;
            }

            vx += fx * dt;
            vy += fy * dt;

            this.entityData.setX(i, x);
            this.entityData.setY(i, y);
            this.entityData.setVx(i, vx);
            this.entityData.setVy(i, vy);
        }
    }

    handleEntityNodeCollisions(dt) {
        const entityCount = this.entityData.getCount();
        const nodeCount = this.nodeData.getCount();

        if (this.defendersPool.length < nodeCount) {
            for (let i = this.defendersPool.length; i < nodeCount; i++) {
                this.defendersPool.push(new Int32Array(this.MAX_DEFENDERS_PER_NODE));
            }
        }
        if (this.defendersCount.length < nodeCount) {
            for (let i = this.defendersCount.length; i < nodeCount; i++) {
                this.defendersCount.push(0);
            }
        }

        for (let n = 0; n < nodeCount; n++) {
            this.defendersCount[n] = 0;
        }

        for (let i = 0; i < entityCount; i++) {
            if (this.entityData.isDead(i) || this.entityData.isDying(i)) continue;
            const ex = this.entityData.getX(i);
            const ey = this.entityData.getY(i);
            const eOwner = this.entityData.getOwner(i);

            for (let n = 0; n < nodeCount; n++) {
                const nodeOwner = this.nodeData.getOwner(n);
                if (eOwner !== nodeOwner || nodeOwner === -1) continue;

                const nodeX = this.nodeData.getX(n);
                const nodeY = this.nodeData.getY(n);
                const nodeInfluenceRadius = this.nodeData.getInfluenceRadius(n);

                const dx = ex - nodeX;
                const dy = ey - nodeY;
                const distSq = dx * dx + dy * dy;

                if (distSq < nodeInfluenceRadius * nodeInfluenceRadius) {
                    if (this.defendersCount[n] < this.MAX_DEFENDERS_PER_NODE) {
                        this.defendersPool[n][this.defendersCount[n]++] = i;
                    }
                }
            }
        }

        for (let i = 0; i < entityCount; i++) {
            if (this.entityData.isDead(i) || this.entityData.isDying(i)) continue;

            let ex = this.entityData.getX(i);
            let ey = this.entityData.getY(i);
            const eRadius = this.entityData.getRadius(i);
            const eOwner = this.entityData.getOwner(i);
            const eTargetNodeId = this.entityData.getTargetNodeId(i);

            for (let n = 0; n < nodeCount; n++) {
                const nodeOwner = this.nodeData.getOwner(n);
                const nodeX = this.nodeData.getX(n);
                const nodeY = this.nodeData.getY(n);
                const nodeRadius = this.nodeData.getRadius(n);
                const nodeId = this.nodeData.getId(n);

                const dx = ex - nodeX;
                const dy = ey - nodeY;
                const distSq = dx * dx + dy * dy;
                // ROBUST CONTACT: Trigger at edge (+8px margin for high speed safety)
                const touchRange = nodeRadius + eRadius + 8;
                const dist = Math.sqrt(distSq);

                const targetX = this.entityData.getTargetX(i);
                const targetY = this.entityData.getTargetY(i);
                const hasTarget = this.entityData.hasTarget(i);
                const isTargetingThisNode = hasTarget && ((eTargetNodeId === nodeId) ||
                    (Math.hypot(targetX - nodeX, targetY - nodeY) < nodeRadius + 35));

                if (dist < touchRange && dist > 0.001) {
                    const overlap = touchRange - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    if (isTargetingThisNode) {
                        if (nodeOwner === -1) {
                            // Neutral node - cell dies and damages node
                            this.nodeData.setBaseHp(n, this.nodeData.getBaseHp(n) - 1);
                            this.nodeData.setHitFlash(n, 0.3);

                            if (this.nodeData.getBaseHp(n) <= 0) {
                                this.nodeData.setOwner(n, eOwner);
                                this.nodeData.setBaseHp(n, this.nodeData.getMaxHp(n) * 0.1);
                            }

                            this.entityData.setDying(i, true);
                            this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ATTACK);
                            this.entityData.setDeathTime(i, 0);
                            this.sharedMemory.addDeathEvent(ex, ey, eOwner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ATTACK, i);
                            break;
                        }
                        else if (nodeOwner === eOwner) {
                            const baseHp = this.nodeData.getBaseHp(n);
                            const maxHp = this.nodeData.getMaxHp(n);
                            if (baseHp < maxHp) {
                                this.nodeData.setBaseHp(n, baseHp + 1);
                                this.nodeData.setHitFlash(n, 0.15);

                                this.entityData.setDying(i, true);
                                this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ABSORBED);
                                this.entityData.setDeathTime(i, 0);
                                this.sharedMemory.addDeathEvent(ex, ey, eOwner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ABSORBED, i, nodeX, nodeY);
                                break;
                            }
                            else {
                                this.entityData.setTargetNodeId(i, -1);
                                this.entityData.setTargetX(i, ex);
                                this.entityData.setTargetY(i, ey);

                                ex = ex + nx * overlap;
                                ey = ey + ny * overlap;
                                this.entityData.setX(i, ex);
                                this.entityData.setY(i, ey);
                            }
                        }
                        else {
                            let defenderIdx = -1;
                            let minDistDefender = Infinity;
                            for (let d = 0; d < this.defendersCount[n]; d++) {
                                const idx = this.defendersPool[n][d];
                                if (!this.entityData.isDead(idx) && !this.entityData.isDying(idx)) {
                                    const dx2 = this.entityData.getX(idx) - nodeX;
                                    const dy2 = this.entityData.getY(idx) - nodeY;
                                    const d2 = dx2 * dx2 + dy2 * dy2;
                                    if (d2 < minDistDefender) {
                                        minDistDefender = d2;
                                        defenderIdx = idx;
                                    }
                                }
                            }

                            if (defenderIdx !== -1) {
                                this.entityData.setDying(defenderIdx, true);
                                this.entityData.setDeathType(defenderIdx, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.SACRIFICE);
                                this.entityData.setDeathTime(defenderIdx, 0);

                                // Store node center as target for pull animation
                                this.entityData.setTargetX(defenderIdx, nodeX);
                                this.entityData.setTargetY(defenderIdx, nodeY);

                                const defX = this.entityData.getX(defenderIdx);
                                const defY = this.entityData.getY(defenderIdx);
                                const defOwner = this.entityData.getOwner(defenderIdx);
                                this.sharedMemory.addDeathEvent(defX, defY, defOwner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.SACRIFICE, defenderIdx, nodeX, nodeY);

                                this.entityData.setDying(i, true);
                                this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ATTACK);
                                this.entityData.setDeathTime(i, 0);
                                this.sharedMemory.addDeathEvent(ex, ey, eOwner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ATTACK, i, nodeX, nodeY);
                                break;
                            }
                            else {
                                this.nodeData.setBaseHp(n, this.nodeData.getBaseHp(n) - 1);
                                this.nodeData.setHitFlash(n, 0.3);

                                if (this.nodeData.getBaseHp(n) <= 0) {
                                    this.nodeData.setOwner(n, eOwner);
                                    this.nodeData.setBaseHp(n, this.nodeData.getMaxHp(n) * 0.1);
                                }

                                this.entityData.setDying(i, true);
                                this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ATTACK);
                                this.entityData.setDeathTime(i, 0);
                                this.sharedMemory.addDeathEvent(ex, ey, eOwner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ATTACK, i, nodeX, nodeY);
                                break;
                            }
                        }
                    }
                    else {
                        // Not targeting this node: only physical collision and evasion
                        ex = ex + nx * overlap;
                        ey = ey + ny * overlap;
                        this.entityData.setX(i, ex);
                        this.entityData.setY(i, ey);

                        const perpX = -ny;
                        const perpY = nx;
                        const targetDx = this.entityData.getTargetX(i) - ex;
                        const targetDy = this.entityData.getTargetY(i) - ey;
                        const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
                        if (targetDist > 0.01) {
                            const side = (dx * targetDy - dy * targetDx) > 0 ? 1 : -1;
                            // Increased evasion force (was 100/2500)
                            const evasionForce = (1 - (dist / (nodeRadius + 60))) * 4500;
                            this.entityData.setVx(i, this.entityData.getVx(i) + perpX * side * evasionForce * dt);
                            this.entityData.setVy(i, this.entityData.getVy(i) + perpY * side * evasionForce * dt);
                        }
                    }
                }
            }
        }
    }

    updateEntities(dt) {
        const bounds = this.entityData.getWorldBounds();
        const speedMult = this.gameSettings.speedMultiplier || 1;
        const now = (Date.now() * 0.001); // seconds, for oscillation

        for (let i = 0; i < this.entityData.getCount(); i++) {
            if (this.entityData.isDead(i)) continue;

            // ── Death animation ──
            if (this.entityData.isDying(i)) {
                let deathTime = this.entityData.getDeathTime(i) + dt;
                this.entityData.setDeathTime(i, deathTime);

                const deathType = this.entityData.getDeathType(i);
                if (deathType === _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ABSORBED || deathType === _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.SACRIFICE) {
                    const tx = this.entityData.getTargetX(i);
                    const ty = this.entityData.getTargetY(i);
                    if (tx !== 0 || ty !== 0) {
                        const pullFactor = Math.pow(deathTime / 0.4, 2);
                        let ex = this.entityData.getX(i);
                        let ey = this.entityData.getY(i);
                        ex += (tx - ex) * pullFactor * 0.5;
                        ey += (ty - ey) * pullFactor * 0.5;
                        this.entityData.setX(i, ex);
                        this.entityData.setY(i, ey);
                    }
                }

                if (deathTime > 0.4) {
                    this.entityData.setDead(i, true);
                }
                continue;
            }

            let x = this.entityData.getX(i);
            let y = this.entityData.getY(i);
            let vx = this.entityData.getVx(i);
            let vy = this.entityData.getVy(i);
            let speedBoost = this.entityData.getSpeedBoost(i);
            const owner = this.entityData.getOwner(i);

            // ─────────────────────────────────────────────────────────────────
            // 0. Starvation Attrition: If owner has 0 nodes, progressive death
            // ─────────────────────────────────────────────────────────────────
            if (owner !== -1 && !this.activePlayers.has(owner)) {
                // To keep it performant and chaotic, each unit has a small random
                // chance to die every second. A 5% chance per second per unit 
                // means an army of 100 will lose ~5 units per sec.
                if (Math.random() < 0.05 * dt) {
                    this.entityData.setDying(i, true);
                    this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.EXPLOSION);
                    this.entityData.setDeathTime(i, 0);
                    this.sharedMemory.addDeathEvent(x, y, owner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.EXPLOSION, i);
                    continue; // Skip the rest of the update for this entity
                }
            }

            // ─────────────────────────────────────────────────────────────────
            // A. Speed-boost: faster in friendly territory (acceleration lane)
            // ─────────────────────────────────────────────────────────────────
            let inFriendlyTerritory = false;
            if (owner !== -1) {
                for (let n = 0; n < this.nodeData.getCount(); n++) {
                    if (this.nodeData.getOwner(n) !== owner) continue;
                    const ndx = x - this.nodeData.getX(n);
                    const ndy = y - this.nodeData.getY(n);
                    const ir = this.nodeData.getInfluenceRadius(n);
                    if (ndx * ndx + ndy * ndy < ir * ir) {
                        inFriendlyTerritory = true;
                        break;
                    }
                }
            }
            speedBoost = inFriendlyTerritory
                ? Math.min(1.0, speedBoost + dt * 1.8)
                : Math.max(0.0, speedBoost - dt * 0.9);


            // B. Seek target -- direct drive, no orbit
            //    * Node target  -> straight in (separation handles spacing)
            //    * Point target -> 12px golden-angle spread across units
            //    * Obstacle avoidance: minimal swerve, graze close to nodes
            const hasTarget = this.entityData.hasTarget(i);
            const targetX = this.entityData.getTargetX(i);
            const targetY = this.entityData.getTargetY(i);
            const targetNodeId = this.entityData.getTargetNodeId(i);

            if (hasTarget) {
                let arrivalX = targetX;
                let arrivalY = targetY;

                let seekThreshold = 2;

                // Point-only targets: stop seeking when close to let the group settle naturally
                if (targetNodeId === -1) {
                    seekThreshold = 25;
                }

                const dx = arrivalX - x;
                const dy = arrivalY - y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > seekThreshold) {
                    const SEEK_FORCE = 900;
                    vx += (dx / dist) * SEEK_FORCE * dt;
                    vy += (dy / dist) * SEEK_FORCE * dt;

                    // Obstacle avoidance: graze non-target nodes (tight)
                    const speed2 = Math.sqrt(vx * vx + vy * vy);
                    const lookAhead = 30 + speed2 * 0.12;
                    const dirX = vx / (speed2 || 1);
                    const dirY = vy / (speed2 || 1);

                    for (let n = 0; n < this.nodeData.getCount(); n++) {
                        const nnx = this.nodeData.getX(n);
                        const nny = this.nodeData.getY(n);
                        const nRadius = this.nodeData.getRadius(n);

                        // Skip avoidance if this is our target node OR if our target point is inside it
                        if (this.nodeData.getId(n) === targetNodeId) continue;
                        const tdx = targetX - nnx;
                        const tdy = targetY - nny;
                        if (tdx * tdx + tdy * tdy < (nRadius + 35) * (nRadius + 35)) continue;

                        const ndx = nnx - x;
                        const ndy = nny - y;
                        const nDist = Math.sqrt(ndx * ndx + ndy * ndy);

                        if (nDist < nRadius + lookAhead && nDist > 1) {
                            const dot = (ndx / nDist) * dirX + (ndy / nDist) * dirY;
                            if (dot > 0.2) {
                                const perpX = -dirY;
                                const perpY = dirX;
                                const side = (ndx * dirY - ndy * dirX) > 0 ? 1 : -1;
                                const avoidStrength = (1 - nDist / (nRadius + lookAhead)) * 2000;
                                vx += perpX * side * avoidStrength * dt;
                                vy += perpY * side * avoidStrength * dt;
                            }
                        }
                    }
                }
            }

            // C. Organic wobble -- gentle, fades at speed
            //    Idle cells wander slowly; moving cells are nearly straight
            const wobbleFreq = 0.9 + (i % 7) * 0.11;
            const wobblePhase = i * 1.618;
            const wobbleAmp = 2.5;
            const speed = Math.sqrt(vx * vx + vy * vy);
            const speedFade = Math.max(0, 1 - speed / 30);
            if (speed > 0.5) {
                const perpX = -vy / speed;
                const perpY = vx / speed;
                const wobble = Math.sin(now * wobbleFreq + wobblePhase) * wobbleAmp * speedFade;
                vx += perpX * wobble * dt;
                vy += perpY * wobble * dt;
            } else {
                // Idle: slow biological drift
                vx += Math.sin(now * wobbleFreq + wobblePhase) * wobbleAmp * 0.4 * dt;
                vy += Math.cos(now * wobbleFreq + wobblePhase + 0.8) * wobbleAmp * 0.4 * dt;
            }



            // ─────────────────────────────────────────────────────────────────
            // D. Friction + speed cap
            // ─────────────────────────────────────────────────────────────────
            const friction = this.entityData.getFriction(i);
            vx *= friction;
            vy *= friction;

            const maxSpeed = this.entityData.getMaxSpeed(i) * (1 + speedBoost * 0.5) * speedMult;
            const speedSq = vx * vx + vy * vy;
            if (speedSq > maxSpeed * maxSpeed) {
                const s = Math.sqrt(speedSq);
                vx = (vx / s) * maxSpeed;
                vy = (vy / s) * maxSpeed;
            }

            x += vx * dt;
            y += vy * dt;

            // ─────────────────────────────────────────────────────────────────
            // E. World boundary — push back and die if outside too long
            // ─────────────────────────────────────────────────────────────────
            const centerDx = x - bounds.centerX;
            const centerDy = y - bounds.centerY;
            const distFromCenter = Math.sqrt(centerDx * centerDx + centerDy * centerDy);

            if (distFromCenter > bounds.worldRadius) {
                // Soft push back toward center
                const pushStr = (distFromCenter - bounds.worldRadius) * 3;
                vx -= (centerDx / distFromCenter) * pushStr * dt;
                vy -= (centerDy / distFromCenter) * pushStr * dt;

                let outsideTime = this.entityData.getOutsideTime(i) + dt;
                this.entityData.setOutsideTime(i, outsideTime);
                this.entityData.setOutsideWarning(i, true);

                if (outsideTime >= 5) {
                    this.entityData.setDying(i, true);
                    this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.OUT_OF_BOUNDS);
                    this.entityData.setDeathTime(i, 0);
                    this.sharedMemory.addDeathEvent(x, y, owner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.OUT_OF_BOUNDS, i);
                }
            } else {
                this.entityData.setOutsideTime(i, 0);
                this.entityData.setOutsideWarning(i, false);
            }

            this.entityData.setX(i, x);
            this.entityData.setY(i, y);
            this.entityData.setVx(i, vx);
            this.entityData.setVy(i, vy);
            this.entityData.setSpeedBoost(i, speedBoost);
        }
    }

    updateNodes(dt) {
        // Precalculate unit counts per player to enforce global cap efficiently
        const playerUnitCounts = {};
        let totalAlive = 0;
        for (let i = 0; i < this.entityData.getCount(); i++) {
            if (this.entityData.isDead(i) || this.entityData.isDying(i)) continue;
            totalAlive++;
            const owner = this.entityData.getOwner(i);
            if (owner !== -1) {
                playerUnitCounts[owner] = (playerUnitCounts[owner] || 0) + 1;
            }
        }

        for (let i = 0; i < this.nodeData.getCount(); i++) {
            const owner = this.nodeData.getOwner(i);

            if (owner !== -1) {
                let baseHp = this.nodeData.getBaseHp(i);
                const maxHp = this.nodeData.getMaxHp(i);

                if (baseHp < maxHp) {
                    baseHp += 0.5 * dt;
                    this.nodeData.setBaseHp(i, baseHp);
                }

                let spawnTimer = this.nodeData.getSpawnTimer(i);
                spawnTimer += dt;

                const healthPercent = Math.min(baseHp / maxHp, 1.0);
                let healthScaling = 0.3 + healthPercent * 1.2;

                // Smoothly ramp bonus production from 90% to 100% HP (prevents visual jumps)
                const fullBonus = Math.max(0, Math.min(0.5, (healthPercent - 0.9) * 5));
                healthScaling += fullBonus;

                const nodeType = this.nodeData.getType(i);
                if (nodeType === _GameConfig_js__WEBPACK_IMPORTED_MODULE_2__.NODE_TYPES.LARGE) {
                    healthScaling += 0.5;
                }

                const spawnInterval = this.nodeData.getSpawnInterval(i);
                const spawnThreshold = spawnInterval / healthScaling;

                const currentCount = playerUnitCounts[owner] || 0;
                const hitGlobalCap = currentCount >= _GameConfig_js__WEBPACK_IMPORTED_MODULE_2__.GAME_SETTINGS.MAX_UNITS_PER_PLAYER;
                const canSpawn = totalAlive < _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__.MEMORY_LAYOUT.MAX_ENTITIES && !hitGlobalCap;

                if (canSpawn && spawnTimer >= spawnThreshold && baseHp > maxHp * 0.1) {
                    spawnTimer = 0;
                    this.nodeData.setManualSpawnReady(i, false);

                    const angle = Math.random() * Math.PI * 2;
                    const influenceRadius = this.nodeData.getInfluenceRadius(i);
                    const spawnDist = influenceRadius * 0.6;
                    const ex = this.nodeData.getX(i) + Math.cos(angle) * spawnDist;
                    const ey = this.nodeData.getY(i) + Math.sin(angle) * spawnDist;

                    const targetX = this.nodeData.getRallyX(i);
                    const targetY = this.nodeData.getRallyY(i);
                    const targetNodeId = this.nodeData.getRallyTargetNodeId(i);

                    this.sharedMemory.addSpawnEvent(ex, ey, owner, targetX, targetY, targetNodeId);

                    this.nodeData.setSpawnEffect(i, 0.4);
                }

                this.nodeData.setSpawnTimer(i, spawnTimer);
                this.nodeData.setSpawnProgress(i, spawnTimer / spawnThreshold);
            }

            let hitFlash = this.nodeData.getHitFlash(i);
            if (hitFlash > 0) {
                hitFlash -= dt;
                this.nodeData.setHitFlash(i, hitFlash);
            }

            let spawnEffect = this.nodeData.getSpawnEffect(i);
            if (spawnEffect > 0) {
                spawnEffect -= dt;
                this.nodeData.setSpawnEffect(i, spawnEffect);
            }
        }
    }

}


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
        this.spatialGrid = new _SpatialGrid_js__WEBPACK_IMPORTED_MODULE_2__.SpatialGrid(this.worldWidth, this.worldHeight, 160); // 160px cells for units
        this.spatialGridNodes = new _SpatialGrid_js__WEBPACK_IMPORTED_MODULE_2__.SpatialGrid(this.worldWidth, this.worldHeight, 400); // 400px cells for nodes (larger radius)
        this.maxEntitiesPerPlayer = _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.MAX_UNITS_PER_PLAYER; // Global unit cap per player
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
            productionHistory: [], // { time, playerId, rate, total }
            events: [] // { time, type, playerId, data }
        };

        this.deathBuffer = []; // To detect "Big Battles"
    }

    recordDeath(playerId, x, y) {
        if (!this.stats.unitsLost[playerId]) this.stats.unitsLost[playerId] = 0;
        this.stats.unitsLost[playerId]++;

        const now = Date.now();
        this.deathBuffer.push({ time: now, x, y, owner: playerId });

        // Clean old deaths from buffer (last 3 seconds for better detection)
        this.deathBuffer = this.deathBuffer.filter(d => now - d.time < 3000);

        // Detect Big Battle: 40+ deaths in 3 seconds in a small area
        if (this.deathBuffer.length >= 40) {
            // Simple spatial check: average position
            let avgX = 0, avgY = 0;
            this.deathBuffer.forEach(d => { avgX += d.x; avgY += d.y; });
            avgX /= this.deathBuffer.length;
            avgY /= this.deathBuffer.length;

            // If majority are within 200px of center
            const closeOnes = this.deathBuffer.filter(d => {
                const dx = d.x - avgX;
                const dy = d.y - avgY;
                return dx * dx + dy * dy < 200 * 200;
            });

            if (closeOnes.length >= 30 && now - (this.lastBigBattle || 0) > 8000) {
                this.lastBigBattle = now;
                // Count deaths per player in this battle
                const participants = {};
                closeOnes.forEach(d => participants[d.owner] = (participants[d.owner] || 0) + 1);

                this.recordEvent('big_battle', playerId, {
                    x: avgX, y: avgY,
                    count: closeOnes.length,
                    participants
                });
            }
        }
    }

    recordEvent(type, playerId, data = {}) {
        this.stats.events.push({
            time: (Date.now() - this.stats.startTime) / 1000, // seconds
            type,
            playerId,
            data
        });
    }

    update(dt, gameInstance) {
        this.elapsedTime += dt;
        this.globalSpawnTimer.update(dt);

        // Apply time-based escalation to spawn intervals
        const timeBonus = Math.min(this.elapsedTime / 120, 1.0); // Max bonus at 2 minutes

        // CLIENT EXTRAPOLATION: If we are a client in multiplayer, we don't run the backend simulation.
        // We just extrapolate positions for smooth 60fps rendering between server syncs.
        if (this.isClient) {
            this.nodes.forEach(node => {
                if (node.hitFlash > 0) node.hitFlash -= dt;
                if (node.spawnEffect > 0) node.spawnEffect -= dt;
            });

            this.entities.forEach(ent => {
                if (ent.dead) return;

                if (ent.dying) {
                    ent.deathTime += dt;
                    if (ent.deathTime > 0.4) ent.dead = true;
                    return;
                }

                // Visual extrapolation purely based on velocity
                ent.x += ent.vx * dt;
                ent.y += ent.vy * dt;
            });

            // Clean up dead entities
            this.entities = this.entities.filter(ent => !ent.dead);

            return; // Skip full simulation logic
        }

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
            if (!ent.dead && !ent.dying) {
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
            productionHistory: this.stats.productionHistory,
            events: this.stats.events || []
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
/* harmony import */ var _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./GameConfig.js */ "./src/shared/GameConfig.js");



const MAP_TYPES = [
    'GALAXY_SPIRAL', 'CONSTELLATION_WEB', 'SOLAR_SYSTEMS',
    'RING_OF_FIRE', 'VOID_ISLANDS'
];

class MapGenerator {
    static getRadiusForType(type) {
        return (_GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_CONFIG[type] && _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_CONFIG[type].radius) || 40;
    }

    static generate(playerCount, worldWidth, worldHeight, fixedNodes = null) {
        let finalNodes = [];

        if (fixedNodes && fixedNodes.length > 0) {
            // Bypass random generation and use fixed layout
            console.log(`Loading fixed map layout with ${fixedNodes.length} nodes.`);
            fixedNodes.forEach((n, index) => {
                const node = new _Node_js__WEBPACK_IMPORTED_MODULE_0__.Node(index, n.x, n.y, n.owner, n.type, !!n.productionDisabled);
                if (n.baseHp !== undefined) node.baseHp = n.baseHp;
                if (n.maxHp !== undefined) node.maxHp = n.maxHp;
                if (n.radius !== undefined) node.radius = n.radius;
                finalNodes.push(node);
            });
            return finalNodes;
        }

        const minNodes = Math.max(8, playerCount * 4);
        const maxNodes = playerCount * 15;
        let attempts = 0;

        while (attempts < 50) {
            attempts++;
            finalNodes = this._doGenerate(playerCount, worldWidth, worldHeight, maxNodes);

            if (finalNodes && finalNodes.length >= minNodes && finalNodes.length <= maxNodes) {
                // Ensure all players have at least one node
                const uniqueOwners = new Set(finalNodes.filter(n => n.owner !== -1).map(n => n.owner));
                if (uniqueOwners.size === playerCount) {
                    break;
                }
            }
            finalNodes = [];
        }

        if (finalNodes.length === 0) {
            console.error("Failed to generate a valid map after 50 attempts. Forcing fallback.");
            // Last resort: just try one more time without owner check if it's really stuck
            finalNodes = this._doGenerate(playerCount, worldWidth, worldHeight, maxNodes) || [];
        }

        console.log(`Generated robust map for ${playerCount} players: ${finalNodes.length} nodes after ${attempts} attempts.`);
        return finalNodes;
    }

    static _doGenerate(playerCount, worldWidth, worldHeight, maxAllowed) {
        const nodes = [];
        let idCounter = 0;

        const cx = worldWidth / 2;
        const cy = worldHeight / 2;
        const mapRadius = Math.min(worldWidth, worldHeight) * 0.46;

        const baseAngleOffset = Math.random() * Math.PI * 2;
        const mapType = MAP_TYPES[Math.floor(Math.random() * MAP_TYPES.length)];

        // Helper to check collision for a single position against existing nodes
        const isValidPos = (x, y, r, extraMargin = 120) => {
            const margin = 100;
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) return false;

            for (let n of nodes) {
                const dist = Math.hypot(x - n.x, y - n.y);
                const combinedR = r + this.getRadiusForType(n.type);

                const baseExclusion = Math.max(180, 250 - playerCount * 10); // More reasonable spacing
                const limit = (n.owner !== -1) ? baseExclusion : extraMargin;

                // Push Omega even further
                const finalLimit = (n.type === _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.OMEGA) ? limit + 100 : limit;

                if (dist < combinedR + finalLimit) return false;
            }
            return true;
        };

        // Attempts to add a node and all its rotationally symmetric clones.
        // If ANY clone collides, the WHOLE group is rejected to guarantee 100% fairness.
        const tryAddSymmetricGroup = (r, theta, type, ownerBaseIndex = -1) => {
            if (nodes.length >= maxAllowed) return false;

            const nodeRadius = this.getRadiusForType(type);
            const positions = [];
            const angleStep = (Math.PI * 2) / playerCount;

            // Center node special case
            if (r < 10) {
                if (isValidPos(cx, cy, nodeRadius, 100)) {
                    nodes.push(new _Node_js__WEBPACK_IMPORTED_MODULE_0__.Node(idCounter++, cx, cy, -1, type));
                    return true;
                }
                return false;
            }

            // Calculate all symmetric positions
            for (let i = 0; i < playerCount; i++) {
                const angle = theta + (i * angleStep);
                const px = cx + r * Math.cos(angle);
                const py = cy + r * Math.sin(angle);
                const owner = (ownerBaseIndex === -1 ? -1 : (ownerBaseIndex + i) % playerCount);
                positions.push({ x: px, y: py, owner, angle });
            }

            // Verify ALL positions before adding ANY
            for (let i = 0; i < positions.length; i++) {
                const p = positions[i];
                if (!isValidPos(p.x, p.y, nodeRadius, 90)) return false;

                // Self-collision within the group: ensure nodes in the group don't overlap with each other
                for (let j = i + 1; j < positions.length; j++) {
                    const p2 = positions[j];
                    if (Math.hypot(p.x - p2.x, p.y - p2.y) < (nodeRadius * 2) + 120) return false;
                }
            }

            // All valid, apply!
            for (let p of positions) {
                nodes.push(new _Node_js__WEBPACK_IMPORTED_MODULE_0__.Node(idCounter++, p.x, p.y, p.owner, type));
            }
            return true;
        };

        // --- MAP GENERATION PIPELINE ---

        // 1. PLACE OMEGA (Center) / DUAL CORE
        if (mapType === 'RING_OF_FIRE' || (playerCount === 2 && Math.random() > 0.5)) {
            // No center node. If not Ring of Fire, place Dual Cores.
            if (mapType !== 'RING_OF_FIRE') {
                tryAddSymmetricGroup(mapRadius * 0.2, baseAngleOffset + Math.PI / 2, _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.OMEGA);
            }
        } else {
            // Standard center OMEGA
            nodes.push(new _Node_js__WEBPACK_IMPORTED_MODULE_0__.Node(idCounter++, cx, cy, -1, _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.OMEGA));
        }

        // 2. PLACE PLAYER BASES
        const baseDist = mapRadius * 0.85;
        if (!tryAddSymmetricGroup(baseDist, baseAngleOffset, _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.LARGE, 0)) {
            return null; // Fatal failure, retry
        }

        // 3. SECURE FIRST EXPANSION (Close to bases)
        // A medium node slightly inwards and to the side
        tryAddSymmetricGroup(baseDist * 0.75, baseAngleOffset + 0.3, _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.MEDIUM);

        // 4. THEMATIC FILL
        const fillTheme = (theme) => {
            // Reduced total thematic nodes for less clutter, better spacing
            const steps = 10;
            for (let i = 0; i < steps; i++) {
                if (nodes.length >= maxAllowed) break;

                let r, theta;
                let type;

                // Shifted node distribution to favor LARGE and MEGA, entirely cutting SMALL
                // 30% MEGA, 55% LARGE, 15% MEDIUM, 0% SMALL
                const randType = Math.random();
                if (randType > 0.70) type = _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.MEGA;
                else if (randType > 0.15) type = _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.LARGE;
                else type = _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.MEDIUM;

                if (theme === 'GALAXY_SPIRAL') {
                    const t = i / steps;
                    r = baseDist * (1 - t * 0.8);
                    theta = baseAngleOffset + t * Math.PI;
                }
                else if (theme === 'SOLAR_SYSTEMS') {
                    const a = Math.random() * Math.PI * 2;
                    const d = 150 + Math.random() * 200;
                    const bx = cx + baseDist * Math.cos(baseAngleOffset);
                    const by = cy + baseDist * Math.sin(baseAngleOffset);
                    const px = bx + d * Math.cos(a);
                    const py = by + d * Math.sin(a);
                    r = Math.hypot(px - cx, py - cy);
                    theta = Math.atan2(py - cy, px - cx);
                    type = Math.random() > 0.7 ? _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.LARGE : _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.MEDIUM;
                }
                else if (theme === 'CONSTELLATION_WEB') {
                    r = Math.random() * mapRadius * 0.9;
                    theta = Math.random() * Math.PI * 2;
                }
                else if (theme === 'RING_OF_FIRE') {
                    r = mapRadius * (0.6 + Math.random() * 0.3);
                    theta = Math.random() * Math.PI * 2;
                    type = Math.random() > 0.6 ? _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.MEGA : _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.LARGE;
                }
                else if (theme === 'VOID_ISLANDS') {
                    if (Math.random() > 0.5) continue;
                    r = Math.random() * mapRadius * 0.8;
                    theta = Math.random() * Math.PI * 2;
                    type = Math.random() > 0.5 ? _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.MEGA : _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.ULTRA;
                }

                tryAddSymmetricGroup(r, theta, type);
            }

            // Post-theme random scatter for connections
            // Reduced to 10 scattered structures
            for (let i = 0; i < 10; i++) {
                if (nodes.length >= maxAllowed) break;
                const r = Math.random() * mapRadius * 0.9;
                const theta = Math.random() * Math.PI * 2;

                // Keep the proportion balanced instead of defaulting entirely to SMALL/MEDIUM
                // 80% LARGE, 20% MEDIUM
                const rand = Math.random();
                let type;
                if (rand > 0.20) type = _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.LARGE;
                else type = _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_TYPES.MEDIUM;

                tryAddSymmetricGroup(r, theta, type);
            }
        };

        fillTheme(mapType);

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
    constructor(id, x, y, ownerId, type = _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.NODE_TYPES.MEDIUM, productionDisabled = false) {
        this.id = id; this.x = x; this.y = y; this.owner = ownerId; this.type = type;
        this.productionDisabled = productionDisabled;

        const config = _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.NODE_CONFIG[type] || _GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.NODE_CONFIG[_GameConfig_js__WEBPACK_IMPORTED_MODULE_0__.NODE_TYPES.MEDIUM];

        // Add a small bit of random variation to radius for natural feel
        const variation = (Math.random() - 0.5) * (config.radius * 0.15);
        this.radius = config.radius + variation;
        this.influenceRadius = config.influenceRadius;
        this.maxHp = config.maxHp;
        this.spawnInterval = config.spawnInterval;

        // Neutral nodes start at 10% health (same)
        // Owned nodes (starter) start at 25% health (Was 50%) -> More balanced start
        this.baseHp = (this.owner === -1) ? (this.maxHp * 0.1) : (this.maxHp * 0.25);
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

        // Sincronizar con el worker si tenemos el índice y el worker está activo
        if (this.nodeIndex !== undefined && this.sharedNodeData) {
            this.sharedNodeData.setRallyX(this.nodeIndex, x);
            this.sharedNodeData.setRallyY(this.nodeIndex, y);
            this.sharedNodeData.setRallyTargetNodeId(this.nodeIndex, targetNode ? targetNode.id : -1);
        }
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

            if (game && game.state && game.state.recordEvent) {
                game.state.recordEvent('capture', attackerId, { nodeId: this.id, x: this.x, y: this.y });
            }

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

        if (this.owner !== -1 && !this.productionDisabled) {
            // Heal node slowly if not at max
            const healRate = 0.5;
            if (this.baseHp < this.maxHp) {
                this.baseHp += healRate * dt;
            }

            // Check if node is full (100%+ health = bonus production)
            const isFull = this.baseHp >= this.maxHp;

            this.spawnTimer += dt;
            const healthPercent = Math.min(this.baseHp / this.maxHp, 1.0);

            // Base generation: 0.2 at 0% HP (Was 0.3), up to 1.4 at 100% HP
            // This slows down early game production significantly
            let healthScaling = 0.2 + healthPercent * 1.2;

            // Smoothly ramp bonus production from 90% to 100% HP (prevents visual jumps)
            const fullBonus = Math.max(0, Math.min(0.5, (healthPercent - 0.9) * 5));
            healthScaling += fullBonus;

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
                const entity = new _Entity_js__WEBPACK_IMPORTED_MODULE_1__.Entity(ex, ey, this.owner);

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

/***/ "./src/shared/NodeData.js"
/*!********************************!*\
  !*** ./src/shared/NodeData.js ***!
  \********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NodeData: () => (/* binding */ NodeData)
/* harmony export */ });
/* harmony import */ var _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SharedMemory.js */ "./src/shared/SharedMemory.js");
/* harmony import */ var _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./GameConfig.js */ "./src/shared/GameConfig.js");



class NodeData {
    constructor(sharedMemory) {
        this.memory = sharedMemory;
        this.nodes = sharedMemory.nodes;
        // Initialize count from the shared header so we can reconstruct NodeData
        // after the memory is written externally (e.g. server sending to client)
        this.count = sharedMemory.getNodeCount();

        this.typeConfig = _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_CONFIG;
    }

    allocate(x, y, owner, type, id) {
        const idx = this.count;
        if (idx >= _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__.MEMORY_LAYOUT.MAX_NODES) {
            console.warn('Max nodes reached');
            return -1;
        }

        const config = this.typeConfig[type];

        this.nodes.x[idx] = x;
        this.nodes.y[idx] = y;
        this.nodes.owner[idx] = owner;
        this.nodes.baseHp[idx] = owner === -1 ? config.maxHp * 0.1 : config.maxHp * 0.25;
        this.nodes.maxHp[idx] = config.maxHp;
        this.nodes.radius[idx] = config.radius;
        this.nodes.influenceRadius[idx] = config.influenceRadius;
        this.nodes.spawnTimer[idx] = 0;
        this.nodes.spawnProgress[idx] = 0;
        this.nodes.hitFlash[idx] = 0;
        this.nodes.stock[idx] = 0;
        this.nodes.nodeFlags[idx] = 0;
        this.nodes.type[idx] = type;
        this.nodes.spawnEffect[idx] = 0;
        this.nodes.manualSpawnReady[idx] = 0;
        this.nodes.id[idx] = id || idx;
        this.nodes.rallyX[idx] = 0;
        this.nodes.rallyY[idx] = 0;
        this.nodes.rallyTargetNodeId[idx] = -1;

        this.count++;
        this.memory.setNodeCount(this.count);

        return idx;
    }

    getCount() {
        return this.count;
    }

    getX(index) {
        return this.nodes.x[index];
    }

    setX(index, value) {
        this.nodes.x[index] = value;
    }

    getY(index) {
        return this.nodes.y[index];
    }

    setY(index, value) {
        this.nodes.y[index] = value;
    }

    getOwner(index) {
        return this.nodes.owner[index];
    }

    setOwner(index, value) {
        this.nodes.owner[index] = value;
    }

    getBaseHp(index) {
        return this.nodes.baseHp[index];
    }

    setBaseHp(index, value) {
        this.nodes.baseHp[index] = value;
    }

    getMaxHp(index) {
        return this.nodes.maxHp[index];
    }

    setMaxHp(index, value) {
        this.nodes.maxHp[index] = value;
    }

    getRadius(index) {
        return this.nodes.radius[index];
    }

    setRadius(index, value) {
        this.nodes.radius[index] = value;
    }

    getInfluenceRadius(index) {
        return this.nodes.influenceRadius[index];
    }

    setInfluenceRadius(index, value) {
        this.nodes.influenceRadius[index] = value;
    }

    getSpawnTimer(index) {
        return this.nodes.spawnTimer[index];
    }

    setSpawnTimer(index, value) {
        this.nodes.spawnTimer[index] = value;
    }

    getSpawnProgress(index) {
        return this.nodes.spawnProgress[index];
    }

    setSpawnProgress(index, value) {
        this.nodes.spawnProgress[index] = value;
    }

    getRallyX(index) {
        return this.nodes.rallyX[index];
    }

    setRallyX(index, value) {
        this.nodes.rallyX[index] = value;
    }

    getRallyY(index) {
        return this.nodes.rallyY[index];
    }

    setRallyY(index, value) {
        this.nodes.rallyY[index] = value;
    }

    getRallyTargetNodeId(index) {
        return this.nodes.rallyTargetNodeId[index];
    }

    setRallyTargetNodeId(index, value) {
        this.nodes.rallyTargetNodeId[index] = value;
    }

    getHitFlash(index) {
        return this.nodes.hitFlash[index];
    }

    setHitFlash(index, value) {
        this.nodes.hitFlash[index] = value;
    }

    getStock(index) {
        return this.nodes.stock[index];
    }

    setStock(index, value) {
        this.nodes.stock[index] = value;
    }

    getType(index) {
        return this.nodes.type[index];
    }

    setType(index, value) {
        this.nodes.type[index] = value;
    }

    setSpawnInterval(index, value) {
        // spawnInterval is stored in the SharedMemory spawnTimer field (no dedicated field).
        // We store it separately using a per-node override encoded in a spare field.
        // Actually spawnTimer stores the current timer, so we need another approach:
        // NodeData.getSpawnInterval reads from typeConfig; to override per-node, store in stock temporarily.
        // Better: use a dedicated backing array.
        if (!this._spawnIntervalOverride) this._spawnIntervalOverride = new Float32Array(_SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__.MEMORY_LAYOUT.MAX_NODES);
        this._spawnIntervalOverride[index] = value;
    }

    getSpawnEffect(index) {
        return this.nodes.spawnEffect[index];
    }

    setSpawnEffect(index, value) {
        this.nodes.spawnEffect[index] = value;
    }

    isManualSpawnReady(index) {
        return this.memory.isNodeManualSpawnReady(index);
    }

    setManualSpawnReady(index, value) {
        this.memory.setNodeManualSpawnReady(index, value);
    }

    isValidIndex(index) {
        return index >= 0 && index < this.count;
    }

    getSpawnInterval(index) {
        if (this._spawnIntervalOverride && this._spawnIntervalOverride[index] > 0) {
            return this._spawnIntervalOverride[index];
        }
        const type = this.nodes.type[index];
        return this.typeConfig[type]?.spawnInterval || 3.5;
    }

    getTotalHp(index) {
        return Math.min(this.nodes.maxHp[index], this.nodes.baseHp[index]);
    }

    getId(index) {
        return this.nodes.id[index];
    }

    setId(index, value) {
        this.nodes.id[index] = value;
    }
}


/***/ },

/***/ "./src/shared/SharedMemory.js"
/*!************************************!*\
  !*** ./src/shared/SharedMemory.js ***!
  \************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MEMORY_LAYOUT: () => (/* binding */ MEMORY_LAYOUT),
/* harmony export */   SharedMemory: () => (/* binding */ SharedMemory),
/* harmony export */   calculateBufferSize: () => (/* binding */ calculateBufferSize)
/* harmony export */ });
// These are filled in after the offset calculations below
const MEMORY_LAYOUT = {
    MAX_ENTITIES: 15000,
    MAX_NODES: 128,
    MAX_DEATH_EVENTS: 256,
    MAX_SPAWN_EVENTS: 64,
    // Filled in at bottom of this file after layout is computed:
    TOTAL_SIZE: 0,
    ENTITY_DATA_START: 0,
    NODE_DATA_START: 0,
    ENTITY_STRIDE: 0,
    NODE_STRIDE: 0,
};

const HEADER_SIZE = 256;

const ENTITY_FIELD_SIZES = {
    x: 4, y: 4, vx: 4, vy: 4,
    owner: 4, radius: 4, maxSpeed: 4, friction: 4,
    hp: 4, speedBoost: 4,
    flags: 4, deathTime: 4, deathType: 4,
    targetX: 4, targetY: 4, targetNodeId: 4,
    flockId: 4, outsideTime: 4,
    id: 8,
};

let entityOffset = 0;
const ENTITY_OFFSET_X = entityOffset; entityOffset += ENTITY_FIELD_SIZES.x * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_Y = entityOffset; entityOffset += ENTITY_FIELD_SIZES.y * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_VX = entityOffset; entityOffset += ENTITY_FIELD_SIZES.vx * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_VY = entityOffset; entityOffset += ENTITY_FIELD_SIZES.vy * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_OWNER = entityOffset; entityOffset += ENTITY_FIELD_SIZES.owner * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_RADIUS = entityOffset; entityOffset += ENTITY_FIELD_SIZES.radius * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_MAXSPEED = entityOffset; entityOffset += ENTITY_FIELD_SIZES.maxSpeed * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_FRICTION = entityOffset; entityOffset += ENTITY_FIELD_SIZES.friction * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_HP = entityOffset; entityOffset += ENTITY_FIELD_SIZES.hp * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_SPEEDBOOST = entityOffset; entityOffset += ENTITY_FIELD_SIZES.speedBoost * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_FLAGS = entityOffset; entityOffset += ENTITY_FIELD_SIZES.flags * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_DEATHTIME = entityOffset; entityOffset += ENTITY_FIELD_SIZES.deathTime * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_DEATHTYPE = entityOffset; entityOffset += ENTITY_FIELD_SIZES.deathType * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_TARGETX = entityOffset; entityOffset += ENTITY_FIELD_SIZES.targetX * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_TARGETY = entityOffset; entityOffset += ENTITY_FIELD_SIZES.targetY * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_TARGETNODEID = entityOffset; entityOffset += ENTITY_FIELD_SIZES.targetNodeId * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_FLOCKID = entityOffset; entityOffset += ENTITY_FIELD_SIZES.flockId * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_OUTSIDETIME = entityOffset; entityOffset += ENTITY_FIELD_SIZES.outsideTime * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_ID = entityOffset; entityOffset += ENTITY_FIELD_SIZES.id * MEMORY_LAYOUT.MAX_ENTITIES;

const TOTAL_ENTITY_BYTES = entityOffset;

const NODE_FIELD_SIZES = {
    x: 4, y: 4, owner: 4, baseHp: 4, maxHp: 4,
    radius: 4, influenceRadius: 4, spawnTimer: 4, spawnProgress: 4,
    hitFlash: 4, stock: 4, nodeFlags: 4, type: 4, spawnEffect: 4, manualSpawnReady: 4,
    id: 4,
    rallyX: 4, rallyY: 4, rallyTargetNodeId: 4,
};

let nodeOffset = 0;
const NODE_OFFSET_X = nodeOffset; nodeOffset += NODE_FIELD_SIZES.x * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_Y = nodeOffset; nodeOffset += NODE_FIELD_SIZES.y * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_OWNER = nodeOffset; nodeOffset += NODE_FIELD_SIZES.owner * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_BASEHP = nodeOffset; nodeOffset += NODE_FIELD_SIZES.baseHp * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_MAXHP = nodeOffset; nodeOffset += NODE_FIELD_SIZES.maxHp * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_RADIUS = nodeOffset; nodeOffset += NODE_FIELD_SIZES.radius * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_INFLUENCERADIUS = nodeOffset; nodeOffset += NODE_FIELD_SIZES.influenceRadius * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_SPAWNTIMER = nodeOffset; nodeOffset += NODE_FIELD_SIZES.spawnTimer * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_SPAWNPROGRESS = nodeOffset; nodeOffset += NODE_FIELD_SIZES.spawnProgress * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_HITFLASH = nodeOffset; nodeOffset += NODE_FIELD_SIZES.hitFlash * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_STOCK = nodeOffset; nodeOffset += NODE_FIELD_SIZES.stock * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_NODEFLAGS = nodeOffset; nodeOffset += NODE_FIELD_SIZES.nodeFlags * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_TYPE = nodeOffset; nodeOffset += NODE_FIELD_SIZES.type * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_SPAWNEFFECT = nodeOffset; nodeOffset += NODE_FIELD_SIZES.spawnEffect * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_MANUALSPAWNREADY = nodeOffset; nodeOffset += NODE_FIELD_SIZES.manualSpawnReady * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_ID = nodeOffset; nodeOffset += NODE_FIELD_SIZES.id * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_RALLYX = nodeOffset; nodeOffset += NODE_FIELD_SIZES.rallyX * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_RALLYY = nodeOffset; nodeOffset += NODE_FIELD_SIZES.rallyY * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_RALLYTARGETNODEID = nodeOffset; nodeOffset += NODE_FIELD_SIZES.rallyTargetNodeId * MEMORY_LAYOUT.MAX_NODES;

const TOTAL_NODE_BYTES = nodeOffset;

const DEATH_EVENT_FIELD_SIZES = { x: 4, y: 4, owner: 4, type: 4, entityIndex: 4, targetX: 4, targetY: 4 };
let deathOffset = 0;
const DEATH_OFFSET_X = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.x * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_Y = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.y * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_OWNER = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.owner * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_TYPE = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.type * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_ENTITYINDEX = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.entityIndex * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_TARGETX = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.targetX * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_TARGETY = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.targetY * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const TOTAL_DEATH_EVENT_BYTES = deathOffset;

const SPAWN_EVENT_FIELD_SIZES = { x: 4, y: 4, owner: 4, targetX: 4, targetY: 4, targetNodeId: 4, id: 8 };
let spawnOffset = 0;
const SPAWN_OFFSET_X = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.x * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_Y = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.y * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_OWNER = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.owner * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_TARGETX = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.targetX * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_TARGETY = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.targetY * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_TARGETNODEID = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.targetNodeId * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_ID = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.id * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const TOTAL_SPAWN_EVENT_BYTES = spawnOffset;

const NODES_OFFSET = HEADER_SIZE + TOTAL_ENTITY_BYTES;
const DEATH_EVENTS_OFFSET = NODES_OFFSET + TOTAL_NODE_BYTES;
const SPAWN_EVENTS_OFFSET = DEATH_EVENTS_OFFSET + TOTAL_DEATH_EVENT_BYTES;

// Fill in derived layout constants now that offsets are known
MEMORY_LAYOUT.ENTITY_DATA_START = HEADER_SIZE;
MEMORY_LAYOUT.NODE_DATA_START = NODES_OFFSET;
MEMORY_LAYOUT.ENTITY_STRIDE = Object.values(ENTITY_FIELD_SIZES).reduce((a, b) => a + b, 0) / 4; // in float32 words
MEMORY_LAYOUT.NODE_STRIDE = Object.values(NODE_FIELD_SIZES).reduce((a, b) => a + b, 0) / 4;

function calculateBufferSize() {
    return SPAWN_EVENTS_OFFSET + TOTAL_SPAWN_EVENT_BYTES;
}
// Also store total size on MEMORY_LAYOUT for external use
MEMORY_LAYOUT.TOTAL_SIZE = calculateBufferSize();

class SharedMemory {
    constructor(buffer) {
        this.buffer = buffer;

        this.header = {
            entityCount: new Uint32Array(buffer, 0, 1),
            nodeCount: new Uint32Array(buffer, 4, 1),
            maxEntities: new Uint32Array(buffer, 8, 1),
            maxNodes: new Uint32Array(buffer, 12, 1),
            flags: new Uint8Array(buffer, 16, 1),
            deathEventsCount: new Uint32Array(buffer, 20, 1),
            spawnEventsCount: new Uint32Array(buffer, 24, 1),
            frameCounter: new Uint32Array(buffer, 28, 1),
        };

        this.header.maxEntities[0] = MEMORY_LAYOUT.MAX_ENTITIES;
        this.header.maxNodes[0] = MEMORY_LAYOUT.MAX_NODES;

        this.entities = {
            x: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_X, MEMORY_LAYOUT.MAX_ENTITIES),
            y: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_Y, MEMORY_LAYOUT.MAX_ENTITIES),
            vx: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_VX, MEMORY_LAYOUT.MAX_ENTITIES),
            vy: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_VY, MEMORY_LAYOUT.MAX_ENTITIES),
            owner: new Int32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_OWNER, MEMORY_LAYOUT.MAX_ENTITIES),
            radius: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_RADIUS, MEMORY_LAYOUT.MAX_ENTITIES),
            maxSpeed: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_MAXSPEED, MEMORY_LAYOUT.MAX_ENTITIES),
            friction: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_FRICTION, MEMORY_LAYOUT.MAX_ENTITIES),
            hp: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_HP, MEMORY_LAYOUT.MAX_ENTITIES),
            speedBoost: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_SPEEDBOOST, MEMORY_LAYOUT.MAX_ENTITIES),
            flags: new Uint32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_FLAGS, MEMORY_LAYOUT.MAX_ENTITIES),
            deathTime: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_DEATHTIME, MEMORY_LAYOUT.MAX_ENTITIES),
            deathType: new Uint32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_DEATHTYPE, MEMORY_LAYOUT.MAX_ENTITIES),
            targetX: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_TARGETX, MEMORY_LAYOUT.MAX_ENTITIES),
            targetY: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_TARGETY, MEMORY_LAYOUT.MAX_ENTITIES),
            targetNodeId: new Int32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_TARGETNODEID, MEMORY_LAYOUT.MAX_ENTITIES),
            flockId: new Int32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_FLOCKID, MEMORY_LAYOUT.MAX_ENTITIES),
            outsideTime: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_OUTSIDETIME, MEMORY_LAYOUT.MAX_ENTITIES),
            id: new Float64Array(buffer, HEADER_SIZE + ENTITY_OFFSET_ID, MEMORY_LAYOUT.MAX_ENTITIES),
        };

        this.nodes = {
            x: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_X, MEMORY_LAYOUT.MAX_NODES),
            y: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_Y, MEMORY_LAYOUT.MAX_NODES),
            owner: new Int32Array(buffer, NODES_OFFSET + NODE_OFFSET_OWNER, MEMORY_LAYOUT.MAX_NODES),
            baseHp: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_BASEHP, MEMORY_LAYOUT.MAX_NODES),
            maxHp: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_MAXHP, MEMORY_LAYOUT.MAX_NODES),
            radius: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_RADIUS, MEMORY_LAYOUT.MAX_NODES),
            influenceRadius: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_INFLUENCERADIUS, MEMORY_LAYOUT.MAX_NODES),
            spawnTimer: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_SPAWNTIMER, MEMORY_LAYOUT.MAX_NODES),
            spawnProgress: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_SPAWNPROGRESS, MEMORY_LAYOUT.MAX_NODES),
            hitFlash: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_HITFLASH, MEMORY_LAYOUT.MAX_NODES),
            stock: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_STOCK, MEMORY_LAYOUT.MAX_NODES),
            nodeFlags: new Uint32Array(buffer, NODES_OFFSET + NODE_OFFSET_NODEFLAGS, MEMORY_LAYOUT.MAX_NODES),
            type: new Uint32Array(buffer, NODES_OFFSET + NODE_OFFSET_TYPE, MEMORY_LAYOUT.MAX_NODES),
            spawnEffect: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_SPAWNEFFECT, MEMORY_LAYOUT.MAX_NODES),
            manualSpawnReady: new Uint32Array(buffer, NODES_OFFSET + NODE_OFFSET_MANUALSPAWNREADY, MEMORY_LAYOUT.MAX_NODES),
            id: new Int32Array(buffer, NODES_OFFSET + NODE_OFFSET_ID, MEMORY_LAYOUT.MAX_NODES),
            rallyX: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_RALLYX, MEMORY_LAYOUT.MAX_NODES),
            rallyY: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_RALLYY, MEMORY_LAYOUT.MAX_NODES),
            rallyTargetNodeId: new Int32Array(buffer, NODES_OFFSET + NODE_OFFSET_RALLYTARGETNODEID, MEMORY_LAYOUT.MAX_NODES),
        };

        this.deathEvents = {
            x: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_X, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            y: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_Y, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            owner: new Int32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_OWNER, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            type: new Uint32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_TYPE, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            entityIndex: new Int32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_ENTITYINDEX, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            targetX: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_TARGETX, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            targetY: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_TARGETY, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
        };

        this.spawnEvents = {
            x: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_X, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            y: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_Y, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            owner: new Int32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_OWNER, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            targetX: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_TARGETX, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            targetY: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_TARGETY, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            targetNodeId: new Int32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_TARGETNODEID, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            id: new Float64Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_ID, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
        };
    }

    static create() {
        const size = calculateBufferSize();
        const buffer = new SharedArrayBuffer(size);
        return new SharedMemory(buffer);
    }

    // Convenience alias: clear both event queues
    clearEvents() {
        this.header.deathEventsCount[0] = 0;
        this.header.spawnEventsCount[0] = 0;
    }

    clearDeathEvents() {
        this.header.deathEventsCount[0] = 0;
    }

    addDeathEvent(x, y, owner, type, entityIndex, targetX = 0, targetY = 0) {
        const idx = this.header.deathEventsCount[0];
        if (idx >= MEMORY_LAYOUT.MAX_DEATH_EVENTS) return;

        this.deathEvents.x[idx] = x;
        this.deathEvents.y[idx] = y;
        this.deathEvents.owner[idx] = owner;
        this.deathEvents.type[idx] = type;
        this.deathEvents.entityIndex[idx] = entityIndex;
        this.deathEvents.targetX[idx] = targetX;
        this.deathEvents.targetY[idx] = targetY;

        this.header.deathEventsCount[0] = idx + 1;
    }

    clearSpawnEvents() {
        this.header.spawnEventsCount[0] = 0;
    }

    // Allocate entity: returns index or -1
    allocateEntity() {
        const idx = this.header.entityCount[0];
        if (idx >= MEMORY_LAYOUT.MAX_ENTITIES) return -1;
        this.header.entityCount[0] = idx + 1;
        // Zero the flags for this slot
        this.entities.flags[idx] = 0;
        this.entities.deathTime[idx] = 0;
        this.entities.deathType[idx] = 0;
        return idx;
    }

    // Read back all death events as array of objects
    getDeathEvents() {
        const count = this.header.deathEventsCount[0];
        const events = [];
        for (let i = 0; i < count; i++) {
            events.push({
                x: this.deathEvents.x[i],
                y: this.deathEvents.y[i],
                owner: this.deathEvents.owner[i],
                type: this.deathEvents.type[i],
                entityIndex: this.deathEvents.entityIndex[i],
                targetX: this.deathEvents.targetX[i],
                targetY: this.deathEvents.targetY[i],
            });
        }
        return events;
    }

    // Read back all spawn events as array of objects
    getSpawnEvents() {
        const count = this.header.spawnEventsCount[0];
        const events = [];
        for (let i = 0; i < count; i++) {
            events.push({
                x: this.spawnEvents.x[i],
                y: this.spawnEvents.y[i],
                owner: this.spawnEvents.owner[i],
                targetX: this.spawnEvents.targetX[i],
                targetY: this.spawnEvents.targetY[i],
                targetNodeId: this.spawnEvents.targetNodeId[i],
                id: this.spawnEvents.id[i],
            });
        }
        return events;
    }

    addSpawnEvent(x, y, owner, targetX, targetY, targetNodeId, id) {
        const idx = this.header.spawnEventsCount[0];
        if (idx >= MEMORY_LAYOUT.MAX_SPAWN_EVENTS) return;

        this.spawnEvents.x[idx] = x;
        this.spawnEvents.y[idx] = y;
        this.spawnEvents.owner[idx] = owner;
        this.spawnEvents.targetX[idx] = targetX;
        this.spawnEvents.targetY[idx] = targetY;
        this.spawnEvents.targetNodeId[idx] = targetNodeId;
        this.spawnEvents.id[idx] = id;

        this.header.spawnEventsCount[0] = idx + 1;
    }

    setEntityCount(count) {
        this.header.entityCount[0] = count;
    }

    setNodeCount(count) {
        this.header.nodeCount[0] = count;
    }

    getEntityCount() {
        return this.header.entityCount[0];
    }

    getNodeCount() {
        return this.header.nodeCount[0];
    }

    incrementFrameCounter() {
        this.header.frameCounter[0]++;
    }

    getFrameCounter() {
        return this.header.frameCounter[0];
    }

    isDead(entityIndex) {
        return (this.entities.flags[entityIndex] & 1) !== 0;
    }

    setDead(entityIndex, dead) {
        if (dead) {
            this.entities.flags[entityIndex] |= 1;
        } else {
            this.entities.flags[entityIndex] &= 0xFFFFFFFE;
        }
    }

    isDying(entityIndex) {
        return (this.entities.flags[entityIndex] & 2) !== 0;
    }

    setDying(entityIndex, dying) {
        if (dying) {
            this.entities.flags[entityIndex] |= 2;
        } else {
            this.entities.flags[entityIndex] &= 0xFFFFFFFD;
        }
    }

    isSelected(entityIndex) {
        return (this.entities.flags[entityIndex] & 4) !== 0;
    }

    setSelected(entityIndex, selected) {
        if (selected) {
            this.entities.flags[entityIndex] |= 4;
        } else {
            this.entities.flags[entityIndex] &= 0xFFFFFFFB;
        }
    }

    hasOutsideWarning(entityIndex) {
        return (this.entities.flags[entityIndex] & 8) !== 0;
    }

    setOutsideWarning(entityIndex, warning) {
        if (warning) {
            this.entities.flags[entityIndex] |= 8;
        } else {
            this.entities.flags[entityIndex] &= 0xFFFFFFF7;
        }
    }

    isNodeManualSpawnReady(nodeIndex) {
        return (this.nodes.nodeFlags[nodeIndex] & 1) !== 0;
    }

    setNodeManualSpawnReady(nodeIndex, ready) {
        if (ready) {
            this.nodes.nodeFlags[nodeIndex] |= 1;
        } else {
            this.nodes.nodeFlags[nodeIndex] &= 0xFFFFFFFE;
        }
    }
}


/***/ },

/***/ "./src/shared/SharedView.js"
/*!**********************************!*\
  !*** ./src/shared/SharedView.js ***!
  \**********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SharedView: () => (/* binding */ SharedView)
/* harmony export */ });
/* harmony import */ var _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SharedMemory.js */ "./src/shared/SharedMemory.js");


class SharedView {
    constructor(buffer) {
        this.buffer = buffer;
        this.memory = new _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__.SharedMemory(buffer);
    }

    getEntityCount() {
        return this.memory.getEntityCount();
    }

    getNodeCount() {
        return this.memory.getNodeCount();
    }

    getEntityX(index) {
        return this.memory.entities.x[index];
    }

    getEntityY(index) {
        return this.memory.entities.y[index];
    }

    getEntityVx(index) {
        return this.memory.entities.vx[index];
    }

    getEntityVy(index) {
        return this.memory.entities.vy[index];
    }

    getEntityOwner(index) {
        return this.memory.entities.owner[index];
    }

    getEntityRadius(index) {
        return this.memory.entities.radius[index];
    }

    getEntityMaxSpeed(index) {
        return this.memory.entities.maxSpeed[index];
    }

    getEntityFriction(index) {
        return this.memory.entities.friction[index];
    }

    getEntityHp(index) {
        return this.memory.entities.hp[index];
    }

    getEntitySpeedBoost(index) {
        return this.memory.entities.speedBoost[index];
    }

    getEntityTargetX(index) {
        return this.memory.entities.targetX[index];
    }

    getEntityTargetY(index) {
        return this.memory.entities.targetY[index];
    }

    getEntityTargetNodeId(index) {
        return this.memory.entities.targetNodeId[index];
    }

    getEntityId(index) {
        return this.memory.entities.id[index];
    }

    isEntityDead(index) {
        return this.memory.isDead(index);
    }

    isEntityDying(index) {
        return this.memory.isDying(index);
    }

    isEntitySelected(index) {
        return this.memory.isSelected(index);
    }

    hasEntityOutsideWarning(index) {
        return this.memory.hasOutsideWarning(index);
    }

    getEntityDeathTime(index) {
        return this.memory.entities.deathTime[index];
    }

    getEntityDeathType(index) {
        return this.memory.entities.deathType[index];
    }

    getNodeX(index) {
        return this.memory.nodes.x[index];
    }

    getNodeY(index) {
        return this.memory.nodes.y[index];
    }

    getNodeOwner(index) {
        return this.memory.nodes.owner[index];
    }

    getNodeRadius(index) {
        return this.memory.nodes.radius[index];
    }

    getNodeInfluenceRadius(index) {
        return this.memory.nodes.influenceRadius[index];
    }

    getNodeBaseHp(index) {
        return this.memory.nodes.baseHp[index];
    }

    getNodeMaxHp(index) {
        return this.memory.nodes.maxHp[index];
    }

    getNodeSpawnProgress(index) {
        return this.memory.nodes.spawnProgress[index];
    }

    getNodeHitFlash(index) {
        return this.memory.nodes.hitFlash[index];
    }

    getNodeSpawnEffect(index) {
        return this.memory.nodes.spawnEffect[index];
    }

    getNodeId(index) {
        return this.memory.nodes.id[index];
    }

    getNodeRallyX(index) {
        return this.memory.nodes.rallyX[index];
    }

    getNodeRallyY(index) {
        return this.memory.nodes.rallyY[index];
    }

    getNodeRallyTargetNodeId(index) {
        return this.memory.nodes.rallyTargetNodeId[index];
    }

    getDeathEventsCount() {
        return this.memory.header.deathEventsCount[0];
    }

    getDeathEvent(index) {
        if (index >= this.getDeathEventsCount()) return null;
        return {
            x: this.memory.deathEvents.x[index],
            y: this.memory.deathEvents.y[index],
            owner: this.memory.deathEvents.owner[index],
            type: this.memory.deathEvents.type[index],
            targetX: this.memory.deathEvents.targetX[index],
            targetY: this.memory.deathEvents.targetY[index],
        };
    }

    getSpawnEventsCount() {
        return this.memory.header.spawnEventsCount[0];
    }

    getSpawnEvent(index) {
        if (index >= this.getSpawnEventsCount()) return null;
        return {
            x: this.memory.spawnEvents.x[index],
            y: this.memory.spawnEvents.y[index],
            owner: this.memory.spawnEvents.owner[index],
            targetX: this.memory.spawnEvents.targetX[index],
            targetY: this.memory.spawnEvents.targetY[index],
            targetNodeId: this.memory.spawnEvents.targetNodeId[index],
            id: this.memory.spawnEvents.id[index],
        };
    }

    getFrameCounter() {
        return this.memory.getFrameCounter();
    }

    iterateEntities(callback) {
        const count = this.getEntityCount();
        for (let i = 0; i < count; i++) {
            if (!this.isEntityDead(i)) {
                callback(i);
            }
        }
    }

    iterateNodes(callback) {
        const count = this.getNodeCount();
        for (let i = 0; i < count; i++) {
            callback(i);
        }
    }

    findNodeByPosition(x, y, radius) {
        const count = this.getNodeCount();
        for (let i = 0; i < count; i++) {
            const nx = this.getNodeX(i);
            const ny = this.getNodeY(i);
            const nr = this.getNodeRadius(i);
            const dx = x - nx;
            const dy = y - ny;
            if (dx * dx + dy * dy < (nr + radius) * (nr + radius)) {
                return i;
            }
        }
        return -1;
    }

    findNodeById(id) {
        const count = this.getNodeCount();
        for (let i = 0; i < count; i++) {
            if (this.getNodeId(i) === id) {
                return i;
            }
        }
        return -1;
    }

    findEntityById(id) {
        const count = this.getEntityCount();
        for (let i = 0; i < count; i++) {
            if (this.getEntityId(i) === id) {
                return i;
            }
        }
        return -1;
    }

    getEntitiesInRect(x1, y1, x2, y2, owner = -1) {
        const result = [];
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        const count = this.getEntityCount();

        for (let i = 0; i < count; i++) {
            if (this.isEntityDead(i) || this.isEntityDying(i)) continue;
            if (owner !== -1 && this.getEntityOwner(i) !== owner) continue;

            const ex = this.getEntityX(i);
            const ey = this.getEntityY(i);

            if (ex >= minX && ex <= maxX && ey >= minY && ey <= maxY) {
                result.push(i);
            }
        }
        return result;
    }

    getEntitiesInRadius(x, y, radius, owner = -1) {
        const result = [];
        const radiusSq = radius * radius;
        const count = this.getEntityCount();

        for (let i = 0; i < count; i++) {
            if (this.isEntityDead(i) || this.isEntityDying(i)) continue;
            if (owner !== -1 && this.getEntityOwner(i) !== owner) continue;

            const ex = this.getEntityX(i);
            const ey = this.getEntityY(i);
            const dx = x - ex;
            const dy = y - ey;

            if (dx * dx + dy * dy <= radiusSq) {
                result.push(i);
            }
        }
        return result;
    }

    getEntitiesByOwner(owner) {
        const result = [];
        const count = this.getEntityCount();

        for (let i = 0; i < count; i++) {
            if (this.isEntityDead(i) || this.isEntityDying(i)) continue;
            if (this.getEntityOwner(i) === owner) {
                result.push(i);
            }
        }
        return result;
    }

    getNodesByOwner(owner) {
        const result = [];
        const count = this.getNodeCount();

        for (let i = 0; i < count; i++) {
            if (this.getNodeOwner(i) === owner) {
                result.push(i);
            }
        }
        return result;
    }

    getEntityTargetNodeId(index) {
        return this.memory.entities.targetNodeId[index];
    }

    getEntityTargetX(index) {
        return this.memory.entities.targetX[index];
    }

    getEntityTargetY(index) {
        return this.memory.entities.targetY[index];
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
        this._resultArray.length = this._resultLength;
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
        this._resultArray.length = this._resultLength;
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
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
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
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".bundle.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
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
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		__webpack_require__.b = (typeof document !== 'undefined' && document.baseURI) || self.location.href;
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"main": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// no jsonp function
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
/* harmony import */ var _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../shared/GameConfig.js */ "./src/shared/GameConfig.js");
/* harmony import */ var _shared_Entity_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../shared/Entity.js */ "./src/shared/Entity.js");
/* harmony import */ var _shared_CampaignConfig_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../shared/CampaignConfig.js */ "./src/shared/CampaignConfig.js");
/* harmony import */ var _CampaignManager_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./CampaignManager.js */ "./src/client/CampaignManager.js");













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
        const colorIndex = parseInt(urlParams.get('color')) || 0;
        const campaignId = urlParams.get('campaign');

        (0,_shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_8__.setPlayerColor)(colorIndex);

        game.controller = new _modes_SingleplayerController_js__WEBPACK_IMPORTED_MODULE_4__.SingleplayerController(game);
        game.controller.setup(playerCount, difficulty, testMode, campaignId);

        // Show game UI and screen
        const ui = document.getElementById('ui');
        const menu = document.getElementById('menu-screen');
        if (ui) ui.style.display = 'flex'; // Changed to flex for horizontal layout
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

    // -- HUD BUTTONS SETUP --

    // 0. Help
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            const tutorial = document.getElementById('tutorial-overlay');
            if (tutorial) {
                tutorial.classList.add('visible');
            } else {
                alert('CONTROLES:\n- Click Izq: Seleccionar\n- Click Der: Mover\n- T + Click: Rally Point\n- S: Detener');
            }
        });
    }

    // 1. Mute
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            const enabled = _systems_SoundManager_js__WEBPACK_IMPORTED_MODULE_7__.sounds.toggle();
            muteBtn.textContent = enabled ? '🔊' : '🔇';
        });
    }

    // 2. Surrender
    const surrenderBtn = document.getElementById('surrender-btn');
    if (surrenderBtn) {
        surrenderBtn.style.display = 'flex';
        surrenderBtn.addEventListener('click', () => {
            const confirmMsg = mode === 'multiplayer' ?
                '¿Estás seguro de que quieres rendirte? Los nodos pasarán a ser neutrales.' :
                '¿Estás seguro de que quieres rendirte?';

            if (confirm(confirmMsg)) {
                if (game.controller && game.controller.surrender) game.controller.surrender();
            }
        });
    }

    // 3. Reset (Singleplayer only)
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.style.display = (mode === 'singleplayer') ? 'flex' : 'none';
        if (mode === 'singleplayer') {
            resetBtn.addEventListener('click', () => {
                const urlParams = new URLSearchParams(window.location.search);
                const playerCount = parseInt(urlParams.get('players')) || 2;
                const difficulty = urlParams.get('difficulty') || 'intermediate';
                const testMode = urlParams.get('test') === '1';
                const colorIndex = parseInt(urlParams.get('color')) || 0;
                (0,_shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_8__.setPlayerColor)(colorIndex);

                game.stop();
                game.gameOverShown = false;
                _shared_Entity_js__WEBPACK_IMPORTED_MODULE_9__.Entity.resetIdCounter();
                game.state = new _shared_GameState_js__WEBPACK_IMPORTED_MODULE_6__.GameState();
                game.state.playerCount = playerCount;

                game.ais = [];
                if (game.controller && game.controller.ais) {
                    game.controller.ais = [];
                }

                game.particles = [];
                game.commandIndicators = [];
                game.waypointLines = [];
                game.systems.selection.clear();

                const ui = game.systems.ui;
                ui._lastCounts = {};
                ui._ratesCache = {};
                ui._totalProduced = {};
                ui._currentCounts = {};
                ui._lastSampleTime = 0;

                game.skipCameraReset = true;
                game.controller.setup(playerCount, difficulty, testMode);
                game.skipCameraReset = false;

                if (game.worker) {
                    game.worker.terminate();
                    game.worker = null;
                    game.useWorker = false;
                    game.workerRunning = false;
                }

                game.start();
            });
        }
    }

    return game;
};

// --- CAMPAIGN UI LOGIC ---
let selectedCampaignId = null;

window.renderCampaignGrid = () => {
    const grid = document.getElementById('campaign-grid');
    if (!grid) return;

    // Create elements if not already there, up to 50
    const unlockedLevelId = _CampaignManager_js__WEBPACK_IMPORTED_MODULE_11__.CampaignManager.getUnlockedLevel();
    grid.innerHTML = '';

    // Render the 50 slots (even if configured levels don't exist yet, we show placeholders)
    for (let i = 0; i < 50; i++) {
        const btn = document.createElement('button');
        btn.className = 'ui-btn-game';
        btn.textContent = (i + 1).toString();
        btn.style.width = '100%';
        btn.style.height = '40px';
        btn.style.fontSize = '12px';

        const isUnlocked = i <= unlockedLevelId;
        const config = _shared_CampaignConfig_js__WEBPACK_IMPORTED_MODULE_10__.CampaignLevels.find(l => l.id === i);

        if (!isUnlocked) {
            btn.style.opacity = '0.2';
            btn.style.cursor = 'not-allowed';
            btn.textContent = '🔒';
        } else if (!config) {
            // Level is unlocked but not yet implemented in Config
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Próximamente';
        } else {
            // Unlocked and playable
            if (i < unlockedLevelId) {
                btn.style.borderColor = '#4CAF50';
                btn.style.color = '#4CAF50';
            } else {
                btn.style.borderColor = '#FFEB3B';
                btn.style.color = '#FFEB3B';
                btn.style.boxShadow = '0 0 10px rgba(255, 235, 59, 0.3)';
            }

            btn.addEventListener('click', () => {
                selectedCampaignId = i;
                document.getElementById('campaign-level-title').textContent = `Misión ${i}: ${config.name}`;
                document.getElementById('campaign-level-desc').textContent = config.description || 'Sin descripción.';
                document.getElementById('btn-start-campaign').disabled = false;

                // Visual selection
                Array.from(grid.children).forEach(c => c.style.background = 'transparent');
                btn.style.background = 'rgba(255, 255, 255, 0.2)';
            });
        }

        grid.appendChild(btn);
    }
};

let selectedTutorialId = null;

window.renderTutorialGrid = () => {
    const grid = document.getElementById('tutorials-grid');
    if (!grid) return;

    grid.innerHTML = '';

    _shared_CampaignConfig_js__WEBPACK_IMPORTED_MODULE_10__.TutorialLevels.forEach(config => {
        const btn = document.createElement('button');
        btn.className = 'ui-btn-game';
        btn.textContent = (config.id - 99).toString(); // Show 1, 2, 3...
        btn.style.width = '100%';
        btn.style.height = '60px';
        btn.style.fontSize = '18px';
        btn.style.borderColor = '#4CAF50';
        btn.style.color = '#4CAF50';

        btn.addEventListener('click', () => {
            selectedTutorialId = config.id;
            document.getElementById('tutorial-level-title').textContent = config.name;
            document.getElementById('tutorial-level-desc').textContent = config.description || 'Sin descripción.';
            document.getElementById('btn-start-tutorial').disabled = false;

            // Visual selection
            Array.from(grid.children).forEach(c => c.style.background = 'transparent');
            btn.style.background = 'rgba(76, 175, 80, 0.2)';
        });

        grid.appendChild(btn);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const btnStartCampaign = document.getElementById('btn-start-campaign');
    if (btnStartCampaign) {
        btnStartCampaign.addEventListener('click', () => {
            if (selectedCampaignId !== null) {
                // We pass the campaign id in the URL
                window.location.href = `singleplayer.html?campaign=${selectedCampaignId}`;
            }
        });
    }
    const btnStartTutorial = document.getElementById('btn-start-tutorial');
    if (btnStartTutorial) {
        btnStartTutorial.addEventListener('click', () => {
            if (selectedTutorialId !== null) {
                window.location.href = `singleplayer.html?campaign=${selectedTutorialId}`;
            }
        });
    }
});

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