import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Users, Star, AlertTriangle, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip as RechartsTooltip } from 'recharts';
import { analyticsAPI } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';

const CustomRadarTooltip = ({ active, payload, label }) => {
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
      <div className="space-y-6 animate-pulse">
        <div className="h-16 w-full rounded-xl bg-surfaceHover" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 w-full rounded-xl bg-surfaceHover" />
          <div className="h-80 w-full rounded-xl bg-surfaceHover" />
        </div>
        <div className="h-64 w-full rounded-xl bg-surfaceHover" />
      </div>
    );
  }

  const radarData = insights?.insights?.map(t => ({
    team: t.team_name,
    members: t.member_count,
    direct: t.direct_staff_count,
    nonDirect: t.non_direct_staff_count,
  })) || [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Analytics</h1>
        <p className="text-sm text-text-muted mt-1">Business insights and organizational analysis</p>
      </motion.div>

      {/* Radar Chart & Staff Ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary-400" /> Team Size Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#2a2a2a" />
                    <PolarAngleAxis dataKey="team" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#71717a', fontSize: 10 }} />
                    <Radar name="Total Members" dataKey="members" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                    <Radar name="Direct" dataKey="direct" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                    <RechartsTooltip content={<CustomRadarTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-500" /> Non-Direct Staff Ratios
              </CardTitle>
              <Badge variant={ratios?.teams_exceeding_threshold > 0 ? 'destructive' : 'success'}>
                {ratios?.teams_exceeding_threshold || 0} teams &gt; 20%
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Team</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Ratio</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratios?.ratios?.map((r) => (
                    <TableRow key={r.team_id} className={r.exceeds_threshold ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-surfaceHover/50"}>
                      <TableCell className="font-semibold">{r.team_name}</TableCell>
                      <TableCell className="text-text-muted">{r.total_members}</TableCell>
                      <TableCell>
                        <span className={r.exceeds_threshold ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>
                          {r.non_direct_ratio}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {r.exceeds_threshold ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 tracking-wider uppercase">
                            <AlertTriangle className="h-3.5 w-3.5" /> Exceeds
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 tracking-wider uppercase">
                            <CheckCircle2 className="h-3.5 w-3.5" /> OK
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Leadership Analysis */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary-400" /> Leadership Analysis
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant={leadership?.non_colocated_leaders > 0 ? 'warning' : 'success'}>
                {leadership?.non_colocated_leaders} non-colocated
              </Badge>
              <Badge variant={leadership?.non_direct_staff_leaders > 0 ? 'destructive' : 'success'}>
                {leadership?.non_direct_staff_leaders} non-direct leaders
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Co-located</TableHead>
                  <TableHead>Direct Staff</TableHead>
                  <TableHead>Reports to VP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadership?.insights?.map((l) => (
                  <TableRow key={l.team_id}>
                    <TableCell className="font-semibold">{l.team_name}</TableCell>
                    <TableCell className="text-text-muted">{l.leader_name || '—'}</TableCell>
                    <TableCell>
                      {l.leader_is_colocated ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                    </TableCell>
                    <TableCell>
                      {l.leader_is_direct_staff ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                    </TableCell>
                    <TableCell>
                      {l.reports_to_org_leader ? (
                        <Badge variant="outline" className="bg-primary-500/10 text-primary-400 border-none">Yes</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-surface text-text-muted">No</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
