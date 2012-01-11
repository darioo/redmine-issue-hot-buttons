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
        Event.observe(button, 'click', function(event) {
          t.hot_button_submit_action(event, t);
        });
      }

      return button;
    },

    hide_optional: function(event) {
      $('issue_hot_buttons').select('button').each(function(btn){
        btn.removeAttribute('disabled');
        btn.setStyle({opacity: 1});
      });
      if (event) {
        var element = Event.element(event);
        element.up(1).remove();
      }
      else {
        $('issue_hot_buttons_additional').remove();
      }
    },

    hot_button_opt_action: function(event, t) {
      var hot_button = Event.element(event);
      
      hot_button.up().select('button').each(function(btn){
        btn.writeAttribute('disabled', 'disabled');
        btn.setStyle({opacity: 0.3});
      });

      hot_button.setStyle({opacity: 1});

      var submit_button = new Element('button', {'class': 'submit'})
        .insert(t._('submit'));
      submit_button.config = hot_button.config;
      Event.observe(submit_button, 'click', function(event) {
        t.hot_button_submit_action(event, t);
        t.hide_optional();
      });
      
      var additional_wrapper = new Element('div', {
        'class': 'optional_wrapper'
      });

      t.get_opt_controls(hot_button.config).each(function(element) {
        additional_wrapper.insert(element);
      });

      additional_wrapper.insert(submit_button);

      var close_button = new Element('a', {
        'class': 'icon_close',
        href: 'javascript:void(0)'
      });
      Event.observe(close_button, 'click', this.hide_optional)

      var additional_container = new Element('div', {
        id: 'issue_hot_buttons_additional'
      })
        .insert(new Element('div', {'class': 'controls'}).insert(close_button))
        .insert(additional_wrapper)
        .insert(new Element('div', {'class': 'clear'}));

      $('issue_hot_buttons').insert({after: additional_container});
    },

    get_opt_controls: function(button_config) {
      t = this;
      var elements = [];
      button_config.keys().each(function(field){
        switch(field) {

          case 'assign_to_other':
            var assign_to_roles = button_config.get('assign_to_other').evalJSON();
            var mirrored_element = t.get_mirrored_element('issue_assigned_to_id');

            var allowed_users = [];
            assign_to_roles.each(function(role_id){
              allowed_users = allowed_users.concat(t.users_per_role[role_id]);
            });

            mirrored_element.select('select option').each(function(option){
              value = parseInt(option.readAttribute('value'));
              if (0 > allowed_users.indexOf(value)) {
                option.remove();
              }
            });

            $('issue_assigned_to_id').value = mirrored_element.select('select').first().value;
            elements.push(mirrored_element);
            break;

          case 'include_standart_fields':
            var standart_fields = button_config.get('include_standart_fields').evalJSON();
            standart_fields.each(function(standart_field){
              elements.push(t.get_mirrored_element(standart_field));
            });
            break;

          case 'include_custom_fields':
            var custom_fields = button_config.get('include_custom_fields').evalJSON();
            custom_fields.each(function(custom_field_id) {
              elements.push(
                t.get_mirrored_element(['issue_custom_field_values', custom_field_id].join('_'))
              );
            });
            break;

          case 'include_comment':
            break;

        }
      });
      return elements;
    },

    get_mirrored_element: function(element_id) {
      mirror_element_id = ['hot_button', element_id].join('_');

      var original_element = $(element_id);
      if (! original_element) return false;

      var mirrored_element = original_element.up().clone(true);
      mirrored_element.select('input, select').first().writeAttribute('id', mirror_element_id);
      mirrored_element.select('label').first().writeAttribute('for', mirror_element_id);

      var calendar_field = mirrored_element.select('img.calendar-trigger').first();
      if (! Object.isUndefined(calendar_field)) {
        calendar_field.writeAttribute('id', [mirror_element_id, 'trigger'].join('_'));
        Calendar.setup({
          inputField : mirrored_element.select('input').first(),
          ifFormat : '%Y-%m-%d',
          button : calendar_field
        });
      }

      /*Event.observe(mirrored_element.select('input,select').first(), 'change', function(event) {
        original_element.value = Event.element(event).value;
      });*/

      return mirrored_element;
    },

    hot_button_submit_action: function(event, t){
      var hot_button = Event.element(event);
      console.log(hot_button.config)
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
 