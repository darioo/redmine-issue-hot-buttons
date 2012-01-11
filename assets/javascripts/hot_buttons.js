/**
 * Redmine Issue Hot Buttons plugin
 * Issue page
 */
document.observe('dom:loaded', function(){

  var AbstractHotButton = Class.create(IssueHotButtons, {
    initialize: function(){
      this.i18n_strings = new Hash(this.i18n_strings);
    },
    _: function(key, get_back){
      get_back = get_back === false ? false : true;
      if (Object.isArray(key)) key = key.join('_');
      return this.i18n_strings.get(key) || (get_back ? key : false);
    }
  });

  /**
   * Issue Update Hot Button
   */
  var IssueUpdateButton = Class.create(AbstractHotButton, {

    render: function(config) {
      this.config = new Hash(config);

      // button is not suitable for current context
      if (! this.check_conditions()) return false;

      return this.render_button();
    },

    check_conditions: function() {
      return true
    },

    has_additional_controls: function(){
      var t = this;
      var has_additional = false;
      [
        'assign_to_other',
        'include_standart_fields',
        'include_custom_fields',
        'include_comment',
      ].each(function(i){
        if (! Object.isUndefined(t.config.get(i))) return has_additional = true;
      });
      return has_additional;
    },

    render_button: function() {
      var t = this;
      var button = new Element('button', {'class': 'action'})
        .insert(this.config.get('caption'));
      button.config = this.config;

      if(this.has_additional_controls()) {
        Event.observe(button, 'click', function(event){
          t.hot_button_opt_action(event, t);
        });
      }
      else {
        Event.observe(button, 'click', this.hot_button_action);
      }

      return button;
    },

    hide_optional: function(event) {
      $('issue_hot_buttons').select('button').each(function(btn){
        btn.removeAttribute('disabled');
        btn.setStyle({opacity: 1});
      });

      var element = Event.element(event);
      element.up().remove();
    },

    hot_button_action: function(event){
    },

    hot_button_opt_action: function(event, t) {
      var hot_button = Event.element(event);
      
      hot_button.up().select('button').each(function(btn){
        btn.writeAttribute('disabled', 'disabled');
        btn.setStyle({opacity: 0.3});
      });

      hot_button.setStyle({opacity: 1});

      var additional_wrapper = new Element('span', {
        'class': 'optional_wrapper'
      })
        .insert(new Element('button').insert(t._('submit')));

      var close_button = new Element('a', {
        'class': 'icon_close',
        href: 'javascript:void(0)'
      });
      Event.observe(close_button, 'click', this.hide_optional)

      var additional_container = new Element('div', {
        id: 'issue_hot_buttons_additional'
      })
        .insert(close_button)
        .insert(additional_wrapper);

      $('issue_hot_buttons').insert({after: additional_container});
    }

  });

  /**
   * Time Tracker Hot Button
   */
  var TimeTrackerButton = Class.create({
  });

  /**
   * Hot buttons initializer
   */
  var HotButtons = Class.create(IssueHotButtons, {

    /**
     * Constructor.
     * Initialize Issue Hot Buttons
     *
     * @return void
     */
    initialize: function() {
      this.buttons = {
        issue_update: new IssueUpdateButton/*,
        time_tracker: new TimeTrackerButton*/
      };
      this.render_hot_buttons();
    },

    /**
     * Render Hot Buttons block
     *
     * @return void
     */
    render_hot_buttons: function() {
      if (Object.isString(this.settings)) {
        // nothing to do, settings is empty
        return false;
      }

      var buttons = [];
      for (var i in this.settings) {
        var hot_button = this.settings[i];
        var button_type   = new Hash(hot_button).keys().first();
        var button_config = new Hash(hot_button).values().first();
        if ('undefined' == typeof this.buttons[button_type]) {
          // unknown button type
          continue;
        }
        var button = this.buttons[button_type].render(button_config);
        button && buttons.push(button);
      }

      if (0 < buttons.length) {
        // attach hot buttons, if exists
        var hot_buttons_container = new Element('div', {'id': 'issue_hot_buttons'});
        buttons.each(function(element){
          hot_buttons_container.insert(element);
        });
        $$('div.issue').first().insert({before: hot_buttons_container});
      }

    }

  });

  // Initialize Hot Buttons!
  new HotButtons();

});
 