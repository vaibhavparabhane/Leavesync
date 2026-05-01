'use client';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Box, Typography, Paper, TextField, MenuItem, Button, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { dashboardStyles, formStyles } from '@/config/styles';
import { TYPOGRAPHY } from '@/config/typography';

export default function HolidayManagementPage() {
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [holidays, setHolidays] = useState<any[]>([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchLocationsAndHolidays();
  }, []);

  const fetchLocationsAndHolidays = async () => {
    try {
      const [locationsRes, holidaysRes] = await Promise.all([
        api.get('/system/locations'),
        api.get('/holidays', { params: { page: 1, per_page: 100 } })
      ]);
      const locationsData = locationsRes.data.data || locationsRes.data;
      const holidaysData = holidaysRes.data.data || holidaysRes.data;
      setLocations(locationsData.locations || locationsData || []);
      setHolidays(holidaysData.holidays || holidaysData || []);
    } catch (err) {
      console.error('Failed to fetch locations/holidays');
    }
  };

  const getCurrentHolidays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidays.filter(h => new Date(h.date) >= today);
  };

  const getPreviousHolidays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidays.filter(h => new Date(h.date) < today);
  };

  const handleAddHoliday = async () => {
    if (!selectedLocation || !holidayDate || !holidayName) {
      setMessage({ type: 'error', text: 'Please fill all fields' });
      return;
    }
    
    setFormLoading(true);
    try {
      await api.post('/holidays', {
        name: holidayName,
        date: holidayDate,
        location: selectedLocation,
      });
      setMessage({ type: 'success', text: 'Holiday created successfully!' });
      setHolidayDate('');
      setHolidayName('');
      setSelectedLocation('');
      fetchLocationsAndHolidays();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create holiday' });
    } finally {
      setFormLoading(false);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleRemoveHoliday = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    
    setFormLoading(true);
    try {
      await api.delete(`/holidays/${holidayId}`);
      setMessage({ type: 'success', text: 'Holiday deleted successfully!' });
      setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete holiday' });
    } finally {
      setFormLoading(false);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
      <DashboardLayout role="admin">
        <Box sx={{ mb: 3 }}>
          <Typography sx={TYPOGRAPHY.PAGE_TITLE} gutterBottom>Holiday Management</Typography>
          <Typography sx={TYPOGRAPHY.PAGE_SUBTITLE}>Create and manage company holidays for different locations</Typography>
        </Box>

        {message.text && (
          <Alert severity={message.type as 'success' | 'error'} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 4, mb: 3, maxWidth: 900 }}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={TYPOGRAPHY.CARD_TITLE} gutterBottom>Add New Holiday</Typography>
              <Typography sx={TYPOGRAPHY.PAGE_SUBTITLE}>Create a holiday for specific location or all locations</Typography>
            </Box>
            <Box sx={formStyles.dialogContent}>
              <TextField
                select
                label="Select Location"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                fullWidth
                placeholder="Choose location"
              >
                <MenuItem value="">Select a location</MenuItem>
                <MenuItem value="ALL">All Locations</MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                ))}
              </TextField>
              <TextField
                type="date"
                label="Holiday Date"
                InputLabelProps={{ shrink: true }}
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                fullWidth
              />
              <TextField
                label="Holiday Name"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                fullWidth
                placeholder="Enter holiday name"
              />
              <Button 
                variant="contained" 
                onClick={handleAddHoliday}
                disabled={formLoading}
                fullWidth
                size="large"
                sx={{ mt: 1, py: 1.5 }}
              >
                {formLoading ? 'Adding...' : 'Add Holiday'}
              </Button>
            </Box>
          </Paper>

          {getCurrentHolidays().length > 0 ? (
            <Paper sx={{ p: 4, maxWidth: 900, mb: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography sx={TYPOGRAPHY.CARD_TITLE} gutterBottom>Current Holidays ({getCurrentHolidays().length})</Typography>
                <Typography sx={TYPOGRAPHY.PAGE_SUBTITLE}>Upcoming and current holidays in the system</Typography>
              </Box>
              {getCurrentHolidays().map((h) => (
                <Box key={h.id} sx={dashboardStyles.holidayItem}>
                  <Box>
                    <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, fontWeight: 600 }}>{h.name}</Typography>
                    <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, fontSize: '0.875rem', color: 'text.secondary' }}>
                      {h.date} • {h.location}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleRemoveHoliday(h.id)}
                    disabled={formLoading}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Paper>
          ) : (
            <Paper sx={{ p: 4, bgcolor: '#f8fafc', textAlign: 'center', border: '1px dashed', borderColor: 'divider', maxWidth: 900, mb: 3 }}>
              <Typography sx={TYPOGRAPHY.BODY_TEXT} color="text.secondary">
                No current holidays found. Add your first holiday above.
              </Typography>
            </Paper>
          )}

          {getPreviousHolidays().length > 0 && (
            <Paper sx={{ p: 4, maxWidth: 900 }}>
              <Box sx={{ mb: 3 }}>
                <Typography sx={TYPOGRAPHY.CARD_TITLE} gutterBottom>Previous Holidays ({getPreviousHolidays().length})</Typography>
                <Typography sx={TYPOGRAPHY.PAGE_SUBTITLE}>Past holidays that have already occurred</Typography>
              </Box>
              {getPreviousHolidays().map((h) => (
                <Box key={h.id} sx={{ ...dashboardStyles.holidayItem, borderColor: 'divider' }}>
                  <Box>
                    <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, fontWeight: 600, color: 'text.secondary' }}>{h.name}</Typography>
                    <Typography sx={{ ...TYPOGRAPHY.BODY_TEXT, fontSize: '0.875rem', color: 'text.secondary' }}>
                      {h.date} • {h.location}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
