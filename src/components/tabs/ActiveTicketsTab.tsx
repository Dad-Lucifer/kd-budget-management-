'use client';

import { useState } from 'react';
import { Ticket } from '@/lib/types';
import { formatCurrency, formatDate, getWalletColorClasses } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  XCircle,
  User,
  Phone,
  FileText,
  IndianRupee,
  AlertTriangle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface ActiveTicketsTabProps {
  tickets: Ticket[];
  loading: boolean;
  onTicketClosed: () => void;
}

export function ActiveTicketsTab({ tickets, loading, onTicketClosed }: ActiveTicketsTabProps) {
  const { toast } = useToast();
  const [closingId, setClosingId] = useState<string | null>(null);

  const handleCloseTicket = async (ticketId: string) => {
    setClosingId(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to close ticket');
      }

      toast({
        title: 'Ticket Closed ✅',
        description: `Ticket #${data.ticket.ticketNo} has been closed.`,
      });

      onTicketClosed();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to close ticket';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setClosingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-card animate-pulse border border-border/30" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-blue/15 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">No Active Tickets</h3>
        <p className="text-sm text-muted-foreground">All tickets are closed. Start new work to create a ticket.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue/15 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Active Tickets</h2>
            <p className="text-xs text-muted-foreground">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} in progress</p>
          </div>
        </div>
        <Badge className="bg-blue/20 text-blue border-blue/30">
          {tickets.length} Open
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tickets.map((ticket) => {
          const starterColors = getWalletColorClasses(ticket.starter);
          const partner = ticket.starter === 'Roshan' ? 'Anand' : 'Roshan';
          const partnerColors = getWalletColorClasses(partner);
          const isClosing = closingId === ticket.id;

          return (
            <Card
              key={ticket.id}
              className={`${starterColors.bg} ${starterColors.border} ${starterColors.glow} transition-all duration-300`}
            >
              <CardContent className="p-5">
                {/* Ticket Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${starterColors.badge}`}>
                      #{ticket.ticketNo}
                    </Badge>
                    <Badge className="bg-teal/20 text-teal text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      OPEN
                    </Badge>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs"
                        disabled={isClosing}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        {isClosing ? 'Closing...' : 'Close Ticket'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border/50">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-gold" />
                          Close Ticket #{ticket.ticketNo}?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          This will mark the ticket as closed. This action cannot be undone.
                          The money has already been distributed to wallets.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-border/50">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCloseTicket(ticket.id)}
                          className="bg-red-500/80 hover:bg-red-500 text-white"
                        >
                          Yes, Close Ticket
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Client Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{ticket.clientName}</span>
                    {ticket.clientPhone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {ticket.clientPhone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                    <span className="text-xs text-muted-foreground">{ticket.purpose}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-3.5 h-3.5 text-gold" />
                    <span className="text-lg font-bold text-gold">{formatCurrency(ticket.totalAmount)}</span>
                  </div>
                </div>

                {/* Split Details */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Starter</p>
                    <p className="text-xs font-bold text-gold">{formatCurrency(ticket.starterAmount)}</p>
                    <p className="text-[9px] text-gold/70">{ticket.starter}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-teal/10 border border-teal/20 text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Partner</p>
                    <p className="text-xs font-bold text-teal">{formatCurrency(ticket.partnerAmount)}</p>
                    <p className="text-[9px] text-teal/70">{partner}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue/10 border border-blue/20 text-center">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Kaam Done</p>
                    <p className="text-xs font-bold text-blue">{formatCurrency(ticket.kaamDoneAmount)}</p>
                    <p className="text-[9px] text-blue/70">Savings</p>
                  </div>
                </div>

                {/* Opened At */}
                <p className="text-[10px] text-muted-foreground mt-3">
                  Opened: {formatDate(ticket.createdAt)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
