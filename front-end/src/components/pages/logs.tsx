/**
 * Logs Page Component - Proper Oracle JET table implementation
 */
import { h, render } from "preact";
import { useState, useEffect, useMemo, useRef } from "preact/hooks";
import { apiClient, Log as ApiLog, LogSearchParams, PaginatedResponse, Application } from "../../services/api";
import { errorHandler } from "../../services/errorHandler";
import { useToast } from "../../contexts/ToastContext";
import { HttpApiError } from "../../services/HttpApiError";
import "ojs/ojinputtext";
import "ojs/ojlabel";
import "ojs/ojbutton";
import "ojs/ojtable";
import "ojs/ojmessages";
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { ojTable } from 'ojs/ojtable';

interface LogEntry {
  id: number;
  timestamp: string;
  appName?: string;
  appId: number;
  level: string;
  message: string;
  applicationName?: string;
}

interface LogFilters {
  apps: number[];
  timeRange: {
    from: Date | null;
    to: Date | null;
    relative: string;
  };
  level: string[];
  searchQuery: string;
}

interface MultiSelectOption {
  value: string | number;
  label: string;
  color?: string;
}

function MultiSelect({ id, options, value, onChange, placeholder, className }: {
  id: string;
  options: MultiSelectOption[];
  value: Set<string | number>;
  onChange: (newValue: Set<string | number>) => void;
  placeholder: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (val: string | number) => {
    const newSet = new Set(value);
    if (newSet.has(val)) {
      newSet.delete(val);
    } else {
      newSet.add(val);
    }
    onChange(newSet);
  };

  const selectedLabels = Array.from(value).map(v => options.find(o => o.value === v)?.label || v).join(', ');
  const displayText = selectedLabels || placeholder;

  return (
    <div ref={ref} className={`multi-select ${className || ''}`} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          background: 'white',
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#333',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {displayText}
        <span style={{ float: 'right', marginLeft: '8px' }}>▼</span>
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            maxHeight: '200px',
            overflowY: 'auto',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}
        >
          {options.map(opt => (
            <label
              key={opt.value}
              style={{
                display: 'block',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
              }}
              onMouseOver={(e) => (e.currentTarget as HTMLElement).style.background = '#f5f5f5'}
              onMouseOut={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <input
                type="checkbox"
                checked={value.has(opt.value)}
                onChange={() => handleToggle(opt.value)}
                style={{ marginRight: '8px' }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function LogsPage() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<LogFilters>({
    apps: [],
    timeRange: {
      from: null,
      to: null,
      relative: 'last_24_hours'
    },
    level: [],
    searchQuery: ''
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Toast notifications
  const { showSuccess, showError, showWarning } = useToast();

  const levelOptions: MultiSelectOption[] = [
    { value: 'DEBUG', label: 'Debug', color: 'secondary' },
    { value: 'INFO', label: 'Info', color: 'info' },
    { value: 'WARNING', label: 'Warning', color: 'warning' },
    { value: 'ERROR', label: 'Error', color: 'danger' }
  ];

  const timeRangeOptions = [
    { value: 'last_hour', label: 'Last hour' },
    { value: 'last_24_hours', label: 'Last 24 hours' },
    { value: 'last_7_days', label: 'Last 7 days' },
    { value: 'last_30_days', label: 'Last 30 days' }
  ];


  // Load applications for filter dropdown using bulk endpoint
  const loadApplications = async () => {
    try {
      const allApps = await apiClient.getApplications();
      setApplications(allApps);
    } catch (error) {
      errorHandler.handleApiError(error, 'loading applications for logs page');
    }
  };

  // Convert time range to LocalDateTime format (without timezone)
  const getTimeRangeDates = (relative: string) => {
    const now = new Date();
    const from = new Date();
    
    switch (relative) {
      case 'last_hour':
        from.setTime(now.getTime() - (60 * 60 * 1000)); // 1 hour in milliseconds
        break;
      case 'last_24_hours':
        from.setTime(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours in milliseconds
        break;
      case 'last_7_days':
        from.setTime(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days in milliseconds
        break;
      case 'last_30_days':
        from.setTime(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days in milliseconds
        break;
      default:
        from.setTime(now.getTime() - (60 * 60 * 1000)); // Default to 1 hour
    }
    
    // Convert to LocalDateTime format (YYYY-MM-DDTHH:mm:ss) without timezone
    const formatLocalDateTime = (date: Date) => {
      // Use local time formatting to avoid timezone conversion issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };
    
    return {
      from: formatLocalDateTime(from),
      to: formatLocalDateTime(now)
    };
  };

  const handleSearch = async (page: number = 0) => {
    console.log('🔍 handleSearch: Starting search with page:', page);
    setIsLoading(true);
    setError(null);
    
    try {
      // Handle time range: custom dates take priority over relative time
      let fromDate: string | undefined;
      let toDate: string | undefined;
      
      const formatLocalDateTime = (date: Date) => {
        // Force local time formatting without timezone conversion
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      
      // Check if any custom dates are set
      if (filters.timeRange.from || filters.timeRange.to) {
        // Use custom dates (individual or both)
        if (filters.timeRange.from) {
          fromDate = formatLocalDateTime(filters.timeRange.from);
        }
        if (filters.timeRange.to) {
          toDate = formatLocalDateTime(filters.timeRange.to);
        }
      } else if (filters.timeRange.relative) {
        // Use relative time range only if no custom dates are set
      const timeRange = getTimeRangeDates(filters.timeRange.relative);
        fromDate = timeRange.from;
        toDate = timeRange.to;
      }
      // If neither custom dates nor relative time is set, don't set from/to (search all time)
      
      const searchParams: LogSearchParams = {
        page,
        size: pagination.size,
        from: fromDate,
        to: toDate
      };
      
      // Add multi-select filters
      if (filters.apps.length > 0) {
        searchParams.appIds = filters.apps;
      }
      
      if (filters.level.length > 0) {
        searchParams.levels = filters.level;
      }
      
      if (searchQuery.trim()) {
        searchParams.messageContains = searchQuery.trim();
      }
      
      // Debug: Show what we're sending to the logs endpoint
      console.log('🌐 handleSearch: Calling GET /logs with params:', searchParams);
      
      const response: PaginatedResponse<ApiLog> = await apiClient.searchLogs(searchParams);
      console.log('📊 handleSearch: Received response:', response);
      
      // Transform API logs to component format
      const transformedLogs: LogEntry[] = response.content.map((apiLog: ApiLog) => {
        // Handle both Unix timestamp (number) and ISO string formats
        let timestamp: string;
        if (typeof apiLog.timestamp === 'number') {
          // Convert Unix timestamp to ISO string
          timestamp = new Date(apiLog.timestamp).toISOString();
        } else {
          // Already an ISO string
          timestamp = apiLog.timestamp;
        }
        
        return {
        id: apiLog.id,
          timestamp: timestamp,
        appId: apiLog.applicationId,
        appName: apiLog.applicationName,
        level: apiLog.level,
        message: apiLog.message,
        applicationName: apiLog.applicationName
        };
      });
      
      console.log('📝 handleSearch: Setting logs and pagination...');
      setLogs(transformedLogs);
      setPagination({
        page: response.pageable.pageNumber,
        size: response.pageable.pageSize,
        totalElements: response.totalElements,
        totalPages: response.totalPages
      });
      console.log('✅ handleSearch: Search completed successfully');
    } catch (error) {
      console.error('❌ handleSearch: Failed to search logs:', error);
      
      // Use centralized error handling
      errorHandler.handleApiError(error, 'searching logs');
      
      // Handle specific error types for user feedback
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Access denied') || errorMessage.includes('403')) {
        setError('Access denied. You do not have permission to view logs for this application.');
        showError('Access denied. You do not have permission to view logs for this application.');
      } else if (errorMessage.includes('Authentication required') || errorMessage.includes('401')) {
        setError('Authentication required. Please log in again.');
        showError('Authentication required. Please log in again.');
      } else {
      setError('Failed to search logs. Please try again.');
        showError('Failed to search logs. Please try again.');
      }
      
      setLogs([]);
    } finally {
      setIsLoading(false);
      console.log('🏁 handleSearch: Finished (loading set to false)');
    }
  };

  useEffect(() => {
    const initializeLogs = async () => {
      try {
        console.log('🚀 LogsPage: Starting initialization...');
        
        // Load applications first
        console.log('📱 LogsPage: Loading applications...');
        const allApps = await apiClient.getApplications();
        setApplications(allApps);
        console.log('✅ LogsPage: Applications loaded');
        
        // Check URL parameters for appId (from View Logs button)
        const hash = window.location.hash.slice(1); // Remove #
        console.log('🔗 LogsPage: Current hash:', hash);
        
        const queryString = hash.split('?')[1] || '';
        const urlParams = new URLSearchParams(queryString);
        const appIdParam = urlParams.get('appId');
        
        if (appIdParam) {
          console.log('🎯 LogsPage: Found appId parameter:', appIdParam);
          const appId = parseInt(appIdParam);
          if (!isNaN(appId)) {
            console.log('✅ LogsPage: Setting filter for appId:', appId);
            // Find application name for better user experience using loaded allApps
            const app = allApps.find(a => a.id === appId);
            const appName = app ? app.name : `ID: ${appId}`;
            
            // Show info message
            setMessages([{ 
              severity: 'info', 
              summary: `Filtering logs for: ${appName}` 
            }]);
            
            // Set filters
            setFilters(prev => ({
              ...prev,
              apps: [appId]
            }));
          }
        }
        
        // Mark as initialized (triggers auto-search if needed)
        setIsInitialized(true);
        console.log('🎉 LogsPage: Initialization completed successfully');
        
      } catch (error) {
        console.error('❌ LogsPage: Initialization failed:', error);
        setError('Failed to initialize logs page');
      }
    };
    
    initializeLogs();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      console.log('🔍 LogsPage: Triggering initial search after init...');
      handleSearch(0);
    }
  }, [isInitialized]);

  // Data provider for table
  const dataProvider = useMemo(() => {
    return new ArrayDataProvider(logs, { keyAttributes: 'id' });
  }, [logs]);

  // Timestamp renderer
  const timestampRenderer = (context: ojTable.ColumnsRendererContext<LogEntry['id'], LogEntry>) => {
    const timestamp = new Date(context.row.timestamp);
    
    const timestampContent = (
      <div class="timestamp-cell-content">
        <div class="timestamp-date">{timestamp.toLocaleDateString()}</div>
        <div class="timestamp-time">{timestamp.toLocaleTimeString()}</div>
      </div>
    );

    render(timestampContent, context.parentElement);
  };

  // Application renderer
  const applicationRenderer = (context: ojTable.ColumnsRendererContext<LogEntry['id'], LogEntry>) => {
    const appContent = (
      <div class="app-cell-content">
        <div class="app-name-log">{context.row.appName || context.row.applicationName || 'Unknown'}</div>
        <div class="app-id-log">ID: {context.row.appId}</div>
      </div>
    );

    render(appContent, context.parentElement);
  };

  // Level renderer with badges
  const levelRenderer = (context: ojTable.ColumnsRendererContext<LogEntry['id'], LogEntry>) => {
    const getLevelBadge = (level: string) => {
      const levelConfig = levelOptions.find(l => l.value === level) || { color: 'secondary', label: level };
      return (
        <span class={`oj-badge oj-badge-${levelConfig.color} level-badge-table level-${level.toLowerCase()}`}>
          {levelConfig.label}
        </span>
      );
    };

    render(getLevelBadge(context.row.level), context.parentElement);
  };

  // Message renderer with truncation
  const messageRenderer = (context: ojTable.ColumnsRendererContext<LogEntry['id'], LogEntry>) => {
    const messageContent = (
      <div class="log-message-cell" title={context.row.message}>
        {context.row.message}
      </div>
    );

    render(messageContent, context.parentElement);
  };

  // Column definitions
  const columns = useMemo(() => [
    {
      headerText: 'Timestamp',
      renderer: timestampRenderer,
      resizable: "enabled" as const,
      className: 'timestamp-column-table'
    },
    {
      headerText: 'Application',
      renderer: applicationRenderer,
      resizable: "enabled" as const,
      className: 'application-column-table'
    },
    {
      headerText: 'Level',
      renderer: levelRenderer,
      resizable: "enabled" as const,
      className: 'level-column-table'
    },
    {
      headerText: 'Message',
      renderer: messageRenderer,
      resizable: "enabled" as const,
      className: 'message-column-table'
    },
  ], []);

  return (
    <div class="logs-page">
      {/* Page Header */}
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center page-header-logs">
        <h1 class="oj-typography-heading-lg page-title">Log Query</h1>
        <oj-button 
          chroming="outlined"
          onojAction={() => setShowFilters(!showFilters)}
          class="filter-toggle-btn"
        >
          <span slot="startIcon" class={`oj-ux-ico ${showFilters ? 'oj-ux-ico-chevron-up' : 'oj-ux-ico-chevron-down'}`}></span>
          {showFilters ? 'Hide' : 'Show'} Filters
        </oj-button>
      </div>

      {/* Messages */}
      <oj-messages 
        messages={messages} 
        onmessagesChanged={() => setMessages([])}
        class="logs-messages"
      />

      {/* Error Message */}
      {error && (
        <div class="oj-panel oj-panel-alt1 error-panel">
          <div class="error-content">
            <span class="oj-ux-ico oj-ux-ico-error error-icon"></span>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Search Bar */}
      <div class="oj-panel oj-panel-alt1 search-section-logs oj-sm-margin-3x-bottom">
        <div class="oj-flex oj-sm-align-items-end search-controls-logs">
          <div class="oj-flex-item search-field-logs">
            <oj-input-text
              value={searchQuery}
              onvalueChanged={(e: CustomEvent) => setSearchQuery(e.detail.value)}
              labelHint="Search Query"
              placeholder="Search logs by message content"
              class="search-input-logs"
            />
          </div>
          <oj-button 
            chroming="callToAction"
            onojAction={() => handleSearch(0)}
            disabled={isLoading}
            class="search-btn-logs"
          >
            <span slot="startIcon" class="oj-ux-ico-search"></span>
            Search
          </oj-button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div class="oj-panel oj-panel-alt1 filters-section-logs oj-sm-margin-3x-bottom">
          <h3 class="oj-typography-heading-sm filter-title-logs">Filters</h3>
          <div class="filter-info-logs">
            <span class="oj-typography-body-sm oj-text-color-secondary">
              💡 Custom dates take priority over relative time. You can set individual from/to dates or use both.
            </span>
          </div>
          <div class="filter-grid-logs">
            <div class="filter-group-logs">
              <oj-label for="appFilter">Applications</oj-label>
              <MultiSelect
                id="appFilter"
                options={applications.map(app => ({ value: app.id, label: app.name }))}
                value={new Set(filters.apps)}
                onChange={(newValue) => setFilters({ ...filters, apps: Array.from(newValue) as number[] })}
                placeholder="Select applications..."
                className="filter-select-logs"
              />
            </div>

            <div class="filter-group-logs">
              <oj-label for="levelFilter">Level</oj-label>
              <MultiSelect
                id="levelFilter"
                options={levelOptions}
                value={new Set(filters.level)}
                onChange={(newValue) => setFilters({ ...filters, level: Array.from(newValue) as string[] })}
                placeholder="Select levels..."
                className="filter-select-logs"
              />
            </div>

            <div class="filter-group-logs">
              <oj-label for="timeRangeFilter">Time Range</oj-label>
              <select
                id="timeRangeFilter"
                value={filters.timeRange.relative}
                class="filter-select-logs"
                onChange={(event: any) => {
                  setFilters({
                    ...filters,
                    timeRange: {
                      ...filters.timeRange,
                      relative: event.target.value
                      // Don't clear custom dates - let the search logic handle priority
                    }
                  });
                }}
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div class="filter-group-logs">
              <oj-label for="customFromDate">Custom From Date</oj-label>
              <input
                id="customFromDate"
                type="datetime-local"
                class="filter-input-logs"
                value={filters.timeRange.from ? 
                  new Date(filters.timeRange.from.getTime() - filters.timeRange.from.getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
                  : ''}
                min="2020-01-01T00:00"
                max="2030-12-31T23:59"
                onChange={(event: any) => {
                  const value = event.target.value;
                  if (value) {
                    const date = new Date(value);
                    setFilters({
                      ...filters,
                      timeRange: {
                        ...filters.timeRange,
                        from: date
                        // Don't clear relative time - let the search logic handle priority
                      }
                    });
                  } else {
                    setFilters({
                      ...filters,
                      timeRange: {
                        ...filters.timeRange,
                        from: null
                      }
                    });
                  }
                }}
              />
            </div>

            <div class="filter-group-logs">
              <oj-label for="customToDate">Custom To Date</oj-label>
              <input
                id="customToDate"
                type="datetime-local"
                class="filter-input-logs"
                value={filters.timeRange.to ? 
                  new Date(filters.timeRange.to.getTime() - filters.timeRange.to.getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
                  : ''}
                min="2020-01-01T00:00"
                max="2030-12-31T23:59"
                onChange={(event: any) => {
                  const value = event.target.value;
                  if (value) {
                    const date = new Date(value);
                    setFilters({
                      ...filters,
                      timeRange: {
                        ...filters.timeRange,
                        to: date
                        // Don't clear relative time - let the search logic handle priority
                      }
                    });
                  } else {
                    setFilters({
                      ...filters,
                      timeRange: {
                        ...filters.timeRange,
                        to: null
                      }
                    });
                  }
                }}
              />
            </div>

            <div class="filter-group-logs">
              <oj-button
                chroming="outlined"
                onojAction={() => {
                  setFilters({
                    apps: [],
                    timeRange: {
                      from: null,
                      to: null,
                      relative: 'last_24_hours' // Reset to default
                    },
                    level: [],
                    searchQuery: ''
                  });
                  setSearchQuery('');
                }}
                class="clear-filters-btn-logs"
              >
                <span slot="startIcon" class="oj-ux-ico-refresh"></span>
                Clear All Filters
              </oj-button>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div class="table-section-logs">
        <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center table-header-logs">
          <h3 class="oj-typography-heading-sm table-title-logs">
            Results {pagination.totalElements > 0 && `(${pagination.totalElements} total)`}
          </h3>
        </div>

        {isLoading ? (
          <div class="loading-container">
            <span class="oj-ux-ico oj-ux-ico-clock loading-icon oj-icon-spin"></span>
            <p class="oj-typography-body-md">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div class="empty-state-logs">
            <span class="oj-ux-ico oj-ux-ico-info empty-state-icon"></span>
            <h3 class="oj-typography-heading-sm">No logs found</h3>
            <p class="oj-typography-body-md oj-text-color-secondary">
              Try adjusting your search criteria or time range.
            </p>
          </div>
        ) : (
          <>
            <oj-table
              data={dataProvider}
              columns={columns}
              aria-label="Logs Table"
              class="oj-table-stretch logs-oj-table"
              horizontal-grid-visible="enabled"
              vertical-grid-visible="enabled"
              scroll-policy="loadMoreOnScroll"
              style={{ width: '100%', minHeight: '600px' }}
            />
          </>
        )}
        
        {/* Simple Pagination */}
        {logs.length > 0 && pagination.totalPages > 1 && (
          <div class="pagination-container-logs">
            <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center pagination-wrapper-logs">
              {/* Results Info */}
              <div class="pagination-info-logs">
                <span class="oj-typography-body-sm oj-text-color-secondary">
                  {pagination.totalElements} results • Page {pagination.page + 1} of {pagination.totalPages}
                </span>
              </div>

              {/* Simple Navigation */}
              <div class="oj-flex oj-sm-align-items-center pagination-controls-logs">
            <oj-button 
              chroming="outlined"
              onojAction={() => handleSearch(pagination.page - 1)}
              disabled={pagination.page === 0 || isLoading}
                  title="Previous page"
                  class="pagination-btn-logs"
            >
                  <span slot="startIcon" class="oj-ux-ico-previous"></span>
              Previous
            </oj-button>

            <oj-button 
              chroming="outlined"
              onojAction={() => handleSearch(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages - 1 || isLoading}
                  title="Next page"
                  class="pagination-btn-logs"
            >
              Next
                  <span slot="endIcon" class="oj-ux-ico-next"></span>
            </oj-button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}