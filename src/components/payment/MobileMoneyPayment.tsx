import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Phone, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface MobileMoneyPaymentProps {
  orderId: string;
  amount: number;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

type Provider = "mvola" | "orange_money" | "airtel_money";

const providers = [
  { id: "mvola" as Provider, name: "MVola", color: "from-red-500 to-red-600", prefixes: "034, 038" },
  { id: "orange_money" as Provider, name: "Orange Money", color: "from-orange-500 to-orange-600", prefixes: "032, 037" },
  { id: "airtel_money" as Provider, name: "Airtel Money", color: "from-red-600 to-pink-600", prefixes: "033" },
];

const MobileMoneyPayment = ({ orderId, amount, onSuccess, onCancel }: MobileMoneyPaymentProps) => {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProvider || !phoneNumber) {
      toast({
        title: "Diso",
        description: "Safidio ny fomba fandoavana sy ampidiro ny laharana finday",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setStatus("processing");
    setErrorMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Tsy tafiditra");
      }

      const response = await supabase.functions.invoke("mobile-money", {
        body: {
          orderId,
          amount,
          phoneNumber,
          provider: selectedProvider,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (result.success) {
        setStatus("success");
        toast({
          title: "Nahomby!",
          description: "Voaray ny fandoavana",
        });
        setTimeout(() => {
          onSuccess(result.transactionId);
        }, 2000);
      } else {
        setStatus("error");
        setErrorMessage(result.message || "Tsy nahomby ny fandoavana");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setStatus("error");
      setErrorMessage(error.message || "Nisy olana tamin'ny fandoavana");
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-8 animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          Nahomby ny fandoavana!
        </h3>
        <p className="text-muted-foreground">
          Mahazo notification ianao rehefa voaray ny commande
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Amount Display */}
      <div className="bg-muted/50 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Vola haloa</p>
        <p className="font-display text-3xl font-bold text-primary">
          Ar {amount.toLocaleString()}
        </p>
      </div>

      {/* Provider Selection */}
      <div className="space-y-3">
        <Label>Safidio ny fomba fandoavana</Label>
        <div className="grid grid-cols-3 gap-3">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => setSelectedProvider(provider.id)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedProvider === provider.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className={`w-full h-2 rounded-full bg-gradient-to-r ${provider.color} mb-3`} />
              <p className="font-semibold text-sm text-foreground">{provider.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{provider.prefixes}</p>
              {selectedProvider === provider.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Phone Number Input */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Laharana finday</Label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="034 00 000 00"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="pl-12 h-12"
              disabled={loading}
            />
          </div>
        </div>

        {/* Error Message */}
        {status === "error" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Processing State */}
        {status === "processing" && (
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-muted/50">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-muted-foreground">Miandry ny fankatoavana...</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Hanafoana
          </Button>
          <Button
            type="submit"
            variant="hero"
            className="flex-1"
            disabled={loading || !selectedProvider || !phoneNumber}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Manatanteraka...
              </>
            ) : (
              "Handoa"
            )}
          </Button>
        </div>
      </form>

      {/* Security Note */}
      <p className="text-xs text-center text-muted-foreground">
        🔒 Ny fandoavana dia azo antoka sy voaaro
      </p>
    </div>
  );
};

export default MobileMoneyPayment;
