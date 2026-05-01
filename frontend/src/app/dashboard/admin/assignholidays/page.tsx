'use client';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';

import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Loading from '@/components/common/Loading';
import { HRController } from '@/controllers/HRController';
import { Holiday } from '@/models/Leave';
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  IconButton,
  Alert,
  Checkbox,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { hrAPI } from '@/utils/api';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  location?: string;
}

export default function AssignHolidaysPage() {
  const [locations, setLocations] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedHoliday, setSelectedHoliday] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [assigned, setAssigned] = useState<
    { employee: string; employeeId: string; holiday: string; date: string; location: string }[]
  >([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const employeesResult = await HRController.fetchEmployees(1, 100);
    const holidaysResult = await HRController.fetchHolidays(1, 100);
    
    if (employeesResult.success) {
      setEmployees(employeesResult.data.employees);
      const uniqueLocations = new Set<string>();
      employeesResult.data.employees.forEach((emp: Employee) => {
        if (emp.location) uniqueLocations.add(emp.location);
      });
      setLocations(Array.from(uniqueLocations));
    } else {
      setMessage({ text: employeesResult.error || 'Error loading employees', type: 'error' });
    }
    
    if (holidaysResult.success) {
      setHolidays(holidaysResult.data.holidays);
    } else {
      setMessage({ text: holidaysResult.error || 'Error loading holidays', type: 'error' });
    }
    
    setLoading(false);
  };

  // Filter holidays based on selected location:
  // - When "All Locations" selected: show only holidays with location = 'ALL' (common holidays)
  // - When specific location selected: show holidays matching that location OR location = 'ALL'
  const filteredHolidays = selectedLocation === ''
    ? holidays.filter((h) => h.location === 'ALL')
    : selectedLocation
      ? holidays.filter((h) => h.location === selectedLocation || h.location === 'ALL')
      : [];

  // Filter employees based on selected location:
  // - When "All Locations" selected: show all employees
  // - When specific location selected: show only employees of that location
  const filteredEmployees = selectedLocation === ''
    ? employees
    : selectedLocation
      ? employees.filter((e) => e.location === selectedLocation)
      : [];

  const handleAssign = async () => {
    if (selectedLocation === undefined || selectedEmployeeIds.length === 0 || !selectedHoliday) {
      setMessage({ text: 'Please select employees and holiday', type: 'error' });
      return;
    }

    const holiday = holidays.find((h) => h.id === selectedHoliday);
    if (!holiday) return;

    console.log('Assigning holiday:', { employee_ids: selectedEmployeeIds, holiday_id: selectedHoliday });

    setLoading(true);
    const result = await HRController.assignHolidays(selectedEmployeeIds, selectedHoliday);
    
    console.log('Assignment result:', result);
    
    if (result.success) {
      if (result.data.assigned_count === 0) {
        setMessage({ text: 'This holiday is already assigned to all selected employees', type: 'warning' });
      } else {
        const selectedEmployees = employees.filter((emp) => selectedEmployeeIds.includes(emp.id));
        const newAssignments = selectedEmployees.map((emp) => ({
          employee: emp.full_name,
          employeeId: emp.id,
          holiday: holiday.name,
          date: holiday.date,
          location: holiday.location,
        }));
        setAssigned((prev) => [...prev, ...newAssignments]);
        setSelectedEmployeeIds([]);
        setSelectedHoliday('');
        setMessage({ text: `Holiday assigned to ${result.data.assigned_count} employee(s) successfully`, type: 'success' });
      }
    } else {
      console.error('Assignment error:', result.error);
      setMessage({ text: result.error || 'Failed to assign holiday', type: 'error' });
    }
    setLoading(false);
  };

  const handleRemove = (index: number) => {
    setAssigned((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployeeIds.length === filteredEmployees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredEmployees.map((emp) => emp.id));
    }
  };

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    setSelectedEmployeeIds([]);
    setSelectedHoliday('');
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
        <DashboardLayout role="admin">
          <Loading message="Loading holiday assignment data..." />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={ROLE_GROUPS.ADMIN_ONLY}>
      <DashboardLayout role="admin">
        {message.text && (
          <Alert severity={message.type as 'success' | 'error'} sx={{ mb: 2 }} onClose={() => setMessage({ text: '', type: '' })}>
            {message.text}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              select
              label="Select Location"
              value={selectedLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              sx={{ maxWidth: 300 }}
            >
              <MenuItem value="">All Locations</MenuItem>
              {locations.map((loc) => (
                <MenuItem key={loc} value={loc}>
                  {loc}
                </MenuItem>
              ))}
            </TextField>

            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Select Employees ({selectedEmployeeIds.length} selected)
                </Typography>
                <Button 
                  size="small" 
                  onClick={handleSelectAll}
                  disabled={filteredEmployees.length === 0}
                >
                  {selectedEmployeeIds.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>
              
              <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                {filteredEmployees.length === 0 ? (
                  <Typography sx={{ p: 2 }} color="text.secondary">
                    No employees found for this location
                  </Typography>
                ) : (
                  <List>
                    {filteredEmployees.map((emp) => (
                      <ListItem key={emp.id} disablePadding>
                        <ListItemButton onClick={() => handleEmployeeToggle(emp.id)}>
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={selectedEmployeeIds.includes(emp.id)}
                              tabIndex={-1}
                              disableRipple
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={emp.full_name} 
                            secondary={emp.email}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Box>

            <TextField
              select
              label="Select Holiday"
              value={selectedHoliday}
              onChange={(e) => setSelectedHoliday(e.target.value)}
              disabled={filteredHolidays.length === 0}
              sx={{ maxWidth: 400 }}
            >
              <MenuItem value="">Select Holiday</MenuItem>
              {filteredHolidays.map((h) => (
                <MenuItem key={h.id} value={h.id}>
                  {h.name} - {h.date} ({h.location})
                </MenuItem>
              ))}
            </TextField>

            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAssign}
              disabled={selectedEmployeeIds.length === 0 || !selectedHoliday}
              sx={{ maxWidth: 200 }}
            >
              Assign Holiday to {selectedEmployeeIds.length > 0 ? `${selectedEmployeeIds.length} ` : ''}Employee{selectedEmployeeIds.length !== 1 ? 's' : ''}
            </Button>
          </Box>
        </Paper>

        {assigned.length > 0 && (
          <Paper sx={{ p: 3, maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              Assigned Holidays ({assigned.length})
            </Typography>
            <List>
              {assigned.map((a, idx) => (
                <ListItem
                  key={idx}
                  secondaryAction={
                    <IconButton edge="end" color="error" onClick={() => handleRemove(idx)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${a.employee} - ${a.holiday}`}
                    secondary={`Date: ${a.date} | Location: ${a.location}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {locations.length === 0 && (
          <Alert severity="info">
            No locations found. Please ensure employees have location assigned and holidays are created.
          </Alert>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
