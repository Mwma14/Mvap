import { useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CreditCard, Plus, Trash2, Edit, Loader2, Save, Shield, Gem } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  usePaymentMethods,
  useUpsertPaymentMethod,
  useDeletePaymentMethod,
  PaymentMethod,
} from '@/hooks/usePaymentMethods';
import {
  usePricingPlans,
  useUpsertPricingPlan,
  useDeletePricingPlan,
  PricingPlan,
} from '@/hooks/usePricingPlans';

const gradientOptions = [
  { label: 'Blue', value: 'bg-gradient-to-br from-blue-400 to-blue-500' },
  { label: 'Yellow', value: 'bg-gradient-to-br from-yellow-300 to-yellow-400' },
  { label: 'Pink/Red', value: 'bg-gradient-to-br from-pink-400 via-rose-400 to-red-400' },
  { label: 'Teal', value: 'bg-gradient-to-br from-teal-600 to-teal-700' },
  { label: 'Green', value: 'bg-gradient-to-br from-emerald-600 to-emerald-700' },
  { label: 'Purple', value: 'bg-gradient-to-br from-purple-500 to-purple-700' },
  { label: 'Orange', value: 'bg-gradient-to-br from-orange-400 to-orange-600' },
];

export default function PaymentSettingsAdmin() {
  const { data: methods, isLoading: methodsLoading } = usePaymentMethods();
  const { data: plans, isLoading: plansLoading } = usePricingPlans();
  const upsertMethod = useUpsertPaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const upsertPlan = useUpsertPricingPlan();
  const deletePlan = useDeletePricingPlan();

  const [editingMethod, setEditingMethod] = useState<Partial<PaymentMethod> | null>(null);
  const [editingPlan, setEditingPlan] = useState<Partial<PricingPlan> | null>(null);

  const handleSaveMethod = () => {
    if (!editingMethod?.name || !editingMethod.account_number || !editingMethod.account_name) return;
    upsertMethod.mutate(editingMethod as any, {
      onSuccess: () => setEditingMethod(null),
    });
  };

  const handleSavePlan = () => {
    if (!editingPlan?.duration || !editingPlan.price) return;
    upsertPlan.mutate(editingPlan as any, {
      onSuccess: () => setEditingPlan(null),
    });
  };

  if (methodsLoading || plansLoading) {
    return <LoadingSpinner message="Loading payment settings..." />;
  }

  return (
    <div className="w-full space-y-6">
      <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2">
        <CreditCard className="w-5 h-5 sm:w-8 sm:h-8" />
        Payment Settings
      </h1>

      {/* Payment Methods */}
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Payment Methods</CardTitle>
          <Button
            size="sm"
            onClick={() =>
              setEditingMethod({
                name: '',
                account_number: '',
                account_name: '',
                gradient: gradientOptions[0].value,
                text_color: 'text-white',
                display_order: (methods?.length || 0) + 1,
              })
            }
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {methods?.map((method) => (
            <div
              key={method.id}
              className={`${method.gradient} rounded-xl p-3 flex items-center justify-between`}
            >
              <div className={method.text_color}>
                <p className="font-bold text-sm">{method.name}</p>
                <p className="text-xs opacity-80">{method.account_number} • {method.account_name}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={() => setEditingMethod(method)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={() => deleteMethod.mutate(method.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {(!methods || methods.length === 0) && (
            <p className="text-center text-sm text-muted-foreground py-4">No payment methods yet</p>
          )}
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Pricing Plans</CardTitle>
          <Button
            size="sm"
            onClick={() =>
              setEditingPlan({
                duration: '',
                duration_days: 30,
                price: '',
                platinum_price: '',
                display_order: (plans?.length || 0) + 1,
              })
            }
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {plans?.map((plan) => (
            <div
              key={plan.id}
              className="bg-muted rounded-xl p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{plan.duration}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                    <Shield className="w-3 h-3" />
                    Gold: {plan.price}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                    <Gem className="w-3 h-3" />
                    Platinum: {plan.platinum_price || '—'}
                  </span>
                  <span className="text-xs text-muted-foreground">{plan.duration_days} days</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingPlan(plan)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => deletePlan.mutate(plan.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {(!plans || plans.length === 0) && (
            <p className="text-center text-sm text-muted-foreground py-4">No pricing plans yet</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Payment Method Dialog */}
      <Dialog open={!!editingMethod} onOpenChange={(open) => !open && setEditingMethod(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingMethod?.id ? 'Edit' : 'Add'} Payment Method</DialogTitle>
            <DialogDescription>Configure the payment method details</DialogDescription>
          </DialogHeader>
          {editingMethod && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={editingMethod.name || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                  placeholder="KBZ Pay"
                />
              </div>
              <div>
                <Label className="text-xs">Account Number</Label>
                <Input
                  value={editingMethod.account_number || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, account_number: e.target.value })}
                  placeholder="09xxxxxxxx"
                />
              </div>
              <div>
                <Label className="text-xs">Account Name</Label>
                <Input
                  value={editingMethod.account_name || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, account_name: e.target.value })}
                  placeholder="Account holder name"
                />
              </div>
              <div>
                <Label className="text-xs">Color Theme</Label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {gradientOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`${opt.value} h-8 rounded-lg border-2 ${
                        editingMethod.gradient === opt.value ? 'border-white' : 'border-transparent'
                      }`}
                      onClick={() => setEditingMethod({ ...editingMethod, gradient: opt.value })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Display Order</Label>
                <Input
                  type="number"
                  value={editingMethod.display_order || 0}
                  onChange={(e) => setEditingMethod({ ...editingMethod, display_order: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingMethod(null)}>Cancel</Button>
            <Button onClick={handleSaveMethod} disabled={upsertMethod.isPending}>
              {upsertMethod.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Pricing Plan Dialog */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingPlan?.id ? 'Edit' : 'Add'} Pricing Plan</DialogTitle>
            <DialogDescription>Configure Gold and Platinum prices for this plan</DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Duration Label</Label>
                <Input
                  value={editingPlan.duration || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, duration: e.target.value })}
                  placeholder="1 Month"
                />
              </div>
              <div>
                <Label className="text-xs">Duration (Days)</Label>
                <Input
                  type="number"
                  value={editingPlan.duration_days || 30}
                  onChange={(e) => setEditingPlan({ ...editingPlan, duration_days: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Shield className="w-3 h-3 text-yellow-500" />
                  Gold Plan Price
                </Label>
                <Input
                  value={editingPlan.price || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })}
                  placeholder="5000 MMK"
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Gem className="w-3 h-3 text-purple-500" />
                  Platinum Plan Price
                </Label>
                <Input
                  value={editingPlan.platinum_price || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, platinum_price: e.target.value })}
                  placeholder="7000 MMK"
                />
              </div>
              <div>
                <Label className="text-xs">Display Order</Label>
                <Input
                  type="number"
                  value={editingPlan.display_order || 0}
                  onChange={(e) => setEditingPlan({ ...editingPlan, display_order: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingPlan(null)}>Cancel</Button>
            <Button onClick={handleSavePlan} disabled={upsertPlan.isPending}>
              {upsertPlan.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
