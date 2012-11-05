IQ.define('app.BackToTop',['core'],function(core){
	//默认配置，是可配的，外面可以改的
	var _config = {
		author : 'yeyunchun',
		describe : 'back-to-top APP'
	};
	//静态数据
	var	_DATA = {
			_author : 'yeyunchun',
			_describe : 'back-to-top APP'
	};
	var BackToTop = core.create(core.base,{
		//构造函数
		_izer : function(config){
			this.data = config;
			console.log(this.data);
			this.model.init(this);
			this.domControl.init(this);
			this.eventHandle.init(this);
		},
		//析构函数
		_dtor : function(){
			
		},
		//数据层
		data : null,
		//model层
		model : {
			_parent : null,
			init : function(parent){
				this._parent = parent;
			},
			get : function(key){
				return this._parent.data[key];
			},
			set : function(key,value){
				this._parent.data[key] = value;
			}
		},
		//dom渲染以及control层
		domControl : {
			_parent : null,
			init : function(parent){
				this._parent = parent;
			}
		},
		//event捕获层
		eventHandle : {
			_parent : null,
			init : function(parent){
				this._parent = parent;
			}
		}
	},_config,_DATA);
	return BackToTop;
});

IQ.use('app.BackToTop',function(BackToTop){
	var backToTop = new BackToTop();
	console.log(backToTop);
});
