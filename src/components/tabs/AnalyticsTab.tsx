'use client';

import { AnalyticsData } from '@/lib/types';
import { formatCurrency, getWalletColorClasses } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  TrendingUp,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';

interface AnalyticsTabProps {
  analytics: AnalyticsData | null;
  loading: boolean;
}

const GOLD = '#D4AF37';
const TEAL = '#14B8A6';
const BLUE = '#3B82F6';

export function AnalyticsTab({ analytics, loading }: AnalyticsTabProps) {
  if (loading || !analytics) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 rounded-xl bg-card animate-pulse border border-border/30" />
          ))}
        </div>
      </div>
    );
  }

  // Prepare earnings comparison data
  const earningsData = [
    {
      name: 'As Starter',
      Roshan: analytics.earnings.roshan.asStarter,
      Anand: analytics.earnings.anand.asStarter,
    },
    {
      name: 'As Partner',
      Roshan: analytics.earnings.roshan.asPartner,
      Anand: analytics.earnings.anand.asPartner,
    },
    {
      name: 'Total',
      Roshan: analytics.earnings.roshan.total,
      Anand: analytics.earnings.anand.total,
    },
  ];

  // Prepare pie data for total earnings
  const totalEarnings = analytics.earnings.roshan.total + analytics.earnings.anand.total + (analytics.wallets.find(w => w.name === 'KaamDone')?.totalIn || 0);
  const pieData = [
    { name: 'Roshan', value: analytics.earnings.roshan.total, color: GOLD },
    { name: 'Anand', value: analytics.earnings.anand.total, color: TEAL },
    { name: 'Kaam Done', value: analytics.wallets.find(w => w.name === 'KaamDone')?.totalIn || 0, color: BLUE },
  ];

  // Prepare volume data
  const volumeData = [
    { name: 'Started by Roshan', count: analytics.volume.roshanStarted, fill: GOLD },
    { name: 'Started by Anand', count: analytics.volume.anandStarted, fill: TEAL },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal/15 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Analytics</h2>
          <p className="text-xs text-muted-foreground">Track your agency&apos;s performance</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/80 border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-4 h-4 text-gold" />
              <span className="text-xs text-muted-foreground">Roshan Total</span>
            </div>
            <p className="text-xl font-bold text-gold">{formatCurrency(analytics.earnings.roshan.total)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-teal/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-4 h-4 text-teal" />
              <span className="text-xs text-muted-foreground">Anand Total</span>
            </div>
            <p className="text-xl font-bold text-teal">{formatCurrency(analytics.earnings.anand.total)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-blue/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-blue" />
              <span className="text-xs text-muted-foreground">Kaam Done Total</span>
            </div>
            <p className="text-xl font-bold text-blue">
              {formatCurrency(analytics.wallets.find(w => w.name === 'KaamDone')?.totalIn || 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-gold" />
              <span className="text-xs text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(analytics.revenue.total)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Earnings Comparison Bar Chart */}
        <Card className="bg-card/80 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-gold" />
              Earnings Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Roshan" fill={GOLD} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Anand" fill={TEAL} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Distribution Pie Chart */}
        <Card className="bg-card/80 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4 text-teal" />
              Total Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {totalEarnings > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ₹${Math.round(value)}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Growth - Wallet Accumulation */}
        <Card className="bg-card/80 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue" />
              Monthly Earnings Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {analytics.monthlyGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" dataKey="roshan" stackId="1" stroke={GOLD} fill={GOLD} fillOpacity={0.2} name="Roshan" />
                    <Area type="monotone" dataKey="anand" stackId="1" stroke={TEAL} fill={TEAL} fillOpacity={0.2} name="Anand" />
                    <Area type="monotone" dataKey="kaamDone" stackId="1" stroke={BLUE} fill={BLUE} fillOpacity={0.2} name="Kaam Done" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No data yet. Create some tickets to see trends.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Volume */}
        <Card className="bg-card/80 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gold" />
              Project Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 11 }} width={130} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {volumeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats below chart */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-border/20">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{analytics.volume.totalTickets}</p>
                <p className="text-xs text-muted-foreground">Total Tickets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal">{analytics.volume.openTickets}</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gold">{analytics.volume.closedTickets}</p>
                <p className="text-xs text-muted-foreground">Closed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Line Chart - Full Width */}
      {analytics.monthlyGrowth.length > 0 && (
        <Card className="bg-card/80 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" />
              Monthly Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="total" stroke="#fff" strokeWidth={2} dot={{ fill: '#fff', r: 4 }} name="Total Revenue" />
                  <Line type="monotone" dataKey="kaamDone" stroke={BLUE} strokeWidth={2} dot={{ fill: BLUE, r: 4 }} name="Kaam Done" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet Details Table */}
      <Card className="bg-card/80 border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4 text-teal" />
            Wallet Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {analytics.wallets.map((wallet) => {
              const colors = getWalletColorClasses(wallet.name);
              const displayName = wallet.name === 'KaamDone' ? 'Kaam Done' : wallet.name;
              return (
                <div key={wallet.name} className={`p-4 rounded-xl ${colors.bg} ${colors.border} border`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`text-sm font-medium ${colors.text}`}>{displayName}</h4>
                    <div className={`w-6 h-6 rounded-full ${colors.badge} flex items-center justify-center`}>
                      <Wallet className="w-3 h-3" />
                    </div>
                  </div>
                  <p className={`text-xl font-bold ${colors.text} mb-3`}>{formatCurrency(wallet.balance)}</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total In</span>
                      <span className="text-green-400 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        {formatCurrency(wallet.totalIn)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Out</span>
                      <span className="text-red-400 flex items-center gap-1">
                        <ArrowDownRight className="w-3 h-3" />
                        {formatCurrency(wallet.totalOut)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border/20">
                      <span className="text-muted-foreground">Balance</span>
                      <span className={`font-medium ${colors.text}`}>{formatCurrency(wallet.balance)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
