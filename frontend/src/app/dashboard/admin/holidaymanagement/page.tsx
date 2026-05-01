'use client';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/common/Loading';
import { AdminController } from '@/controllers/AdminController';
import { HRController } from '@/controllers/HRController';
import { Holiday } from '@/models/Leave';
import { useState, useEffect } from 'react';
import { Box, Button, Paper, TextField, Typography, MenuItem, IconButton, Alert, Snackbar } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export default function HolidayManagementPage() {
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [locationsResult, holidaysResult] = await Promise.all([
        HRController.fetchLocations(),
        HRController.fetchHolidays(1, 100)
      ]);
      
      if (locationsResult.success && locationsResult.data) {
        setLocations(locationsResult.data.locations || []);
      } else {
        setError(locationsResult.error || 'Failed to load locations');
      }
      if (holidaysResult.success) {
        setHolidays(holidaysResult.data.holidays);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAddHoliday = async () => {
    if (!selectedLocation || !holidayDate || !holidayName) {
      setError('Please fill all fields');
      return;
    }
    
    setSubmitting(true);
    setError('');
    const result = await AdminController.createHoliday({
      name: holidayName,
      date: holidayDate,
      location: selectedLocation,
    });
    
    if (result.success) {
      setSuccessMsg('Holiday created successfully');
      // Refresh holidays list
      const refreshResult = await HRController.fetchHolidays(1, 100);
      if (refreshResult.success) {
        setHolidays(refreshResult.data.holidays);
      }
      setHolidayDate('');
      setHolidayName('');
      setSelectedLocation('');
    } else {
      setError(result.error || 'Failed to create holiday');
    }
    setSubmitting(false);
  };

  const handleRemoveHoliday = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    
    const result = await AdminController.deleteHoliday(holidayId);
    if (result.success) {
      setSuccessMsg('Holiday deleted successfully');
      setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
    } else {
      setError(result.error || 'Failed to delete holiday');
    }
  };

  const handleEditClick = (holiday: Holiday) => {
    setEditingId(holiday.id || null);
    setEditName(holiday.name);
    setEditDate(holiday.date);
    setEditLocation(holiday.location);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDate('');
    setEditLocation('');
  };

  const handleSaveEdit = async (holidayId: string) => {
    if (!editName || !editDate || !editLocation) {
      setError('Please fill all fields');
      return;
    }

    setSubmitting(true);
    const result = await AdminController.updateHoliday(holidayId, {
      name: editName,
      date: editDate,
      location: editLocation,
    });

    if (result.success) {
      setSuccessMsg('Holiday updated successfully');
      setHolidays((prev) =>
        prev.map((h) =>
          h.id === holidayId
            ? { ...h, name: editName, date: editDate, location: editLocation }
            : h
        )
      );
      setEditingId(null);
      setEditName('');
      setEditDate('');
      setEditLocation('');
    } else {
      setError(result.error || 'Failed to update holiday');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
        <DashboardLayout role="admin">
          <Loading message="Loading holidays..." />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
      <DashboardLayout role="admin">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Paper sx={{ p: 3, maxWidth: 500, mb: 4 }}>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            select
            label="Select Location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <MenuItem value="">Select a location</MenuItem>
            <MenuItem value="ALL">All Locations</MenuItem>
            {locations.map((loc) => (
              <MenuItem key={loc} value={loc}>
                {loc}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="date"
            label="Holiday Date"
            InputLabelProps={{ shrink: true }}
            value={holidayDate}
            onChange={(e) => setHolidayDate(e.target.value)}
          />

          <TextField
            label="Holiday Name"
            value={holidayName}
            onChange={(e) => setHolidayName(e.target.value)}
          />

          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddHoliday}
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add Holiday'}
          </Button>
        </Box>
      </Paper>

      {holidays.length > 0 && (
        <Paper sx={{ p: 3, maxWidth: 800 }}>
          <Typography variant="h6" gutterBottom>
            Current Holidays
          </Typography>
          {holidays.map((h) => (
            <Box
              key={h.id}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
              p={1}
              border="1px solid #ccc"
              borderRadius={1}
            >
              {editingId === h.id ? (
                <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                  <TextField
                    size="small"
                    label="Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    sx={{ minWidth: 150 }}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="Date"
                    InputLabelProps={{ shrink: true }}
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    sx={{ minWidth: 140 }}
                  />
                  <TextField
                    select
                    size="small"
                    label="Location"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="ALL">All Locations</MenuItem>
                    {locations.map((loc) => (
                      <MenuItem key={loc} value={loc}>
                        {loc}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => h.id && handleSaveEdit(h.id)}
                    disabled={submitting}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </Box>
              ) : (
                <>
                  <Typography>
                    {h.location} - {h.date} - {h.name}
                  </Typography>
                  <Box>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEditClick(h)}
                    >
                      <EditIcon />
                    </IconButton>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => h.id && handleRemoveHoliday(h.id)}
                    >
                      Remove
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          ))}
        </Paper>
      )}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg('')}
        message={successMsg}
      />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
