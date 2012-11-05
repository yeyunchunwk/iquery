IQ.define('classFactory',[],function(){	
	var ClassFactory = {
		base : {
			//用于依次执行对象的析构函数
			dispose: function () {
				var ctor = this.constructor,
					dtor;
				//循环
				while (ctor) {
					// 仅执行当前类自己的析构函数。
					if (ctor.prototype.hasOwnProperty('_dtor') && (dtor = ctor.prototype._dtor)) {
						dtor.apply(this);
					}
					//依次执行
					ctor = ctor.superclass ? ctor.superclass.constructor : null;
				}
			}
		},
		/**
		 * 使用指定父类对象创建一个子类。
		 * <pre>
		 * var Foo = core.create(core.Base, {
		 *     _izer: function (config) {
		 *         this.bar = config.bar;
		 *     },
		 *     baz: function () {
		 *         console.log(this.bar);
		 *     }
		 * }, {
		 *     bar: 'bar'
		 * });
		 * </pre>
		 * @static
		 * @public
		 * @method create
		 * @param target {Obj} 父类对象。
		 * @param [classObj] {Object} 类对象。
		 * @param [classObj._izer] {Function} 初始化函数。
		 * @param overrides._izer.arg0 {Object} 实际配置，由从子类构造函数传入的配置与默认配置合并后产生。
		 * @param [_CONFIG] {Object} 默认配置。
		 * @return {Function} 子类构造函数。
		 */
		create : function(target,classObj,_CONFIG,_DATA){
			//合并父对象和子类对象
			var superObj = $.extend(target,classObj);
			
			var fun = function(config){
				config = config || {};
				var _config = {};
				var _self = this;
				//合并默认配置和类初始化配置
				if(!!_CONFIG){
					_config = $.extend(_CONFIG,config);
				}
				//如果有静态属性，进一步合并
				if(!!_DATA){
					_config = $.extend(_config,_DATA);
				}
				//如果存在构造函数，则执行这个函数
				if(!!superObj.hasOwnProperty('_izer')){
					superObj._izer.call(_self,_config);
				}
			} 
			fun.prototype = superObj;
			fun.prototype.constructor = fun;
			//返回生成的构造函数
			return fun;
		}
	}
	return ClassFactory;
});
