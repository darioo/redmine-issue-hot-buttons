require 'redmine'

Redmine::Plugin.register :redmine_issue_hot_buttons do
  name 'Issue Hot Buttons Plugin'
  author 'Mike Kolganov of Thumbtack Inc.'
  description 'Plugin for Redmine that add buttons for often used actions to issue page'
  version '0.1.0'
  url 'https://github.com/mikekolganov/redmine-issue-hot-buttons'
  author_url 'mailto:mike.kolganov@gmail.com'
	
	settings :partial => 'settings/settings'
end

class Hooks < Redmine::Hook::ViewListener
  render_on :view_issues_show_details_bottom,
            :partial => 'assets',
            :layout => false
end
