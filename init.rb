require 'redmine'

Redmine::Plugin.register :redmine_issue_hot_buttons do
  name 'Issue Hot Buttons plugin'
  author 'Mike Kolganov'
  description 'Plugin for Redmine that add some often used actions to issue page'
  version '0.0.1'
  url 'https://github.com/mikekolganov/redmine-issue-hot-buttons'
  author_url 'mailto:mike.kolganov@gmail.com'
	
	settings :default => {'list_size' => '5', 'precision' => '2'}, :partial => 'settings/settings'
end

class Hooks < Redmine::Hook::ViewListener
  render_on :view_issues_show_details_bottom,
            :partial => 'assets',
            :layout => false
end