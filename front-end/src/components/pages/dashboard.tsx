/**
 * Dashboard Page Component - Role-aware dashboard view
 */
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { UserRole } from "../../contexts/user-context";
import { apiClient, Application, Alert, LevelCount, TrendBucket } from "../../services/api";
import { authService } from "../../services/auth";
import { errorHandler } from "../../services/errorHandler";
import { useToast } from "../../contexts/ToastContext";
import "ojs/ojlabel";
import "ojs/ojbutton";
import "ojs/ojchart";
import ArrayDataProvider = require('ojs/ojarraydataprovider');

interface DashboardPageProps {
  userRole: UserRole;
}

export function DashboardPage({ userRole }: DashboardPageProps) {
  const [stats, setStats] = useState({
    totalLogs: 0,
    applications: 0,
    activeAlerts: 0,
    users: 0
  });
  const [logSummary, setLogSummary] = useState<LevelCount[]>([]);
  const [trendsData, setTrendsData] = useState<TrendBucket[]>([]);
  const [summaryData, setSummaryData] = useState<LevelCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast notifications
  const { showSuccess, showError, showWarning } = useToast();

  // Load dashboard data from API
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return;
      
      
      // Load users and applications using bulk endpoints
      const [users, allApps] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getApplications()
      ]);
      
      // Get current user's applications
      let userApplications: Application[] = [];
      try {
        userApplications = await apiClient.getUserApplications(parseInt(currentUser.id));
      } catch (error) {
        errorHandler.handleApiError(error, `loading apps for current user`);
      }
      
      const allApplications = new Map<number, Application>();
      allApps.forEach(app => allApplications.set(app.id, app));
      
      // Load log summary and trends for last 24 hours
      let logSummaryData: LevelCount[] = [];
      let trends: TrendBucket[] = [];
      try {
        // For admins: get all apps data (no appIds = all apps)
        // For users: get assigned apps data (must always send appIds, even if empty)
        let appIds: number[] | undefined;
        if (userRole === 'user') {
          const assignedAppIds = authService.getAssignedApplicationIds();
          // User roles must always send appIds parameter, even if empty array
          appIds = assignedAppIds || [];
        }
        
        const summary = await apiClient.getLogSummary('last_24_hours', appIds);
        logSummaryData = Array.isArray(summary) ? summary as LevelCount[] : [];
        trends = await apiClient.getLogTrends('last_24_hours', appIds);
      } catch (error) {
        errorHandler.handleApiError(error, 'loading charts');
      }
      
      // Calculate total logs from summary
      const totalLogs = logSummaryData.reduce((sum, level) => sum + level.count, 0);
      
      // Set state
      setLogSummary(logSummaryData);
      setSummaryData(logSummaryData);
      setTrendsData(trends);
      setStats({
        totalLogs,
        applications: userRole === 'admin' ? allApplications.size : userApplications.length,
        activeAlerts: 0,
        users: userRole === 'admin' ? users.length : 0
      });
    } catch (error) {
      errorHandler.handleApiError(error, 'loading dashboard data');
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Only load dashboard data if we have a valid user role that matches the actual user
    const currentUser = authService.getCurrentUser();
    if (userRole && currentUser) {
      const actualUserRole = currentUser.role.toLowerCase() as UserRole;
      if (userRole === actualUserRole) {
        loadDashboardData();
      }
    }
  }, [userRole]);

  // Transform trends data for line chart
  interface ChartTrendItem { id: number; series: string; time: string; value: number; }
  const trendsChartData = (() => {
    const chartData: ChartTrendItem[] = [];
    let id = 0;
    trendsData.forEach(bucket => {
      const time = typeof bucket.time === 'string' ? new Date(bucket.time).toLocaleString() : new Date(bucket.time).toLocaleString();
      bucket.levelCounts.forEach(levelCount => {
        chartData.push({ id: id++, series: levelCount.level, time, value: levelCount.count });
      });
    });
    return chartData;
  })();

  // Transform summary data for pie chart
  interface ChartSummaryItem { id: number; series: string; group: string; value: number; }
  const summaryChartData = (() => {
    const chartData: ChartSummaryItem[] = [];
    let id = 0;
    summaryData.forEach(levelCount => {
      chartData.push({ id: id++, series: levelCount.level, group: 'Log Levels', value: levelCount.count });
    });
    return chartData;
  })();

  // Data providers
  const trendsDataProvider = new ArrayDataProvider(trendsChartData, { keyAttributes: 'id' });
  const summaryDataProvider = new ArrayDataProvider(summaryChartData, { keyAttributes: 'id' });

  // Chart item templates
  const trendsItemTemplate = (item: { data: ChartTrendItem }) => (
    <oj-chart-item value={item.data.value} groupId={[item.data.time]} seriesId={item.data.series} />
  );
  const summaryItemTemplate = (item: { data: ChartSummaryItem }) => (
    <oj-chart-item value={item.data.value} groupId={[item.data.group]} seriesId={item.data.series} />
  );

  const renderAdminDashboard = () => (
    <div>
      <h1 class="text-black mb-lg" style="font-size: 2.5rem; font-weight: 800; letter-spacing: -0.025em;">
        Administrator Dashboard
      </h1>
      
      {/* Stats Cards */}
      <div class="grid-responsive mb-lg">
        <div class="stats-card" style="text-align: center;">
          <h3 class="text-black" style="margin: 0; font-size: 3rem; font-weight: 800; line-height: 1;">
            {stats.totalLogs.toLocaleString()}
          </h3>
          <p class="text-gray-600" style="margin: var(--app-space-md) 0 0 0; font-weight: 600; font-size: 1rem;">
            Total Log Entries
          </p>
        </div>
        
        <div class="stats-card" style="text-align: center;">
          <h3 class="text-success" style="margin: 0; font-size: 3rem; font-weight: 800; line-height: 1;">
            {stats.applications}
          </h3>
          <p class="text-gray-600" style="margin: var(--app-space-md) 0 0 0; font-weight: 600; font-size: 1rem;">
            Applications
          </p>
        </div>
        
        <div class="stats-card" style="text-align: center;">
          <h3 class="text-black" style="margin: 0; font-size: 3rem; font-weight: 800; line-height: 1;">
            {stats.users}
          </h3>
          <p class="text-gray-600" style="margin: var(--app-space-md) 0 0 0; font-weight: 600; font-size: 1rem;">
            Total Users
          </p>
        </div>
      </div>

      {/* Charts: Last 24 Hours (admin = all apps; user = permitted apps by backend) */}
      <div class="grid-responsive">
        <div class="oj-panel oj-panel-alt1" style="min-height: 360px;">
          <h2 class="oj-typography-heading-md oj-sm-margin-bottom-3x">Last 24 Hours - Trends</h2>
          {trendsChartData.length > 0 ? (
            <oj-chart id="dashboardTrendsChart" type="line" stack="on" data={trendsDataProvider} animationOnDisplay="auto" animationOnDataChange="auto" hoverBehavior="dim" class="chart-component">
              <template slot="itemTemplate" render={trendsItemTemplate}></template>
            </oj-chart>
          ) : (
            <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center" style="height: 280px;">
              <span class="oj-ux-ico oj-ux-ico-chart oj-text-color-secondary" style="font-size: 2rem;"></span>
            </div>
          )}
        </div>
        <div class="oj-panel oj-panel-alt1" style="min-height: 360px;">
          <h2 class="oj-typography-heading-md oj-sm-margin-bottom-3x">Last 24 Hours - Level Distribution</h2>
          {summaryChartData.length > 0 ? (
            <oj-chart id="dashboardSummaryChart" type="pie" data={summaryDataProvider} animationOnDisplay="auto" animationOnDataChange="auto" hoverBehavior="dim" class="chart-component">
              <template slot="itemTemplate" render={summaryItemTemplate}></template>
            </oj-chart>
          ) : (
            <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center" style="height: 280px;">
              <span class="oj-ux-ico oj-ux-ico-chart oj-text-color-secondary" style="font-size: 2rem;"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUserDashboard = () => (
    <div>
      <h1 class="text-black mb-lg" style="font-size: 2.5rem; font-weight: 800; letter-spacing: -0.025em;">
        User Dashboard
      </h1>
      
      {/* Stats Cards */}
      <div class="grid-2 mb-lg">
        <div class="stats-card" style="text-align: center;">
          <h3 class="text-black" style="margin: 0; font-size: 3rem; font-weight: 800; line-height: 1;">
            {stats.totalLogs.toLocaleString()}
          </h3>
          <p class="text-gray-600" style="margin: var(--app-space-md) 0 0 0; font-weight: 600; font-size: 1rem;">
            Total Log Entries
          </p>
        </div>
        
        <div class="stats-card" style="text-align: center;">
          <h3 class="text-success" style="margin: 0; font-size: 3rem; font-weight: 800; line-height: 1;">
            {stats.applications}
          </h3>
          <p class="text-gray-600" style="margin: var(--app-space-md) 0 0 0; font-weight: 600; font-size: 1rem;">
            Total Applications
          </p>
        </div>
      </div>

      {/* Charts: Last 24 Hours */}
      <div class="grid-responsive">
        <div class="oj-panel oj-panel-alt1" style="min-height: 360px;">
          <h2 class="oj-typography-heading-md oj-sm-margin-bottom-3x">Last 24 Hours - Trends</h2>
          {trendsChartData.length > 0 ? (
            <oj-chart id="dashboardTrendsChartUser" type="line" stack="on" data={trendsDataProvider} animationOnDisplay="auto" animationOnDataChange="auto" hoverBehavior="dim" class="chart-component">
              <template slot="itemTemplate" render={trendsItemTemplate}></template>
            </oj-chart>
          ) : (
            <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center" style="height: 280px;">
              <span class="oj-ux-ico oj-ux-ico-chart oj-text-color-secondary" style="font-size: 2rem;"></span>
            </div>
          )}
        </div>
        <div class="oj-panel oj-panel-alt1" style="min-height: 360px;">
          <h2 class="oj-typography-heading-md oj-sm-margin-bottom-3x">Last 24 Hours - Level Distribution</h2>
          {summaryChartData.length > 0 ? (
            <oj-chart id="dashboardSummaryChartUser" type="pie" data={summaryDataProvider} animationOnDisplay="auto" animationOnDataChange="auto" hoverBehavior="dim" class="chart-component">
              <template slot="itemTemplate" render={summaryItemTemplate}></template>
            </oj-chart>
          ) : (
            <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center" style="height: 280px;">
              <span class="oj-ux-ico oj-ux-ico-chart oj-text-color-secondary" style="font-size: 2rem;"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );


  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
        return renderAdminDashboard();
      case 'user':
        return renderUserDashboard();
      default:
        return renderUserDashboard(); // fallback to user dashboard
    }
  };

  if (loading) {
    return (
      <div style="padding: 1rem; text-align: center;">
        <div style="padding: 2rem;">
          <span class="oj-icon oj-icon-clock" style="font-size: 2rem; color: #6b7280;"></span>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style="padding: 1rem;">
      {error && (
        <div class="oj-panel oj-panel-alt1" style="margin-bottom: 1rem; padding: 1rem; border-left: 4px solid #dc2626; background-color: #fef2f2;">
          <div style="color: #dc2626; font-weight: 500;">
            <span class="oj-icon oj-icon-error" style="margin-right: 0.5rem;"></span>
            {error}
          </div>
        </div>
      )}
      {renderDashboard()}
    </div>
  );
}
