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
      return new Element('input', {type: 'hidden', xname: 'enabled'});
    },

    /**
     * "Time tracker" Hot Button
     *
     * @param  params Saved button configuration
     * @return "Time tracker" Hot Button settings section
     */
    button_time_tracker: function(params) {
      return {
        options: {
          unique: true
        }
      };
    },

    /**
     * "Reassign to" Hot Button
     *
     * @param  params Saved button configuration
     * @return "Reassign to" Hot Button settings section
     */
    button_reassign_to: function(params) {
      return {
        options: {}
      };
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
      var elements = [
        new Element('p', {class: 'title'})
          .insert(this._([button_name, 'title'])),

        new Element('p', {class: 'description'})
          .insert(this._([button_name, 'description'])),

        new Element('div', {class: 'fields'})
          .insert(button)
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
      this.translator = this.buttons_factory.translator = new Translator(this.i18n_strings);

      this.render_selector();
      this.load_saved_buttons();
    },

    /**
     * Render to page exists configured Hot Buttons
     */
    load_saved_buttons: function() {},

    /**
     * Make buttons list sortable
     */
    init_sortable_list: function() {},

    /**
     * Callback invoked before settings form submitted
     */
    before_form_submit: function() {},

    /**
     * Render to page "Add Hot Button" select
     */
    render_selector: function() {
      var t = this;

      var wrapper = new Element('div', {id: 'hot_buttons_selector_wrapper'});

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
      }).insert('Add');
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