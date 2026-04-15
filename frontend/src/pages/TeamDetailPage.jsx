import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, MapPin, Users as UsersIcon, User, Star, ShieldAlert, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { teamsAPI, membersAPI, usersAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Input, Label } from '../components/ui/Input';

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

  const handleAddMember = async (e) => {
    e?.preventDefault();
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
      <div className="space-y-6 animate-pulse">
        <div className="h-48 w-full rounded-xl bg-surfaceHover" />
        <div className="h-64 w-full rounded-xl bg-surfaceHover" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-text-muted" />
        <h2 className="text-xl font-bold text-text-secondary">Team not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/teams')}>
          Back to Teams
        </Button>
      </div>
    );
  }

  const directCount = team.members?.filter(m => m.is_direct_staff).length || 0;
  const nonDirectCount = (team.members?.length || 0) - directCount;
  const ratio = team.members?.length > 0
    ? ((nonDirectCount / team.members.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <button 
          onClick={() => navigate('/teams')}
          className="group flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Teams
        </button>
      </motion.div>

      {/* Team Info Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary-500 via-primary-400 to-purple-500" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <Avatar 
                fallback={team.name.charAt(0)}
                className="h-20 w-20 text-2xl font-bold bg-gradient-to-br from-primary-600 to-purple-600 !text-white border-none shadow-xl"
              />
              <div className="flex-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mb-3">{team.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-primary-500/10 text-primary-400 border-none px-2.5 py-1">
                    <MapPin className="mr-1.5 h-3.5 w-3.5" /> {team.location}
                  </Badge>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-none px-2.5 py-1">
                    <UsersIcon className="mr-1.5 h-3.5 w-3.5" /> {team.member_count} members
                  </Badge>
                  {parseFloat(ratio) > 20 && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-none px-2.5 py-1">
                      <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> {ratio}% non-direct
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="my-8 h-px w-full bg-border" />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-muted">Team Leader</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary-500" />
                  <span className="font-semibold text-text-primary">{team.leader?.name || 'Unassigned'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-muted">Org Leader</p>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                  <span className="font-semibold text-text-primary">{team.org_leader?.name || 'None'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-muted">Staff Breakdown</p>
                <p className="font-medium text-text-primary">
                  <span className="text-emerald-500 font-bold">{directCount}</span> direct,{' '}
                  <span className="text-amber-500 font-bold">{nonDirectCount}</span> non-direct
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Members Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-4 sm:px-6">
            <h2 className="text-lg font-bold text-text-primary">Team Members</h2>
            {isContributor && (
              <Button size="sm" variant="secondary" onClick={openAddMember}>
                <UserPlus className="mr-2 h-4 w-4" /> Add Member
              </Button>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Staff Type</TableHead>
                <TableHead>Joined</TableHead>
                {isManager && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.members?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-text-muted">
                    No members yet.
                  </TableCell>
                </TableRow>
              ) : (
                team.members?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar 
                          fallback={member.name?.charAt(0)}
                          className={member.role === 'leader' ? "bg-amber-500/20 text-amber-500" : "bg-primary-500/20 text-primary-500"}
                        />
                        <span className="font-semibold text-text-primary">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-text-muted">{member.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'leader' ? 'warning' : 'outline'} className="capitalize border-none">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {member.is_direct_staff ? (
                          <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> <span className="text-emerald-500 font-medium text-sm">Direct</span></>
                        ) : (
                          <><XCircle className="h-4 w-4 text-amber-500" /> <span className="text-amber-500 font-medium text-sm">Non-Direct</span></>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-text-muted">
                        {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '—'}
                      </span>
                    </TableCell>
                    {isManager && (
                      <TableCell className="text-right">
                        <button 
                          onClick={() => handleRemoveMember(member.id)}
                          className="rounded-md p-1.5 text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {/* Add Member Modal */}
      <Modal isOpen={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} title="Add Team Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
          
          <div className="space-y-1.5">
            <Label htmlFor="member-user">User</Label>
            <select
              id="member-user"
              value={memberForm.user_id}
              onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <option value="">Select a user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="member-role">Role</Label>
            <select
              id="member-role"
              value={memberForm.role}
              onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <option value="member">Member</option>
              <option value="leader">Leader</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="member-staff-type">Staff Type</Label>
            <select
              id="member-staff-type"
              value={memberForm.is_direct_staff ? 'direct' : 'non-direct'}
              onChange={(e) => setMemberForm({ ...memberForm, is_direct_staff: e.target.value === 'direct' })}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <option value="direct">Direct Staff</option>
              <option value="non-direct">Non-Direct Staff (Contractor)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Add Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
