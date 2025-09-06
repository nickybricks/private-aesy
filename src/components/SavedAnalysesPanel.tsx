import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Trash2, Edit, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

interface SavedAnalysesPanelProps {
  onLoadAnalysis?: (analysis: SavedAnalysis) => void;
}

export const SavedAnalysesPanel: React.FC<SavedAnalysesPanelProps> = ({ onLoadAnalysis }) => {
  const { analyses, loading, deleteAnalysis, updateAnalysisTitle } = useSavedAnalyses();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleLoadAnalysis = (analysis: SavedAnalysis) => {
    // Navigate to analyzer page with the analysis ID
    // The BuffettAnalyzer page will handle loading the saved analysis
    navigate(`/analyzer?ticker=${analysis.ticker}&loadAnalysis=${analysis.id}`);
    
    // Show success message
    toast({
      title: "Analyse wird geladen",
      description: `${analysis.title} wird geöffnet.`
    });
    
    // Call optional callback if provided (for backwards compatibility)
    onLoadAnalysis?.(analysis);
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
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <History size={20} />
          <h3 className="text-lg font-semibold">Gespeicherte Analysen</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History size={20} />
        <h3 className="text-lg font-semibold">Gespeicherte Analysen</h3>
        <Badge variant="secondary">{analyses.length}</Badge>
      </div>

      {analyses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <History size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Noch keine Analysen gespeichert.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Führen Sie eine Aktienanalyse durch und speichern Sie diese als Momentaufnahme.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <Card key={analysis.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingId === analysis.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="text-sm"
                          autoFocus
                        />
                        <Button size="sm" onClick={handleSaveTitle}>
                          Speichern
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          Abbrechen
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{analysis.title}</CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTitle(analysis)}
                          className="p-1 h-auto"
                        >
                          <Edit size={14} />
                        </Button>
                      </div>
                    )}
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(analysis.saved_at).toLocaleString('de-DE')}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {analysis.analysis_data?.overallRating?.buffettScore && (
                      <Badge 
                        variant={getScoreBadgeVariant(analysis.analysis_data.overallRating.buffettScore)}
                        className="flex items-center gap-1"
                      >
                        <TrendingUp size={12} />
                        {analysis.analysis_data.overallRating.buffettScore}/10
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{analysis.company_name}</span> ({analysis.ticker})
                    {analysis.analysis_data?.stockInfo?.price && (
                      <span className="ml-2">
                        {analysis.analysis_data.stockInfo.price.toFixed(2)} {analysis.analysis_data.stockInfo.currency}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleLoadAnalysis(analysis)}
                      className="flex items-center gap-1"
                    >
                      Laden
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteId(analysis.id)}
                      className="flex items-center gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analyse löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diese gespeicherte Analyse löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};