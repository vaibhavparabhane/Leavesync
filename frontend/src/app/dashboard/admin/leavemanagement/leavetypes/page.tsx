'use client';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/common/Loading';
import { AdminController } from '@/controllers/AdminController';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { useState, useEffect } from 'react';
import { hrAPI } from '@/utils/api';

interface LeaveType {
  id: string;
  name: string;
  yearly_quota: number;
  is_active: boolean;
}

export default function LeaveTypesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [formData, setFormData] = useState({ name: '', yearly_quota: 0 });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    setLoading(true);
    const result = await AdminController.fetchAllLeaveTypes();
    if (result.success) {
      const types = result.data?.data || result.data || [];
      setLeaveTypes(Array.isArray(types) ? types : []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (leaveType?: LeaveType) => {
    if (leaveType) {
      setEditingType(leaveType);
      setFormData({ name: leaveType.name, yearly_quota: leaveType.yearly_quota });
    } else {
      setEditingType(null);
      setFormData({ name: '', yearly_quota: 0 });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingType(null);
    setFormData({ name: '', yearly_quota: 0 });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Leave type name is required' });
      return;
    }

    if (editingType) {
      const result = await AdminController.updateLeaveType(editingType.id, formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Leave type updated successfully' });
        fetchLeaveTypes();
        handleCloseDialog();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update' });
      }
    } else {
      const result = await AdminController.createLeaveType(formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Leave type created successfully' });
        fetchLeaveTypes();
        handleCloseDialog();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create' });
      }
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleToggleActive = async (leaveType: LeaveType) => {
    const result = await AdminController.updateLeaveType(leaveType.id, {
      name: leaveType.name,
      yearly_quota: leaveType.yearly_quota,
      is_active: !leaveType.is_active
    });
    if (result.success) {
      setMessage({ type: 'success', text: `Leave type ${leaveType.is_active ? 'deactivated' : 'activated'}` });
      fetchLeaveTypes();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
      <DashboardLayout role="admin">
        {message.text && (
          <Alert severity={message.type as 'success' | 'error'} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        {loading ? (
          <Loading message="Loading leave types..." />
        ) : (
          <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  Leave Types Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add Leave Type
                </Button>
              </Box>

              <TableContainer sx={{ backgroundColor: '#f5f5f5' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Yearly Quota</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaveTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No leave types found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveTypes.map((lt) => (
                        <TableRow key={lt.id} hover>
                          <TableCell>{lt.name}</TableCell>
                          <TableCell>{lt.yearly_quota} days</TableCell>
                          <TableCell>
                            <Chip
                              label={lt.is_active ? 'Active' : 'Inactive'}
                              color={lt.is_active ? 'success' : 'default'}
                              size="small"
                              onClick={() => handleToggleActive(lt)}
                              sx={{ cursor: 'pointer' }}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleOpenDialog(lt)}
                            >
                              <EditIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
        )}

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingType ? 'Edit Leave Type' : 'Add Leave Type'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Leave Type Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Yearly Quota (Days)"
                type="number"
                value={formData.yearly_quota}
                onChange={(e) => setFormData({ ...formData, yearly_quota: parseInt(e.target.value) || 0 })}
                fullWidth
                required
                inputProps={{ min: 0 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              {editingType ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
