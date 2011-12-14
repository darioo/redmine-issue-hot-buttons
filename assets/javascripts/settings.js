document.observe("dom:loaded", function() {
	function init_sortable_list() {
		Sortable.create('buttons_list', {
			tag:'li',
			onChange: function(){
				console.log(Math.random());
			}
		});
	}
	
	function add_hot_button(event) {
		var button_name = $$('#hot_button_select')[0].value;
		if (0 == button_name.length) return false;
		
		var button_element = $$('#buttons_repository li[button_id="' + button_name + '"]');
		if (0 == button_element.length) return false;
		
		button_element = button_element[0];

		if (button_element.hasClassName('unique')) {		
			var exists = $$('#buttons_list li[button_id="' + button_name + '"]').length != 0;
			if (exists) return false;
			
		}
		$('buttons_list').insert(button_element.clone(true));

		$$('.delete_hot_button').invoke('observe', 'click', delete_hot_button.bindAsEventListener('compare', this)); 
		init_sortable_list();
	}
	
	function delete_hot_button(event) {
		var element = Event.element(event);
		try {
			element.up(1).remove(true);
		}catch(e){}
	}
	
	function update_inputs(event) {
		$$('#buttons_list li').each(function(li){
			var button_id = li.readAttribute('button_id');
			$(li).select('input').each(function(input){
				var name = 'settings[' + button_id + ']' + input.readAttribute('name_suffix')
				console.log(name);
			});
		});

		event.preventDefault();
	}
	
	$('add_hot_button').observe('click', add_hot_button);
	$$('.delete_hot_button').invoke('observe', 'click', delete_hot_button.bindAsEventListener('compare', this));
	$$('input[name="commit"]')[0].observe('click', update_inputs);
	init_sortable_list();

});