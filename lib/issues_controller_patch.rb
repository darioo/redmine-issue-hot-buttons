module IssuesControllerPatch     
  
  def self.included(base)
    base.send(:include, InstanceMethods)
    base.class_eval do
      before_filter :nearby_issues, :only => :show
    end
  end
  
  module InstanceMethods
    def nearby_issues
      retrieve_query
      sort_init(@query.sort_criteria.empty? ? [['id', 'desc']] : @query.sort_criteria)
      sort_update(@query.sortable_columns)

      @nearby_issues = [];
      if @query.valid?
        @issues = @query.issues(
          :include => [:assigned_to, :tracker, :priority, :category, :fixed_version],
          :order => sort_clause
        )
        @issues.uniq!
        @issues.each {|issue| @nearby_issues.unshift issue.id}
      end
    end
  end
  
end