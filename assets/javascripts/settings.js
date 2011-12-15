document.observe("dom:loaded", function() {

  function init_sortable_list() {
    Sortable.create('buttons_list', {
      tag:'li',
      onChange: function(){}
    });
  }

  function init_saved_buttons() {
    if ('undefined' != typeof settings) {
      for (var button_number in settings) {
        var button = settings[button_number];
        for (var button_name in button) {
          var button_options = button[button_name];
          add_hot_button_to_list(button_name, button_options);
        }
      }
    }
  }

  function add_hot_button_to_list(button_name, button_options) {
    var button_element = $$('#buttons_repository li[button_id="' + button_name + '"]');
    if (0 == button_element.length) return false;

    button_element = button_element[0];

    if (button_element.hasClassName('unique')) {
      var exists = $$('#buttons_list li[button_id="' + button_name + '"]').length != 0;
      if (exists) return false;

    }
		
		button_element = button_element.clone(true);

    if ('undefined' != typeof button_options) {
      for (var key in button_options) {
        var value = button_options[key];


        var selector = [
          'input[sname="' + key + '"]',
          'textarea[sname="' + key + '"]'
        ].join(',');

        input_element = button_element.select(selector);
        if (input_element.length > 0) {
          input_element = input_element[0];
          input_element.value = value;
        }
      }
    }

    $('buttons_list').insert(button_element);

    $$('.delete_hot_button').invoke('observe', 'click', delete_hot_button.bindAsEventListener('compare', this));
    init_sortable_list();
  }

  function add_hot_button_click(event) {
    var button_name = $$('#hot_button_select')[0].value;
    if (0 == button_name.length) return false;
    
    add_hot_button_to_list(button_name);
  }
  
  function delete_hot_button(event) {
    var element = Event.element(event);
    try {
      element.up(1).remove(true);
    } catch(e) {}
  }
  
  function update_inputs(event) {
    var hot_button_number = 0;
    $$('#buttons_list li').each(function(li){
      var button_id = li.readAttribute('button_id');
      $(li).select('input, textarea').each(function(input){
        var name = 'settings[' + hot_button_number + '][' + button_id + '][' + input.readAttribute('sname') + ']';
        input.setAttribute('name', name);
      });
      hot_button_number++;
    });
  }
  
  $('add_hot_button').observe('click', add_hot_button_click);
  $$('.delete_hot_button').invoke('observe', 'click', delete_hot_button.bindAsEventListener('compare', this));
  $$('input[name="commit"]')[0].observe('click', update_inputs);

  init_sortable_list();
  init_saved_buttons();

});