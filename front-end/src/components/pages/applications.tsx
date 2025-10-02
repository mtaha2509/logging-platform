import { h, render } from "preact";
import { useState, useEffect, useMemo, useRef } from "preact/hooks";
import { apiClient, Application as ApiApplication, CreateApplicationRequest, UpdateApplicationRequest, User, BulkPermissionRequest } from '../../services/api';
import { authService } from '../../services/auth';
import { errorHandler } from '../../services/errorHandler';
import { HttpApiError } from '../../services/HttpApiError';
import { useToast } from "../../contexts/ToastContext";
import { validateCreateApplication, validateUpdateApplication } from '../../utils/validation';
import "ojs/ojinputtext";
import "ojs/ojlabel";
import "ojs/ojbutton";
import "ojs/ojdialog";
import "ojs/ojformlayout";
import "ojs/ojtable";
import "ojs/ojmenu";
import "ojs/ojoption";
import "ojs/ojmessages";
import "ojs/ojswitch";
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { ojTable } from 'ojs/ojtable';

interface Application {
  id: number;
  name: string;
  description?: string;
  owner?: string;
  status: 'active' | 'inactive' | 'warning';
  updatedAt: string;
  isActive?: boolean;
  lastActivity?: string;
  logCount?: number;
  users?: User[]; // optional; may be filled by current loadApplications
}

// Action Cell Component for row buttons (removed 'View Logs' button)
const ActionCell = ({ 
  rowData, 
  onViewUsers,
  onEditApp,
  isAdmin
}: {
  rowData: Application,
  onViewUsers: (app: Application) => void,
  onEditApp: (app: Application) => void,
  isAdmin: boolean,
}) => {
  return (
    <div class="oj-flex oj-sm-justify-content-end oj-sm-align-items-center action-cell-container">
      {/* Only show "View Users" button for admin users */}
      {isAdmin && (
        <oj-button
          display="icons"
          chroming="outlined"
          title={`View assigned users for ${rowData.name}`}
          aria-label={`View Users for ${rowData.name}`}
          onojAction={() => onViewUsers(rowData)}
          class="action-btn-table"
        >
          <span slot="startIcon" class="oj-ux-ico-user-available"></span>
        </oj-button>
      )}

      {/* Only show "Edit" button for admin users */}
      {isAdmin && (
        <oj-button
          display="icons"
          chroming="outlined"
          title={`Edit ${rowData.name}`}
          aria-label={`Edit ${rowData.name}`}
          onojAction={() => onEditApp(rowData)}
          class="action-btn-table"
        >
          <span slot="startIcon" class="oj-ux-ico-edit"></span>
        </oj-button>
      )}

      {/* Removed View Logs action per request */}
    </div>
  );
};

// Assign Users Dialog Component (mirror of your AssignAppsDialog, but for users)
const AssignUsersDialog = ({
  isOpen,
  saving = false,
  onClose,
  onSave, // (userIds: number[]) => void | Promise<void>
  selectedApp,
  users,
  currentAssignedUserIds
}: {
  isOpen: boolean,
  saving?: boolean,
  onClose: () => void,
  onSave: (userIds: number[]) => void | Promise<void>,
  selectedApp?: Application,
  users: User[],
  currentAssignedUserIds: number[]
}) => {
  const dialogRef = useRef<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // refs for dialog lifecycle coordination
  const preventCloseRef = useRef(false);
  const lastIsOpenRef = useRef<boolean | null>(null);

  // attach ojBeforeClose guard to block internal close when saving
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const beforeCloseHandler = (ev: any) => {
      if (preventCloseRef.current || saving) {
        try { ev.preventDefault?.(); } catch (err) { /* ignore */ }
      }
    };
    el.addEventListener?.('ojBeforeClose' as any, beforeCloseHandler as any);
    return () => {
      el.removeEventListener?.('ojBeforeClose' as any, beforeCloseHandler as any);
    };
  }, [saving]);

  // defensive open/close effect.
  useEffect(() => {
    if (!dialogRef.current) return;

    if (isOpen) {
      if (!lastIsOpenRef.current && !saving) {
        dialogRef.current.open();
      }
    } else {
      if (lastIsOpenRef.current) {
        dialogRef.current.close();
      }
    }
    lastIsOpenRef.current = isOpen;
  }, [isOpen, saving]);

  // Initialize selectedUsers based on currentAssignedUserIds
  useEffect(() => {
    if (isOpen) {
      setSelectedUsers(currentAssignedUserIds || []);
    } else if (!isOpen) {
      setSelectedUsers([]);
      setSearchTerm("");
    }
  }, [isOpen, currentAssignedUserIds]);

  // Filtered and sorted users (assigned users at top)
  const filteredUsers = useMemo(() => {
    let result = users;
    
    // Apply search filter
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter(u =>
        u.email.toLowerCase().includes(q) ||
        (u as any)?.name?.toLowerCase?.().includes(q)
      );
    }
    
    // Sort: assigned users first, then unassigned users
    result = [...result].sort((a, b) => {
      const aIsAssigned = currentAssignedUserIds.includes(a.id);
      const bIsAssigned = currentAssignedUserIds.includes(b.id);
      
      if (aIsAssigned && !bIsAssigned) return -1;
      if (!aIsAssigned && bIsAssigned) return 1;
      
      // If both assigned or both unassigned, sort by name/email
      const aName = ("name" in a && a.name) ? String(a.name) : a.email.split('@')[0];
      const bName = ("name" in b && b.name) ? String(b.name) : b.email.split('@')[0];
      return aName.toLowerCase().localeCompare(bName.toLowerCase());
    });
    
    return result;
  }, [users, searchTerm, currentAssignedUserIds]);

  const handleCheckboxToggle = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const selectVisible = () => {
    setSelectedUsers(prev => {
      const visibleIds = filteredUsers.map(u => u.id);
      const merged = Array.from(new Set([...prev, ...visibleIds]));
      return merged;
    });
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  // handle save click — we set preventCloseRef so internal closes are blocked while the parent's onSave runs
  const handleSaveClick = async () => {
    preventCloseRef.current = true;
    try {
      const maybePromise = onSave(selectedUsers);
      if (maybePromise && typeof (maybePromise as any).then === 'function') {
        await (maybePromise as any);
      }
    } finally {
      setTimeout(() => {
        preventCloseRef.current = false;
      }, 50);
    }
  };

  return (
    <oj-dialog
      ref={dialogRef}
      id="assignUsersDialog"
      dialogTitle={`Assign Users - ${selectedApp?.name || ''}`}
      initialVisibility="hide"
      class="assign-users-dialog"
    >
      <div slot="body" class="dialog-body-assign">
        <div class="apps-assignment-container">
          <div className="apps-header-row" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>

            <oj-input-text
              id="user-search"
              labelHint="Search users"
              placeholder="Search by email or name"
              value={searchTerm}
              onvalueChanged={(e: CustomEvent) => setSearchTerm(e.detail.value)}
              class="app-search-input"
              style={{ flex: 1 }}
            />

            <oj-button onojAction={() => selectVisible()} chroming="outlined" style={{ whiteSpace: "nowrap" }} disabled={saving}>
              Select All
            </oj-button>
            <oj-button onojAction={() => clearSelection()} chroming="outlined" style={{ whiteSpace: "nowrap" }} disabled={saving}>
              Unselect All
            </oj-button>
          </div>

          <div class="apps-checklist" style={{ maxHeight: "320px", overflowY: "auto", paddingRight: "8px" }}>
            {filteredUsers.length === 0 ? (
              <div class="empty-apps">
                <span class="oj-ux-ico oj-ux-ico-user empty-apps-icon"></span>
                <p class="oj-typography-body-md">No users match your search</p>
              </div>
            ) : (
              filteredUsers.map(user => (
                <div key={user.id} class="app-checkbox-item" style={{ padding: "8px 4px", borderBottom: "1px solid #eee" }}>
                  <label class="app-checkbox-label" style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <input
                      type="checkbox"
                      aria-label={`Assign ${user.email}`}
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e: any) => handleCheckboxToggle(user.id, e.target.checked)}
                      class="app-checkbox"
                      disabled={saving}
                    />
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span class="app-checkbox-text" style={{ fontWeight: 500 }}>
                          {"name" in user && user.name ? user.name : user.email.split('@')[0]}
                        </span>
                        {currentAssignedUserIds.includes(user.id) && (
                          <span class="oj-badge oj-badge-success" style={{ fontSize: "0.7em" }}>
                            Currently Assigned
                          </span>
                        )}
                      </div>
                      <span class="app-checkbox-desc" style={{ fontSize: "0.9em", color: "#666" }}>{user.email}</span>
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div slot="footer" class="dialog-footer" style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <oj-button onojAction={() => onClose()} chroming="outlined" disabled={saving}>Cancel</oj-button>
        <oj-button
          onojAction={() => handleSaveClick()}
          chroming="callToAction"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Assignment'}
        </oj-button>
      </div>
    </oj-dialog>
  );
};

// Add Application Dialog Component
const AddApplicationDialog = ({ 
  isOpen, 
  onClose, 
  onSave,
  formErrors = {}
}: {
  isOpen: boolean,
  onClose: () => void,
  onSave: (name: string, description: string) => void,
  formErrors?: Record<string, string>,
}) => {
  const dialogRef = useRef<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (dialogRef.current) {
      if (isOpen) {
        dialogRef.current.open();
      } else {
        dialogRef.current.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  // Check if form is valid (real-time validation)
  const isFormValid = () => {
    return name.trim().length >= 1 && name.trim().length <= 100 && description.length <= 500;
  };

  const handleSave = () => {
    if (!isFormValid()) return;
    onSave(name.trim(), description.trim());
  };

  return (
    <oj-dialog 
      ref={dialogRef} 
      id="addAppDialog" 
      dialogTitle="Register New Application" 
      initialVisibility="hide"
      class="add-app-dialog"
    >
      <div slot="body" class="dialog-body-form">
        <oj-form-layout direction="column">
          <div class="form-field">
            <oj-input-text
              required
              labelHint="Application Name *"
              value={name}
              onvalueChanged={(e: CustomEvent) => setName(e.detail.value)}
              placeholder="Enter application name (max 100 characters)"
              class="form-input"
            />
            <div class="field-hint">{name.length}/100 characters</div>
            {formErrors.name && (
              <div class="field-error">{formErrors.name}</div>
            )}
          </div>
          <div class="form-field">
            <oj-input-text
              labelHint="Description"
              value={description}
              onvalueChanged={(e: CustomEvent) => setDescription(e.detail.value)}
              placeholder="Enter application description (optional, max 500 characters)"
              class="form-input"
            />
            <div class="field-hint">{description.length}/500 characters</div>
            {formErrors.description && (
              <div class="field-error">{formErrors.description}</div>
            )}
          </div>
        </oj-form-layout>
      </div>
      <div slot="footer" class="dialog-footer">
        <oj-button onojAction={onClose} chroming="outlined">Cancel</oj-button>
        <oj-button 
          onojAction={handleSave} 
          chroming="callToAction"
          disabled={!isFormValid()}
        >
          Register Application
        </oj-button>
      </div>
    </oj-dialog>
  );
};

// Edit Application Dialog Component
const EditApplicationDialog = ({ 
  isOpen, 
  onClose, 
  onSave,
  selectedApp,
  formErrors = {}
}: {
  isOpen: boolean,
  onClose: () => void,
  onSave: (id: number, name: string, description: string, isActive: boolean) => void,
  selectedApp?: Application | null,
  formErrors?: Record<string, string>,
}) => {
  const dialogRef = useRef<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (dialogRef.current) {
      if (isOpen) {
        dialogRef.current.open();
      } else {
        dialogRef.current.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedApp) {
      setName(selectedApp.name);
      setDescription(selectedApp.description || '');
      setIsActive(selectedApp.isActive !== false); // Default to true if undefined
    } else if (!isOpen) {
      setName('');
      setDescription('');
      setIsActive(true);
    }
  }, [isOpen, selectedApp]);

  // Check if anything changed
  const hasChanges = () => {
    if (!selectedApp) return false;
    return (
      name.trim() !== selectedApp.name ||
      description.trim() !== (selectedApp.description || '') ||
      isActive !== (selectedApp.isActive !== false)
    );
  };

  // Check if form is valid
  const isFormValid = () => {
    return name.trim().length >= 1 && name.trim().length <= 100 && description.length <= 500;
  };

  const handleSave = () => {
    if (!name.trim() || !selectedApp) return;
    if (!hasChanges()) {
      onClose(); // No changes, just close
      return;
    }
    onSave(selectedApp.id, name.trim(), description.trim(), isActive);
  };

  return (
    <oj-dialog 
      ref={dialogRef} 
      id="editAppDialog" 
      dialogTitle={`Edit Application - ${selectedApp?.name || ''}`} 
      initialVisibility="hide"
      class="edit-app-dialog"
      style={{width: '500px'}}
    >
      <div slot="body" class="dialog-body-form">
        <oj-form-layout direction="column">
          <div class="form-field">
            <oj-input-text
              required
              labelHint="Application Name *"
              value={name}
              onvalueChanged={(e: CustomEvent) => setName(e.detail.value)}
              placeholder="Enter application name (max 100 characters)"
              class="form-input oj-form-control-full-width"
            />
            <div class="field-hint">{name.length}/100 characters</div>
            {formErrors.name && (
              <div class="field-error">{formErrors.name}</div>
            )}
          </div>
          <div class="form-field">
            <oj-input-text
              labelHint="Description"
              value={description}
              onvalueChanged={(e: CustomEvent) => setDescription(e.detail.value)}
              placeholder="Enter application description (optional, max 500 characters)"
              class="form-input oj-form-control-full-width"
            />
            <div class="field-hint">{description.length}/500 characters</div>
            {formErrors.description && (
              <div class="field-error">{formErrors.description}</div>
            )}
          </div>
          <div class="form-field">
            <oj-switch
              labelHint="Status"
              value={isActive}
              onvalueChanged={(e: CustomEvent) => setIsActive(e.detail.value)}
            >
            </oj-switch>
          </div>
        </oj-form-layout>
      </div>
      <div slot="footer" class="dialog-footer">
        <oj-button onojAction={onClose} chroming="outlined">Cancel</oj-button>
        <oj-button 
          onojAction={handleSave} 
          chroming="callToAction"
          disabled={!isFormValid() || !hasChanges()}
        >
          Update Application
        </oj-button>
      </div>
    </oj-dialog>
  );
};

export function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUsersDialog, setShowUsersDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // State for user assignment dialog
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [currentAssignedUserIds, setCurrentAssignedUserIds] = useState<number[]>([]);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Toast notifications
  const { showSuccess, showError, showWarning } = useToast();

  // Check if current user is admin
  const isAdmin = authService.isAdmin();

  // Optimized loading using bulk endpoints
  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      setFormErrors({});
      
      // 1. Fetch applications (backend filters based on user permissions) and all users in parallel
      const [allApps, allUsersData] = await Promise.all([
        apiClient.getApplications(), // Backend returns all apps for ADMIN or only assigned apps for USER
        apiClient.getUsers()
      ]);
      
      // Add friendly name to users
      const usersWithNames = allUsersData.map(user => ({
        ...user,
        name: user.email.split('@')[0]
      }));
      
      setAllUsers(usersWithNames);
      
      // 2. For each application, get its assigned users to build relationships
      const appsWithUsers = await Promise.all(
        allApps.map(async (app) => {
          try {
            const assignedUsers = await apiClient.getApplicationUsers(app.id);
            return {
              ...app,
                  status: 'active' as const,
              users: assignedUsers
            };
          } catch (error) {
            // Handle individual app user loading errors gracefully
            errorHandler.handleApiError(error, `loading users for app ${app.id}`);
            return {
              ...app,
              status: 'active' as const,
              users: []
            };
          }
        })
      );
      
      setApplications(appsWithUsers);
    } catch (error) {
      errorHandler.handleApiError(error, 'loading applications');
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleAddApplication = async (name: string, description: string) => {
    try {
      setError(null);
      setFormErrors({});
      
      const createRequest: CreateApplicationRequest = {
        name,
        description: description || undefined
      };
      
      // Frontend validation
      const validation = validateCreateApplication(createRequest);
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        showError('Please correct the errors below');
        return;
      }
      
      await apiClient.createApplication(createRequest);
      
      // Show success toast instead of HTML message
      showSuccess('Application registered successfully!');
      
      // Close dialog first to prevent flickering
      setShowAddDialog(false);
      
      await loadApplications();
    } catch (error) {
      if (error instanceof HttpApiError && error.hasFieldErrors()) {
        // Handle field validation errors
        setFormErrors(error.getFieldErrors());
        showError('Please correct the errors below');
      } else {
        // Handle other errors
        errorHandler.handleApiError(error, 'creating application');
      }
    }
  };

  const handleEditApplication = async (id: number, name: string, description: string, isActive: boolean) => {
    try {
      setError(null);
      setFormErrors({});
      
      const updateRequest: UpdateApplicationRequest = {
        name,
        description: description || undefined,
        isActive
      };
      
      // Frontend validation
      const validation = validateUpdateApplication(updateRequest);
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        showError('Please correct the errors below');
        return;
      }
      
      await apiClient.updateApplication(id, updateRequest);
      
      // Show success toast instead of HTML message
      showSuccess('Application updated successfully!');
      
      // Close dialog first to prevent flickering
      setShowEditDialog(false);
      setSelectedApp(null);
      
      await loadApplications();
    } catch (error) {
      if (error instanceof HttpApiError && error.hasFieldErrors()) {
        // Handle field validation errors
        setFormErrors(error.getFieldErrors());
        showError('Please correct the errors below');
      } else {
        // Handle other errors (including duplication errors)
        const errorMessage = error instanceof HttpApiError ? error.message : 'Failed to update application';
        if (errorMessage.includes('already exists')) {
          showError(errorMessage);
        } else {
          errorHandler.handleApiError(error, 'updating application');
        }
      }
    }
  };

  // When user clicks "View Users" on an app row
  const handleViewUsers = (app: Application) => {
    if (savingAssignment) {
      return;
    }
    setSelectedApp(app);
    setCurrentAssignedUserIds((app.users || []).map(user => user.id));
    setShowUsersDialog(true);
  };

  // When user clicks "Edit" on an app row
  const handleEditApp = (app: Application) => {
    setSelectedApp(app);
    setShowEditDialog(true);
  };

  const handleSaveUserAssignments = async (selectedUserIds: number[]) => {
    if (!selectedApp) return;
    setSavingAssignment(true);
    setError(null);

    try {
      const current = currentAssignedUserIds;
      const toAdd = selectedUserIds.filter(id => !current.includes(id));
      const toRemove = current.filter(id => !selectedUserIds.includes(id));

      if (toAdd.length > 0) {
        const req: BulkPermissionRequest = { userIds: toAdd, appIds: [selectedApp.id] };
        await apiClient.createPermissions(req);
      }

      if (toRemove.length > 0) {
        // Remove multiple users from single app - this should work according to API docs
        const req: BulkPermissionRequest = { userIds: toRemove, appIds: [selectedApp.id] };
        await apiClient.deletePermissions(req);
      }

      // Show success toast instead of HTML message
      showSuccess('Application assignments updated successfully!');

      // Close dialog first to prevent flickering
      setShowUsersDialog(false);
      setSelectedApp(null);
      setCurrentAssignedUserIds([]);

      // refresh page dataset
      await loadApplications();
    } catch (err) {
      if (err instanceof HttpApiError && err.hasFieldErrors()) {
        setFormErrors(err.getFieldErrors());
        showError('Please correct the errors below');
      } else {
        errorHandler.handleApiError(err, 'updating assignments');
      }
    } finally {
      setSavingAssignment(false);
    }
  };


  // Filtered data for table
  const filteredApplications = useMemo(() => {
    if (!searchTerm) return applications;
    const lowerTerm = searchTerm.toLowerCase();
    return applications.filter(app =>
      app.name.toLowerCase().includes(lowerTerm) ||
      (app.description && app.description.toLowerCase().includes(lowerTerm)) ||
      (app.users && app.users.some(user => user.email.toLowerCase().includes(lowerTerm)))
    );
  }, [applications, searchTerm]);

  // Data provider for table
  const dataProvider = useMemo(() => {
    return new ArrayDataProvider(filteredApplications, { keyAttributes: 'id' });
  }, [filteredApplications]);

  // Action renderer for table actions column
  const actionsRenderer = (context: ojTable.ColumnsRendererContext<Application['id'], Application>) => {
    render(
      <ActionCell
        rowData={context.row}
        onViewUsers={handleViewUsers}
        onEditApp={handleEditApp}
        isAdmin={isAdmin}
      />,
      context.parentElement
    );
  };

  // Status badge renderer
  const statusRenderer = (context: ojTable.ColumnsRendererContext<Application['id'], Application>) => {
    const isActive = context.row.isActive !== false; // Default to true if undefined
    const statusBadge = isActive 
      ? <span class="oj-badge oj-badge-success status-badge">Active</span>
      : <span class="oj-badge oj-badge-danger status-badge">Inactive</span>;

    render(statusBadge, context.parentElement);
  };

  // Created renderer — format epoch millis or ISO string into friendly date/time
  const createdRenderer = (context: ojTable.ColumnsRendererContext<Application['id'], Application>) => {
    const val = context.row.updatedAt;
    // sometimes backend gives epoch millis as string/number — handle both
    let date: Date | null = null;
    if (typeof val === 'number') date = new Date(val);
    else if (typeof val === 'string') {
      // detect numeric string (epoch ms)
      if (/^\d{10,}$/.test(val)) {
        // if length 10 — seconds, convert to ms
        const n = Number(val);
        date = (val.length === 10) ? new Date(n * 1000) : new Date(n);
      } else {
        const d = new Date(val);
        if (!isNaN(d.getTime())) date = d;
      }
    }

    const content = date ? (
      <div class="created-cell">
        <div class="created-date">{date.toLocaleDateString()}</div>
        <div class="created-time">{date.toLocaleTimeString()}</div>
      </div>
    ) : (
      <span class="created-raw">{String(val)}</span>
    );

    render(content, context.parentElement);
  };

  // Column definitions — NOTE: removed 'Users' column per your request
  const columns = useMemo(() => {
    const cols: any[] = [
      { 
        headerText: 'Name', 
        field: 'name', 
        resizable: "enabled" as const,
        className: 'name-column'
      },
      { 
        headerText: 'Description', 
        field: 'description', 
        resizable: "enabled" as const,
        className: 'description-column'
      },
      {
        headerText: 'Status',
        renderer: statusRenderer,
        resizable: "enabled" as const,
        className: 'status-column'
      },
      {
        headerText: 'Last Updated',
        renderer: createdRenderer,
        resizable: "enabled" as const,
        className: 'created-column'
      }
    ];

    // Only include Actions column for admin users
    if (isAdmin) {
      cols.push({
        headerText: 'Actions',
        headerClassName: 'oj-sm-text-align-end',
        className: 'oj-sm-text-align-end actions-column-table',
        renderer: actionsRenderer,
      });
    }

    return cols;
  }, [isAdmin]);
  
  if (loading) {
    return (
      <div class="applications-page">
        <div class="loading-container">
          <div class="oj-panel oj-panel-alt1 loading-panel">
            <span class="oj-ux-ico oj-ux-ico-clock loading-icon oj-icon-spin"></span>
            <h3 class="oj-typography-heading-sm">Loading applications...</h3>
            <p class="oj-typography-body-md oj-text-color-secondary">Please wait while we fetch your data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="applications-page">
      {/* Page Header */}
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center page-header-apps">
        <h1 class="oj-typography-heading-lg page-title">Application Management</h1>
        {/* Only show "Register Application" button for admin users */}
        {isAdmin && (
        <oj-button 
            onojAction={() => setShowAddDialog(true)} 
          chroming="callToAction"
            class="add-app-btn"
        >
            <span slot="startIcon" class="oj-ux-ico-plus"></span>
          Register Application
        </oj-button>
        )}
        
      </div>

      {/* Search Section */}
      <div class="oj-flex oj-sm-margin-4x-bottom search-section-apps">
            <oj-input-text
              value={searchTerm}
          onvalueChanged={(e: CustomEvent) => setSearchTerm(e.detail.value)}
          labelHint="Search applications"
          placeholder="Search by name or description..."
          class="oj-sm-width-1/2 search-input-apps"
        />
      </div>

      {/* Messages */}
      <oj-messages 
        messages={messages} 
        onmessagesChanged={() => setMessages([])}
        class="apps-messages"
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

      {/* Applications Table */}
      <div class="table-section-apps">
        <h3 class="oj-typography-heading-sm table-title-apps oj-sm-margin-3x-bottom">
          Registered Applications ({filteredApplications.length})
        </h3>
        
        <oj-table
          data={dataProvider}
          columns={columns}
          aria-label="Applications Table"
          class="oj-table-stretch applications-oj-table"
          horizontal-grid-visible="enabled"
          vertical-grid-visible="enabled"
          scroll-policy="loadMoreOnScroll"
          style={{ width: '100%', minHeight: '600px' }}
        />
        
        {filteredApplications.length === 0 && (
          <div class="empty-state-apps">
            <span class="oj-ux-ico oj-ux-ico-application empty-state-icon"></span>
            <h3 class="oj-typography-heading-sm">No applications found</h3>
            <p class="oj-typography-body-md oj-text-color-secondary">
              {applications.length === 0 
                ? 'Get started by registering your first application.' 
                : 'Try adjusting your search criteria.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Add Application Dialog */}
      <AddApplicationDialog
        isOpen={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setFormErrors({});
        }}
        onSave={handleAddApplication}
        formErrors={formErrors}
      />

      {/* Edit Application Dialog */}
      {isAdmin && (
        <EditApplicationDialog
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedApp(null);
            setFormErrors({});
          }}
          onSave={handleEditApplication}
          selectedApp={selectedApp}
          formErrors={formErrors}
        />
      )}

      {/* Assign Users Dialog - Only for admin users */}
      {isAdmin && (
        <AssignUsersDialog
          isOpen={showUsersDialog}
          saving={savingAssignment}
          onClose={() => {
            setShowUsersDialog(false);
            setSelectedApp(null);
            setCurrentAssignedUserIds([]);
          }}
          onSave={handleSaveUserAssignments}
          selectedApp={selectedApp || undefined}
          users={allUsers}
          currentAssignedUserIds={currentAssignedUserIds}
        />
      )}
    </div>
  );
}
