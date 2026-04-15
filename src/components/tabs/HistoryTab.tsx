'use client';

import { Ticket } from '@/lib/types';
import { formatCurrency, formatDate, getWalletColorClasses } from '@/lib/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  History,
  CheckCircle2,
  User,
  FileText,
  IndianRupee,
} from 'lucide-react';

interface HistoryTabProps {
  tickets: Ticket[];
  loading: boolean;
}

export function HistoryTab({ tickets, loading }: HistoryTabProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-card animate-pulse border border-border/30" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-4">
          <History className="w-8 h-8 text-gold" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">No Closed Tickets</h3>
        <p className="text-sm text-muted-foreground">Closed tickets will appear here.</p>
      </div>
    );
  }

  const totalRevenue = tickets.reduce((sum, t) => sum + t.totalAmount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
            <History className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Ticket History</h2>
            <p className="text-xs text-muted-foreground">{tickets.length} closed ticket{tickets.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Total:</span>
          <span className="text-sm font-bold text-gold">{formatCurrency(totalRevenue)}</span>
        </div>
      </div>

      {/* Desktop Table View */}
      <Card className="bg-card/80 border-border/30 hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">Ticket</TableHead>
                <TableHead className="text-muted-foreground text-xs">Starter</TableHead>
                <TableHead className="text-muted-foreground text-xs">Client</TableHead>
                <TableHead className="text-muted-foreground text-xs">Purpose</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Amount</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Starter Split</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Partner Split</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Kaam Done</TableHead>
                <TableHead className="text-muted-foreground text-xs">Opened</TableHead>
                <TableHead className="text-muted-foreground text-xs">Closed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const colors = getWalletColorClasses(ticket.starter);
                const partner = ticket.starter === 'Roshan' ? 'Anand' : 'Roshan';
                return (
                  <TableRow key={ticket.id} className="border-border/20 hover:bg-secondary/20">
                    <TableCell>
                      <Badge className={`text-xs ${colors.badge}`}>#{ticket.ticketNo}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <span className={colors.text}>{ticket.starter}</span>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{ticket.clientName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{ticket.purpose}</TableCell>
                    <TableCell className="text-sm font-bold text-gold text-right">{formatCurrency(ticket.totalAmount)}</TableCell>
                    <TableCell className="text-xs text-gold text-right">{formatCurrency(ticket.starterAmount)}</TableCell>
                    <TableCell className="text-xs text-teal text-right">{formatCurrency(ticket.partnerAmount)} <span className="text-muted-foreground">({partner})</span></TableCell>
                    <TableCell className="text-xs text-blue text-right">{formatCurrency(ticket.kaamDoneAmount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(ticket.createdAt)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ticket.closedAt ? formatDate(ticket.closedAt) : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden max-h-[600px] overflow-y-auto">
        {tickets.map((ticket) => {
          const colors = getWalletColorClasses(ticket.starter);
          const partner = ticket.starter === 'Roshan' ? 'Anand' : 'Roshan';
          return (
            <Card key={ticket.id} className={`${colors.bg} ${colors.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${colors.badge}`}>#{ticket.ticketNo}</Badge>
                    <Badge className="bg-green-500/20 text-green-400 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      CLOSED
                    </Badge>
                  </div>
                  <span className="text-sm font-bold text-gold">{formatCurrency(ticket.totalAmount)}</span>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    <span>{ticket.clientName}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span className={colors.text}>{ticket.starter} started</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    <span className="truncate">{ticket.purpose}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-1.5 rounded bg-gold/10">
                    <p className="text-[9px] text-muted-foreground">Starter</p>
                    <p className="text-xs font-bold text-gold">{formatCurrency(ticket.starterAmount)}</p>
                  </div>
                  <div className="p-1.5 rounded bg-teal/10">
                    <p className="text-[9px] text-muted-foreground">Partner ({partner[0]})</p>
                    <p className="text-xs font-bold text-teal">{formatCurrency(ticket.partnerAmount)}</p>
                  </div>
                  <div className="p-1.5 rounded bg-blue/10">
                    <p className="text-[9px] text-muted-foreground">Kaam Done</p>
                    <p className="text-xs font-bold text-blue">{formatCurrency(ticket.kaamDoneAmount)}</p>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground mt-2">
                  {formatDate(ticket.createdAt)} → {ticket.closedAt ? formatDate(ticket.closedAt) : '-'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
