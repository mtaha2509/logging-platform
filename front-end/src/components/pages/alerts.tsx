/**
 * Alerts Management Page - Admin only page for managing alerts
 */
import { h } from 'preact';
import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { apiClient, Alert, Application, CreateAlertRequest, UpdateAlertRequest } from '../../services/api';
import { authService } from '../../services/auth';
import { errorHandler } from '../../services/errorHandler';
import { useToast } from '../../contexts/ToastContext';
import { validateCreateAlert, validateUpdateAlert } from '../../utils/validation';
import { Pagination } from '../common/Pagination';
import { SortButton } from '../common/SortButton';
import 'ojs/ojbutton';
import 'ojs/ojlabel';
import 'ojs/ojinputtext';
import 'ojs/ojselectsingle';
import 'ojs/ojdialog';
import 'ojs/ojtable';
import 'ojs/ojswitch';
import ArrayDataProvider = require('ojs/ojarraydataprovider');

interface AlertsPageProps {
  // No props needed - this is a standalone page
}

export function AlertsPage({}: AlertsPageProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [appsLoading, setAppsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [formData, setFormData] = useState<CreateAlertRequest>({
    applicationId: 0,
    severityLevel: 'ERROR',
    count: 1,
    timeWindow: 'PT5M'
  });
  const [editFormData, setEditFormData] = useState<UpdateAlertRequest>({
    applicationId: 0,
    severityLevel: 'ERROR',
    count: 1,
    timeWindow: 'PT5M'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { showSuccess, showError } = useToast();
  const dialogRef = useRef<any>(null);
  const editDialogRef = useRef<any>(null);

  // Time window options
  const timeWindowOptions = [
    { label: '30 seconds', value: 'PT30S' },
    { label: '1 minute', value: 'PT1M' },
    { label: '5 minutes', value: 'PT5M' },
    { label: '15 minutes', value: 'PT15M' },
    { label: '30 minutes', value: 'PT30M' },
    { label: '1 hour', value: 'PT1H' },
    { label: '2 hours', value: 'PT2H' },
    { label: '6 hours', value: 'PT6H' },
    { label: '12 hours', value: 'PT12H' },
    { label: '24 hours', value: 'PT24H' }
  ];

  const severityOptions = [
    { label: 'ERROR', value: 'ERROR' },
    { label: 'WARN', value: 'WARNING' },
    { label: 'INFO', value: 'INFO' },
    { label: 'DEBUG', value: 'DEBUG' }
  ];

  // Data providers for select components
  const applicationDataProvider = useMemo(() => 
    new ArrayDataProvider(
      applications.map(app => ({ value: app.id.toString(), label: app.name })), 
      { keyAttributes: 'value' }
    ),
    [applications]
  );
  
  const severityDataProvider = useMemo(() => 
    new ArrayDataProvider(severityOptions, { keyAttributes: 'value' }),
    []
  );
  
  const timeWindowDataProvider = useMemo(() => 
    new ArrayDataProvider(timeWindowOptions, { keyAttributes: 'value' }),
    []
  );

  // Data provider for table
  const dataProvider = useMemo(() => {
    return new ArrayDataProvider(alerts, { keyAttributes: 'id' });
  }, [alerts]);

  // Table column renderers
  const applicationRenderer = (context: any) => {
    const name = context.row.applicationName || 'Unknown';
    const element = document.createElement('span');
    element.textContent = name;
    context.parentElement.appendChild(element);
  };

  const actionsRenderer = (context: any) => {
    const alert = context.row;
    const container = document.createElement('div');
    container.className = 'oj-flex oj-sm-justify-content-end oj-sm-align-items-center action-cell-container';
    
    const editButton = document.createElement('oj-button');
    editButton.setAttribute('display', 'icons');
    editButton.setAttribute('chroming', 'outlined');
    editButton.setAttribute('title', `Edit ${alert.applicationName || 'Alert'}`);
    editButton.setAttribute('aria-label', `Edit Alert for ${alert.applicationName || 'Unknown Application'}`);
    editButton.className = 'action-btn-table';
    
    const editIcon = document.createElement('span');
    editIcon.setAttribute('slot', 'startIcon');
    editIcon.className = 'oj-ux-ico-edit';
    editButton.appendChild(editIcon);
    
    editButton.addEventListener('ojAction', () => {
      handleEditAlert(alert);
    });
    
    container.appendChild(editButton);
    context.parentElement.appendChild(container);
  };

  const severityRenderer = (context: any) => {
    const severity = context.row.level;
    const severityClass = `severity-${severity.toLowerCase()}`;
    const element = document.createElement('span');
    element.className = `alert-severity ${severityClass}`;
    element.textContent = severity;
    context.parentElement.appendChild(element);
  };

  const timeWindowRenderer = (context: any) => {
    const timeWindow = context.row.timeWindow;
    // Handle numeric timeWindow (seconds) and convert to display format
    let formatted;
    if (typeof timeWindow === 'number') {
      // Convert seconds to human readable format
      if (timeWindow < 60) {
        formatted = `${timeWindow} seconds`;
      } else if (timeWindow < 3600) {
        formatted = `${Math.floor(timeWindow / 60)} minutes`;
      } else if (timeWindow < 86400) {
        formatted = `${Math.floor(timeWindow / 3600)} hours`;
      } else {
        formatted = `${Math.floor(timeWindow / 86400)} days`;
      }
    } else {
      formatted = formatTimeWindow(timeWindow);
    }
    const element = document.createElement('span');
    element.textContent = formatted;
    context.parentElement.appendChild(element);
  };

  const createdRenderer = (context: any) => {
    const date = new Date(context.row.updatedAt);
    const container = document.createElement('div');
    container.className = 'created-cell';
    
    const dateElement = document.createElement('div');
    dateElement.className = 'created-date';
    dateElement.textContent = date.toLocaleDateString();
    
    const timeElement = document.createElement('div');
    timeElement.className = 'created-time';
    timeElement.textContent = date.toLocaleTimeString();
    
    container.appendChild(dateElement);
    container.appendChild(timeElement);
    context.parentElement.appendChild(container);
  };

  const statusRenderer = (context: any) => {
    const isActive = context.row.isActive !== false; // Default to true if undefined
    const badge = document.createElement('span');
    badge.className = isActive ? 'oj-badge oj-badge-success' : 'oj-badge oj-badge-danger';
    badge.textContent = isActive ? 'Active' : 'Inactive';
    context.parentElement.appendChild(badge);
  };

  // Column definitions
  const columns = useMemo(() => [
    { 
      headerText: 'Application', 
      renderer: applicationRenderer,
      resizable: "enabled" as const,
      className: 'application-column'
    },
    { 
      headerText: 'Severity', 
      renderer: severityRenderer,
      resizable: "enabled" as const,
      className: 'severity-column'
    },
    {
      headerText: 'Threshold',
      field: 'count',
      resizable: "enabled" as const,
      className: 'threshold-column'
    },
    {
      headerText: 'Time Window',
      renderer: timeWindowRenderer,
      resizable: "enabled" as const,
      className: 'time-window-column'
    },
    {
      headerText: 'Last Updated',
      renderer: createdRenderer,
      resizable: "enabled" as const,
      className: 'created-column'
    },
    {
      headerText: 'Status',
      renderer: statusRenderer,
      resizable: "enabled" as const,
      className: 'status-column'
    },
    {
      headerText: 'Actions',
      renderer: actionsRenderer,
      resizable: "disabled" as const,
      className: 'actions-column'
    }
  ], []);

  // Load applications
  const loadApplications = async () => {
    try {
      setAppsLoading(true);
      const apps = await apiClient.getApplications();
      setApplications(apps);
    } catch (error) {
      errorHandler.handleApiError(error, 'loading applications');
    } finally {
      setAppsLoading(false);
    }
  };

  // Load alerts with pagination (admin-only)
  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAllAlerts(currentPage, pageSize, sortOrder);
      setAlerts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      if (response.content.length === 0 && currentPage > 0) {
        setCurrentPage(0);
      }
    } catch (error) {
      errorHandler.handleApiError(error, 'loading alerts');
    } finally {
      setLoading(false);
    }
  };

  // Create alert
  const handleCreateAlert = async () => {
    try {
      setFormErrors({});
      
      // Validation using utility
      const validation = validateCreateAlert(formData);
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        return;
      }

      const user = authService.getCurrentUser();
      if (user) {
        await apiClient.createAlert(formData, parseInt(user.id));
      }
      showSuccess('Alert created successfully!');
      
      // Close dialog first to prevent flickering
      setShowCreateDialog(false);
      setFormData({
        applicationId: 0,
        severityLevel: 'ERROR',
        count: 1,
        timeWindow: 'PT5M'
      });
      
      loadAlerts(); // Refresh alerts list
    } catch (error) {
      if (error instanceof Error && error.name === 'HttpApiError') {
        // Handle field-level errors from backend
        const httpError = error as any;
        if (httpError.body?.errors) {
          setFormErrors(httpError.body.errors);
        } else {
          showError(httpError.body?.message || 'Failed to create alert');
        }
      } else {
        errorHandler.handleApiError(error, 'creating alert');
      }
    }
  };

  // helper: convert seconds -> PT string (common mappings)
const secondsToPT = (secs: number) => {
  const map: Record<number, string> = {
    30: 'PT30S',
    60: 'PT1M',
    300: 'PT5M',
    900: 'PT15M',
    1800: 'PT30M',
    3600: 'PT1H',
    7200: 'PT2H',
    21600: 'PT6H',
    43200: 'PT12H',
    86400: 'PT24H'
  };
  return map[secs] ?? `PT${secs}S`;
};

const normalizeTimeWindow = (tw: any) => {
  if (tw === undefined || tw === null || tw === '') return 'PT5M'; // default
  if (typeof tw === 'number') return secondsToPT(tw);
  return tw; // assume already a string like 'PT5M'
};

  // Edit alert
  const handleEditAlert = (alert: Alert) => {
  setSelectedAlert(alert);
  setEditFormData({
    applicationId: alert.applicationId || 0,
    severityLevel: alert.level,
    count: alert.count,
    timeWindow: normalizeTimeWindow(alert.timeWindow), // <- normalized here
    isActive: alert.isActive !== false // Default to true if undefined
  });
  setEditFormErrors({});
  setShowEditDialog(true);
};


  const handleUpdateAlert = async () => {
    try {
      if (!selectedAlert) return;
      
      setEditFormErrors({});
      
      // Validation using utility
      const validation = validateUpdateAlert(editFormData);
      if (!validation.isValid) {
        setEditFormErrors(validation.errors);
        return;
      }

      await apiClient.updateAlert(selectedAlert.id, editFormData);
      showSuccess('Alert updated successfully!');
      
      // Close dialog first to prevent flickering
      setShowEditDialog(false);
      setSelectedAlert(null);
      
      loadAlerts(); // Refresh alerts list
    } catch (error) {
      if (error instanceof Error && error.name === 'HttpApiError') {
        // Handle field-level errors from backend
        const httpError = error as any;
        if (httpError.body?.errors) {
          setEditFormErrors(httpError.body.errors);
        } else {
          const errorMessage = httpError.body?.message || 'Failed to update alert';
          if (errorMessage.includes('already exists')) {
            showError(errorMessage);
          } else {
            showError(errorMessage);
          }
        }
      } else {
        errorHandler.handleApiError(error, 'updating alert');
      }
    }
  };

  // Format time window for display
  const formatTimeWindow = (timeWindow: string) => {
    const option = timeWindowOptions.find(opt => opt.value === timeWindow);
    return option ? option.label : timeWindow || 'Unknown';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Load data on mount
  useEffect(() => {
    loadApplications();
    loadAlerts();
  }, []);

  // Handlers for pagination and sorting
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when size changes
  };

  const handleSortChange = (newSort: 'asc' | 'desc') => {
    setSortOrder(newSort);
    setCurrentPage(0); // Reset to first page when sort changes
  };

  // Reload alerts when page, size, or sort changes
  useEffect(() => {
    if (applications.length > 0) { // Only load after applications are loaded
      loadAlerts();
    }
  }, [currentPage, pageSize, sortOrder]);

  // Control dialog visibility
  useEffect(() => {
    if (dialogRef.current) {
      if (showCreateDialog) {
        dialogRef.current.open();
      } else {
        dialogRef.current.close();
      }
    }
  }, [showCreateDialog]);

  // Control edit dialog visibility
  useEffect(() => {
    if (editDialogRef.current) {
      if (showEditDialog) {
        editDialogRef.current.open();
      } else {
        editDialogRef.current.close();
      }
    }
  }, [showEditDialog]);

  return (
    <div class="alerts-page">
      {/* Page Header */}
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center page-header-alerts">
        <h1 class="oj-typography-heading-lg page-title">Alerts Management</h1>
        <oj-button 
          onojAction={() => setShowCreateDialog(true)}
          chroming="callToAction"
          disabled={appsLoading}
        >
          <span slot="startIcon" class="oj-ux-ico-plus"></span>
          Create Alert
        </oj-button>
      </div>

      {/* Alerts Table */}
      <div class="table-section-alerts">
        {loading ? (
          <div class="loading-container">
            <div class="loading-spinner">⏳</div>
            <p>Loading alerts...</p>
          </div>
        ) : totalElements === 0 ? (
          <div class="empty-state">
            <span class="oj-ux-ico-bell-slash empty-icon"></span>
            <h3>No Alerts Yet</h3>
            <p>Create your first alert to start monitoring log patterns.</p>
            <oj-button
              class="create-first-alert-btn"
              onojAction={() => setShowCreateDialog(true)}
            >
              Create Your First Alert
            </oj-button>
          </div>
        ) : (
          <>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 class="oj-typography-heading-sm table-title-alerts">
                Active Alerts ({totalElements})
              </h3>
              <SortButton
                label="Sort by Updated"
                currentSort={sortOrder}
                onSortChange={handleSortChange}
              />
            </div>
            
            
            <oj-table
              data={dataProvider}
              columns={columns}
              aria-label="Alerts Table"
              class="oj-table-stretch alerts-oj-table"
              horizontal-grid-visible="enabled"
              vertical-grid-visible="enabled"
              scroll-policy="auto"
              style={{ width: '100%', minHeight: '600px' }}
            />
            
            {/* Advanced Pagination */}
            {totalElements > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalElements={totalElements}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            )}
          </>
        )}
      </div>

      {/* Create Alert Dialog */}
      <oj-dialog
        ref={dialogRef}
        id="create-alert-dialog"
        class="create-alert-dialog"
        onojClose={() => setShowCreateDialog(false)}
        dialogTitle="Create New Alert"
        initialVisibility="hide"
        style={{width: '500px'}}
      >
        <div slot="body" class="create-alert-form">
          {appsLoading ? (
            <div class="loading-container">
              <div class="loading-spinner">⏳</div>
              <p>Loading applications...</p>
            </div>
          ) : (
            <>
              <div class="form-group">
                <oj-label for="application-select" labelId="application-label">
                  <span slot="label">Application *</span>
                </oj-label>
                <oj-select-single
                  id="application-select"
                  class="oj-form-control-full-width"
                  value={formData.applicationId.toString()}
                  onvalueChanged={(event) => {
                    const value = event.detail.value;
                    setFormData(prev => ({ ...prev, applicationId: parseInt(value) || 0 }));
                  }}
                  data={applicationDataProvider as any}
                  placeholder="Select an application"
                />
                {formErrors.applicationId && (
                  <div class="field-error">{formErrors.applicationId}</div>
                )}
            </div>
            
              <div class="form-group">
                <oj-label for="severity-select" labelId="severity-label">
                  <span slot="label">Severity Level *</span>
                </oj-label>
                <oj-select-single
                  id="severity-select"
                  class="oj-form-control-full-width"
                  value={formData.severityLevel}
                  onvalueChanged={(event) => {
                    const value = event.detail.value;
                    setFormData(prev => ({ ...prev, severityLevel: value as any }));
                  }}
                  data={severityDataProvider as any}
                />
                {formErrors.severityLevel && (
                  <div class="field-error">{formErrors.severityLevel}</div>
                )}
              </div>

              <div class="form-group">
                <oj-label for="count-input" labelId="count-label">
                  <span slot="label">Threshold Count *</span>
                </oj-label>
                <oj-input-text
                  id="count-input"
                  class="oj-form-control-full-width"
                  value={formData.count.toString()}
                  onvalueChanged={(event) => {
                    const value = parseInt(event.detail.value) || 0;
                    setFormData(prev => ({ ...prev, count: value }));
                  }}
                  placeholder="Enter threshold count (1-10000)"
                />
                <div class="field-hint">Enter a number between 1 and 10000</div>
                {formErrors.count && (
                  <div class="field-error">{formErrors.count}</div>
                )}
            </div>

              <div class="form-group">
                <oj-label for="time-window-select" labelId="time-window-label">
                  <span slot="label">Time Window *</span>
                </oj-label>
                <oj-select-single
                  id="time-window-select"
                  class="oj-form-control-full-width"
                  value={formData.timeWindow}
                  onvalueChanged={(event) => {
                    const value = event.detail.value;
                    setFormData(prev => ({ ...prev, timeWindow: value }));
                  }}
                  data={timeWindowDataProvider as any}
                />
                {formErrors.timeWindow && (
                  <div class="field-error">{formErrors.timeWindow}</div>
                )}
              </div>
            </>
          )}
        </div>

        <div slot="footer" class="form-actions">
          <oj-button 
            class="cancel-btn"
            onojAction={() => setShowCreateDialog(false)}
                >
                  Cancel
                </oj-button>
                <oj-button 
            class="create-btn"
                  onojAction={handleCreateAlert}
            disabled={appsLoading}
                >
                  Create Alert
                </oj-button>
              </div>
      </oj-dialog>

      {/* Edit Alert Dialog */}
      <oj-dialog
        ref={editDialogRef}
        id="edit-alert-dialog"
        class="edit-alert-dialog"
        dialogTitle={`Edit Alert - ${selectedAlert?.applicationName || ''}`}
        initialVisibility="hide"
        style={{width: '500px'}}
      >
        <div slot="body" class="dialog-body-form">
          <oj-form-layout direction="column">
            <div class="form-field">
              <oj-label labelId="editApplicationLabel">
                <span slot="label">Application *</span>
              </oj-label>
              <oj-select-single
                id="editApplicationSelect"
                data={applicationDataProvider as any}
                value={editFormData.applicationId?.toString()}
                onvalueChanged={(e: CustomEvent) => setEditFormData({...editFormData, applicationId: parseInt(e.detail.value) || 0})}
                class="oj-form-control-full-width"
              />
              {editFormErrors.applicationId && (
                <div class="field-error">{editFormErrors.applicationId}</div>
              )}
            </div>

            <div class="form-field">
              <oj-label labelId="editSeverityLabel">
                <span slot="label">Severity Level *</span>
              </oj-label>
              <oj-select-single
                id="editSeveritySelect"
                data={severityDataProvider as any}
                value={editFormData.severityLevel}
                onvalueChanged={(e: CustomEvent) => setEditFormData({...editFormData, severityLevel: e.detail.value})}
                class="oj-form-control-full-width"
              />
              {editFormErrors.severityLevel && (
                <div class="field-error">{editFormErrors.severityLevel}</div>
              )}
            </div>

            <div class="form-field">
              <oj-label labelId="editCountLabel">
                <span slot="label">Threshold Count *</span>
              </oj-label>
              <oj-input-text
                id="editCountInput"
                value={editFormData.count?.toString()}
                onvalueChanged={(e: CustomEvent) => setEditFormData({...editFormData, count: parseInt(e.detail.value) || 0})}
                placeholder="Enter threshold count (1-10000)"
                class="oj-form-control-full-width"
              />
              <div class="field-hint">Enter a number between 1 and 10000</div>
              {editFormErrors.count && (
                <div class="field-error">{editFormErrors.count}</div>
              )}
            </div>

            <div class="form-field">
              <oj-label labelId="editTimeWindowLabel">
                <span slot="label">Time Window *</span>
              </oj-label>
              <oj-select-single
                id="editTimeWindowSelect"
                data={timeWindowDataProvider as any}
                value={editFormData.timeWindow}
                onvalueChanged={(e: CustomEvent) => setEditFormData({...editFormData, timeWindow: e.detail.value})}
                class="oj-form-control-full-width"
              />
              {editFormErrors.timeWindow && (
                <div class="field-error">{editFormErrors.timeWindow}</div>
              )}
            </div>

            <div class="form-field">
              <oj-switch
                labelHint="Status"
                value={editFormData.isActive}
                onvalueChanged={(e: CustomEvent) => setEditFormData({...editFormData, isActive: e.detail.value})}
              >
                
              </oj-switch>
            </div>
          </oj-form-layout>
          </div>
        <div slot="footer" class="dialog-footer">
          <oj-button onojAction={() => setShowEditDialog(false)} chroming="outlined">Cancel</oj-button>
          <oj-button 
            onojAction={handleUpdateAlert} 
            chroming="callToAction"
            disabled={!editFormData.applicationId || !editFormData.severityLevel || !editFormData.count || !editFormData.timeWindow}
          >
            Update Alert
          </oj-button>
        </div>
      </oj-dialog>
    </div>
  );
}