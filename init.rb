require 'redmine'
require 'dispatcher'
require 'issues_controller_patch'

Dispatcher.to_prepare :issue_hot_buttons do
  IssuesController.send(:include, IssuesControllerPatch)
end

class Hooks < Redmine::Hook::ViewListener
  render_on :view_issues_show_details_bottom,
             :partial => 'assets',
             :layout => false
end

unless Redmine::Plugin.registered_plugins.keys.include?(:issue_hot_buttons)
  Redmine::Plugin.register :issue_hot_buttons do
    name 'Issue Hot Buttons Plugin'
    author 'Mike Kolganov, Thumbtack Inc.'
    description 'Plugin for Redmine that add buttons for often used actions to issue page'
    version '0.4.1'
    url 'https://github.com/mikekolganov/redmine-issue-hot-buttons'
    #author_url 'mailto:mike.kolganov@gmail.com'
    settings :partial => 'settings/hot_buttons_settings'
  end
end
