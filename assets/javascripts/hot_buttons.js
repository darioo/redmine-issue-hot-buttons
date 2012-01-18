/**
 * Redmine Issue Hot Buttons plugin
 * Issue page
 */
document.observe('dom:loaded', function(){

  /**
   * Parent object for all hot buttons
   */
  var AbstractHotButton = Class.create(IssueHotButtons, {

    /**
     * Constructor
     */
    initialize: function(){
      this.i18n_strings = new Hash(this.i18n_strings);
    },

    /**
     * Translate string using IssueHotButtonsSettings locale strings store
     *
     * @param  key i18n identifier
     * @param  get_back Get back i18n ID if translation not exists
     *
     * @return Translated string or input key if translation not found
     */
    _: function(key, get_back){
      get_back = get_back === false ? false : true;
      if (Object.isArray(key)) key = key.join('_');
      return this.i18n_strings.get(key) || (get_back ? key : false);
    },

    /**
     * Check is button suitable for current context
     *
     * @return boolean
     */
    check_conditions: function() {
      var t = this;

      // User role condition
      var user_roles = this.config.get('user_role');
      if (user_roles) {
        user_roles = user_roles.evalJSON();

        var available_users = [];
        user_roles.each(function(role){
          if (! Object.isUndefined(t.users_per_role[role])) {
            available_users = available_users.concat(t.users_per_role[role]);
          }
        });
        if(0 > available_users.uniq().indexOf(t.current_user)) return false;
      }

      // Issue status condition
      var issue_statuses = this.config.get('issue_status');
      if (issue_statuses) {
        issue_statuses = issue_statuses.evalJSON();
        if(0 > issue_statuses.indexOf(t.issue.status_id.toString())) return false;
      }

      // Issue tracker condition
      var issue_tracker = this.config.get('issue_tracker');
      if (issue_tracker) {
        issue_tracker = issue_tracker.evalJSON();
        if (0 > issue_tracker.indexOf(t.issue.tracker_id.toString())) return false;
      }

      return true;
    },

    /**
     * Hide optional button controls
     *
     * @param event (optional) If method used as event listener
     * @return void
     */
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

    /**
     * Clone element from issue update form
     * Perform additional things for fileds with datepickers
     *
     * @param element_id Element ID
     * @return form element
     */
    get_mirrored_element: function(element_id) {
      var tmp_id = [element_id, Math.round(Math.random() * 10000000)].join('_');

      var original_element = $(element_id);
      if (! original_element) return false;

      var mirrored_element = original_element.up().clone(true);
      mirrored_element.select('input, select, textarea').each(function(element){
        if ('hidden' === element.type) {
          element.remove();
          return;
        }
        element.writeAttribute('id', tmp_id);
        element.addClassName(element_id);
      });
      var mirrored_label = mirrored_element.select('label').first();
      mirrored_label.writeAttribute('for', tmp_id);
      

      // Special magic for calendar inputs
      var calendar_field = mirrored_element.select('img.calendar-trigger').first();
      if (! Object.isUndefined(calendar_field)) {
        calendar_field.removeAttribute('id');
        Calendar.setup({
          inputField : mirrored_element.select('input').first(),
          ifFormat : '%Y-%m-%d',
          button : calendar_field
        });
      }

      // Special magic for textareas
      var textarea = mirrored_element.select('textarea').first();
      if (! Object.isUndefined(textarea)) {
        textarea.removeAttribute('style');
        textarea.writeAttribute('cols', 30);
        textarea.writeAttribute('rows', 5);

      }

      /*Event.observe(mirrored_element.select('input,select').first(), 'change', function(event) {
        original_element.value = Event.element(event).value;
      });*/

      return mirrored_element;
    }

  });

  /**
   * Issue Update Hot Button
   */
  var IssueUpdateButton = Class.create(AbstractHotButton, {

    /**
     * Optional fileds in custom order
     */
    fields: [
      'assign_to_other',
      'include_standart_fields',
      'include_custom_fields',
      'include_comment',
    ],

    /**
     * Hot button rendering entry point
     *
     * @param config
     * @return <button /> element
     */
    render: function(config) {
      this.config = new Hash(config);

      // button is not suitable for current context
      if (! this.check_conditions()) return false;

      return this.render_button();
    },

    /**
     * Check is button need optional controls,
     * e.g. select user for reassign
     *
     * @return boolean
     */
    has_additional_controls: function(){
      var t = this;
      var no_additional = true;
      [
        'assign_to_other',
        'include_standart_fields',
        'include_custom_fields',
        'include_comment',
      ].each(function(i){
        if (! Object.isUndefined(t.config.get(i))) {
          switch(i) {
            case 'assign_to_other':
              var assign_to = t.config.get('assign_to_other').evalJSON();
              if (! (assign_to.length == 1 && assign_to.first() == 'current_user')) {
                no_additional = no_additional && false;
              }
              break;
            default:
              no_additional = no_additional && false;
              break;
          };
        }
      });
      return ! no_additional;
    },

    /**
     * Render hot button and attach click listener
     *
     * @return <button /> element
     */
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

    /**
     * Event listener for hot buttons with optional controls
     * Displays opt. controls and add event listeners
     *
     * @param event Event
     * @param t     IssueUpdateButton context
     * @return void
     */
    hot_button_opt_action: function(event, t) {
      var hot_button = Event.element(event);
      
      hot_button.up().select('button').each(function(btn){
        btn.writeAttribute('disabled', 'disabled');
        btn.setStyle({opacity: 0.15});
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
        id: 'issue_hot_buttons_additional',
        'class': 'update_issue'
      })
        .insert(new Element('div', {'class': 'controls'}).insert(close_button))
        .insert(additional_wrapper);

      $('issue_hot_buttons').insert({after: additional_container});
    },

    /**
     * Render optional controls
     *
     * @param button_config Hot button configuration
     * @return array Hot buttons array
     */
    get_opt_controls: function(button_config) {
      t = this;
      var elements = [];

      this.fields.each(function(field){
        if (! button_config.get(field)) return false;
        switch(field) {

          case 'assign_to_other':
            var assign_to_roles = button_config.get('assign_to_other').evalJSON();
            if (assign_to_roles.length == 1 && assign_to_roles.first() == 'current_user') {
              return;
            }
            var mirrored_element = t.get_mirrored_element('issue_assigned_to_id');

            var allowed_users = [];
            assign_to_roles.each(function(role_id){
              allowed_users = allowed_users.concat(t.users_per_role[role_id]);
            });
            allowed_users = allowed_users.uniq();
            mirrored_element.select('select option').each(function(option){
              value = parseInt(option.readAttribute('value'));
              if (0 > allowed_users.indexOf(value)) {
                option.remove();
              }
            });

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
            var comment_element = new Element('p');
            comment_element.insert(new Element('label').update(t._('notes')));
            comment_element.insert(new Element('textarea', {
              cols: 30,
              rows: 5
            }));
            elements.push(comment_element);
            break;

        }
      });
      return elements;
    },

    /**
     * Submit hot button action
     *
     * @param event Event object
     * @param t     IssueUpdateButton context
     */
    hot_button_submit_action: function(event, t){
      var button = Event.element(event);

      // Submit here

    }

  });

  /**
   * Time Tracker Hot Button
   */
  var TimeTrackerButton = Class.create(AbstractHotButton, {

    /**
     * Hot button rendering entry point
     *
     * @param config
     * @return <button /> element
     */
    render: function(config) {
      this.config = new Hash(config);

      // button is not suitable for current context
      if (! this.check_conditions()) return false;

      return this.render_button();
    },

    /**
     * Render TimeTracker Hot Button
     *
     * @return <button /> element
     */
    render_button: function() {
      var t = this;
      var start_working = new Element('button', {'class': 'action'})
        .update(this.config.get('start'));

      Event.observe(start_working, 'click', function(event) {
        t.start_working_action(event, t);
      });

      return start_working;
    },

    start_working_action: function(event, t) {
      var hot_button = Event.element(event);
      hot_button.up().select('button').each(function(btn){
        btn.writeAttribute('disabled', 'disabled');
        btn.setStyle({opacity: 0.15});
      });
      hot_button.setStyle({opacity: 1});

      var include_seconds = t.config.get('with_seconds');
      include_seconds = include_seconds ? include_seconds.evalJSON() : false;
      var timer_label = new Element('label', {'class': 'timer'});
      var timer_ingredients = [
        new Element('span', {'class': 'hours'}).update('00'),
        new Element('span', {'class': 'minutes_divisor'}).update(':'),
        new Element('span', {'class': 'minutes'}).update('00')
      ];
      var timer_prefix = t.config.get('timer_prefix');
      timer_prefix && timer_ingredients.unshift(
        new Element('span', {'class': 'prefix'}).update(timer_prefix)
      );
      if (include_seconds) {
        timer_ingredients.push(
          new Element('span', {'class': 'seconds_divisor'}).update(':'),
          new Element('span', {'class': 'seconds'}).update('00')
        );
      }
      timer_ingredients.each(function(element){
        timer_label.insert(element);
      });
      timer_label.include_seconds = include_seconds;
      t.init_timer(timer_label);

      var pause_button = new Element('button', {
        'class': 'pause'
      })
        .update(t.config.get('pause'))
        .observe('click', t.pause_button_action);

      var resume_button = new Element('button', {
        'class': 'resume',
        'style': 'display: none;'
      })
        .update(t.config.get('resume'))
        .observe('click', t.resume_button_action);

      var stop_button = new Element('button', {
        'class': 'stop'
      })
        .update(t.config.get('stop'))
        .observe('click', function(event) {
          timer_label.status = 'stop';
          t.finish_action(event, t);
          t.hide_optional();
        });
      stop_button.config = t.config;

      var timer_controls = new Element('div', {
        'class': 'timer_controls'
      })
        .insert(timer_label)
        .insert(pause_button)
        .insert(resume_button)
        .insert(stop_button);

      var optional_controls = new Element('div', {
        'class': 'optional_controls'
      });

      t.get_opt_controls(t.config).each(function(element){
        optional_controls.insert(element);
      });

      var additional_wrapper = new Element('div', {
        'class': 'optional_wrapper'
      })
        .insert(timer_controls)
        .insert(optional_controls);

      var close_button = new Element('a', {
        'class': 'icon_close',
        href: 'javascript:void(0)'
      })
        .observe('click', function(event) {
          timer_label.status = 'stop';
          t.hide_optional(event);
        })

      var additional_container = new Element('div', {
        id: 'issue_hot_buttons_additional',
        'class': 'time_tracker'
      })
        .insert(new Element('div', {'class': 'controls'}).insert(close_button))
        .insert(additional_wrapper);

      $('issue_hot_buttons').insert({after: additional_container});
    },

    /**
     * Render optional controls
     *
     * @param button_config Hot button configuration
     * @return array Hot buttons array
     */
    get_opt_controls: function(button_config) {
      t = this;
      var elements = [];

      var select_activity_element = this.get_mirrored_element('time_entry_activity_id');
      var activity_selector = select_activity_element.select('select').first();
      // remove "-- Please select --" item
      activity_selector.select('option').first().remove();
      var activity = button_config.get('activity').evalJSON().pop();
      activity_selector.value = activity;
      var select_activity = button_config.get('select_activity');
      select_activity = select_activity ? select_activity.evalJSON() : false;
      if (! select_activity) {
        activity_selector.writeAttribute('disabled', 'disabled')
      }

      elements.push(select_activity_element);

      var custom_fields = button_config.get('include_custom_fields');
      custom_fields = custom_fields ? custom_fields.evalJSON() : false;
      if (custom_fields) {
        custom_fields.each(function(custom_field_id){
          elements.push(t.get_mirrored_element(
            ['time_entry_custom_field_values', custom_field_id].join('_')
          ));
        });
      }

      var include_comment = button_config.get('include_comment');
      include_comment = include_comment ? include_comment.evalJSON() : false;
      if (include_comment) {
        elements.push(t.get_mirrored_element('time_entry_comments'));
      }

      return elements;
    },

    init_timer: function(label) {
      var mode = ['run', 'pause', 'stop'];

      label.elapsed = 0;
      label.status = 'run';
      
      new PeriodicalExecuter(function(pe) {
        if (0 > mode.indexOf(label.status)) pe.stop();
        if ('stop'  === label.status) pe.stop();
        if ('pause' === label.status) return;

        label.elapsed++

        var hours = Math.floor(label.elapsed / (60 * 60));
        var divisor_for_minutes = label.elapsed % (60 * 60);
        var minutes = Math.floor(divisor_for_minutes / 60);
        var divisor_for_seconds = divisor_for_minutes % 60;
        var seconds = Math.ceil(divisor_for_seconds);
        
        label.select('.hours').first().update(hours < 10 ? '0'.concat(hours): hours);
        label.select('.minutes').first().update(minutes < 10? '0'.concat(minutes): minutes);
        
        if (label.include_seconds) {
          label.select('.seconds').first().update(seconds < 10? '0'.concat(seconds): seconds);
        }
        else {
          var minutes_divisor = label.select('.minutes_divisor').first();
          if (! minutes_divisor.readAttribute('style')) {
            minutes_divisor.writeAttribute('style', 'visibility: hidden');
          }
          else {
            minutes_divisor.removeAttribute('style');
          }
        }
      }, 1);
    },

    pause_button_action: function(event) {
      var button = Event.element(event);
      button.up().select('button.resume').first().show();
      button.up().select('label.timer').first().status = 'pause';
      button.hide();
    },

    resume_button_action: function(event) {
      var button = Event.element(event);
      button.up().select('button.pause').first().show();
      button.up().select('label.timer').first().status = 'run';
      button.hide();
    },

    /**
     * Finish(stop) button action
     *
     * @param event Event object
     * @param t     IssueUpdateButton context
     */
    finish_action: function(event, t){
      var button = Event.element(event);

      // Submit here
      
    }

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
        issue_update: new IssueUpdateButton,
        time_tracker: new TimeTrackerButton
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
 