import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Grid, Chip, Skeleton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar,
} from '@mui/material';
import {
  CheckCircle, Cancel, Warning, LocationOn, Groups, Person, TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Tooltip,
} from 'recharts';
import { analyticsAPI } from '../api/client';

export default function AnalyticsPage() {
  const [insights, setInsights] = useState(null);
  const [ratios, setRatios] = useState(null);
  const [leadership, setLeadership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [insRes, ratRes, leadRes] = await Promise.all([
          analyticsAPI.teamInsights(),
          analyticsAPI.ratios(),
          analyticsAPI.leadership(),
        ]);
        setInsights(insRes.data);
        setRatios(ratRes.data);
        setLeadership(leadRes.data);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={60} sx={{ mb: 3, borderRadius: 3 }} />
        {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={300} sx={{ mb: 3, borderRadius: 3 }} />)}
      </Box>
    );
  }

  const radarData = insights?.insights?.map(t => ({
    team: t.team_name,
    members: t.member_count,
    direct: t.direct_staff_count,
    nonDirect: t.non_direct_staff_count,
  })) || [];

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Analytics</Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Business insights and organizational analysis
        </Typography>
      </motion.div>

      {/* Team Insights Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              <Groups sx={{ mr: 1, verticalAlign: 'middle', color: '#818cf8' }} />
              Team Composition Overview
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Members</TableCell>
                  <TableCell>Direct</TableCell>
                  <TableCell>Non-Direct</TableCell>
                  <TableCell>Leader</TableCell>
                  <TableCell>Org Leader</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {insights?.insights?.map((t) => (
                  <TableRow key={t.team_id} sx={{ '&:hover': { backgroundColor: 'rgba(99,102,241,0.04)' } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.team_name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip icon={<LocationOn sx={{ fontSize: 14 }} />} label={t.location} size="small"
                        sx={{ backgroundColor: 'rgba(99,102,241,0.1)', color: '#818cf8' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={t.member_count} size="small"
                        sx={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: '#10b981' }}>{t.direct_staff_count}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: '#f59e0b' }}>{t.non_direct_staff_count}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: '#94a3b8' }}>{t.leader_name || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: '#94a3b8' }}>{t.org_leader_name || '—'}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </motion.div>

      <Grid container spacing={3}>
        {/* Radar Chart */}
        <Grid item xs={12} md={5}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Team Size Comparison</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="team" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar name="Total Members" dataKey="members" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                  <Radar name="Direct" dataKey="direct" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Tooltip contentStyle={{
                    backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: '#e2e8f0',
                  }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </Grid>

        {/* Staff Ratios */}
        <Grid item xs={12} md={7}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  <TrendingUp sx={{ mr: 1, verticalAlign: 'middle', color: '#f59e0b' }} />
                  Non-Direct Staff Ratios
                </Typography>
                <Chip
                  label={`${ratios?.teams_exceeding_threshold || 0} teams above 20%`}
                  size="small"
                  color={ratios?.teams_exceeding_threshold > 0 ? 'error' : 'success'}
                />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Team</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Direct</TableCell>
                      <TableCell>Non-Direct</TableCell>
                      <TableCell>Ratio</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ratios?.ratios?.map((r) => (
                      <TableRow key={r.team_id} sx={{
                        backgroundColor: r.exceeds_threshold ? 'rgba(239,68,68,0.04)' : 'transparent',
                        '&:hover': { backgroundColor: r.exceeds_threshold ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.04)' },
                      }}>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{r.team_name}</Typography></TableCell>
                        <TableCell>{r.total_members}</TableCell>
                        <TableCell><span style={{ color: '#10b981' }}>{r.direct_staff}</span></TableCell>
                        <TableCell><span style={{ color: '#f59e0b' }}>{r.non_direct_staff}</span></TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{
                            fontWeight: 700,
                            color: r.exceeds_threshold ? '#ef4444' : '#10b981',
                          }}>
                            {r.non_direct_ratio}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {r.exceeds_threshold ? (
                            <Chip icon={<Warning sx={{ fontSize: 14 }} />} label="Exceeds" size="small"
                              sx={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 600 }} />
                          ) : (
                            <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label="OK" size="small"
                              sx={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600 }} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Leadership Analysis */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <Card sx={{ mt: 3, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              <Person sx={{ mr: 1, verticalAlign: 'middle', color: '#8b5cf6' }} />
              Leadership Analysis
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`${leadership?.non_colocated_leaders} non-colocated`} size="small"
                color={leadership?.non_colocated_leaders > 0 ? 'warning' : 'success'} />
              <Chip label={`${leadership?.non_direct_staff_leaders} non-direct`} size="small"
                color={leadership?.non_direct_staff_leaders > 0 ? 'error' : 'success'} />
              <Chip label={`${leadership?.teams_reporting_to_org_leader} report to org leader`} size="small" color="primary" />
            </Box>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  <TableCell>Leader</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Co-located</TableCell>
                  <TableCell>Direct Staff</TableCell>
                  <TableCell>Reports to Org Leader</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leadership?.insights?.map((l) => (
                  <TableRow key={l.team_id} sx={{ '&:hover': { backgroundColor: 'rgba(99,102,241,0.04)' } }}>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{l.team_name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: '#94a3b8' }}>{l.leader_name || '—'}</Typography></TableCell>
                    <TableCell>
                      <Chip icon={<LocationOn sx={{ fontSize: 12 }} />} label={l.team_location} size="small" variant="outlined"
                        sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }} />
                    </TableCell>
                    <TableCell>
                      {l.leader_is_colocated ? (
                        <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label="Yes" size="small"
                          sx={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }} />
                      ) : (
                        <Chip icon={<Cancel sx={{ fontSize: 14 }} />} label="No" size="small"
                          sx={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      {l.leader_is_direct_staff ? (
                        <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label="Yes" size="small"
                          sx={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }} />
                      ) : (
                        <Chip icon={<Cancel sx={{ fontSize: 14 }} />} label="No" size="small"
                          sx={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      {l.reports_to_org_leader ? (
                        <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label="Yes" size="small"
                          sx={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8' }} />
                      ) : (
                        <Chip label="No" size="small" variant="outlined"
                          sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#64748b' }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </motion.div>
    </Box>
  );
}
