'use client';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, InputAdornment, Avatar, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Alert, Tooltip, Menu, Switch } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { COLORS } from '@/config/colors';
import { adminUserDirectoryStyles, dashboardStyles, employeeRowStyles, formStyles, tableStyles } from '@/config/styles';
import { TYPOGRAPHY } from '@/config/typography';

function EmployeeRow({
  emp,
  onEdit,
  onEditLocation,
  onDelete,
  onToggleStatus,
  updating
}: {
  emp: any;
  onEdit: (emp: any) => void;
  onEditLocation: (emp: any) => void;
  onDelete: (emp: any) => void;
  onToggleStatus: (emp: any) => void;
  updating: string | null;
}) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#0097a7', '#c2185b'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  return (
    <TableRow sx={tableStyles.row}>
      <TableCell>
        <Box sx={employeeRowStyles.avatarContainer}>
          <Avatar sx={{ ...employeeRowStyles.avatar, bgcolor: getAvatarColor(emp.full_name) }}>
            {getInitials(emp.full_name)}
          </Avatar>
          <Typography sx={{ ...TYPOGRAPHY.TABLE_CELL, fontWeight: 500 }}>{emp.full_name}</Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Typography sx={TYPOGRAPHY.TABLE_CELL}>{emp.email}</Typography>
      </TableCell>
      <TableCell>
        <Box sx={employeeRowStyles.locationBox}>
          <Typography sx={TYPOGRAPHY.TABLE_CELL}>{emp.location || '-'}</Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={employeeRowStyles.roleBox}>
          <Box sx={employeeRowStyles.roleChipContainer}>
            {emp.roles?.map((role: string) => (
              <Chip 
                key={role} 
                label={role} 
                size="small" 
                color={role === 'ADMIN' ? 'error' : role === 'HR' ? 'warning' : 'primary'}
                sx={employeeRowStyles.roleChip}
              />
            ))}
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={emp.is_active ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            backgroundColor: emp.is_active ? COLORS.STATUS.APPROVED.background : COLORS.STATUS.REJECTED.background,
            color: emp.is_active ? COLORS.STATUS.APPROVED.main : COLORS.STATUS.REJECTED.main,
            fontWeight: 600,
            border: `1px solid ${emp.is_active ? COLORS.STATUS.APPROVED.border : COLORS.STATUS.REJECTED.border}`
          }}
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={emp.is_active}
          onChange={() => onToggleStatus(emp)}
          disabled={updating === emp.id}
          size="small"
        />
      </TableCell>
      <TableCell align="right">
        <Tooltip title="Edit/Delete">
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchorEl(e.currentTarget)}
            sx={adminUserDirectoryStyles.actionIconButton}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={() => setMenuAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={() => { setMenuAnchorEl(null); onEditLocation(emp); }}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit Location
          </MenuItem>
          <MenuItem onClick={() => { setMenuAnchorEl(null); onEdit(emp); }}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit Role
          </MenuItem>
          <MenuItem onClick={() => { setMenuAnchorEl(null); onDelete(emp); }}>
            <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}

export default function EditUserPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLocationDialogOpen, setEditLocationDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({ location: '' });
  const [selectedRole, setSelectedRole] = useState<string>('EMPLOYEE');
  const [roles, setRoles] = useState<any[]>([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/employees', { params: { page: 1, per_page: 100 } });
      const data = response.data.data || response.data;
      setEmployees(data.employees || data || []);
    } catch (err) {
      console.error('Failed to fetch employees');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/permissions/roles');
      const data = response.data.data || response.data;
      setRoles(data.roles || data || []);
    } catch (err) {
      console.error('Failed to fetch roles');
    }
  };

  const handleEditRole = (emp: any) => {
    setEditingEmployee(emp);
    setSelectedRole(emp.roles?.[0] || 'EMPLOYEE');
    setEditDialogOpen(true);
  };

  const handleEditLocation = (emp: any) => {
    setEditingEmployee(emp);
    setFormData({ location: emp.location || '' });
    setEditLocationDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!editingEmployee) return;
    setFormLoading(true);
    try {
      const roleIds = roles.filter(r => r.name === selectedRole).map(r => r.id);
      await api.put(`/users/${editingEmployee.id}/roles`, { role_ids: roleIds });
      setMessage({ type: 'success', text: 'Role updated successfully!' });
      setEditDialogOpen(false);
      setEditingEmployee(null);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update role' });
    } finally {
      setFormLoading(false);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleUpdateLocation = async () => {
    if (!editingEmployee) return;
    setFormLoading(true);
    try {
      await api.put(`/users/${editingEmployee.id}`, { location: formData.location });
      setMessage({ type: 'success', text: 'Location updated successfully!' });
      setEditLocationDialogOpen(false);
      setEditingEmployee(null);
      setFormData({ location: '' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update location' });
    } finally {
      setFormLoading(false);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDeleteUser = async (emp: any) => {
    if (!confirm(`Soft delete ${emp.full_name}? This user will be hidden from active lists.`)) return;
    setFormLoading(true);
    try {
      await api.delete(`/users/${emp.id}`);
      setMessage({ type: 'success', text: 'User deleted successfully!' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete user' });
    } finally {
      setFormLoading(false);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleToggleStatus = async (emp: any) => {
    setUpdating(emp.id);
    try {
      await api.put(`/users/${emp.id}/status`, { is_active: !emp.is_active });
      setMessage({ type: 'success', text: `User ${!emp.is_active ? 'activated' : 'deactivated'} successfully!` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update user status' });
    } finally {
      setUpdating(null);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
      <DashboardLayout role="admin">
        <Box sx={{ mb: 3 }}>
          <Typography sx={TYPOGRAPHY.PAGE_TITLE} gutterBottom>Edit Users</Typography>
          <Typography sx={TYPOGRAPHY.PAGE_SUBTITLE}>Edit user roles, locations, and manage system users</Typography>
        </Box>

        {message.text && (
          <Alert severity={message.type as 'success' | 'error'} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        <Box sx={dashboardStyles.searchContainer}>
          <TextField
            size="small"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={formStyles.searchField}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
          />
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={adminUserDirectoryStyles.headerRow}>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Toggle</TableCell>
                <TableCell align="right">Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 8 }}>No users found</TableCell></TableRow>
              ) : (
                filteredEmployees.map((emp) => (
                  <EmployeeRow
                    key={emp.id}
                    emp={emp}
                    onEdit={handleEditRole}
                    onEditLocation={handleEditLocation}
                    onDelete={handleDeleteUser}
                    onToggleStatus={handleToggleStatus}
                    updating={updating}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2 }}>
          <Typography sx={TYPOGRAPHY.BODY_TEXT} color="text.secondary">
            Showing {filteredEmployees.length} of {employees.length} users
          </Typography>
        </Box>

        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogContent>
            <Box sx={formStyles.dialogContent}>
              <Typography sx={TYPOGRAPHY.BODY_TEXT} color="text.secondary">
                Editing role for: <strong>{editingEmployee?.full_name}</strong>
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} label="Role">
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole} variant="contained" disabled={formLoading}>
              {formLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={editLocationDialogOpen} onClose={() => setEditLocationDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Location</DialogTitle>
          <DialogContent>
            <Box sx={formStyles.dialogContent}>
              <Typography sx={TYPOGRAPHY.BODY_TEXT} color="text.secondary">
                Editing location for: <strong>{editingEmployee?.full_name}</strong>
              </Typography>
              <TextField 
                label="Location" 
                value={formData.location} 
                onChange={(e) => setFormData({ location: e.target.value })} 
                fullWidth 
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditLocationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateLocation} variant="contained" disabled={formLoading}>
              {formLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
