import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, CalendarDays, Plus, Edit2, Trash2 } from 'lucide-react';
import { achievementsAPI, teamsAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

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

  const handleSave = async (e) => {
    e?.preventDefault();
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
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Achievements</h1>
          <p className="text-sm text-text-muted mt-1">Track monthly team accomplishments and KPIs</p>
        </div>
        {isContributor && (
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Achievement
          </Button>
        )}
      </motion.div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="relative w-full sm:w-64 flex">
            <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="flex h-10 w-full appearance-none rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <option value="">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Achievements List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 w-full animate-pulse rounded-xl bg-surfaceHover" />
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <Trophy className="mb-4 h-12 w-12 text-text-muted" />
            <h3 className="text-lg font-semibold text-text-primary">No achievements yet</h3>
            <p className="text-sm text-text-muted">Get started by creating your first team achievement.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {achievements.map((a, i) => {
              const bgColor = getTeamColor(a.team_name);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="relative overflow-hidden group">
                    <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: bgColor }} />
                    <CardContent className="p-5 pl-7">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="border-none font-bold"
                              style={{ backgroundColor: `${bgColor}15`, color: bgColor }}
                            >
                              {a.team_name}
                            </Badge>
                            <Badge variant="secondary" className="font-medium bg-transparent border-border text-text-secondary">
                              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                              {new Date(a.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </Badge>
                          </div>
                          
                          <p className="text-text-primary leading-relaxed">{a.description}</p>
                          
                          {a.metrics && Object.keys(a.metrics).length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {Object.entries(a.metrics).map(([key, val]) => (
                                <Badge key={key} variant="outline" className="bg-surfaceHover/50 text-text-secondary border-border capitalize px-2 py-1">
                                  <span className="font-semibold text-text-primary mr-1">{key.replace(/_/g, ' ')}:</span> 
                                  {typeof val === 'number' ? val.toLocaleString() : val}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0">
                          {isContributor && (
                            <button 
                              onClick={() => openEdit(a)}
                              className="rounded-md p-2 text-text-muted hover:bg-surfaceHover hover:text-text-primary transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {isManager && (
                            <button 
                              onClick={() => handleDelete(a.id)}
                              className="rounded-md p-2 text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Dialog */}
      <Modal 
        isOpen={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        title={editItem ? 'Edit Achievement' : 'New Achievement'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
          
          <div className="space-y-1.5">
            <Label htmlFor="ach-team">Team</Label>
            <select
              id="ach-team"
              value={form.team_id}
              onChange={(e) => setForm({ ...form, team_id: e.target.value })}
              disabled={!!editItem}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" disabled>Select a team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ach-month">Month</Label>
            <Input 
              id="ach-month" 
              type="date"
              value={form.month} 
              onChange={(e) => setForm({ ...form, month: e.target.value })} 
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="ach-description">Description</Label>
            <textarea
              id="ach-description"
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ach-metrics">Metrics (JSON)</Label>
            <textarea
              id="ach-metrics"
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              value={form.metrics}
              onChange={(e) => setForm({ ...form, metrics: e.target.value })}
              placeholder='e.g. {"revenue": 50000}'
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}>{editItem ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
