import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Trash2, Edit, Eye, MoreVertical, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSavedAnalyses, SavedAnalysis } from '@/hooks/useSavedAnalyses';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export const SavedAnalysesTable: React.FC = () => {
  const { analyses, loading, deleteAnalysis, updateAnalysisTitle } = useSavedAnalyses();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleLoadAnalysis = (analysis: SavedAnalysis) => {
    navigate(`/analyzer?ticker=${analysis.ticker}&loadAnalysis=${analysis.id}`);
    toast({
      title: "Analyse wird geladen",
      description: `${analysis.title} wird geöffnet.`
    });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAnalysis(deleteId);
      setDeleteId(null);
    }
  };

  const handleEditTitle = (analysis: SavedAnalysis) => {
    setEditingId(analysis.id);
    setEditTitle(analysis.title);
  };

  const handleSaveTitle = async () => {
    if (editingId && editTitle.trim()) {
      await updateAnalysisTitle(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 5) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <History size={20} />
          <h3 className="text-lg font-semibold">Verlauf</h3>
        </div>
        <div className="border rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aktie</TableHead>
                <TableHead>Gespeichert am</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Preis</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-16">
        <History size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">
          Noch keine Analysen gespeichert
        </h3>
        <p className="text-muted-foreground">
          Führe eine Aktienanalyse durch und speichere sie als Momentaufnahme.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History size={20} />
        <h3 className="text-lg font-semibold">Verlauf</h3>
        <Badge variant="secondary">{analyses.length}</Badge>
      </div>

      <div className="border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aktie</TableHead>
              <TableHead>Gespeichert am</TableHead>
              <TableHead>Buffett-Score</TableHead>
              <TableHead>Preis</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analyses.map((analysis) => (
              <TableRow 
                key={analysis.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleLoadAnalysis(analysis)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{analysis.company_name}</p>
                    <p className="text-xs text-muted-foreground">{analysis.ticker}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <time className="text-sm tabular-nums">
                    {format(new Date(analysis.saved_at), 'dd.MM.yy HH:mm')}
                  </time>
                </TableCell>
                <TableCell>
                  {analysis.analysis_data?.overallRating?.buffettScore ? (
                    <Badge 
                      variant={getScoreBadgeVariant(analysis.analysis_data.overallRating.buffettScore)}
                      className="font-mono"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {analysis.analysis_data.overallRating.buffettScore}/10
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {analysis.analysis_data?.stockInfo?.price ? (
                    <>
                      {analysis.analysis_data.stockInfo.price.toFixed(2)}{' '}
                      {analysis.analysis_data.stockInfo.currency}
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleLoadAnalysis(analysis)}>
                        <Eye className="mr-2 h-4 w-4" /> Öffnen
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditTitle(analysis)}>
                        <Edit className="mr-2 h-4 w-4" /> Titel bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(analysis.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Title Dialog */}
      {editingId && (
        <AlertDialog open={!!editingId} onOpenChange={() => handleCancelEdit()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Titel bearbeiten</AlertDialogTitle>
              <AlertDialogDescription>
                Gib einen neuen Titel für die Analyse ein.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Titel..."
              autoFocus
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelEdit}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveTitle}>Speichern</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analyse löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Behalten</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
