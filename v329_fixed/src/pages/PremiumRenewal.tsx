import { useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Upload, FileText, Moon, Sun, HelpCircle, Shield, Gem, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import { useSubmitPremiumRequest } from '@/hooks/usePremiumRequests';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type PlanType = 'gold' | 'platinum';

const PLATINUM_MULTIPLIER = 1.4;

export default function PremiumRenewal() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data: paymentMethods, isLoading: methodsLoading } = usePaymentMethods();
  const { data: pricingPlans, isLoading: plansLoading } = usePricingPlans();
  const submitRequest = useSubmitPremiumRequest();

  const [selectedType, setSelectedType] = useState<PlanType>('gold');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copyToClipboard = (text: string, methodName: string) => {
    navigator.clipboard.writeText(text);
    setSelectedPaymentMethod(methodName);
    toast.success(t('copied'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getPlanPrice = (plan: { price: string; platinum_price?: string | null }, type: PlanType): string => {
    if (type === 'gold') return plan.price;
    // Use explicitly set platinum_price if available, otherwise auto-calculate
    if (plan.platinum_price) return plan.platinum_price;
    const priceNum = parseInt(plan.price.replace(/[^0-9]/g, ''));
    const platinumPrice = Math.round(priceNum * PLATINUM_MULTIPLIER);
    return `${platinumPrice.toLocaleString()} MMK`;
  };

  const handleSubmit = async () => {
    if (!selectedPlanId) {
      toast.error('Plan ရွေးချယ်ပါ');
      return;
    }
    if (!transactionId.trim()) {
      toast.error('Transaction ID ထည့်ပါ');
      return;
    }
    if (!screenshot) {
      toast.error('Screenshot ထည့်ပါ');
      return;
    }
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Upload screenshot
      const fileExt = screenshot.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, screenshot);

      let screenshotUrl: string | null = null;
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('payment-screenshots')
          .getPublicUrl(filePath);
        screenshotUrl = urlData?.publicUrl || null;
      }

      const selectedPlan = pricingPlans?.find(p => p.id === selectedPlanId);
      const planPrice = selectedPlan ? getPlanPrice(selectedPlan, selectedType) : '';

      await submitRequest.mutateAsync({
        user_id: user.id,
        plan_id: selectedPlanId,
        plan_duration: selectedPlan?.duration || '',
        plan_price: planPrice,
        transaction_id: transactionId.trim(),
        screenshot_url: screenshotUrl,
        premium_type: selectedType,
        payment_method: selectedPaymentMethod,
      });

      toast.success('တင်သွင်းပြီးပါပြီ! စစ်ဆေးပြီးအကြောင်းကြားပါမည်');
      navigate('/');
    } catch {
      toast.error('အမှားတစ်ခု ဖြစ်ပွားသည်');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  const isLoading = methodsLoading || plansLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate('/welcome')} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">
            VIP Member လျှောက်ရန်
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <LoadingSpinner message="Loading..." />
      ) : (
        <div className="px-4 py-6 max-w-lg mx-auto space-y-6">

          {/* Plan Type Selection Cards - Clickable */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              Plan ကွာခြားချက်များ
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Gold Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedType('gold');
                  setSelectedPlanId('');
                }}
                className={cn(
                  "bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white text-center relative overflow-hidden transition-all",
                  selectedType === 'gold'
                    ? 'ring-3 ring-amber-300 scale-[1.02] shadow-lg'
                    : 'opacity-70'
                )}
              >
                <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/10" />
                {selectedType === 'gold' && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <Check className="w-4 h-4 text-amber-500" />
                  </div>
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Gold</h3>
                  <span className="text-xs bg-white/20 rounded-full px-3 py-1">
                    2 Devices
                  </span>
                </div>
              </button>

              {/* Platinum Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedType('platinum');
                  setSelectedPlanId('');
                }}
                className={cn(
                  "bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white text-center relative overflow-hidden transition-all",
                  selectedType === 'platinum'
                    ? 'ring-3 ring-blue-300 scale-[1.02] shadow-lg'
                    : 'opacity-70'
                )}
              >
                <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/10" />
                {selectedType === 'platinum' && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                    <Check className="w-4 h-4 text-blue-500" />
                  </div>
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3">
                    <Gem className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-1">Platinum</h3>
                  <span className="text-xs bg-white/20 rounded-full px-3 py-1">
                    3 Devices
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* VIP Member ဈေးနှုန်းများ - Shows pricing for selected type */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              VIP Member ဈေးနှုန်းများ
            </h2>

            {selectedType === 'gold' ? (
              /* Gold Plan Pricing */
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">Gold Plan</h3>
                  </div>
                  <div className="bg-white/15 rounded-xl divide-y divide-white/20">
                    {pricingPlans?.map((plan) => (
                      <div key={`gold-${plan.id}`} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm font-medium">{plan.duration}</span>
                        <span className="text-sm font-bold">{plan.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Platinum Plan Pricing */
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Gem className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">Platinum Plan</h3>
                  </div>
                  <div className="bg-white/15 rounded-xl divide-y divide-white/20">
                    {pricingPlans?.map((plan) => (
                      <div key={`plat-${plan.id}`} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm font-medium">{plan.duration}</span>
                        <span className="text-sm font-bold">{getPlanPrice(plan, 'platinum')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* သင်အသုံးပြုလိုသော Plan ကိုရွေးပါ */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              သင်အသုံးပြုလိုသော Plan ကိုရွေးပါ
            </h2>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger className="h-12 bg-card border-border text-foreground">
                <SelectValue placeholder="Plan ရွေးချယ်ပါ" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {pricingPlans?.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {selectedType === 'gold' ? 'Gold' : 'Platinum'} — {plan.duration} — {getPlanPrice(plan, selectedType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 1: Payment Accounts */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              ၁။ ငွေလွှဲရန်အချက်အလက်များ
            </h2>
            <div className="space-y-4">
              {paymentMethods?.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.name)}
                  className={cn(
                    `${method.gradient} rounded-2xl p-5 relative overflow-hidden cursor-pointer transition-all`,
                    selectedPaymentMethod === method.name
                      ? 'ring-3 ring-white shadow-lg scale-[1.01]'
                      : ''
                  )}
                >
                  {selectedPaymentMethod === method.name && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center z-20">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -right-2 bottom-4 w-16 h-16 rounded-full bg-white/10" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold text-gray-800">{method.name.split(' ')[0]}</span>
                      </div>
                      <span className={`text-lg font-bold ${method.text_color}`}>
                        {method.name}
                      </span>
                    </div>
                    <p className={`text-sm opacity-80 ${method.text_color}`}>
                      Account Number
                    </p>
                    <div className="flex items-end justify-between mt-1">
                      <div>
                        <p className={`text-2xl font-bold ${method.text_color}`}>
                          {method.account_number}
                        </p>
                        <p className={`text-lg font-semibold ${method.text_color}`}>
                          ({method.account_name})
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(method.account_number, method.name);
                        }}
                        className={`p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors ${method.text_color}`}
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Upload Screenshot */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              ၂။ ငွေလွှဲ Screenshot ထည့်ပါ
            </h2>
            <label className="block border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors bg-card">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {screenshot && screenshotPreview ? (
                <div className="space-y-2">
                  <img src={screenshotPreview} alt="Screenshot preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                  <p className="text-sm font-medium text-foreground">{screenshot.name}</p>
                  <p className="text-xs text-muted-foreground">ပြောင်းလဲရန် နှိပ်ပါ</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Tap to upload screenshot</p>
                </div>
              )}
            </label>
          </div>

          {/* Step 3: Transaction ID */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">
              ၃။ Transaction ID ထည့်ပါ
            </h2>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ငွေလွှဲပြေစာမှ Transaction ID နံပါတ်"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="pl-10 h-12 bg-card border-border text-foreground"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-14 text-lg font-bold rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                တင်သွင်းနေသည်...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
