import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  phoneNumber: string;
  provider: "mvola" | "orange_money" | "airtel_money";
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  message: string;
  status: "pending" | "completed" | "failed";
}

// Simulation of Mobile Money API calls
// In production, replace with actual API integrations
async function processMobileMoneyPayment(
  provider: string,
  phoneNumber: string,
  amount: number
): Promise<PaymentResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate success rate (90% success for demo)
  const isSuccess = Math.random() > 0.1;

  if (!isSuccess) {
    return {
      success: false,
      message: "Tsy nahomby ny fandoavana. Mamerina indray azafady.",
      status: "failed",
    };
  }

  // Generate mock transaction ID
  const transactionId = `${provider.toUpperCase()}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}`;

  return {
    success: true,
    transactionId,
    message: "Nahomby ny fandoavana!",
    status: "completed",
  };
}

// Validate Malagasy phone number
function validatePhoneNumber(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, "");
  
  // Check for valid Malagasy mobile number patterns
  // MVola (Telma): 034, 038
  // Orange Money: 032, 037
  // Airtel Money: 033
  const mvolaPattern = /^(\+261|0)?(34|38)\d{7}$/;
  const orangePattern = /^(\+261|0)?(32|37)\d{7}$/;
  const airtelPattern = /^(\+261|0)?33\d{7}$/;
  
  return mvolaPattern.test(cleaned) || orangePattern.test(cleaned) || airtelPattern.test(cleaned);
}

// Get provider from phone number
function getProviderFromPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s-]/g, "").replace(/^\+261/, "0");
  
  if (/^0?(34|38)/.test(cleaned)) return "mvola";
  if (/^0?(32|37)/.test(cleaned)) return "orange_money";
  if (/^0?33/.test(cleaned)) return "airtel_money";
  
  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Tsy manan-dàlana" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Tsy manan-dàlana" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { orderId, amount, phoneNumber, provider }: PaymentRequest = await req.json();

    // Validate input
    if (!orderId || !amount || !phoneNumber || !provider) {
      return new Response(
        JSON.stringify({ error: "Mila fenoina ny saha rehetra" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      return new Response(
        JSON.stringify({ error: "Laharana finday tsy mety" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate amount
    if (amount < 100) {
      return new Response(
        JSON.stringify({ error: "Tsy ampy ny vola (minimum Ar 100)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, total_amount, status, buyer_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order error:", orderError);
      return new Response(
        JSON.stringify({ error: "Tsy hita ny commande" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.buyer_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Tsy manan-dàlana" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create pending payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: orderId,
        user_id: user.id,
        amount,
        provider,
        phone_number: phoneNumber,
        status: "processing",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Payment creation error:", paymentError);
      return new Response(
        JSON.stringify({ error: "Tsy nahomby ny famoronana fandoavana" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process payment (simulation)
    console.log(`Processing ${provider} payment for Ar ${amount} to ${phoneNumber}`);
    const result = await processMobileMoneyPayment(provider, phoneNumber, amount);

    // Update payment record
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: result.status,
        transaction_id: result.transactionId,
        error_message: result.success ? null : result.message,
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Payment update error:", updateError);
    }

    // If payment successful, update order status
    if (result.success) {
      await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", orderId);
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        transactionId: result.transactionId,
        message: result.message,
        paymentId: payment.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(
      JSON.stringify({ error: "Nisy olana tamin'ny fandoavana" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
