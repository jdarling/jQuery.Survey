// Modified from http://club15cc.com/code/jquery/an-improved-version-of-the-jquery-plugin-template

(function ($) {
  "use strict";
  
  var PLUGIN_NS = 'survey';
  var isNumeric = function(n){
    return !isNaN(parseFloat(n)) && isFinite(n);
  };
  
  var serializeFormObject = function(form) {
        var o = {};
        var a = form.serializeArray();
        $.each(a, function() {
          if(this.name.match(/\[\]$/)){
            this.name = this.name.replace(/\[\]$/, '');
            if (!o[this.name]) {
              o[this.name] = [];
            }
          }
          if (o[this.name]) {
            if (!o[this.name].push) {
              o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || true);
          } else {
            o[this.name] = typeof(this.value)==='boolean'?this.value:this.value || true;
          }
        });
        return o;
      };

  var Plugin = function (target, options) {
    var self = this;
    var data = (options||{}).data;
    self.$this = $(target);
    self.options = $.extend(
      true,
      {},
      $.fn[PLUGIN_NS].defaults,
      options
    );
    self.options.surveyURL=self.options.surveyURL||self.options.surveyUrl;
    var callChains = {
      loadSurvey: function(next){
        if(self.options.survey){
          self.setSurvey(self.options.survey);
          delete self.survey;
          next();
        }else if(self.options.surveyURL){
          $.get(self.options.surveyURL, function(survey){
            self.setSurvey(survey);
            next();
          }, self.options.dataType);
        }else{
          next();
        }
      },
      loadData: function(next){
        if(self.options.data){
          self.setData(data||self.options.data);
          delete self.data;
          next();
        }else if(self.options.dataURL){
          $.get(self.options.dataURL, function(data){
            self.setData(data);
            next();
          }, self.options.dataType);
        }else{
          self.setData({});
          next();
        }
      },
      displayPage: function(){
        self._displayPage(self.options.initialPage||0);
        if(typeof(self.options.init)==='function'){
          self.options.init(self.$this);
        }
      }
    };
    var callChainNext = function(steps){
      var next = function(){
        callChainNext(steps);
      };
      callChains[steps.shift()](next);
    };
    
    callChainNext(['loadSurvey', 'loadData', 'displayPage']);
    
    return self;
  };
  Plugin.parsers = {
    none:function( data ){ return data; },
    xml:function( data ){
      return $('>*>*',data).map(function(i,node){
        var obj = {};
        $(node).children().each(function(){
          obj[this.nodeName.toLowerCase()] = $(this).text();
        });
        return obj;
      }).get();
    }
  };

  /** #### PUBLIC API #### */
  Plugin.prototype.registerUpdateHandlerTo = function(id){
    var self = this;
    if(self._registerUpdateHandlerTo.indexOf(id)===-1){
      self._registerUpdateHandlerTo.push(id);
    }
  };
  Plugin.prototype.setData = function(data){
    var self = this;
    self._digest(data, '_data_');
    return self.$this;
  };
  Plugin.prototype.data = function(){
    var self = this;
    return self._data_;
  };
  Plugin.prototype.updateData = function(data){
    var self = this;
    self._data_=self._data_||{};
    $.extend(true, self._data_, data);
    return self.$this;
  };
  Plugin.prototype.survey = function(){
    var self = this;
    return self._survey_;
  };
  Plugin.prototype.setSurvey = function(survey){
    var self = this;
    self._digest(survey, '_survey_');
    return self.$this;
  };
  Plugin.prototype.nextPage = function(forceChange){
    var self = this;
    if(typeof(forceChange)!=='boolean'){
      forceChange = false;
    }
    self.setPage(self.currentPage()+1, forceChange);
    return self.$this;
  };
  Plugin.prototype.prevPage = function(forceChange){
    var self = this;
    if(typeof(forceChange)!=='boolean'){
      forceChange = false;
    }
    self.setPage(self.currentPage()-1, forceChange);
    return self.$this;
  };
  Plugin.prototype.pageData = function(){
    var self = this;
    var data = serializeFormObject(self.$this.closest("form"));
    var elems = self._elementNames;
    var i=0, l=elems.length, name;
    var matches;
    for(i=0; i<l; i++){
      name = elems[i];
      matches = self.$this.find('[name="'+name+'"], [name="'+name+'[]"]');
      data[name]=data[name]||null;
    }
    return data;
  };
  Plugin.prototype.pageIndex = function(name, defaultPageIndex){
    var self = this;
    var pages = self._survey().pages;
    var i, l=pages.length;
    for(i=0; i<l; i++){
      if(pages[i].name===name){
        return i;
      }
    }
    return defaultPageIndex||0;
  };
  Plugin.prototype.setPage = function (pageNameOrNumber, forceChange) {
    var self = this;
    var setPage = function(){
      self._displayPage(pageNumber);
    };
    var pageNumber = 0;
    if(isNumeric(pageNameOrNumber)){
      pageNumber = Math.max(0, Math.min(parseInt(pageNameOrNumber), self.numberPages()-1));
    }else{
      pageNumber = self.pageIndex(pageNameOrNumber, self.currentPage());
    }
    if(typeof(forceChange)!=='boolean'){
      forceChange = false;
    }
    if(forceChange){
      setPage();
    }else{
      self._beforeChange(pageNumber, setPage);
    }
    return self.$this;
  };
  Plugin.prototype.numberPages = function(){
    var self = this;
    return (self._survey().pages.length)||0;
  };
  Plugin.prototype.currentPage = function(){
    var self = this;
    return self._currentPage||0;
  };
  Plugin.prototype.registerTemplate = function(templateName, source){
    var self = this;
    self.options.templates[templateName] = source;
    return self.$this;
  };
  Plugin.prototype.transition = function(toHTML, callback){
    var self = this;
    var target = self.$this;
    if(typeof(self.options.transition)==='function'){
      self.options.transition(toHTML, target, callback);
    }else{
      target.slideUp(function(){
        target.html(toHTML);
        setTimeout(function() {
          target.slideDown();
          callback();
        }, 10);
      });
    }
  };
  Plugin.prototype.compare = function(formula){
    var self = this;
    var compare = function(formula, data){
      var getDataValue = function(path){
        var value = getElemValue('[name="'+path+'"], [name="'+path+'[]"]');
        if(value){
          return value;
        }
        var path = path.split('.'), i=0, l=path.length;
        var elem = data;
        while(i<l && elem){
          elem = elem[path[i]];
          i++;
        }
        return elem;
      };
      var getElemValue = function(selector){
        var elem = self.$this.find(selector);
        if(elem.length>0){
          return elem.val();
        }else{
          return;
        }
      };
      var getValue = function(key){
        key = (key||{});
        if(key.field){
          return getDataValue(key.field);
        }else if(key.elem||key.element){
          return getElemValue(key.elem||key.element);
        }else if(typeof(key)==='object'){
          return compare(key, data);
        }else{
          return key;
        }
      };
      var from = getValue(formula.from);
      var to = getValue(formula.to);
      switch((formula.condition||'==').toLowerCase()){
        case('=='):
          return from == to;
          break;
        case('==='):
          return from === to;
          break;
        case("<>"):
        case("!="):
          return from != to;
          break;
        case("!=="):
          return from !== to;
          break;
        case(">"):
          return from > to;
          break;
        case("<"):
          return from < to;
          break;
        case("&&"):
        case("and"):
          return from && to;
          break;
        case("||"):
        case("or"):
          return from || to;
          break;
        case("in"):
          return (to instanceof Array?to:[to]).indexOf(from) > -1;
          break;
      }
    };
    return compare(formula, self.data());
  };

  /** #### PRIVATE METHODS #### */
  Plugin.prototype._data = function(){
    var self = this;
    return self._data_;
  };
  Plugin.prototype._beforeChange = function(to, callback){
    var self = this;
    if(typeof(self.options.beforeChange)==='function'){
      self.options.beforeChange.call(self.$this, self._currentPage, to, callback);
    }else{
      callback();
    }
  };
  Plugin.prototype._afterChange = function(){
    var self = this;
    if(typeof(self.options.afterChange)==='function'){
      self.options.afterChange(self._currentPage);
    }
  };
  Plugin.prototype._survey = function(){
    var self = this;
    return self._survey_||{pages: []};
  };
  Plugin.prototype._digest = function(data, into){
    var self = this;
    self[into] = Plugin.parsers[self.options.parser](data);
    return self;
  };
  Plugin.prototype._template = function(templateName){
    var self = this;
    return self.options.templates[templateName];
  };
  Plugin.prototype._render = function(page, templateName, templateData){
    var self = this;
    var data = {
      templateName: templateName,
      page: page,
      element: templateData,
      data: self._data_,
      survey: self
    };
    var source = self._template(templateName);
    try{
      if(source){
        return self.options.render.call(self, source, data);
      }else{
        return self._templateError(templateName);
      }
    }catch(e){
      self._templateError(templateName, e, self.$this);
    }
  };
  Plugin.prototype._templateError = function(templateName, err, target){
    var self = this;
    var info = {
      err: err,
      template: {
        name: templateName,
        source: self._template(templateName)
      }
    };
    if(target){
      target.append(self.options.render.call(self, info.template.source?self._template('templateError'):self._template('noTemplateError'), info));
    }else{
      return self.options.render.call(self, info.template.source?self._template('templateError'):self._template('noTemplateError'), info);
    }
  };
  Plugin.prototype._renderElements = function(page, elements){
    var self = this;
    var src = '';
    var element, i=0, l=(elements||[]).length;
    var pageId = page.page?page.page.id:page.id;
    for(i=0; i<l; i++){
      var element = elements[i];
      element.id = pageId+'_elem_'+(element.name||(element.type+'_'+i));
      if(element.name){
        self._elementNames.push(element.name);
      }
      src += self._render(page, element.type, element);
    }
    return src;
  };
  Plugin.prototype._displayPage = function(pageNumber){
    var self = this;
    var page = self._getPage(pageNumber);
    var loading = self._render(page, 'loading');
    self._registerUpdateHandlerTo = [];
    self._compareFormulas = [];
    page.index = pageNumber||self.options.initialPage;
    page.id = 'page_'+pageNumber;
    self._elementNames = [];
    var html = self._render(page, page.type||'page', page);
    self.transition(html, function(){
      self._registerUpdateHandlers();
      self._controlUpdated();
      self._setCurrentPage(pageNumber);
    });
  };
  Plugin.prototype._controlUpdated = function(control){
    var self = this;
    var controls = self.$this.find('[data-survey-condition]');
    controls.each(function(){
      var $this = $(this);
      var index = parseInt($this.data('surveyCondition'));
      var formula = self._compareFormulas[index];
      if(self.compare(formula)){
        $this.show();
      }else{
        $this.hide();
      }
    });
  };
  Plugin.prototype._registerUpdateHandlers = function(){
    var self = this;
    var i, l = self._registerUpdateHandlerTo.length;
    for(i=0; i<l; i++){
      self.$this.find('#'+self._registerUpdateHandlerTo[i]).change(function(){
        return self._controlUpdated(this);
      });
    }
  };
  Plugin.prototype._setCurrentPage = function(pageNumber){
    var self = this;
    self._currentPage = pageNumber;
    self._afterChange();
  };
  Plugin.prototype._getPage = function(whatPage){
    var self = this, pageNumber = isNumeric(whatPage)?whatPage:self.currentPage();
    return (self._survey().pages[pageNumber])||{elements: []};
  };

  /*###################################################################################
   * JQUERY HOOK
   *###################################################################################*/
  /**
   * Generic jQuery plugin instantiation method call logic
   *
   * Method options are stored via jQuery's data() method in the relevant element(s)
   * Notice, myActionMethod mustn't start with an underscore (_) as this is used to
   * indicate private methods on the PLUGIN class.
   */
  $.fn[PLUGIN_NS] = function (methodOrOptions) {
    if (!$(this).length) {
      return $(this);
    }
    var instance = $(this).data(PLUGIN_NS);
    // CASE: action method (public method on PLUGIN class)
    if (instance && typeof methodOrOptions === 'string' && (methodOrOptions||'').indexOf('_') !== 0 && instance[methodOrOptions] && typeof (instance[methodOrOptions]) === 'function') {
      return instance[methodOrOptions](Array.prototype.slice.call(arguments, 1));
      // CASE: argument is options object or empty = initialise
    } else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
      instance = new Plugin($(this), methodOrOptions); // ok to overwrite if this is a re-init
      $(this).data(PLUGIN_NS, instance);
      return $(this);
      // CASE: method called before init
    } else if (!instance) {
      $.error('Plugin must be initialised before using method: ' + methodOrOptions);
      // CASE: invalid method
    } else if ((methodOrOptions||'').indexOf('_') === 0) {
      $.error('Method ' + methodOrOptions + ' is private!');
    } else if(methodOrOptions){
      $.error('Method ' + methodOrOptions + ' does not exist.');
    }else{
      return instance;
    }
  };
  var showdown;
  $.fn[PLUGIN_NS].defaults = {
    dataType: 'json',
    parser: 'none',
    compiler: 'handlebars',
    compilers: {
      handlebars: function(source){
        var self = this;
        if(!self.handlebarsHelpers){
          self.handlebarsHelpers = $.extend(true, {}, Handlebars.helpers);
          (function(survey){
            var registerHelper = function(name, callback){
              survey.handlebarsHelpers[name] = callback;
            };
            var getData = function(element, elementName){
              var value = survey._data_[elementName];
              element = element || {};
              if(element.value){
                value = element.value;
              }else if(element.bind){
                value = survey._data_[element.bind];
              }
              return value;
            };
            registerHelper('renderElements', function(elements){
              return new Handlebars.SafeString(survey._renderElements(this, elements));
            });
            registerHelper('elementData', function(name){
              var value = getData(this.element, name);
              return new Handlebars.SafeString(value);
            });
            registerHelper('onChangeUpdateById', function(id){
              var args = Array.prototype.slice.call(arguments, 0, arguments.length-1);
              var id = args.join('');
              survey.registerUpdateHandlerTo(id);
              return new Handlebars.SafeString('id="'+id+'"');
            });
            registerHelper('compareHook', function(element){
              if(element.condition){
                var index = survey._compareFormulas.length;
                survey._compareFormulas.push(element.condition);
                return new Handlebars.SafeString(element.condition?'data-survey-condition="'+index+'"':'');
              }else{
                return '';
              }
              //return new Handlebars.SafeString(element.condition?'data-survey-condition="'+element.id+'"':'');
            });
            registerHelper('markdown', function(source){
              showdown = showdown || new Showdown.converter();
              return new Handlebars.SafeString(showdown.makeHtml(source));
            });
            registerHelper('handlebars', function(source, scope){
              var template = Handlebars.compile(source, {});
              return new Handlebars.SafeString(template(scope === void 0?survey._data_:scope, {helpers: survey.handlebarsHelpers}));
            });
            registerHelper('exists', function(arr, v, options){
              return (arr||[]).indexOf(v)>-1?options.fn(this):options.inverse(this);
            });
            registerHelper('dataExists', function(key, value, options){
              //var data = survey._data_;
              //var arr = data[key]||[];
              var arr = getData(this.element, key)||[];
              return (arr.indexOf(value)>-1)?options.fn(this):options.inverse(this);
            });
            registerHelper('ifElementData', function(key, options){
              //var data = survey._data_;
              //var value = data[key];
              var value = getData(this.element, key);
              return value?options.fn(this):options.inverse(this);
            });
            registerHelper('dataIs', function(key, value, options){
              //var data = survey._data_;
              //var val = data[key];
              var val = getData(this.element, key);
              return (val == value)?options.fn(this):options.inverse(this);
            });
          })(self);
        }
        return Handlebars.compile(source);
      },
      mustache: function(source){
        return Mustache.compile(source);
      },
    },
    render: function(source, data){
      var self = this;
      var compiler = self.compiler||self.options.compiler;
      switch(typeof(compiler)){
        case('string'):
          compiler = (self.compilers||{})[compiler]||self.options.compilers[compiler];
        default:
          var template = compiler.call(self, source||'');
      }
      return template(data, {helpers: self.handlebarsHelpers});
    },
    templates: {
      loading: '<div class="loading">Loading...</div>',
      hidden: '{{#ifElementData element.name}}<input type="hidden" {{onChangeUpdateById element.id}} name="{{element.name}}" value="{{elementData element.name}}"/>{{/ifElementData}}',
      text: '<div class="input" {{compareHook element}}><label><span class="inputLabel{{#if element.required}} required{{/if}}">{{element.label}}{{#if element.required}}<span class="ast">*</span>{{/if}}'+
            '<span class="colon">:</span></span> <input type="text" {{onChangeUpdateById element.id}} name="{{element.name}}"{{#if element.required}} required{{/if}}{{#ifElementData element.name}} value="{{elementData element.name}}"{{/ifElementData}} placeholder="{{element.placeholder}}" /></label></div>',
      email: '<div class="input" {{compareHook element}}><label><span class="inputLabel{{#if element.required}} required{{/if}}">{{element.label}}{{#if element.required}}<span class="ast">*</span>{{/if}}'+
            '<span class="colon">:</span></span> <input type="email" {{onChangeUpdateById element.id}} name="{{element.name}}"{{#if element.required}} required{{/if}}{{#ifElementData element.name}} value="{{elementData element.name}}"{{/ifElementData}} placeholder="{{element.placeholder}}" /></label></div>',
      phone: '<div class="input" {{compareHook element}}><label><span class="inputLabel{{#if element.required}} required{{/if}}">{{element.label}}{{#if element.required}}<span class="ast">*</span>{{/if}}'+
            '<span class="colon">:</span></span> <input type="tel" {{onChangeUpdateById element.id}} name="{{element.name}}"{{#if element.required}} required{{/if}}{{#ifElementData element.name}} value="{{elementData element.name}}"{{/ifElementData}} placeholder="{{element.placeholder}}" /></label></div>',
      page: '<div class="input" {{compareHook element}}>{{#if page.title}}<h1>{{page.title}}</h1>{{/if}}{{renderElements page.elements}}{{renderElements page.options}}</div>',
      templateError: '<div class="error"><div class="heading">Template Name: {{template.name}}</div>'+
                     '<div class="message">Error Message: {{err.message}}</div><div class="source">Template Source: {{template.source}}</div></div>',
      noTemplateError: '<div class="error"><div class="heading">Template Name: {{template.name}}</div>'+
                       '<div class="message">Error Message: No template exists for {{template.name}}</div></div>',
      radio: '<div class="input" {{compareHook element}}><label><span class="inputLabel{{#if element.required}} required{{/if}}">{{element.label}}{{#if element.required}}<span class="ast">*</span>{{/if}}<span class="colon">:</span></span></label>'+
             '{{#each element.options}}'+
               '<label><input type="radio" name="{{../element.name}}" {{onChangeUpdateById ../element.id "_" key}} value="{{key}}"{{#if ../element.required}} required{{/if}}{{#dataExists ../element.name key}} checked{{/dataExists}} /> {{value}}</label>'+
             '{{/each}}</div>',
      checkbox: '{{#if element.options}}'+
                  '<div class="input" {{compareHook element}}><label><span class="inputLabel{{#if element.required}} required{{/if}}">{{element.label}}{{#if element.required}}<span class="ast">*</span>{{/if}}<span class="colon">:</span></span></label>'+
                  '{{#each element.options}}'+
                    '<label><input type="checkbox" name="{{../element.name}}[]" {{onChangeUpdateById ../element.id "_" key}} value="{{key}}" {{#dataExists ../element.name key}}checked {{/dataExists}}{{#if ../element.required}} required{{/if}} />{{value}}</label>'+
                  '{{/each}}</div>'+
                '{{else}}'+
                  '<div class="input" {{compareHook element}}><label><span class="inputLabel{{#if element.required}} required{{/if}}">{{element.label}}{{#if element.required}}<span class="ast">*</span>{{/if}} <input type="checkbox" name="{{element.name}}" {{onChangeUpdateById element.id}} value="{{element.key}}"{{#if element.required}} required{{/if}}{{#ifElementData element.name}} checked{{/ifElementData}} /></label></div>'+
                '{{/if}}',
      section: '<div class="section" {{compareHook element}}>{{#if element.title}}<h2>{{element.title}}</h2>{{/if}}{{renderElements element.elements}}</div>',
      submit: '<input class="button" {{compareHook element}} type="submit" {{onChangeUpdateById element.id}} value="{{element.caption}}" />',
      nextPage: '<button class="button" {{compareHook element}} onclick="$.survey(this).nextPage({{element.force}}); return false;">{{element.caption}}</button>',
      prevPage: '<button class="button" {{compareHook element}} onclick="$.survey(this).prevPage({{element.force}}); return false;">{{element.caption}}</button>',
      setPage: '<button class="button" {{compareHook element}} onclick="$.survey(this).setPage(\'{{element.pageNumber}}\', {{element.force}}); return false;">{{#if element.caption}}{{element.caption}}{{else}}{{element.pageNumber}}{{/if}}</button>',
      content: '<{{element.tag}} class="content" {{compareHook element}}>{{element.contents}}</{{tag}}>',
      html: '{{{element.fragment}}}',
      markdown: '{{markdown element.source}}',
      handlebars: '{{handlebars element.source this}}',
      select: '<div class="input" {{compareHook element}}><label><span class="inputLabel{{#if element.required}} required{{/if}}">{{element.label}}{{#if element.required}}<span class="ast">*</span>{{/if}}<span class="colon">:</span></span>'+
            ' <select {{onChangeUpdateById element.id}} name="{{element.name}}"{{#if element.required}} required{{/if}}{{#ifElementData element.name}} value="{{elementData element.name}}"{{/ifElementData}} placeholder="{{element.placeholder}}">'+
             '{{#if element.placeholder}}'+
               '<option value="" class="placeholder">{{element.placeholder}}</option>'+
             '{{else}}'+
               '<option value=""></option>'+
             '{{/if}}'+
             '{{#each element.options}}'+
               '<option {{#dataIs ../element.name key}}selected {{/dataIs}}value="{{key}}">{{value}}</option>'+
             '{{/each}}'+
            '</select></label></div>',
    }
  };
  $.survey = function(elem, options){
    var p = $(elem);
    var survey;
    while(p.length && (!survey)){
      if(p.data('survey')){
        survey = p.data('survey');
      }
      p = p.parent();
    }
    return survey||$(elem).survey(options);
  };
})(jQuery);