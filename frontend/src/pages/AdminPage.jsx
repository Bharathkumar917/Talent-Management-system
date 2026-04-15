import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Button, Skeleton,
  Tooltip, InputAdornment, Avatar, Alert,
} from '@mui/material';
import { Search, Edit, Block, CheckCircle, Person, Shield } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { usersAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const roleColors = {
  admin: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  manager: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  contributor: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  viewer: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page_size: 100 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await usersAPI.list(params);
      setUsers(res.data.users);
    } catch (err) {
      console.error('Users load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name, role: u.role });
    setError('');
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!editForm.name) { setError('Name is required'); return; }
    setSaving(true);
    try {
      await usersAPI.update(editUser.id, editForm);
      setEditDialog(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await usersAPI.delete(userId);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Deactivate failed');
    }
  };

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            <Shield sx={{ mr: 1, verticalAlign: 'middle', color: '#ef4444' }} />
            Admin Panel
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Manage users, roles, and system access</Typography>
        </Box>
      </motion.div>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          id="admin-search" size="small" placeholder="Search users..." value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 200 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ color: '#64748b' }} /></InputAdornment> } }}
        />
        <TextField
          id="admin-role-filter" size="small" select label="Role" value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All Roles</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="manager">Manager</MenuItem>
          <MenuItem value="contributor">Contributor</MenuItem>
          <MenuItem value="viewer">Viewer</MenuItem>
        </TextField>
      </Card>

      {/* Users Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5, 6].map(j => <TableCell key={j}><Skeleton /></TableCell>)}
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No users found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id} sx={{
                      '&:hover': { backgroundColor: 'rgba(99,102,241,0.04)' },
                      opacity: u.is_active ? 1 : 0.5,
                    }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{
                            width: 36, height: 36,
                            background: `linear-gradient(135deg, ${roleColors[u.role]?.color || '#6366f1'}, ${roleColors[u.role]?.color || '#8b5cf6'}88)`,
                            fontSize: '0.8rem', fontWeight: 700,
                          }}>
                            {u.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.name}</Typography>
                            {u.id === currentUser?.id && (
                              <Typography variant="caption" sx={{ color: '#818cf8' }}>(You)</Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: '#94a3b8' }}>{u.email}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          label={u.role}
                          size="small"
                          sx={{
                            backgroundColor: roleColors[u.role]?.bg,
                            color: roleColors[u.role]?.color,
                            fontWeight: 600, textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {u.is_active ? (
                          <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label="Active" size="small"
                            sx={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }} />
                        ) : (
                          <Chip icon={<Block sx={{ fontSize: 14 }} />} label="Inactive" size="small"
                            sx={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit Role">
                          <IconButton size="small" onClick={() => openEdit(u)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {u.id !== currentUser?.id && u.is_active && (
                          <Tooltip title="Deactivate">
                            <IconButton size="small" color="error" onClick={() => handleDeactivate(u.id)}>
                              <Block fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </motion.div>

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit User</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            id="edit-user-name" fullWidth label="Name" value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            id="edit-user-role" fullWidth select label="Role" value={editForm.role}
            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="contributor">Contributor</MenuItem>
            <MenuItem value="viewer">Viewer</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
