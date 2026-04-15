import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, MapPin, Eye, Edit2, Trash2, Filter } from 'lucide-react';
import { teamsAPI, usersAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';

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

  useEffect(() => { 
    const delayDebounceFn = setTimeout(() => {
      fetchTeams();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, locationFilter]);

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

  const handleSave = async (e) => {
    e?.preventDefault();
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

  const handleDelete = async (id, e) => {
    e.stopPropagation();
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
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Teams</h1>
          <p className="text-sm text-text-muted mt-1">Manage team structures and assignments</p>
        </div>
        {isManager && (
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Create Team
          </Button>
        )}
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-4 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input 
              placeholder="Search teams..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="flex h-10 w-full appearance-none rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <option value="">All Locations</option>
              {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Teams Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5].map(j => (
                      <TableCell key={j}><div className="h-5 w-full animate-pulse rounded bg-surfaceHover" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-text-muted">
                    No teams found.
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team, i) => (
                  <TableRow 
                    key={team.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/teams/${team.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar 
                          fallback={team.name.charAt(0)} 
                          className="font-bold border-none"
                          style={{
                            background: `linear-gradient(135deg, ${locationColorMap[team.location] || '#6366f1'}, ${locationColorMap[team.location] || '#8b5cf6'}88)`,
                            color: '#fff'
                          }}
                        />
                        <span className="font-semibold">{team.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="bg-transparent border-none gap-1 px-0"
                        style={{ color: locationColorMap[team.location] || '#8b5cf6' }}
                      >
                        <MapPin className="h-3 w-3" /> {team.location}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-text-muted">{team.leader_id ? 'Assigned' : '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-text-muted">{new Date(team.created_at).toLocaleDateString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => navigate(`/teams/${team.id}`)}
                          className="rounded-md p-1.5 text-text-muted hover:bg-surfaceHover hover:text-text-primary transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {isManager && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEdit(team); }}
                            className="rounded-md p-1.5 text-text-muted hover:bg-primary-500/10 hover:text-primary-500 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button 
                            onClick={(e) => handleDelete(team.id, e)}
                            className="rounded-md p-1.5 text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        title={editTeam ? 'Edit Team' : 'Create New Team'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">{error}</div>}
          
          <div className="space-y-1.5">
            <Label htmlFor="team-name">Team Name</Label>
            <Input 
              id="team-name" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="team-location">Location</Label>
            <Input 
              id="team-location" 
              value={form.location} 
              onChange={(e) => setForm({ ...form, location: e.target.value })} 
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="team-leader">Team Leader</Label>
            <select
              id="team-leader"
              value={form.leader_id}
              onChange={(e) => setForm({ ...form, leader_id: e.target.value })}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <option value="">No Leader</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="team-org-leader">Org Leader</Label>
            <select
              id="team-org-leader"
              value={form.org_leader_id}
              onChange={(e) => setForm({ ...form, org_leader_id: e.target.value })}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <option value="">No Org Leader</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}>
              {editTeam ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
