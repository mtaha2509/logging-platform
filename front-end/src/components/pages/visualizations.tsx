/**
 * Visualizations Page Component - Charts and analytics for log data
 */
import { h } from "preact";
import { useState, useEffect, useMemo } from "preact/hooks";
import { apiClient, Application, TrendBucket, LevelCount } from "../../services/api";
import { authService } from "../../services/auth";
import { errorHandler } from "../../services/errorHandler";
import { useToast } from "../../contexts/ToastContext";
import "ojs/ojchart";
import "ojs/ojbutton";
import "ojs/ojlabel";
import ArrayDataProvider = require('ojs/ojarraydataprovider');

// Chart data interfaces - matching backend DTOs
interface ChartTrendItem {
  id: number;
  series: string;
  time: string;
  value: number;
}

interface ChartSummaryItem {
  id: number;
  series: string;
  group: string;
  value: number;
}

export function VisualizationsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [trendsData, setTrendsData] = useState<TrendBucket[]>([]);
  const [summaryData, setSummaryData] = useState<LevelCount[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [appsLoaded, setAppsLoaded] = useState(false); // ✅ prevent fetch loop

  // Filter states
  const [filters, setFilters] = useState({
    period: 'last_24_hours',
    appIds: [] as number[],
    chartType: 'trends'
  });

  const { showSuccess, showError, showWarning } = useToast();
  const isAdmin = authService.isAdmin();

  const periodOptions = [
    { value: 'last_hour', label: 'Last Hour' },
    { value: 'last_24_hours', label: 'Last 24 Hours' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' }
  ];

  const chartTypeOptions = [
    { value: 'trends', label: 'Line Chart (Trends)' },
    { value: 'summary', label: 'Pie Chart (Summary)' }
  ];

  // ✅ Load applications ONCE at mount
  const loadApplications = async () => {
    try {
      const allApps = await apiClient.getApplications();
      let accessibleApps = allApps;

      if (!isAdmin) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          const assignedAppIds = authService.getAssignedApplicationIds();
          accessibleApps = allApps.filter(app => assignedAppIds?.includes(app.id));
        }
      }
      setApplications(accessibleApps);

      setFilters(prev => {
        if (!isAdmin && accessibleApps.length > 0) {
          // ✅ Set all assigned apps as default for user
          return {
            ...prev,
            appIds: accessibleApps.map(app => app.id)
          };
        } else if (isAdmin && prev.appIds.length === 0) {
          // ✅ Leave it empty for admin = all apps
          return { ...prev, appIds: [] };
        }
        return prev;
      });
      

      setAppsLoaded(true); // mark apps ready
    } catch (error) {
      errorHandler.handleApiError(error, 'loading applications for visualizations');
      setAppsLoaded(true);
    }
  };

  // ✅ Load data (only runs after apps are loaded)
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (filters.chartType === 'trends') {
        const appIdsToSend = isAdmin
          ? (filters.appIds.length > 0 ? filters.appIds : undefined)
          : filters.appIds;
        const trends = await apiClient.getLogTrends(filters.period, appIdsToSend);
        setTrendsData(trends);
        setSummaryData([]);
      } else if (filters.chartType === 'summary') {
        const appIdsToSend = isAdmin
          ? (filters.appIds.length > 0 ? filters.appIds : undefined)
          : filters.appIds;
        const summary = await apiClient.getLogSummary(filters.period, appIdsToSend);
        setSummaryData(summary);
        setTrendsData([]);
      }
    } catch (error) {
      errorHandler.handleApiError(error, 'loading visualization data');
      setTrendsData([]);
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ First load: fetch apps only
  useEffect(() => {
    loadApplications();
  }, []);

  // ✅ Fetch data when filters change, only after appsLoaded
  useEffect(() => {
    if (!appsLoaded) return;
    loadData();
  }, [filters.period, filters.appIds, filters.chartType, appsLoaded]);

  // Transform trends data for chart
  const trendsChartData = useMemo(() => {
    const chartData: ChartTrendItem[] = [];
    let id = 0;
    trendsData.forEach(bucket => {
      const time = new Date(bucket.time as any).toLocaleString();
      bucket.levelCounts.forEach(levelCount => {
        chartData.push({
          id: id++,
          series: levelCount.level,
          time: time,
          value: levelCount.count
        });
      });
    });
    return chartData;
  }, [trendsData]);

  const summaryChartData = useMemo(() => {
    const chartData: ChartSummaryItem[] = [];
    let id = 0;
    summaryData.forEach(levelCount => {
      chartData.push({
        id: id++,
        series: levelCount.level,
        group: 'Log Levels',
        value: levelCount.count
      });
    });
    return chartData;
  }, [summaryData]);

  const trendsDataProvider = useMemo(() => {
    return new ArrayDataProvider(trendsChartData, { keyAttributes: 'id' });
  }, [trendsChartData]);

  const summaryDataProvider = useMemo(() => {
    return new ArrayDataProvider(summaryChartData, { keyAttributes: 'id' });
  }, [summaryChartData]);

  const trendsItemTemplate = (item: { data: ChartTrendItem }) => (
    <oj-chart-item
      value={item.data.value}
      groupId={[item.data.time]}
      seriesId={item.data.series}
    />
  );

  const summaryItemTemplate = (item: { data: ChartSummaryItem }) => (
    <oj-chart-item
      value={item.data.value}
      groupId={[item.data.group]}
      seriesId={item.data.series}
    />
  );

  // Handlers
  const handlePeriodChange = (event: any) => {
    setFilters({ ...filters, period: event.target.value });
  };

  const handleAppChange = (event: any) => {
    const value = event.target.value;
  
    if (value === 'all') {
      if (isAdmin) {
        // ✅ Admin: empty array = all apps
        setFilters({ ...filters, appIds: [] });
      } else {
        // ✅ User: set all assigned apps explicitly
        setFilters({ ...filters, appIds: applications.map(app => app.id) });
      }
    } else if (value) {
      setFilters({ ...filters, appIds: [parseInt(value)] });
    } else {
      setFilters({ ...filters, appIds: [] });
    }
  };
  

  const handleChartTypeChange = (event: any) => {
    setFilters({ ...filters, chartType: event.target.value });
  };

  const handleRefresh = () => {
    loadData();
    showSuccess('Data refreshed successfully');
  };

  if (!appsLoaded) {
    return (
      <div class="oj-panel oj-panel-alt1 oj-md-padding-4x">
        <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center">
          <div>Loading applications...</div>
        </div>
      </div>
    );
  }

  if (loading && trendsData.length === 0 && summaryData.length === 0) {
    return (
      <div class="oj-panel oj-panel-alt1 oj-md-padding-4x">
        <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center">
          <div class="oj-spinner" style="width: 2rem; height: 2rem;"></div>
        </div>
      </div>
    );
  }

  return (
    <div class="visualizations-page">
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center page-header-viz">
        <h1 class="oj-typography-heading-lg page-title">Log Visualizations</h1>
        <div class="oj-flex oj-sm-gap-2x">
          <oj-button 
            chroming="outlined"
            onojAction={() => setShowFilters(!showFilters)}
            class="toggle-filters-btn"
          >
            <span slot="startIcon" class="oj-ux-ico-filter"></span>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </oj-button>
          <oj-button onojAction={handleRefresh} chroming="callToAction" class="refresh-btn">
            <span slot="startIcon" class="oj-ux-ico-refresh"></span>
            Refresh Data
          </oj-button>
        </div>
      </div>

      {showFilters && (
        <div class="oj-panel oj-panel-alt1 filters-section-logs oj-sm-margin-3x-bottom">
          <h3 class="oj-typography-heading-sm filter-title-logs">Filters</h3>
          <div class="filter-grid-logs">
            <div class="filter-group-logs">
              <oj-label for="periodFilter">Time Period</oj-label>
              <select
                id="periodFilter"
                class="filter-select-logs"
                value={filters.period}
                onChange={handlePeriodChange}
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div class="filter-group-logs">
              <oj-label for="chartTypeFilter">Chart Type</oj-label>
              <select
                id="chartTypeFilter"
                class="filter-select-logs"
                value={filters.chartType}
                onChange={handleChartTypeChange}
              >
                {chartTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div class="filter-group-logs">
              <oj-label for="appFilter">Application</oj-label>
              <select
  id="appFilter"
  class="filter-select-logs"
  value={
    isAdmin
      ? (filters.appIds.length === 0 ? 'all' : filters.appIds[0]?.toString())
      : (filters.appIds.length === applications.length ? 'all' : filters.appIds[0]?.toString())
  }
  onChange={handleAppChange}
>

                {isAdmin ? (
                  <>
                    <option value="all">All applications</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                  </>
                ) : (
                  <>
                    <option value="all">All my applications</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.name}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div class="oj-panel oj-panel-alt2 oj-sm-margin-4x-bottom error-panel">
          <div class="oj-flex oj-sm-align-items-center oj-sm-gap-2x">
            <span class="oj-ux-ico oj-ux-ico-warning oj-text-color-danger"></span>
            <span class="oj-typography-body-md">{error}</span>
          </div>
        </div>
      )}

      <div class="chart-section">
        <div class="oj-panel oj-panel-alt1">
          {filters.chartType === 'trends' ? (
            <>
              <h2 class="oj-typography-heading-md oj-sm-margin-bottom-3x">Log Trends Over Time</h2>
              <div class="chart-container">
                {trendsChartData.length > 0 ? (
                  <oj-chart
                    id="trendsChart"
                    type="line"
                    stack="on"
                    data={trendsDataProvider}
                    animationOnDisplay="auto"
                    animationOnDataChange="auto"
                    hoverBehavior="dim"
                    class="chart-component"
                  >
                    <template slot="itemTemplate" render={trendsItemTemplate}></template>
                  </oj-chart>
                ) : (
                  <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center no-data-message">
                    <div class="oj-flex oj-sm-direction-column oj-sm-align-items-center">
                      <span class="oj-ux-ico oj-ux-ico-chart oj-text-color-secondary" style="font-size: 3rem;"></span>
                      <p class="oj-typography-body-md oj-text-color-secondary oj-sm-margin-top-2x">
                        No trend data available for the selected filters
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 class="oj-typography-heading-md oj-sm-margin-bottom-3x">Log Level Distribution</h2>
              <div class="chart-container">
                {summaryChartData.length > 0 ? (
                  <oj-chart
                    id="summaryChart"
                    type="pie"
                    data={summaryDataProvider}
                    animationOnDisplay="auto"
                    animationOnDataChange="auto"
                    hoverBehavior="dim"
                    class="chart-component"
                  >
                    <template slot="itemTemplate" render={summaryItemTemplate}></template>
                  </oj-chart>
                ) : (
                  <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center no-data-message">
                    <div class="oj-flex oj-sm-direction-column oj-sm-align-items-center">
                      <span class="oj-ux-ico oj-ux-ico-chart oj-text-color-secondary" style="font-size: 3rem;"></span>
                      <p class="oj-typography-body-md oj-text-color-secondary oj-sm-margin-top-2x">
                        No summary data available for the selected filters
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
