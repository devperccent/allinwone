import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Megaphone, Trash2, Plus } from 'lucide-react';
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '@/hooks/useAdminActions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const TYPE_COLORS: Record<string, string> = {
  info: 'bg-blue-500/20 text-blue-600',
  warning: 'bg-amber-500/20 text-amber-600',
  success: 'bg-green-500/20 text-green-600',
  critical: 'bg-red-500/20 text-red-600',
};

export function AnnouncementManager() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: announcements, isLoading } = useAnnouncements();
  const createAnn = useCreateAnnouncement();
  const deleteAnn = useDeleteAnnouncement();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  const handleCreate = async () => {
    if (!title.trim() || !message.trim() || !profile?.id) return;
    try {
      await createAnn.mutateAsync({ title, message, type, profileId: profile.id });
      toast({ title: 'Announcement sent', description: 'All users will see this announcement.' });
      setTitle('');
      setMessage('');
      setShowForm(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" /> Announcements
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <Textarea placeholder="Message to all users..." value={message} onChange={e => setMessage(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} disabled={createAnn.isPending || !title.trim()}>
                {createAnn.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Send Announcement
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : announcements?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No announcements yet</p>
        ) : (
          <div className="space-y-2">
            {announcements?.map((ann: any) => (
              <div key={ann.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={TYPE_COLORS[ann.type] || TYPE_COLORS.info}>{ann.type}</Badge>
                    <span className="font-medium text-sm">{ann.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{ann.message}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(ann.created_at), 'dd MMM yyyy HH:mm')}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteAnn.mutate(ann.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
