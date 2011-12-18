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
     * Get hot button config by name
     *
     * @param  name   Hot Button name
     * @param  params Saved button configuration
     * @return Hot Button settings section
     */
    get: function(name, params) {
      if (Object.isFunction(this['button_' + name])) {
        return this.wrap_button(name, this['button_' + name](params));
      }
      return false;
    },

    /**
     * "Assign to" me Hot Button
     *
     * @param  params Saved button configuration
     * @return "Assign to" me Hot Button settings section
     */
    button_assign_to_me: function(params) {
      return [
        new Element('input', {type: 'hidden', xname: 'enabled', value:1}),
        new Element('label', {for: 'assign_to_me_caption'})
          .insert(this._('caption')),
        new Element('input', {id: 'assign_to_me_caption', type: 'text', xname: 'caption'})
      ];
    },

    /**
     * "Time tracker" Hot Button
     *
     * @param  params Saved button configuration
     * @return "Time tracker" Hot Button settings section
     */
    button_time_tracker: function(params) {
      return new Element('input', {type: 'hidden', xname: 'enabled', value:1});
    },

    /**
     * "Reassign to" Hot Button
     *
     * @param  params Saved button configuration
     * @return "Reassign to" Hot Button settings section
     */
    button_reassign_to: function(params) {
      return new Element('input', {type: 'hidden', xname: 'enabled', value:1});
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
        class: 'icon-del icon',
        href: 'javascript:void(0)'
      }).insert(this._('delete'));

      Event.observe(delete_button, 'click', function(event){
        if (! confirm(t._('confirm'))) return false;
        Event.element(event).up(1).remove();
      })

      button = Object.isArray(button)
        ? button
        : [button];

      var button_fields = new Element('div', {class: 'fields'});
      button.each(function(item){
        button_fields.insert(item)
      });

      var elements = [
        new Element('p', {class: 'title'})
          .insert(this._(button_name))
          .insert(delete_button),

        new Element('p', {class: 'description'})
          .insert(this._([button_name, 'description'])),

        button_fields
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
     * Wrapper for Translator.get() method
     * Translate i18n ID to string for current language
     *
     * @param  key i18n ID
     * @return Translated string for current language
     */
    _: function(key) {
      return this.translator.get(key);
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
     * @return Translated string or input key if translation not found
     */
    get: function(key) {
      if (Object.isArray(key)) key = key.join('_');
      return this.i18n_strings.get(key) || key;
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
      'time_tracker',
      'reassign_to'
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
        li.select('input, textarea, select').each(function(element){
          var xname = element.readAttribute('xname');
          var name = [button_number, button_type, xname].join('][');
          name = 'settings[' + name + ']';
          element.setAttribute('name', name);
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

      var label = new Element('label', {for: 'hot_buttons_selector'})
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
        class: 'icon-add icon',
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
     * @param  key i18n ID
     * @return Translated string for current language
     */
    _: function(key) {
      return this.translator.get(key);
    }
  });

  new Settings();
});