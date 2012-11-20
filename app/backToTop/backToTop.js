/**
 * @author: Yunchun Ye
 * @description ： backToTop组件 提供了两种使用方式 （注意：自定义的时候要自己写css样式）
 * @time: 2012-10-25
 * @update 
 */
IQ.define('app.backToTop.backToTop',['classFactory'],function(classFactory){
	//默认配置，是可配的，外面可以改的
	var _config = {
		//传入的目标id，如果不存在，则默认为NULL,则BackToTop组件会自动创建一个
		targetId : null
	};
	//静态数据
	var	_DATA = {
			_author : 'yeyunchun',
			_describe : 'back-to-top APP'
	};
	var BackToTop = classFactory.create(classFactory.base,{
		//构造函数
		_izer : function(config){
			this.data = config;
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
				var targetId = this._parent.model.get('targetId');
				if(!!targetId){
					var target = $(targetId);
					var isIE6 = $.browser.msie&&($.browser.version==6.0)&&!$.support.style;
					if(isIE6){
						this.fixedIE6(target);
					}						
					this._parent.eventHandle.scrollHandle(target);
					this._parent.eventHandle.clickHandle(target);
				}else{
					//没有id则创建一个默认的backToTop组件
					this.createBackToTop();
				}
			},
			//动态修复ie6不支持fixed的问题
			fixedIE6 : function(target){
				var _html=document.getElementsByTagName("html")[0],
				_body=document.getElementsByTagName("body")[0],
				_left,_top;
				if(_html.currentStyle["backgroundAttachment"]!=="fixed" && _body.currentStyle["backgroundAttachment"]!=="fixed"){
					_html.style.cssText="zoom:1;background-image:url(about:blank);background-attachment:fixed";
				}
				_height = $(window).innerHeight();
				target[0].style.setExpression('right','eval(document.documentElement.scrollLeft+20)+"px"'); 
				target[0].style.setExpression('top','eval(document.documentElement.scrollTop+'+_height+'-100)+"px"');
			},
			goToTop : function(target){
				//平滑滚动的效果
				$("html,body").animate({ scrollTop:0});
			},
			doScroll : function(target){
				var docTop = document.body.scrollTop || document.documentElement.scrollTop;
				if(docTop>100){
					target.fadeIn();
				}else{
					target.fadeOut();
				}			
			},
			createBackToTop : function(){
				var src = '<div id="back-to-top" class="back-to-top">BACK TO TOP</div>';
				$('body').append(src);
				var target = $('#back-to-top');
				target[0].style.cssText = 'width:50px;height:40px;background:#666666;position:fixed;_position:absolute;'
				+'right:20px;bottom:40px;font-size:12px;text-align:center;color:#ffffff;cursor: pointer;padding-top:10px;display: none;';
				var isIE6 = $.browser.msie&&($.browser.version==6.0)&&!$.support.style;
				if(isIE6){
					this.fixedIE6(target);
					//修复IE6下resize 窗口的bug
					this._parent.eventHandle.resizeHandle(target);
				}	
				this._parent.eventHandle.scrollHandle(target);
				this._parent.eventHandle.clickHandle(target);
			}
		},
		//event捕获层
		eventHandle : {
			_parent : null,
			init : function(parent){
				this._parent = parent;
			},
			clickHandle : function(target){
				var _self = this;
				target.click(function(){
					_self._parent.domControl.goToTop(target);
				});
			},
			scrollHandle : function(target){
				var _self = this;
				var timer;
				$(window).scroll(function(){
					if(!!timer){
						clearTimeout(timer);
					}
					timer = setTimeout(function(){
						_self._parent.domControl.doScroll(target);
					},0)
				});
			},
			resizeHandle : function(target){
				var _self = this;
				var timer;
				$(window).resize(function(){
					if(!!timer){
						clearTimeout(timer);
					}
					timer = setTimeout(function(){
						_self._parent.domControl.fixedIE6(target);
					},0)
				});
			}
		}
	},_config,_DATA);
	return BackToTop;
});

/**
 * @how to use: 下面是使用这个模块的方法
 */
// IQ.defer(function(){
	// IQ.use('app.BackToTop',function(BackToTop){
		// //自定义组件样式 只要把对应的backToTop的ID传过来就可以了
		// //针对于那种想自定义backToTop的同学
		// // var backToTop = new BackToTop({
			// // targetId : "#back-to-top"
		// // });
		// //默认的组件样式 直接new一个对象就可以了
		// var backToTop = new BackToTop();
	// });
// });

