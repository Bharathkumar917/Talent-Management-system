import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Skeleton, Tooltip,
  Divider, Alert,
} from '@mui/material';
import {
  ArrowBack, Add, Edit, Delete, LocationOn, Person, Groups,
  CheckCircle, Cancel, Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { teamsAPI, membersAPI, usersAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function TeamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isManager, isContributor } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [memberForm, setMemberForm] = useState({ user_id: '', role: 'member', is_direct_staff: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchTeam = async () => {
    try {
      const res = await teamsAPI.getById(id);
      setTeam(res.data);
    } catch (err) {
      console.error('Team load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, [id]);

  const openAddMember = async () => {
    setMemberForm({ user_id: '', role: 'member', is_direct_staff: true });
    setError('');
    try {
      const res = await usersAPI.list({ page_size: 100 });
      setUsers(res.data.users);
    } catch { /* ignore */ }
    setMemberDialogOpen(true);
  };

  const handleAddMember = async () => {
    if (!memberForm.user_id) { setError('Please select a user'); return; }
    setSaving(true);
    try {
      await membersAPI.create({
        user_id: memberForm.user_id,
        team_id: id,
        role: memberForm.role,
        is_direct_staff: memberForm.is_direct_staff,
      });
      setMemberDialogOpen(false);
      fetchTeam();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the team?')) return;
    try {
      await membersAPI.delete(memberId);
      fetchTeam();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Remove failed');
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={200} sx={{ mb: 3, borderRadius: 3 }} />
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!team) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h5" color="text.secondary">Team not found</Typography>
        <Button onClick={() => navigate('/teams')} sx={{ mt: 2 }}>Back to Teams</Button>
      </Box>
    );
  }

  const directCount = team.members?.filter(m => m.is_direct_staff).length || 0;
  const nonDirectCount = (team.members?.length || 0) - directCount;
  const ratio = team.members?.length > 0
    ? ((nonDirectCount / team.members.length) * 100).toFixed(1)
    : 0;

  return (
    <Box>
      {/* Back button + Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/teams')} sx={{ mb: 2, color: '#94a3b8' }}>
          Back to Teams
        </Button>
      </motion.div>

      {/* Team Info Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card sx={{
          mb: 3, overflow: 'hidden', position: 'relative',
          '&::before': {
            content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
          },
        }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar sx={{
                  width: 72, height: 72, borderRadius: 3,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  fontSize: '1.8rem', fontWeight: 800,
                }}>
                  {team.name.charAt(0)}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{team.name}</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip icon={<LocationOn sx={{ fontSize: 16 }} />} label={team.location} size="small"
                    sx={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8' }} />
                  <Chip icon={<Groups sx={{ fontSize: 16 }} />} label={`${team.member_count} members`} size="small"
                    sx={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }} />
                  {parseFloat(ratio) > 20 && (
                    <Chip label={`⚠ ${ratio}% non-direct`} size="small"
                      sx={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }} />
                  )}
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.06)' }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>Team Leader</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ color: '#818cf8', fontSize: 20 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {team.leader?.name || 'Unassigned'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>Org Leader</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Star sx={{ color: '#f59e0b', fontSize: 20 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {team.org_leader?.name || 'None'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>Staff Breakdown</Typography>
                <Typography variant="body1">
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{directCount}</span> direct,{' '}
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>{nonDirectCount}</span> non-direct
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Members Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
        <Card>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Team Members</Typography>
            {isContributor && (
              <Button id="add-member-btn" variant="outlined" startIcon={<Add />} size="small" onClick={openAddMember}>
                Add Member
              </Button>
            )}
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Staff Type</TableCell>
                  <TableCell>Joined</TableCell>
                  {isManager && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {team.members?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No members yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  team.members?.map((member, i) => (
                    <TableRow key={member.id} sx={{ '&:hover': { backgroundColor: 'rgba(99,102,241,0.04)' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{
                            width: 32, height: 32,
                            background: member.role === 'leader'
                              ? 'linear-gradient(135deg, #f59e0b, #eab308)'
                              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            fontSize: '0.75rem', fontWeight: 700,
                          }}>
                            {member.name?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{member.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>{member.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.role}
                          size="small"
                          color={member.role === 'leader' ? 'warning' : 'default'}
                          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {member.is_direct_staff ? (
                            <><CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                            <Typography variant="body2" sx={{ color: '#10b981' }}>Direct</Typography></>
                          ) : (
                            <><Cancel sx={{ fontSize: 16, color: '#f59e0b' }} />
                            <Typography variant="body2" sx={{ color: '#f59e0b' }}>Non-Direct</Typography></>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'}
                        </Typography>
                      </TableCell>
                      {isManager && (
                        <TableCell align="right">
                          <Tooltip title="Remove">
                            <IconButton size="small" color="error" onClick={() => handleRemoveMember(member.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </motion.div>

      {/* Add Member Dialog */}
      <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Team Member</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            id="member-user" fullWidth select label="User" value={memberForm.user_id}
            onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          >
            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>)}
          </TextField>
          <TextField
            id="member-role" fullWidth select label="Role" value={memberForm.role}
            onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="leader">Leader</MenuItem>
          </TextField>
          <TextField
            id="member-staff-type" fullWidth select label="Staff Type"
            value={memberForm.is_direct_staff ? 'direct' : 'non-direct'}
            onChange={(e) => setMemberForm({ ...memberForm, is_direct_staff: e.target.value === 'direct' })}
          >
            <MenuItem value="direct">Direct Staff</MenuItem>
            <MenuItem value="non-direct">Non-Direct Staff (Contractor)</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMember} disabled={saving}>
            {saving ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
