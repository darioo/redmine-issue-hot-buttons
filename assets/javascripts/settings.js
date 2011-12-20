/**
 * Redmine Issue Hot Buttons plugin
 */
document.observe("dom:loaded", function() {

  /**
   * Hot Buttons configuration factory class.
   * Produce Hot Button settings sections
   */
  var ButtonSettingsFactory = Class.create({
    /**
     * "Assign to" me Hot Button
     *
     * @return "Assign to" me Hot Button settings frame
     */
    button_assign_to_me: function(params) {
      return {
        enabled: ['hidden', 1],
        caption: 'text'
      };
    },

    /**
     * "Time tracker" Hot Button
     *
     * @return "Time tracker" Hot Button settings frame
     */
    button_time_tracker: function() {
      return {
        enabled: ['hidden', 1],
        start: 'text',
        pause: 'text',
        resume: 'text',
        stop: 'text',
        autosubmit: 'flag'
      };
    },

    /**
     * "Reassign to" Hot Button
     *
     * @return "Reassign to" Hot Button settings frame
     */
    button_reassign_to: function() {
      return {
        _optional: ['caption2'],
        enabled: ['hidden', 1],
        caption: 'text',
        caption2: 'text',
        conditions: {
          _optional: ['target_user_role', 'has_comment'],
          issue_status: ['multiselect', 123, this.issue_statuses],
          source_user_role: ['multiselect', false, this.user_roles],
          target_user_role: ['multiselect', false, this.user_roles],
          has_comment: 'flag'
        },
        actions: {
          set_issue_status: ['select', false, this.issue_statuses]
        }
      };
    },
    
    button_quick_update: function(params) {
      return {
        enabled: ['hidden', 1],
        caption: ['text'],
        fields:  ['list']
      };
    },

    /**
     * Get hot button config by name
     *
     * @param  name   Hot Button name
     * @param  params Saved button configuration
     * @return Hot Button settings section
     */
    get: function(button_name, params) {
      if (Object.isFunction(this['button_' + button_name])) {
        var button_frame = this['button_' + button_name](params);

        return this.wrap_button(
          button_name,
          this.render_form(button_name, button_frame, params)
        );
      }
      return false;
    },

    /**
     * Wrap Hot Button settings section to li with common elements
     * like Title, Description and section config controls
     *
     * @param  button_name Hot Button name
     * @param  button      Nake hot button config fields
     * @return Complete Hot Button settings section
     */
    wrap_button: function(button_name, button) {
      var t = this;

      var delete_button = new Element('a', {
        'class': 'icon-del icon',
        href: 'javascript:void(0)'
      }).insert(this._('delete'));

      Event.observe(delete_button, 'click', function(event){
        if (! confirm(t._('confirm'))) return false;
        Event.element(event).up(1).remove();
      })

      var elements = [
        new Element('p', {'class': 'title'})
          .insert(this._(button_name))
          .insert(delete_button),

        new Element('p', {'class': 'description'})
          .insert(this._([button_name, 'description'])),

        button
      ];

      var wrapper = new Element('li')
        .addClassName('hot_button')
        .addClassName(button_name);

      elements.each(function(item) {
        wrapper.insert(item);
      });

      return wrapper;
    },

    /**
     * Render Hot Button configuration inputs group
     *
     * @param button_name  Hot button name
     * @param button_frame Hot button structure
     * @param params       Hot button saved params
     *
     */
    render_form: function(button_name, button_frame, params) {
      return this.render_group(
        button_name,
        button_frame,
        new Element('div',{'class': 'fields'}),
        new Hash(params));
    },

    /**
     * Render inputs group and wrap it
     *
     * @param  button_name  Hot button name
     * @param  inputs_group Inputs group object
     * @param  wrap_element Wrapper for button
     * @param  params       Hot button saved params
     * @return Rendered inputs_group wrapped by wrap_element
     */
    render_group: function(button_name, inputs_group, wrap_element, params) {
      var t = this;

      inputs_group = new Hash(inputs_group);

      var optional_fields = inputs_group.get('_optional') || [];

      inputs_group.each(function(pair){
        // ignore service keys that starts with underscore, like "_optional"
        if (! pair.key.indexOf('_')) return false;

        var input_name    = pair.key;
        var input_options = pair.value;

        if (! Object.isString(input_options) && ! Object.isArray(input_options)) {
          var sub_wrapper = new Element('fieldset', {'class': 'subset'}).insert(
            new Element('legend').insert(t._([button_name, input_name, 'subset']))
          );

          t.render_group(button_name, input_options, sub_wrapper, params);
          wrap_element.insert(sub_wrapper);
        }
        else {
          if (! Object.isArray(input_options)) input_options = [input_options];
          var input_type  = input_options.shift();
          var input_value = input_options.shift();
          input_value = params.get(input_name) || input_value;
          var default_value = input_options.shift();
          // special input params like "_optional"
          var service_params = new Hash();
          if (optional_fields.indexOf(input_name) != -1) {
            service_params.set('_optional', true);
          }

          wrap_element.insert(
            t.render_input(
              button_name,
              input_type,
              input_name,
              input_value,
              default_value,
              service_params
            )
          );

        }
      });
      
      return wrap_element;
    },

    /**
     * Render single input
     *
     * @param input_type  Input type
     *  Available types:
     *   - text
     *   - list
     *   - flag
     *   - hidden
     * @param input_name
     * @param input_value
     * @param default_value
     * @param service_params
     */
    render_input: function(button_name, input_type, input_name, input_value, default_value, service_params) {
      var input_element = null;
      var no_label = false;
      var input_id = [button_name, input_name].join('_');

      var isOptional = service_params.get('_optional');

      switch (input_type) {
        case 'hidden':
          input_element = new Element('input', {
            id: input_id,
            xname: input_name,
            type:  'hidden',
            value: input_value
          });
          no_label = true;
          break;

        case 'select':
        case 'multiselect':
          var multiselect = 'multiselect' == input_type;
          
          input_value = input_value.toString();
          input_value = input_value.isJSON() ? input_value.evalJSON() : input_value;
          
          var select = new Element('select', {id: input_id, 'class': input_name})
            .addClassName(isOptional ? 'optional' : '');

          if (multiselect) {
            select.setAttribute('multiple', 'multiple');
            new Hash(default_value).each(function(pair){
              var option_element = new Element('option', {
                value: pair.key,
                name: false
              }).insert(pair.value);
              
              if (Object.isArray(input_value) && input_value.indexOf(pair.key) !== -1) {
                option_element.setAttribute('selected', 'selected')
              }
              select.insert(option_element);
            });
          }
          else {
            new Hash(default_value).each(function(pair){
                select.insert(
                  new Element('option', {value: pair.key,name: false})
                    .insert(pair.value)
              );
            });
            select.value = Object.isArray(input_value) ? input_value.pop() : input_value;
          }
          
          input_element =  [
            select,
            new Element('input', {xname: input_name, type: 'hidden'})
          ];
          
          break;

        case 'flag':
          input_element = [
            new Element('input', {
              xname: input_name,
              type: 'hidden',
              value: 0
            }),
            new Element('input', {
              id: input_id,
              xname: input_name,
              type: 'checkbox',
              value: 1
            }).addClassName(isOptional ? 'optional' : '')
          ];
          var is_undefined = Object.isUndefined(input_value);

          if ((is_undefined && default_value) || (!is_undefined && parseInt(input_value) !== 0)) {
            input_element.last().setAttribute('checked', 'checked')
          }
          break;

        default:
        case 'text':
          input_value = input_value || default_value || (this._([button_name, input_name, 'value'], false) || input_value);
          input_element = new Element('input', {
            id: input_id,
            xname: input_name,
            type: 'text',
            value: input_value || ''
          }).addClassName(isOptional ? 'optional' : '');
      }

      var result = new Element('div', {'class': 'input_wrapper'})
        .insert(no_label || new Element('label', {'for': input_id}).insert(this._([input_id, 'label'])));

      input_element = Object.isArray(input_element) ? input_element : [input_element];
      input_element.each(function(element){
        result.insert(element);
      });

      if (isOptional) {
        var delete_button = new Element('a', {
          'class': 'icon-move icon',
          href: 'javascript:void(0)'
        }).insert(this._('Remove'));
        result.insert(delete_button);
      }

      return result;
    },

    /**
     * Wrapper for Translator.get() method
     * Translate i18n ID to string for current language
     *
     * @param  key i18n ID
     * @param  get_back Get back i18n ID if translation not exists
     * @return Translated string for current language
     */
    _: function(key, get_back) {
      return this.translator.get(key, get_back);
    }
  });


  /**
   * Translator class
   */
  var Translator = Class.create({
    /**
     * Constructor.
     * Initialize translator
     *
     * @param  i18n strings object
     * @return void
     */
    initialize: function(i18n_strings) {
      this.i18n_strings = new Hash(i18n_strings);
    },

    /**
     * Translate string using IssueHotButtonsSettings locale strings store
     *
     * @param  key i18n identifier
     * @param  get_back Get back i18n ID if translation not exists
     * @return Translated string or input key if translation not found
     */
    get: function(key, get_back) {
      get_back = get_back === false ? false : true;
      if (Object.isArray(key)) key = key.join('_');
      return this.i18n_strings.get(key) || (get_back ? key : false);
    }
  });

  /**
   * Settings page class
   */
  var Settings = Class.create(IssueHotButtonsSettings, {
    /**
     * Available Hot Buttons
     */
    available_buttons: [
      'assign_to_me',
      'reassign_to',
      'quick_update',
      'time_tracker'
    ],

    /**
     * Constructor.
     * Initialize settings page
     *
     * @return void
     */
    initialize: function() {
      this.buttons_factory = new ButtonSettingsFactory();

      // Assign custom fields to ButtonSettingsFactory
      this.buttons_factory.custom_fields = this.custom_fields;
      this.buttons_factory.issue_statuses = this.issue_statuses;
      this.buttons_factory.user_roles = this.user_roles;

      this.translator = this.buttons_factory.translator = new Translator(this.i18n_strings);

      this.render_selector();
      this.load_saved_buttons();

      $$('input[name="commit"]').first().observe('click', this.attach_input_names);
    },

    /**
     * Render to page exists configured Hot Buttons
     *
     * @return void
     */
    load_saved_buttons: function() {
      if (Object.isUndefined(this.settings)) return false;

      var t = this;
      new Hash(this.settings).values().each(function(button_config){
        var button_config = new Hash(button_config);
        var name = button_config.keys().first();
        var params = button_config.values().first();

        t.render_button(name, params);
      });
    },

    /**
     * Make buttons list sortable
     */
    init_sortable_list: function() {
      Sortable.create('buttons_list', {
        tag:'li',
        onChange: function(){}
      });
    },

    /**
     * Callback invoked before settings form submitted
     */
    attach_input_names: function(e) {
      var button_number = 0;
      $$('li.hot_button').each(function(li){
        var button_type = li.classNames().toArray().pop();

        li.select('input').each(function(element){
          var xname = element.readAttribute('xname');
          var name = [button_number, button_type, xname].join('][');
          name = 'settings[' + name + ']';
          element.setAttribute('name', name);
        });
        
        li.select('select').each(function(select){
          var values = [];
          if (select.hasAttribute('multiple')) {
            select.select('option:selected').each(function(option){
              values.push(option.value);
            });
          }
          else {
            values.push(select.value);
          }
          select.siblings().last().value = Object.toJSON(values);
        });
        
        button_number++;
      });
    },

    /**
     * Render to page "Add Hot Button" select
     */
    render_selector: function() {
      var t = this;

      var wrapper = new Element('div', {id: 'hot_buttons_selector_wrapper'});

      var label = new Element('label', {'for': 'hot_buttons_selector'})
        .insert(this._('select_hot_button'));
      wrapper.insert(label);

      var select = new Element('select', {id: 'hot_buttons_selector'});
      var buttons = this.available_buttons;
      buttons.unshift(false);
      buttons.each(function(button_id){
        var option = new Element('option', {
          value: button_id
        }).insert(t._(button_id));
        select.appendChild(option);
      });
      wrapper.appendChild(select);

      var add_button = new Element('a', {
        'class': 'icon-add icon',
        href: 'javascript:void(0)'
      }).insert(this._('add'));
      wrapper.appendChild(add_button);

      Event.observe(add_button, 'click', function(){
        var button_name = $('hot_buttons_selector').value;
        if (button_name.length == 0) return false;

        t.render_button(button_name);
      })

      $('hot_buttons_settings').appendChild(wrapper);
    },

    /**
     * Render Hot Button
     *
     * @return void
     */
    render_button: function(button_name, params) {
      // Create buttons list, if not exists
      if ($('buttons_list') == null) {
        $('hot_buttons_settings').appendChild(new Element('ul', {id: 'buttons_list'}));
      }

      var button = this.buttons_factory.get(button_name, params)

      $('buttons_list').insert(button);
      this.init_sortable_list();
    },

    /**
     * Wrapper for Translator.get() method
     * Translate i18n ID to string for current language
     *
     * @param  key      i18n ID
     * @param  get_back Get back i18n ID if translation not exists
     * @return Translated string for current language
     */
    _: function(key, get_back) {
      return this.translator.get(key, get_back);
    }
  });

  // Initialize settings page!
  new Settings();
});