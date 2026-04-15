import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, CheckCircle2, XCircle, Edit2, Play, Square, Settings } from 'lucide-react';
import { usersAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';

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

  useEffect(() => { 
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, roleFilter]);

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name, role: u.role });
    setError('');
    setEditDialog(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
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

  const roleStyles = {
    admin: "bg-red-500/10 text-red-500",
    manager: "bg-amber-500/10 text-amber-500",
    contributor: "bg-primary-500/10 text-primary-500",
    viewer: "bg-text-muted/10 text-text-secondary",
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-500" /> Admin Panel
        </h1>
        <p className="text-sm text-text-muted mt-1">Manage users, roles, and system access constraints.</p>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-4 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Settings className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex h-10 w-full appearance-none rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="contributor">Contributor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6].map(j => (
                      <TableCell key={j}><div className="h-5 w-full animate-pulse rounded bg-surfaceHover" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-text-muted">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className={!u.is_active ? "opacity-50 grayscale" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar 
                          fallback={u.name.charAt(0)}
                          className={`font-bold border-none ${u.role === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-primary-500/20 text-primary-500'}`}
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary">
                            {u.name} {u.id === currentUser?.id && <span className="text-primary-400 text-xs ml-1">(You)</span>}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-text-muted text-sm">{u.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-none capitalize ${roleStyles[u.role]}`}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {u.is_active ? (
                          <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> <span className="text-emerald-500 font-medium text-sm">Active</span></>
                        ) : (
                          <><XCircle className="h-4 w-4 text-red-500" /> <span className="text-red-500 font-medium text-sm">Inactive</span></>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-text-muted text-sm">{new Date(u.created_at).toLocaleDateString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEdit(u)}
                          className="rounded-md p-1.5 text-text-muted hover:bg-primary-500/10 hover:text-primary-500 transition-colors"
                          title="Edit Role"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {u.id !== currentUser?.id && u.is_active && (
                          <button 
                            onClick={() => handleDeactivate(u.id)}
                            className="rounded-md p-1.5 text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            title="Deactivate"
                          >
                            <Square className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <Modal isOpen={editDialog} onClose={() => setEditDialog(false)} title="Edit User">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
          
          <div className="space-y-1.5">
            <Label htmlFor="edit-user-name">Full Name</Label>
            <Input 
              id="edit-user-name" 
              value={editForm.name} 
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="edit-user-role">Role</Label>
            <select
              id="edit-user-role"
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="contributor">Contributor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Update User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
