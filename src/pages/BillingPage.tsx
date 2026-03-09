import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Bot, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const PLANS = [
  {
    id: 'standard',
    name: 'Standard',
    price: 'Free',
    description: 'For small businesses getting started',
    icon: Bot,
    features: [
      '50 AI queries per day',
      '10 premium model queries',
      'All core invoicing features',
      'Up to 500 invoices/month',
      'Email support',
    ],
    color: 'border-border',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹999/mo',
    description: 'For growing businesses that need more AI power',
    icon: Crown,
    popular: true,
    features: [
      '200 AI queries per day',
      '100 premium model queries',
      'Priority AI model access',
      'Unlimited invoices',
      'Advanced reports & analytics',
      'Priority email support',
    ],
    color: 'border-amber-500',
  },
  {
    id: 'admin',
    name: 'Enterprise',
    price: 'Contact us',
    description: 'For large teams with custom needs',
    icon: Zap,
    features: [
      '1000 AI queries per day',
      '500 premium model queries',
      'Dedicated AI model access',
      'Custom integrations',
      'Phone & chat support',
      'Dedicated account manager',
    ],
    color: 'border-primary',
  },
];

export default function BillingPage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const currentTier = (profile as any)?.ai_tier || 'standard';

  const { data: usage } = useQuery({
    queryKey: ['my_ai_usage'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('ai_usage_logs')
        .select('id')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');
      return { todayCount: data?.length || 0 };
    },
  });

  const handleUpgrade = async (planId: string) => {
    if (planId === 'admin') {
      toast({ title: 'Contact Us', description: 'Please reach out to oneinwall@gmail.com for enterprise plans.' });
      return;
    }
    if (planId === currentTier) return;

    setUpgrading(planId);
    try {
      // For now, directly update tier (in production, this would go through Stripe)
      const { error } = await supabase
        .from('profiles')
        .update({ ai_tier: planId } as any)
        .eq('id', profile?.id);
      
      if (error) throw error;
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['my_ai_usage'] });
      toast({ title: 'Plan Updated!', description: `You're now on the ${planId} plan.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your AI tier and usage</p>
      </div>

      {/* Current usage */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-lg font-bold capitalize flex items-center gap-2">
                {currentTier === 'premium' && <Crown className="h-5 w-5 text-amber-500" />}
                {currentTier === 'admin' && <Zap className="h-5 w-5 text-primary" />}
                {currentTier}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI Queries Today</p>
              <p className="text-lg font-bold">{usage?.todayCount ?? (profile as any)?.ai_queries_today ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.id;
          const Icon = plan.icon;
          return (
            <Card key={plan.id} className={`relative ${plan.color} ${plan.popular ? 'border-2' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <div className="text-2xl font-bold">{plan.price}</div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? 'outline' : plan.popular ? 'default' : 'secondary'}
                  disabled={isCurrent || upgrading !== null}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {upgrading === plan.id && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {isCurrent ? 'Current Plan' : plan.id === 'admin' ? 'Contact Sales' : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
