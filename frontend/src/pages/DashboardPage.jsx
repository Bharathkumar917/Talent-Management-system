import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Trophy, MapPin, TrendingUp, BarChart } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { analyticsAPI } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-surface"
    >
      <div 
        className="absolute left-0 top-0 h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-text-muted">{label}</p>
          <h3 className="text-3xl font-extrabold tracking-tight text-text-primary">{value}</h3>
        </div>
        <div 
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface/95 p-3 shadow-xl backdrop-blur-md">
      <p className="mb-1 text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</p>
      {payload.map((item, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: item.color || item.payload.fill }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [ratios, setRatios] = useState(null);
  const [leadership, setLeadership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, ratioRes, leaderRes] = await Promise.all([
          analyticsAPI.dashboard(),
          analyticsAPI.ratios(),
          analyticsAPI.leadership(),
        ]);
        setStats(dashRes.data);
        setRatios(ratioRes.data);
        setLeadership(leaderRes.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-xl bg-surfaceHover" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-[350px] rounded-xl bg-surfaceHover lg:col-span-2" />
          <div className="h-[350px] rounded-xl bg-surfaceHover" />
        </div>
      </div>
    );
  }

  const locationData = stats ? Object.entries(stats.teams_by_location).map(([name, value]) => ({ name, value })) : [];
  const ratioData = ratios?.ratios?.map(r => ({
    name: r.team_name,
    direct: r.direct_staff,
    nonDirect: r.non_direct_staff,
    ratio: r.non_direct_ratio,
  })) || [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">ACME Inc. organization overview and key metrics</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Teams" value={stats?.total_teams || 0} color="#6366f1" delay={0.1} />
        <StatCard icon={User} label="Active Users" value={stats?.total_users || 0} color="#10b981" delay={0.15} />
        <StatCard icon={Trophy} label="Achievements" value={stats?.total_achievements || 0} color="#f59e0b" delay={0.2} />
        <StatCard icon={MapPin} label="Locations" value={stats?.active_locations || 0} color="#8b5cf6" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Staff Ratio Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Staff Composition by Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={ratioData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#1c1c1c' }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="direct" name="Direct Staff" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="nonDirect" name="Non-Direct" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Teams by Location Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Teams by Location</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={locationData} cx="50%" cy="50%"
                      innerRadius={60} outerRadius={85}
                      dataKey="value" paddingAngle={2}
                      stroke="none"
                    >
                      {locationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {locationData.map((item, i) => (
                  <Badge 
                    key={item.name} 
                    variant="outline" 
                    className="border-transparent font-medium"
                    style={{ backgroundColor: `${COLORS[i % COLORS.length]}15`, color: COLORS[i % COLORS.length] }}
                  >
                    {item.name}: {item.value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Leadership Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <BarChart className="h-5 w-5 text-primary-400" />
              <CardTitle>Leadership Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <span className="text-3xl font-bold text-red-500">{leadership?.non_colocated_leaders || 0}</span>
                  <span className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">Non-Colocated</span>
                </div>
                <div className="flex flex-col rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <span className="text-3xl font-bold text-amber-500">{leadership?.non_direct_staff_leaders || 0}</span>
                  <span className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">Non-Direct Leaders</span>
                </div>
                <div className="flex flex-col rounded-xl border border-primary-500/20 bg-primary-500/5 p-4">
                  <span className="text-3xl font-bold text-primary-500">{leadership?.teams_reporting_to_org_leader || 0}</span>
                  <span className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">Report to VP</span>
                </div>
                <div className="flex flex-col rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <span className="text-3xl font-bold text-emerald-500">{ratios?.teams_exceeding_threshold || 0}</span>
                  <span className="text-xs font-medium text-text-muted mt-1 uppercase tracking-wider">&gt;20% Non-Direct</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Achievements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recent_achievements?.length ? stats.recent_achievements.map((a, i) => (
                  <div key={i} className="group flex flex-col rounded-lg border border-border bg-surfaceHover/50 p-3 transition-colors hover:bg-surfaceHover">
                    <div className="mb-1.5 flex items-center justify-between">
                      <Badge className="bg-primary-500/10 text-primary-400 hover:bg-primary-500/20">{a.team_name}</Badge>
                      <span className="text-xs text-text-muted">{a.month}</span>
                    </div>
                    <p className="text-sm font-medium text-text-primary leading-relaxed">{a.description}</p>
                  </div>
                )) : (
                  <p className="text-sm text-text-muted">No achievements yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
