/**
 * Redmine Issue Hot Buttons plugin
 * Settings page
 */
document.observe('dom:loaded', function() {

  /**
   * Hot Buttons configuration factory.
   * Produce Hot Button settings sections
   */
  var ButtonSettingsFactory = Class.create({

    /**
     * "Time tracker" Hot Button fields frame
     *
     * @return "Time tracker" Hot Button settings frame
     */
    button_time_tracker: function() {
      return {
        enabled: ['hidden', 1],
        internal_name: ['hidden', ''],
        start: 'text',
        pause: 'text',
        resume: 'text',
        stop: 'text',
        options: {
          _optional: ['include_comment', 'autosubmit'],
          include_comment: 'flag',
          autosubmit: 'flag'
        },
        conditions: {
          _optional: ['user_role', 'issue_status', 'issue_tracker'],
          user_role: ['multiselect', false, this.user_roles],
          issue_status: ['multiselect', false, this.issue_statuses],
          issue_tracker: ['multiselect', false, this.issue_trackers]
        }
      };
    },

    /**
     * "Reassign to" Hot Button fields frame
     *
     * @return "Reassign to" Hot Button settings frame
     */
    button_issue_update: function() {
      return {
        enabled: ['hidden', 1],
        internal_name: ['hidden', ''],
        caption: 'text',
        conditions: {
          _optional: ['user_role', 'issue_status', 'issue_tracker'],
          user_role: ['multiselect', false, this.user_roles],
          issue_status: ['multiselect', false, this.issue_statuses],
          issue_tracker: ['multiselect', false, this.issue_trackers]
        },
        actions: {
          _optional: [
            'set_issue_status','assign_to_other',
            'set_done', 'include_standart_fields', 'include_custom_fields',
            'include_comment'
          ],
          set_issue_status: ['select', false, this.issue_statuses],
          assign_to_other: ['multiselect', false, this.user_roles],
          set_done: 'flag',
          include_standart_fields: ['multiselect', false, this.standart_fields],
          include_custom_fields: ['multiselect', false, this.custom_fields],
          include_comment: 'flag'
        }
      }
    },

    /**
     * Get hot button config by name
     *
     * @param  name   Hot Button name
     * @param  params Saved button configuration
     *
     * @return Hot Button settings section
     */
    get: function(button_name, params) {
      if (Object.isFunction(this['button_' + button_name])) {
        var button_frame = this['button_' + button_name](params);


        var config_section_name = !Object.isUndefined(params) &&
          ! Object.isUndefined(params.internal_name) &&
          params['internal_name'].strip();

        return this.wrap_button(
          button_name,
          this.render_form(button_name, button_frame, params),
          config_section_name || this._(button_name)
        );
      }
      return false;
    },

    /**
     * Wrap Hot Button settings section to li with common elements
     * like Title, Description and section config controls
     *
     * @param  button_name         Hot Button name
     * @param  button              Nake hot button config fields
     * @param  config_section_name Hot button internal name
     *
     * @return Complete Hot Button settings section
     */
    wrap_button: function(button_name, button, config_section_name) {
      var t = this;

      var delete_button = new Element('a', {
        'class': 'icon-del icon',
        href: 'javascript:void(0)'
      }).insert(this._('delete'));

      Event.observe(delete_button, 'click', function(event){
        if (! confirm(t._('confirm'))) return false;
        Event.element(event).up(1).remove();
      })

      var config_section_title = new Element('a',{
        'class': 'collapse_section internal_name',
        href: 'javascript:void(0)'
      })
        .update(config_section_name);

      Event.observe(config_section_title, 'click', function(event){
        var config_section = Event.element(event).up('.hot_button');
        if (config_section.hasClassName('collapsed')) {
          config_section.removeClassName('collapsed');
        }
        else {
          config_section.addClassName('collapsed');
        }
      })

      var internal_name_input = new Element('input', {
        type: 'text',
        'class': 'internal_name',
        value: config_section_name
      }).hide();

      var edit_internal_name = new Element('a', {
        'class': 'icon-edit icon edit_internal_name',
        href: 'javascript:void(0)'
      }).insert(this._('rename'));

      Event.observe(edit_internal_name, 'click', function(event){
        var button_edit = Event.element(event);
        var wrapper = button_edit.up();

        var button_save = wrapper.select('a.save_internal_name').first();
        var name_input = wrapper.select('input.internal_name').first();
        var name_link = wrapper.select('a.internal_name').first();

        name_input.value = name_link.innerHTML;

        button_save.show();
        name_input.show().focus();

        button_edit.hide();
        name_link.hide();
      });

      var save_internal_name = new Element('a', {
        'class': 'icon-save icon save_internal_name',
        href: 'javascript:void(0)'
      })
        .insert(this._('save'))
        .hide();

      Event.observe(save_internal_name, 'click', function(event){
        var button_save = Event.element(event);
        var wrapper = button_save.up();

        var button_edit = wrapper.select('a.edit_internal_name').first();
        var name_input = wrapper.select('input.internal_name').first();
        var name_link = wrapper.select('a.internal_name').first();

        button_edit.show();
        name_input.hide();
        button_save.hide();
        name_link.show();

        var internal_name_value = name_input.value.trim();
        name_link.update(internal_name_value);

        button_save.up(1).select('input[xname="internal_name"]')
          .first()
          .value = internal_name_value;
      });

      var elements = [
        new Element('p', {'class': 'title'})
          .insert(config_section_title)
          .insert(internal_name_input)
          .insert(save_internal_name)
          .insert(edit_internal_name)
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
     * @param  button_name  Hot button name
     * @param  button_frame Hot button structure
     * @param  params       Hot button saved params
     *
     * @return Hot button settings form
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
     *
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
          var sub_wrapper = new Element('fieldset', {
            'class': 'subset'
          });

          var legend = false;
          if (legend = t._([button_name, input_name, 'subset'], false)) {
            sub_wrapper.insert(
              new Element('legend').insert(legend)
            );
          }

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
     * @param  input_type  Input type
     *  Available types:
     *   - text
     *   - select
     *   - multiselect
     *   - flag
     *   - hidden
     * @param  input_name
     * @param  inpulistt_value
     * @param  default_value
     * @param  service_params
     *
     * @return Sigle input for hot button settings form
     */
    render_input: function(button_name, input_type, input_name, input_value, default_value, service_params) {
      var input_element = null;
      var no_label = false;

      var isOptional = service_params.get('_optional');

      switch (input_type) {
        case 'hidden':
          input_element = new Element('input', {
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
          
          var select = new Element('select', {'class': input_name})
            .addClassName(isOptional ? 'optional' : '')
            .addClassName(input_value.length ? '' : 'no_value');

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
          var is_undefined = Object.isUndefined(input_value);
          input_element = [
            new Element('input', {
              xname: input_name,
              type: 'hidden',
              value: 0
            }),
            new Element('input', {
              xname: input_name,
              'class': input_name,
              type: 'checkbox',
              value: 1
            })
              .addClassName(isOptional ? 'optional' : '')
              .addClassName(is_undefined ? 'no_value' : '')
          ];

          if ((is_undefined && default_value) || (!is_undefined && parseInt(input_value) !== 0)) {
            input_element.last().setAttribute('checked', 'checked')
          }
          break;

        default:
        case 'text':
          var is_no_value = Object.isUndefined(input_value) || ! input_value;

          input_value = input_value || default_value || (this._([button_name, input_name, 'value'], false) || input_value);
          input_element = new Element('input', {
            xname: input_name,
            type: 'text',
            value: input_value || ''
          })
            .addClassName(isOptional ? 'optional' : '')
            .addClassName(is_no_value ? 'no_value' : '');
      }

      var result = new Element('div', {'class': 'input_wrapper'})
        .insert(no_label || new Element('label').insert(this._([button_name, input_name, 'label'])));

      input_element = Object.isArray(input_element) ? input_element : [input_element];
      input_element.each(function(element){
        result.insert(element);
      });

      if (isOptional) {
        var delete_button = new Element('a', {
          'class': 'icon-move icon',
          href: 'javascript:void(0)'
        }).insert(this._('Remove'));

        t = this;

        Event.observe(delete_button, 'click', function(event){
          var optional_field = Event.element(event).up().select('.optional').first();
          t.hide_optional_field(optional_field);
        });


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
     *
     * @return Translated string for current language
     */
    _: function(key, get_back) {
      return this.translator.get(key, get_back);
    }
  });


  /**
   * Translator
   */
  var Translator = Class.create({
    /**
     * Constructor.
     * Initialize translator
     *
     * @param  i18n strings class object
     *
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
     *
     * @return Translated string or input key if translation not found
     */
    get: function(key, get_back) {
      get_back = get_back === false ? false : true;
      if (Object.isArray(key)) key = key.join('_');
      return this.i18n_strings.get(key) || (get_back ? key : false);
    }
  });

  /**
   * Settings page
   */
  var Settings = Class.create(IssueHotButtonsSettings, {

    /**
     * Available Hot Buttons
     */
    available_buttons: [
      'time_tracker',
      'issue_update'
    ],

    /**
     * Constructor.
     * Initialize settings page
     *
     * @return void
     */
    initialize: function() {
      this.buttons_factory = new ButtonSettingsFactory();

      this.translator = this.buttons_factory.translator = new Translator(this.i18n_strings);

      // Assign custom fields to ButtonSettingsFactory
      this.buttons_factory.custom_fields = this.custom_fields;
      this.buttons_factory.standart_fields = this.standart_fields;
      this.buttons_factory.issue_statuses = this.issue_statuses;
      this.buttons_factory.issue_trackers = this.issue_trackers;
      this.user_roles['current_user'] = '&lt;&lt; ' + this._('current_user') + ' &gt;&gt;';
      this.buttons_factory.user_roles = this.user_roles;


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

        t.render_button(name, params, true);
      });
    },

    /**
     * Make buttons list sortable
     *
     * @return void
     */
    init_sortable_list: function() {
      Sortable.create('buttons_list', {
        tag:'li',
        onChange: function(){}
      });
    },

    /**
     * Callback invoked before settings form submitted
     *
     * @param  e Event object
     *
     * @return void
     */
    attach_input_names: function(e) {
      var button_number = 0;
      $$('li.hot_button').each(function(li){
        var collapsed = li.hasClassName('collapsed');
        if (collapsed) {
          li.removeClassName('collapsed');
        }

        var button_type = li.classNames().toArray().pop();

        li.select('.input_wrapper input').each(function(element){
          if (! element.up().visible()) return;

          var xname = element.readAttribute('xname');
          var name = [button_number, button_type, xname].join('][');
          name = 'settings[' + name + ']';
          element.setAttribute('name', name);
        });
        
        li.select('.input_wrapper select').each(function(select){
          if (! select.up().visible()) return;

          var values = [];
          if (select.hasAttribute('multiple')) {
            select.select('option:selected').each(function(option){
              values.push(option.value);
            });
          }
          else {
            values.push(select.value);
          }
          select.up().select('input').first().value = Object.toJSON(values);
        });

        if (collapsed) {
          li.addClassName('collapsed');
        }
        button_number++;
      });
    },

    /**
     * Render to page "Add Hot Button" select
     *
     * @return void
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

      var add_button_event_callback = function(){
        var button_name = $('hot_buttons_selector').value;
        if (button_name.length == 0) return false;

        t.render_button(button_name);
      }

      Event.observe(add_button, 'click', add_button_event_callback);
      Event.observe(select, 'change', add_button_event_callback);

      $('hot_buttons_settings').appendChild(wrapper);
    },

    /**
     * Render Hot Button
     *
     * @return void
     */
    render_button: function(button_name, params, collapsed) {
      // Create buttons list, if not exists
      if ($('buttons_list') == null) {
        $('hot_buttons_settings').appendChild(new Element('ul', {id: 'buttons_list'}));
      }

      var button = this.buttons_factory.get(button_name, params)
      if (button && collapsed) {
        button.addClassName('collapsed');
      }

      $('buttons_list').insert(button);
      this.hide_optional_fields(button);
      this.init_sortable_list();
    },

    hide_optional_fields: function(button) {
      if (! button) return;
      t = this;
      var hidden_fields_selector = new Element('select', {
        'class': 'optional_fields'
      });
      button.select('.optional.no_value').each(function(field){
        t.hide_optional_field(field)
      });
    },

    hide_optional_field: function(field){
      t = this;

      var label_text = field.siblings().first().innerHTML;
      var element_name = field.classNames().toArray().first();

      var field_wrapper = field.up();
      var field_container = field_wrapper.up();

      var optional_fields_select = null;
      if (! field_container.select('select.optional_fields').length) {
        optional_fields_select = new Element('select', {
          'class': 'optional_fields'
        }).insert(new Element('option'));

        Event.observe(optional_fields_select, 'change', function(event){
          var optional_select = Event.element(event);
          var button_name = optional_select.value;
          if (button_name.length == 0) return false;
          var optional_field = optional_select.up(1).select('.' + button_name).first().up();
          optional_field.show();

          var option = optional_select.select('option[value="' + button_name + '"]').first();
          option.remove();
          if(optional_select.select('option').length == 1) {
            optional_select.up().remove();
          }
        });

        field_container.insert({
          top: new Element('div', {'class': 'optional_elements_selector'})
            .insert(new Element('label').update(this._('select_hidden_elements')))
            .insert(optional_fields_select)
        })
      }
      else {
        optional_fields_select = field_container.select('select.optional_fields').first();
      }
      optional_fields_select.insert(
        new Element('option', {value: element_name}).update(label_text)
      );

      field_wrapper.hide();
    },

    /**
     * Wrapper for Translator.get() method
     * Translate i18n ID to string for current language
     *
     * @param  key      i18n ID
     * @param  get_back Get back i18n ID if translation not exists
     * 
     * @return Translated string for current language
     */
    _: function(key, get_back) {
      return this.translator.get(key, get_back);
    }
  });

  // Initialize settings page!
  new Settings();
});