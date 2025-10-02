/**
 * Users Page Component - Proper Oracle JET table implementation
 */
import { h, render } from "preact";
import { useState, useEffect, useMemo, useRef } from "preact/hooks";
import { UserRole } from "../../contexts/user-context";
import { apiClient, User as ApiUser, Application, BulkPermissionRequest } from "../../services/api";
import { errorHandler } from "../../services/errorHandler";
import { useToast } from "../../contexts/ToastContext";
import { HttpApiError } from "../../services/HttpApiError";
import "ojs/ojinputtext";
import "ojs/ojlabel";
import "ojs/ojbutton";
import "ojs/ojdialog";
import "ojs/ojformlayout";
import "ojs/ojtable";
import "ojs/ojmessages";
import ArrayDataProvider = require('ojs/ojarraydataprovider');
import { ojTable } from 'ojs/ojtable';

interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  assignedApps: Application[];
  status: 'active' | 'inactive';
}

// Action Cell Component for row buttons
const ActionCell = ({ 
  rowData, 
  onAssignApps
}: {
  rowData: User,
  onAssignApps: (user: User) => void,
}) => {
  return (
    <div class="oj-flex oj-sm-justify-content-end oj-sm-align-items-center action-cell-container">
      <oj-button
        display="icons"
        chroming="outlined"
        title={`Assign applications to ${rowData.name}`}
        aria-label={`Assign Applications for ${rowData.name}`}
        onojAction={() => onAssignApps(rowData)}
        class="action-btn-table"
      >
        <span slot="startIcon" class="oj-ux-ico-new-application"></span>
      </oj-button>
    </div>
  );
};



// Assign Applications Dialog Component
// AssignAppsDialog (replace your current component with this)
const AssignAppsDialog = ({ 
  isOpen, 
  saving = false,
  onClose, 
  onSave,
  selectedUser,
  applications,
  currentAssignedAppIds
}: {
  isOpen: boolean,
  saving?: boolean,
  onClose: () => void,
  // parent onSave returns void | Promise<void>
  onSave: (appIds: number[]) => void | Promise<void>,
  selectedUser?: User,
  applications: Application[],
  currentAssignedAppIds: number[]
}) => {
  const dialogRef = useRef<any>(null);
  const [selectedApps, setSelectedApps] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // refs for dialog lifecycle coordination
  const preventCloseRef = useRef(false);
  const lastIsOpenRef = useRef<boolean | null>(null);

  // attach ojBeforeClose guard to block internal close when saving
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const beforeCloseHandler = (ev: any) => {
      // if saving, block internal close
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
  // If saving is true and the dialog is currently closed, do NOT re-open.
  useEffect(() => {
    if (!dialogRef.current) return;

    if (isOpen) {
      // only open if previously closed and not in "do-not-reopen" saving-window
      if (!lastIsOpenRef.current && !saving) {
        dialogRef.current.open();
      }
    } else {
      // allow parent-driven close always
      if (lastIsOpenRef.current) {
        dialogRef.current.close();
      }
    }
    lastIsOpenRef.current = isOpen;
  }, [isOpen, saving]);

  // Initialize selectedApps based on currentAssignedAppIds
  useEffect(() => {
    if (isOpen) {
      setSelectedApps(currentAssignedAppIds || []);
    } else if (!isOpen) {
      setSelectedApps([]);
      setSearchTerm("");
    }
  }, [isOpen, currentAssignedAppIds]);

  // Filtered and sorted applications (assigned applications at top)
  const filteredApplications = useMemo(() => {
    let result = applications;
    
    // Apply search filter
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter(app =>
        app.name.toLowerCase().includes(q) ||
        (app.description ?? "").toLowerCase().includes(q)
      );
    }
    
    // Sort: assigned applications first, then unassigned applications
    result = [...result].sort((a, b) => {
      const aIsAssigned = currentAssignedAppIds.includes(a.id);
      const bIsAssigned = currentAssignedAppIds.includes(b.id);
      
      if (aIsAssigned && !bIsAssigned) return -1;
      if (!aIsAssigned && bIsAssigned) return 1;
      
      // If both assigned or both unassigned, sort by name
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    
    return result;
  }, [applications, searchTerm, currentAssignedAppIds]);

  const handleCheckboxToggle = (appId: number, checked: boolean) => {
    if (checked) {
      setSelectedApps(prev => prev.includes(appId) ? prev : [...prev, appId]);
    } else {
      setSelectedApps(prev => prev.filter(id => id !== appId));
    }
  };

  const selectVisible = () => {
    setSelectedApps(prev => {
      const visibleIds = filteredApplications.map(a => a.id);
      const merged = Array.from(new Set([...prev, ...visibleIds]));
      return merged;
    });
  };

  const clearSelection = () => {
    setSelectedApps([]);
  };

  // handle save click — we set preventCloseRef so internal closes are blocked while the parent's onSave runs
  const handleSaveClick = async () => {
    preventCloseRef.current = true;
    try {
      const maybePromise = onSave(selectedApps);
      if (maybePromise && typeof (maybePromise as any).then === 'function') {
        await (maybePromise as any);
      }
    } finally {
      // small timeout to avoid immediate reopen races; adjust/remove if you want strict synchronous behavior
      setTimeout(() => {
        preventCloseRef.current = false;
      }, 50);
    }
  };

  return (
    <oj-dialog 
      ref={dialogRef} 
      id="assignAppsDialog" 
      dialogTitle={`Assign Applications - ${selectedUser?.name || ''}`} 
      initialVisibility="hide"
      class="assign-apps-dialog"
    >
      <div slot="body" class="dialog-body-assign">
        <div class="apps-assignment-container">
          <div className="apps-header-row" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>

            <oj-input-text
              id="app-search"
              labelHint="Search apps"
              placeholder="Search by name or description"
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
            {filteredApplications.length === 0 ? (
              <div class="empty-apps">
                <span class="oj-ux-ico oj-ux-ico-application empty-apps-icon"></span>
                <p class="oj-typography-body-md">No applications match your search</p>
              </div>
            ) : (
              filteredApplications.map(app => (
                <div key={app.id} class="app-checkbox-item" style={{ padding: "8px 4px", borderBottom: "1px solid #eee" }}>
                  <label class="app-checkbox-label" style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <input
                      type="checkbox"
                      aria-label={`Assign ${app.name}`}
                      checked={selectedApps.includes(app.id)}
                      onChange={(e: any) => handleCheckboxToggle(app.id, e.target.checked)}
                      class="app-checkbox"
                      disabled={saving}
                    />
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span class="app-checkbox-text" style={{ fontWeight: 500 }}>{app.name}</span>
                        {currentAssignedAppIds.includes(app.id) && (
                          <span class="oj-badge oj-badge-success" style={{ fontSize: "0.7em" }}>
                            Currently Assigned
                          </span>
                        )}
                      </div>
                      {app.description && (
                        <span class="app-checkbox-desc" style={{ fontSize: "0.9em", color: "#666" }}>{app.description}</span>
                      )}
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



export function UsersPage() {
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentAssignedAppIds, setCurrentAssignedAppIds] = useState<number[]>([]);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Toast notifications
  const { showSuccess, showError, showWarning } = useToast();

  // Optimized loading using bulk endpoints  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setFormErrors({});
      
      // 1. Fetch all users and all applications in parallel (bulk endpoints)
      const [apiUsers, allApps] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getApplications()
      ]);
      
      setAllApplications(allApps);
      
      // 2. For each user, get their assigned applications to build relationships
      const usersWithApps = await Promise.all(
        apiUsers.map(async (apiUser: ApiUser) => {
          try {
            const userApps = await apiClient.getUserApplications(apiUser.id);
            
            return {
              id: apiUser.id,
              email: apiUser.email,
              name: apiUser.email.split('@')[0],
              role: apiUser.role.toLowerCase() as UserRole,
              assignedApps: userApps,
              status: 'active' as const
            };
          } catch (error) {
            // Handle individual user app loading errors gracefully
            errorHandler.handleApiError(error, `loading apps for user ${apiUser.id}`);
            return {
              id: apiUser.id,
              email: apiUser.email,
              name: apiUser.email.split('@')[0],
              role: apiUser.role.toLowerCase() as UserRole,
              assignedApps: [],
              status: 'active' as const
            };
          }
        })
      );
      
      setUsers(usersWithApps);
    } catch (error) {
      errorHandler.handleApiError(error, 'loading users');
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignApps = (user: User) => {
    if (savingAssignment) {
      return;
    }
    setSelectedUser(user);
    
    // Set current assigned app IDs for proper checkbox initialization and sorting
    setCurrentAssignedAppIds(user.assignedApps.map(app => app.id));
    
    setShowAssignDialog(true);
  };

  const handleSaveAssignment = async (selectedAppIds: number[]) => {
    if (!selectedUser) return;
    
    setSavingAssignment(true);
    try {
      setError(null);
      
      const currentAppIds = selectedUser.assignedApps.map(app => app.id);
      const appsToAdd = selectedAppIds.filter(appId => !currentAppIds.includes(appId));
      const appsToRemove = currentAppIds.filter(appId => !selectedAppIds.includes(appId));
  
      if (appsToAdd.length > 0) {
        await apiClient.createPermissions({
          userIds: [selectedUser.id],
          appIds: appsToAdd
        });
      }
      
      if (appsToRemove.length > 0) {
        await apiClient.deletePermissions({
          userIds: [selectedUser.id],
          appIds: appsToRemove
        });
      }
      
      // refresh dataset
      await loadData();
      
      // close dialog after success
      setShowAssignDialog(false);
      setSelectedUser(null);
      // Show success toast instead of HTML message
      showSuccess(`Successfully updated app assignments for ${selectedUser.name}!`);
    } catch (error) {
      if (error instanceof HttpApiError && error.hasFieldErrors()) {
        setFormErrors(error.getFieldErrors());
        showError('Please correct the errors below');
      } else {
        errorHandler.handleApiError(error, 'updating user assignments');
      }
    } finally {
      setSavingAssignment(false);
    }
  };

  

  // Filtered data for table
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowerTerm = searchTerm.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(lowerTerm) ||
      user.email.toLowerCase().includes(lowerTerm) ||
      user.role.toLowerCase().includes(lowerTerm)
    );
  }, [users, searchTerm]);

  // Data provider for table
  const dataProvider = useMemo(() => {
    return new ArrayDataProvider(filteredUsers, { keyAttributes: 'id' });
  }, [filteredUsers]);

  // Action renderer for table actions column
  const actionsRenderer = (context: ojTable.ColumnsRendererContext<User['id'], User>) => {
    render(
      <ActionCell
        rowData={context.row}
        onAssignApps={handleAssignApps}
      />,
      context.parentElement
    );
  };

  // User info renderer
  const userRenderer = (context: ojTable.ColumnsRendererContext<User['id'], User>) => {
    const userContent = (
      <div class="user-info-cell">
        <div class="user-name">{context.row.name}</div>
        <div class="user-email">{context.row.email}</div>
      </div>
    );

    render(userContent, context.parentElement);
  };

  // Role badge renderer
  const roleRenderer = (context: ojTable.ColumnsRendererContext<User['id'], User>) => {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
          return <span class="oj-badge oj-badge-danger role-badge-table">Admin</span>;
      case 'user':
          return <span class="oj-badge oj-badge-info role-badge-table">User</span>;
      default:
          return <span class="oj-badge oj-badge-secondary role-badge-table">User</span>;
    }
  };

    render(getRoleBadge(context.row.role), context.parentElement);
  };



  // Column definitions
  const columns = useMemo(() => [
    { 
      headerText: 'User', 
      renderer: userRenderer, 
      resizable: "enabled" as const,
      className: 'user-column'
    },
    {
      headerText: 'Role',
      renderer: roleRenderer,
      resizable: "enabled" as const,      
      className: 'role-column'
    },
    {
      headerText: 'Actions',
      headerClassName: 'oj-sm-text-align-end',
      className: 'oj-sm-text-align-end actions-column-table',
      renderer: actionsRenderer,
    },
  ], []);
  
  if (loading) {
    return (
      <div class="users-page">
        <div class="loading-container">
          <div class="oj-panel oj-panel-alt1 loading-panel">
            <span class="oj-ux-ico oj-ux-ico-clock loading-icon oj-icon-spin"></span>
            <h3 class="oj-typography-heading-sm">Loading users...</h3>
            <p class="oj-typography-body-md oj-text-color-secondary">Please wait while we fetch your data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="users-page">
      {/* Page Header */}
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center page-header-users">
        <h1 class="oj-typography-heading-lg page-title">User Management</h1>
      </div>

      {/* Search Section */}
      <div class="oj-flex oj-sm-margin-4x-bottom search-section-users">
        <oj-input-text
          value={searchTerm}
          onvalueChanged={(e: CustomEvent) => setSearchTerm(e.detail.value)}
          labelHint="Search users"
          placeholder="Search by name, email, or role..."
          class="oj-sm-width-1/2 search-input-users"
        />
      </div>

      {/* Messages */}
      <oj-messages 
        messages={messages} 
        onmessagesChanged={() => setMessages([])}
        class="users-messages"
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

      {/* Users Table */}
      <div class="table-section-users">
        <h3 class="oj-typography-heading-sm table-title-users oj-sm-margin-3x-bottom">
          Users ({filteredUsers.length})
        </h3>
        
        <oj-table
          data={dataProvider}
          columns={columns}
          aria-label="Users Table"
          class="oj-table-stretch users-oj-table"
          horizontal-grid-visible="enabled"
          vertical-grid-visible="enabled"
          scroll-policy="loadMoreOnScroll"
          style={{ width: '100%', minHeight: '600px' }}
        />
        
        {filteredUsers.length === 0 && (
          <div class="empty-state-users">
            <span class="oj-ux-ico oj-ux-ico-user empty-state-icon"></span>
            <h3 class="oj-typography-heading-sm">No users found</h3>
            <p class="oj-typography-body-md oj-text-color-secondary">
              {users.length === 0 
                ? 'Get started by creating your first user.' 
                : 'Try adjusting your search criteria.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Assign Applications Dialog */}
      <AssignAppsDialog
        isOpen={showAssignDialog}
        saving={savingAssignment}
        onClose={() => {
          setShowAssignDialog(false);
          setSelectedUser(null);
          setCurrentAssignedAppIds([]);
        }}
        onSave={handleSaveAssignment}
        selectedUser={selectedUser || undefined}
        applications={allApplications}
        currentAssignedAppIds={currentAssignedAppIds}
      />
      
    </div>
  );
}