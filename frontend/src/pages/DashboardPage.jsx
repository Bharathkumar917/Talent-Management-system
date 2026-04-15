import { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Skeleton, Chip, Avatar, LinearProgress,
} from '@mui/material';
import {
  Groups, Person, EmojiEvents, LocationOn, TrendingUp, Assessment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, AreaChart, Area,
} from 'recharts';
import { analyticsAPI } from '../api/client';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

function StatCard({ icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card sx={{
        position: 'relative', overflow: 'hidden',
        '&::before': {
          content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${color}, transparent)`,
        },
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, mb: 1 }}>
                {label}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1 }}>
                {value}
              </Typography>
            </Box>
            <Avatar sx={{
              width: 48, height: 48, backgroundColor: `${color}15`,
              color: color,
            }}>
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      p: 1.5, borderRadius: 2, backgroundColor: 'rgba(15, 23, 42, 0.95)',
      border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
    }}>
      <Typography variant="caption" sx={{ color: '#94a3b8' }}>{label}</Typography>
      {payload.map((item, i) => (
        <Typography key={i} variant="body2" sx={{ color: item.color, fontWeight: 600 }}>
          {item.name}: {item.value}
        </Typography>
      ))}
    </Box>
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
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
          <Grid item xs={12} md={8}><Skeleton variant="rounded" height={350} sx={{ borderRadius: 3 }} /></Grid>
          <Grid item xs={12} md={4}><Skeleton variant="rounded" height={350} sx={{ borderRadius: 3 }} /></Grid>
        </Grid>
      </Box>
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
    <Box>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          ACME Inc. organization overview and key metrics
        </Typography>
      </motion.div>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<Groups />} label="Total Teams" value={stats?.total_teams || 0} color="#6366f1" delay={0.1} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<Person />} label="Active Users" value={stats?.total_users || 0} color="#10b981" delay={0.15} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<EmojiEvents />} label="Achievements" value={stats?.total_achievements || 0} color="#f59e0b" delay={0.2} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<LocationOn />} label="Locations" value={stats?.active_locations || 0} color="#8b5cf6" delay={0.25} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Staff Ratio Bar Chart */}
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Staff Composition by Team
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ratioData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  <Bar dataKey="direct" name="Direct Staff" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nonDirect" name="Non-Direct" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </Grid>

        {/* Teams by Location Pie */}
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Teams by Location
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={locationData} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    dataKey="value" paddingAngle={3}
                    stroke="none"
                  >
                    {locationData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, justifyContent: 'center' }}>
                {locationData.map((item, i) => (
                  <Chip
                    key={item.name}
                    label={`${item.name}: ${item.value}`}
                    size="small"
                    sx={{
                      backgroundColor: `${COLORS[i % COLORS.length]}20`,
                      color: COLORS[i % COLORS.length],
                      fontSize: '0.7rem', fontWeight: 600,
                    }}
                  />
                ))}
              </Box>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Leadership Insights */}
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                <Assessment sx={{ mr: 1, verticalAlign: 'middle', color: '#818cf8' }} />
                Leadership Insights
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#ef4444' }}>
                      {leadership?.non_colocated_leaders || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Non-Colocated Leaders
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#f59e0b' }}>
                      {leadership?.non_direct_staff_leaders || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Non-Direct Staff Leaders
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#6366f1' }}>
                      {leadership?.teams_reporting_to_org_leader || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Report to Org Leader
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981' }}>
                      {ratios?.teams_exceeding_threshold || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Teams &gt;20% Non-Direct
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </motion.div>
        </Grid>

        {/* Recent Achievements */}
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle', color: '#10b981' }} />
                Recent Achievements
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {stats?.recent_achievements?.length ? stats.recent_achievements.map((a, i) => (
                  <Box key={i} sx={{
                    p: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.2s', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Chip label={a.team_name} size="small" sx={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.7rem' }} />
                      <Typography variant="caption" sx={{ color: '#64748b' }}>{a.month}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#cbd5e1' }}>{a.description}</Typography>
                  </Box>
                )) : (
                  <Typography variant="body2" color="text.secondary">No achievements yet</Typography>
                )}
              </Box>
            </Card>
          </motion.div>
        </Grid>

        {/* Staff Ratio Overview */}
        <Grid item xs={12}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Non-Direct Staff Ratio by Team
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ratios?.ratios?.map((r) => (
                  <Box key={r.team_id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.team_name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: r.exceeds_threshold ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                          {r.non_direct_ratio}%
                        </Typography>
                        {r.exceeds_threshold && (
                          <Chip label="⚠ >20%" size="small" sx={{ height: 20, fontSize: '0.65rem', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }} />
                        )}
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(r.non_direct_ratio, 100)}
                      sx={{
                        height: 8, borderRadius: 4,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: r.exceeds_threshold ? '#ef4444' : '#10b981',
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
