import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Skeleton, IconButton, Tooltip,
  InputAdornment, Avatar,
} from '@mui/material';
import { Add, Search, Edit, Delete, EmojiEvents, CalendarMonth } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { achievementsAPI, teamsAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function AchievementsPage() {
  const { isContributor, isManager } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ team_id: '', month: '', description: '', metrics: '{}' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page_size: 100 };
      if (teamFilter) params.team_id = teamFilter;
      const [achRes, teamsRes] = await Promise.all([
        achievementsAPI.list(params),
        teamsAPI.list({ page_size: 100 }),
      ]);
      setAchievements(achRes.data.achievements);
      setTeams(teamsRes.data.teams);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [teamFilter]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ team_id: '', month: new Date().toISOString().slice(0, 7) + '-01', description: '', metrics: '{}' });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      team_id: item.team_id,
      month: item.month,
      description: item.description,
      metrics: JSON.stringify(item.metrics || {}, null, 2),
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.team_id || !form.month || !form.description) {
      setError('All fields are required');
      return;
    }
    let metricsObj;
    try {
      metricsObj = JSON.parse(form.metrics);
    } catch {
      setError('Metrics must be valid JSON');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        team_id: form.team_id,
        month: form.month,
        description: form.description,
        metrics: metricsObj,
      };
      if (editItem) {
        await achievementsAPI.update(editItem.id, { description: payload.description, metrics: payload.metrics, month: payload.month });
      } else {
        await achievementsAPI.create(payload);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this achievement?')) return;
    try {
      await achievementsAPI.delete(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Delete failed');
    }
  };

  const teamColors = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6'];
  const getTeamColor = (teamName) => {
    const idx = teams.findIndex(t => t.name === teamName);
    return teamColors[idx % teamColors.length] || '#6366f1';
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Achievements</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>Track monthly team accomplishments and KPIs</Typography>
          </Box>
          {isContributor && (
            <Button id="create-achievement-btn" variant="contained" startIcon={<Add />} onClick={openCreate}>
              Add Achievement
            </Button>
          )}
        </Box>
      </motion.div>

      {/* Filter */}
      <Card sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          id="achievement-team-filter" size="small" select label="Filter by Team"
          value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Teams</MenuItem>
          {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
        </TextField>
      </Card>

      {/* Achievements List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={100} sx={{ mb: 2, borderRadius: 3 }} />
          ))
        ) : achievements.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <EmojiEvents sx={{ fontSize: 48, color: '#64748b', mb: 1 }} />
            <Typography color="text.secondary">No achievements found</Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {achievements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card sx={{
                  p: 0, overflow: 'hidden', position: 'relative',
                  '&::before': {
                    content: '""', position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
                    background: getTeamColor(a.team_name),
                  },
                }}>
                  <Box sx={{ p: 3, pl: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={a.team_name}
                          size="small"
                          sx={{
                            backgroundColor: `${getTeamColor(a.team_name)}15`,
                            color: getTeamColor(a.team_name),
                            fontWeight: 600,
                          }}
                        />
                        <Chip
                          icon={<CalendarMonth sx={{ fontSize: 14 }} />}
                          label={new Date(a.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                        />
                      </Box>
                      <Box>
                        {isContributor && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(a)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {isManager && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(a.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 1.5, color: '#e2e8f0' }}>
                      {a.description}
                    </Typography>
                    {a.metrics && Object.keys(a.metrics).length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {Object.entries(a.metrics).map(([key, val]) => (
                          <Chip
                            key={key}
                            label={`${key.replace(/_/g, ' ')}: ${typeof val === 'number' ? val.toLocaleString() : val}`}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(99,102,241,0.08)',
                              color: '#a78bfa',
                              fontSize: '0.7rem',
                              textTransform: 'capitalize',
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Card>
              </motion.div>
            ))}
          </Box>
        )}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editItem ? 'Edit Achievement' : 'New Achievement'}
        </DialogTitle>
        <DialogContent>
          {error && <Typography color="error" sx={{ mb: 2, fontSize: '0.875rem' }}>{error}</Typography>}
          <TextField
            id="ach-team" fullWidth select label="Team" value={form.team_id}
            onChange={(e) => setForm({ ...form, team_id: e.target.value })}
            sx={{ mt: 1, mb: 2 }} disabled={!!editItem}
          >
            {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </TextField>
          <TextField
            id="ach-month" fullWidth label="Month" type="date" value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
            sx={{ mb: 2 }} slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            id="ach-description" fullWidth label="Description" multiline rows={3}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            id="ach-metrics" fullWidth label="Metrics (JSON)" multiline rows={3}
            value={form.metrics} onChange={(e) => setForm({ ...form, metrics: e.target.value })}
            helperText='e.g. {"revenue": 50000, "deals_closed": 12}'
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
