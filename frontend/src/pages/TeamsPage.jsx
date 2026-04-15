import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Typography, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Skeleton, InputAdornment, Avatar, Tooltip,
} from '@mui/material';
import {
  Add, Search, Edit, Delete, Visibility, LocationOn, Person, FilterList,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { teamsAPI, usersAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function TeamsPage() {
  const { isManager, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locations, setLocations] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', leader_id: '', org_leader_id: '' });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const params = { page_size: 100 };
      if (search) params.search = search;
      if (locationFilter) params.location = locationFilter;
      const res = await teamsAPI.list(params);
      setTeams(res.data.teams);
      const locs = [...new Set(res.data.teams.map(t => t.location))];
      setLocations(locs);
    } catch (err) {
      console.error('Teams load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, [search, locationFilter]);

  const openCreate = async () => {
    setEditTeam(null);
    setForm({ name: '', location: '', leader_id: '', org_leader_id: '' });
    setError('');
    if (users.length === 0) {
      try {
        const res = await usersAPI.list({ page_size: 100 });
        setUsers(res.data.users);
      } catch { /* ignore */ }
    }
    setDialogOpen(true);
  };

  const openEdit = async (team) => {
    setEditTeam(team);
    setForm({
      name: team.name,
      location: team.location,
      leader_id: team.leader_id || '',
      org_leader_id: team.org_leader_id || '',
    });
    setError('');
    if (users.length === 0) {
      try {
        const res = await usersAPI.list({ page_size: 100 });
        setUsers(res.data.users);
      } catch { /* ignore */ }
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.location) { setError('Name and location are required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        location: form.location,
        leader_id: form.leader_id || null,
        org_leader_id: form.org_leader_id || null,
      };
      if (editTeam) {
        await teamsAPI.update(editTeam.id, payload);
      } else {
        await teamsAPI.create(payload);
      }
      setDialogOpen(false);
      fetchTeams();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      await teamsAPI.delete(id);
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Delete failed');
    }
  };

  const locationColorMap = {};
  const colorPalette = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6'];
  locations.forEach((loc, i) => { locationColorMap[loc] = colorPalette[i % colorPalette.length]; });

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Teams</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>Manage team structures and assignments</Typography>
          </Box>
          {isManager && (
            <Button id="create-team-btn" variant="contained" startIcon={<Add />} onClick={openCreate}>
              Create Team
            </Button>
          )}
        </Box>
      </motion.div>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          id="team-search" size="small" placeholder="Search teams..." value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 200 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ color: '#64748b' }} /></InputAdornment> } }}
        />
        <TextField
          id="location-filter" size="small" select label="Location" value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)} sx={{ minWidth: 160 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><FilterList sx={{ color: '#64748b' }} /></InputAdornment> } }}
        >
          <MenuItem value="">All Locations</MenuItem>
          {locations.map(loc => <MenuItem key={loc} value={loc}>{loc}</MenuItem>)}
        </TextField>
      </Card>

      {/* Teams Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Team Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Leader</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5].map(j => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : teams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No teams found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  teams.map((team, i) => (
                    <motion.tr
                      key={team.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      component={TableRow}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/teams/${team.id}`)}
                      sx={{ '&:hover': { backgroundColor: 'rgba(99,102,241,0.04)' } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{
                            width: 36, height: 36, borderRadius: 2,
                            background: `linear-gradient(135deg, ${locationColorMap[team.location] || '#6366f1'}, ${locationColorMap[team.location] || '#8b5cf6'}88)`,
                            fontSize: '0.8rem', fontWeight: 700,
                          }}>
                            {team.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{team.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<LocationOn sx={{ fontSize: 14 }} />}
                          label={team.location}
                          size="small"
                          sx={{ backgroundColor: `${locationColorMap[team.location]}15`, color: locationColorMap[team.location] }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          {team.leader_id ? 'Assigned' : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {new Date(team.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => navigate(`/teams/${team.id}`)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {isManager && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(team)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {isAdmin && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(team.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editTeam ? 'Edit Team' : 'Create New Team'}
        </DialogTitle>
        <DialogContent>
          {error && <Typography color="error" sx={{ mb: 2, fontSize: '0.875rem' }}>{error}</Typography>}
          <TextField
            id="team-name" fullWidth label="Team Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            id="team-location" fullWidth label="Location" value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            id="team-leader" fullWidth select label="Team Leader" value={form.leader_id}
            onChange={(e) => setForm({ ...form, leader_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">No Leader</MenuItem>
            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>)}
          </TextField>
          <TextField
            id="team-org-leader" fullWidth select label="Org Leader" value={form.org_leader_id}
            onChange={(e) => setForm({ ...form, org_leader_id: e.target.value })}
          >
            <MenuItem value="">No Org Leader</MenuItem>
            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editTeam ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
