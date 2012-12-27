/*!
 * IQuery version 1.0
 * Copyright (c) 2011~2012 yunchun.com
 * Describe 模块加载器  use the git to deal with the version
 */

/**
 * $domReady模块由模块管理器在文档就绪之后定义，需要等到文档就绪后才可用的模块可依赖于此模块。
 * <pre>
 * IQ.define('foo', [ '$domReady' ], function () { ... }).use();
 * </pre>
 * @module iquery
 * @submodule $domReady
 */

/**
 * $pageLoad模块由模块管理器在页面完全加载之后定义，需要等到页面完全加载之后才可用的模块可依赖于此模块。
 * <pre>
 * IQ.define('foo', [ '$pageLoad' ], function () { ... }).use();
 * </pre>
 * @module iquery
 * @submodule $pageLoad
 */

/**
 * iquery模块由模块管理器定义，提供了配置模块管理器和日志输出的功能。
 * @module iquery
 */

/**
 * 模块管理器。
 * <p>
 * 通过全局对象提供定义和使用模块、加载和执行代码时的必要方法。
 * </p>
 * @class window.IQ
 * @static
 */

/**
 * 该config主要用来定义一些全局的参数，如静态服务器的url等
 */
window.baseConfig = window.baseConfig ||{
	//定义全局的静态url，自动加载需要
	STATIC_URL : ''
};

(function (GLOBAL, GLOBAL_VAR_NAME, UNDEFINED) {
		// 模块名->模块元数据映射表。
	var modules = {},

		// 自增的匿名模块编号。
		anonymousId = 0,

		// 文档就绪标识。
		domReady = false,

		// 用于变量类型判断。
		toString = Object.prototype.toString,

		// 用于转换函数参数。
		slice = Array.prototype.slice,

		// 通过URL设置的调试开关，优先于config.debug。
		debug = false,

		// 模块加载器配置对象。
		config = {
			// 调试模式？
			debug: false
		},

		// 事件处理函数队列。
		handlers = {},

		// 延迟使用模块队列。
		pending = {};

	
	/**
	 * 使用延迟队列中的模块。
	 * @static
	 * @private
	 * @method triggerPending
	 * @param name {string} 模块名。
	 */
	function triggerPending(name) {
		var run;
		// 检查是否存在子延迟使用队列。
		if (typeof pending[name] === 'object') {
			run = function () {
				// 使用下一个模块。
				if (pending[name].length > 0) {
					var obj = pending[name].shift();
					// 制造时间间隔，避免多个函数连续执行阻塞UI线程。
					// 提前载入下一个函数，避免当前函数抛出异常时打断调用链。
					setTimeout(run, 0);
					// 当且仅当被依赖的所有模块都导出后才使用模块。
					if (--obj.dependenceCount === 0) {
						IQ.use(obj.name);
					}
				// 移除子延迟队列。
				} else {
					delete pending[name];
				}
			};
			setTimeout(run, 0);
		}
	}

	/**
	 * 执行事件处理函数。
	 * @static
	 * @private
	 * @method handle
	 * @param type {string} 事件类型。
	 * @return {boolean} 存在指定类型的事件处理函数数组时返回true，否则返回false。
	 */
	function handle(type) {
		var args,
			subHandlers,
			i,
			len;

		if (handlers.hasOwnProperty(type)) {
			args = slice.call(arguments, 1);
			// 生成数组副本，避免遍历过程中由于对数组修改造成越界。
			subHandlers = handlers[type].slice();
			for (i = 0, len = subHandlers.length; i < len; ++i) {
				subHandlers[i].apply({}, args);
			}
			return true;
		}

		return false;
	}

	var IQ = GLOBAL[GLOBAL_VAR_NAME] = GLOBAL[GLOBAL_VAR_NAME] || {};
	/**
	 * 定义一个新模块。
	 * <pre>
	 * IQ.define('foo', [ 'bar', 'baz' ], function (bar, baz) {
	 *     return { moduleName: this.name };
	 * });
	 * </pre>
	 * @static
	 * @public
	 * @method define
	 * @param [name] {string} 模块名，忽略该参数时定义一个匿名模块。在移除某个模块前，不能定义重名模块。
	 * @param [dependencies] {Array} 被依赖模块的名称。所有被依赖模块可用之后，新定义的模块才会变得可用。
	 * @param factory {Function} 模块工厂函数。
	 * @param factory.args {Object...} 被依赖模块的导出对象，顺序与被依赖模块一致。
	 * @param factory.this {Object} 新模块的元数据。
	 * @param factory.this.available {boolean} 模块可用标识。
	 * @param factory.this.dependencies {Array} 被依赖模块的名称。
	 * @param factory.this.exports {Object} 模块默认导出对象。
	 * @param factory.this.factory {Function} 模块工厂函数。
	 * @param factory.this.name {string} 模块名。
	 * @param factory.return {any} 如果工厂函数返回undefined以外的值，返回值将代替模块默认导出对象。
	 * @return {Object} 包含use和remove两个方法，与IQ.use(name)和IQ.remove(name)等价。
	 */
	IQ.define = IQ.define || function (name, dependencies, factory) {
		// 检测可选参数。
		if (typeof name === 'function') {
			factory = name;
			dependencies = [];
			// 为匿名模块自动生成模块名。
			name = '$anonymous_' + (++anonymousId);
		} else if (typeof name === 'object') {
			factory = dependencies;
			dependencies = name;
			// 为匿名模块自动生成模块名。
			name = '$anonymous_' + (++anonymousId);
		} else if (typeof dependencies === 'function') {
			factory = dependencies;
			dependencies = [];
		}

		// 避免定义重名模块。
		if (!modules.hasOwnProperty(name)) {
			// 创建新模块元数据。
			modules[name] = {
				available: false,
				dependencies: dependencies,
				exports: null,
				factory: factory,
				name: name
			};

			// 立即使用延迟队列中的模块。
			if (pending[name]) {
				IQ.use([ name ]);
			}
		}

		// 返回模块句柄。
		return {
			remove: function () {
				return IQ.remove(name);
			},
			use: function (factory) {
				return factory ? IQ.use([ name ], factory)
					: IQ.use([ name ]);
			}
		};
	};

	/**
	 * 移除一个模块。
	 * <pre>
	 * IQ.remove([ 'foo', 'bar' ]);
	 * IQ.remove('foo', 'bar');
	 * </pre>
	 * 移除某个模块后，可以再次定义同名模块。
	 * @static
	 * @public
	 * @method remove
	 * @param name {Array|string...} 需要移除的模块的名称，支持数组和扁平两种形式的参数。
	 */
	IQ.remove = IQ.remove || function (name) {
		var i, len,

			names = typeof name === 'object' ?
				name : arguments;

		for (i = 0, len = names.length; i < len; ++i) {
			name = names[i];
			if (modules.hasOwnProperty(name)) {
				delete modules[name];
			}
		}
	};

	/**
	 * 使用模块。
	 * <pre>
	 * IQ.use([ 'foo', 'bar' ]);
	 * IQ.use('foo', 'bar', function (foo, bar) {
	 *     bar.test();
	 * });
	 * </pre>
	 * 存在回调函数时，此函数实际上使用回调函数作为工厂函数定义并立即使用了一个匿名模块。因此存在以下等价关系。
	 * <pre>
	 * IQ.use('foo', 'bar', function (foo, bar) { ... });
	 * 等价于
	 * IQ.define([ 'foo', 'bar' ], function (foo, bar) { ... }).use();
	 * ---------------------------------
	 * IQ.use([], function () { ... });
	 * 等价于
	 * IQ.define(function () { ... }).use();
	 * </pre>
	 * 新定义的模块只在第一次被使用时通过工厂函数创建可被复用的模块导出对象。
	 * @static
	 * @public
	 * @method use
	 * @param name {Array|string...} 需要使用的模块的名称，支持数组和扁平两种形式的参数。
	 * @param [callback] {Function} 回调函数，当所有使用的模块可用后被执行。
	 * @param callback.args {Object...} 模块导出对象，顺序与使用的模块一致。
	 * @return {Array} 模块导出对象数组，当某个模块不可用时，数组中对应位置为null。
	 * 不存在回调函数时，返回使用的模块的导出对象。存在回调函数时，返回由回调函数定义的匿名模块的导出对象。
	 */
	IQ.use = IQ.use || function () {
		var i, j, len1, len2,

			args = slice.call(arguments),

			// 模块名。
			name,

			// 未定义的被依赖模块名。
			missed,

			// 模块元数据。
			module,

			// 被依赖模块的导出对象数组。
			exports,

			// 工厂函数返回值。
			ret,

			// 待使用列表数据项。
			pendingInfo,

			// 回调函数等价于匿名模块工厂函数。
			factory = (typeof args[args.length - 1] === 'function') ?
				args.pop() : null,

			// 兼容扁平参数与数组参数两种形态。
			required = (typeof args[0] === 'object') ?
				args[0].slice() : args; // 避免修改原始数组

		// 等价变换函数调用形式。
		if (factory) {
			return IQ.define.call(IQ, required, factory).use();
		}

		// 遍历使用的模块。
		for (i = 0, len1 = required.length; i < len1; ++i) {
			name = required[i];
			missed = [];

			// 检查模块是否定义。
			if (modules.hasOwnProperty(name)) {
				// 取出模块。
				module = modules[name];

				// 检查模块是否已导出。
				if (!module.exports) {
					// 获取被依赖模块的导出对象。此事dependencies为一个数组，重新use
					exports = IQ.use(module.dependencies);

					// 被依赖模块初始化过程中产生异常时，use返回null，表示有异常产生。
					if (exports === null) {
						return null;
					}

					// 检查模块依赖是否完整。
					for (j = 0, len2 = exports.length; j < len2; ++j) {
						if (exports[j] === null) {
							// 未定义模块名加入缺失模块列表。
							missed.push(module.dependencies[j]);
						}
					}

					if (missed.length > 0) {
						// 不可用模块加入延迟使用队列。
						if (!pending[name]) {
							pending[name] = [];
						}
						// 被使用模块缺少依赖时添加到待使用列表。
						pendingInfo = { name: name, dependenceCount: missed.length };
						for (j = 0, len2 = missed.length; j < len2; ++j) {
							pending[missed[j]].push(pendingInfo);
						}
					} else {
						// 创建模块默认导出对象。
						module.exports = {};

						try {
							// 初始化模块导出对象。
							ret = module.factory.apply(module, exports);
							if (ret !== UNDEFINED) {
								// 工场函数返回值覆盖模块默认导出对象。
								module.exports = ret;
							}
							// 初始化成功后模块变得可用。
							module.available = true;
							// 检查待使用列表中的模块是否满足使用条件。
							triggerPending(name);
						} catch (e) {
							// 初始化过程中产生异常时销毁模块导出对象。
							module.exports = null;
							// 异常处理。
							if (handle('error', e)) {
								// 异常并被捕获并处理后返回null，表示有异常产生。
								return null;
							} else if (debug || config.debug) {
								// 调试模式下，不存在异常处理函数时直接抛出异常。
								throw e;
							} else {
								// 非调试模式下，不存在异常处理函数时返回null表示有异常产生。
								return null;
							}
						}
					}
				}
				// 复用模块导出对象。
				required[i] = module.exports;
			} else {
				// 未定义模块加入延迟使用队列。
				if (!pending[name]) {
					pending[name] = [];
				}
				//如果未定义 使用loadJS异步加载该js文件
				if(name != "$domReady"){
					IQ.loadJS(name,null,function(){
						//console.log(name+" loaded");
					});
				}
				// 未定义模块的导出对象为null。
				required[i] = null;
			}
		}

		return required;
	};

	IQ.loadJS = IQ.loadJS || function(name,url,callback){
		var newURL;
		var nameArr = name.split(".");
		var newName = nameArr.join("/");
		if(/^(http|https)/i.test(name)){
			newURL = name+"?timestamp="+(new Date-0);
		}else if(!!window.baseConfig.STATIC_URL){	
			newURL = url||window.baseConfig.STATIC_URL + newName + ".js" + "?timestamp="+(new Date-0);;
		}else{
			var path = location.host;
			var protocol = location.protocol;
			newURL = url  || protocol + "//" + path +"/"+ newName + ".js" + "?timestamp="+(new Date-0);//(new Date -0)则自动转化为数字
		}
	    var head = document.getElementsByTagName('head')[0];
	    var script= document.createElement('script');
		script.type= 'text/javascript';
		script.onload = script.onreadystatechange = function() { 
		    if (!this.readyState || this.readyState === "loaded" ||    this.readyState === "complete" ) {
		        if(callback){
		        	callback();
		        }
		        // Handle memory leak in IE
		            script.onload = script.onreadystatechange = null;
		    } };
		script.src= newURL;
		head.appendChild(script);
	}
	
	IQ.define('iquery', function () {
		/**
		 * 模块对象。
		 * @class iquery
		 * @static
		 */
		var exports = this.exports,

			// 浏览器原生控制台日志输出函数。
			log = (GLOBAL.console && GLOBAL.console.log) ? function (message) {
				console.log(message);
			} : null,

			// 浏览器原生控制台错误输出函数。
			error = (GLOBAL.console && GLOBAL.console.error) ? function (message) {
				console.error(message);
			} : log;

		/**
		 * 输出日志信息。
		 * <pre>
		 * iquery.log('System start!');
		 * </pre>
		 * 调用此方法会触发log事件，并且在调试模式下将日志信息输出到浏览器控制台中。
		 * @static
		 * @public
		 * @method log
		 * @param message {string} 日志信息。
		 * @return {Object} 对象本身。
		 */
		exports.log = function (message) {
			// 输出日志信息到浏览器原生控制台。
			if ((debug || config.debug) && log) {
				log(message);
			}

			// 调用日志处理函数。
			handle('log', message);

			return this;
		};

		/**
		 * 输出错误信息。
		 * <pre>
		 * iquery.error('System down!');
		 * iquery.error(new Error('System down!'));
		 * </pre>
		 * 调用此方法会触发error事件，并且在调试模式下将日志信息输出到浏览器控制台中。
		 * @static
		 * @public
		 * @method error
		 * @param err {string|Error} 错误信息或异常对象。
		 * @return {Object} 对象本身。
		 */
		exports.error = function (err) {
			// 将错误信息包装为异常对象。
			if (typeof err === 'string') {
				err = new Error(err);
			}

			// 输出错误信息到浏览器原生控制台。
			if ((debug || config.debug) && error) {
				error(err.message);
			}

			// 调用错误处理函数。
			handle('error', err);

			return this;
		};

		/**
		 * 配置模块管理器。
		 * <pre>
		 * iquery.config({
		 *     debug: true
		 * });
		 * </pre>
		 * 最后一次传入的配置项会覆盖前一次的同名配置项。
		 * @static
		 * @public
		 * @method config
		 * @param options {Object} 配置项键值对。
		 * @param [options.debug] {boolean} 默认false。启用调试模式后，日志信息和错误信息将输出到浏览器控制台，
		 * 并且当不存在异常处理函数时，使用模块管理器管理的代码中产生的异常会直接抛出。
		 * @return {Object} 对象本身。
		 */
		exports.config = function (options) {
			var key;

			for (key in options) {
				if (options.hasOwnProperty(key)) {
					config[key] = options[key];
				}
			}

			return this;
		};

		/**
		 * 添加事件处理函数。
		 * <pre>
		 * iquery.addHandler('error', function (e) { ... });
		 * iquery.addHandler('log', function (msg) { ... });
		 * </pre>
		 * 目前支持的事件类型为error和log。
		 * @static
		 * @public
		 * @method addHandler
		 * @param type {string} 事件类型。
		 * @param handler {Function} 事件处理函数。
		 * @return {Object} 对象本身。
		 */
		exports.addHandler = function (type, handler) {
			if (!handlers.hasOwnProperty(type)) {
				handlers[type] = [];
			}
			handlers[type].push(handler);

			return this;
		};

		/**
		 * 移除事件处理函数。
		 * <pre>
		 * iquery.removeHandler('error', fn);
		 * </pre>
		 * @static
		 * @public
		 * @method removeHandler
		 * @param type {string} 事件类型。
		 * @param handler {Function} 事件处理函数。
		 * @return {Object} 对象本身。
		 */
		exports.removeHandler = function (type, handler) {
			var subHandlers,
				i,
				len;

			if (handlers.hasOwnProperty(type)) {
				subHandlers = handlers[type];
				for (i = 0, len = subHandlers.length; i < len; ++i) {
					if (subHandlers[i] === handler) {
						subHandlers.splice(i, 1);
						break;
					}
				}
				// 某种事件类型下无事件处理函数时移除对应的队列。
				if (subHandlers.length === 0) {
					delete handlers[type];
				}
			}

			return this;
		};
	});


	// 检查URL中的debug参数。
	(function () {
		var query = location.search.substring(1).split('&'),
			len = query.length,
			i = 0;

		for (; i < len; ++i) {
			if (query[i].split('=')[0] === 'iquery-debug') {
				debug = true;
				break;
			}
		}
	}());

}(this, 'IQ'));
