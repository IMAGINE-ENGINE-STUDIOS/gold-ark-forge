import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an elite quantitative trading analyst. You receive structured market data for a potential trade entry and must decide whether to ENTER or SKIP.

Analyze:
1. TREND ALIGNMENT — Are short and long-term trends aligned? SMA/EMA crossovers, Ichimoku cloud position.
2. MOMENTUM QUALITY — Is RSI in a healthy zone (not exhausted)? Is MACD confirming? Check for divergences.
3. VOLATILITY CONTEXT — Is ATR reasonable? Bollinger band position? Avoid entries during extreme compression or expansion.
4. RISK-REWARD — Given the stop loss and take profit levels, is the R:R attractive?
5. REGIME — In trending markets, trend-following entries are good. In ranging markets, require stronger signals.
6. FALSE BREAKOUT RISK — Look for signs of traps: exhaustion candles, volume decline on breakout, RSI divergence.

Be CONSERVATIVE — when in doubt, SKIP. Only approve high-conviction setups.
Return your analysis using the analyze_trade tool.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      symbol, side, compositeScore, signalBreakdown,
      recentCloses, currentPrice, atr, rsi, macdValue, macdSignal,
      regime, strategy, riskReward, confluenceLabel,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ fallback: true, error: "No API key" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `TRADE PROPOSAL: ${side.toUpperCase()} ${symbol} at $${currentPrice}

SIGNAL BREAKDOWN:
- Composite: ${compositeScore} (threshold passed)
- Trend: ${signalBreakdown.trend} | Momentum: ${signalBreakdown.momentum}
- Volatility: ${signalBreakdown.volatility} | Volume: ${signalBreakdown.volume}
- WAVE forecast: ${signalBreakdown.wave}

KEY INDICATORS:
- RSI: ${rsi?.toFixed(1) ?? 'N/A'}
- MACD: ${macdValue?.toFixed(4) ?? 'N/A'} vs Signal: ${macdSignal?.toFixed(4) ?? 'N/A'}
- ATR: $${atr?.toFixed(4) ?? 'N/A'} (${((atr / currentPrice) * 100).toFixed(2)}% of price)
- Risk:Reward = ${riskReward?.toFixed(1) ?? 'N/A'}

MARKET CONTEXT:
- Regime: ${regime} | Strategy: ${strategy} | Confluence: ${confluenceLabel}
- Recent price action (last 10): ${(recentCloses || []).slice(-10).map((p: number) => p.toFixed(2)).join(', ')}

Should I ENTER this trade or SKIP it?`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_trade",
              description: "Return structured trade analysis with confidence and action.",
              parameters: {
                type: "object",
                properties: {
                  confidence: { type: "number", description: "Confidence score 0-100. Above 60 = enter." },
                  action: { type: "string", enum: ["ENTER", "SKIP"], description: "Whether to enter or skip this trade." },
                  reasoning: { type: "string", description: "One-sentence reasoning for the decision." },
                  riskLevel: { type: "string", enum: ["low", "medium", "high"], description: "Risk assessment." },
                },
                required: ["confidence", "action", "reasoning", "riskLevel"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_trade" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({ fallback: true, error: status === 429 ? "rate_limited" : "payment_required" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ fallback: true, error: "ai_error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ fallback: true, error: "no_tool_call" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      fallback: false,
      confidence: analysis.confidence,
      action: analysis.action,
      reasoning: analysis.reasoning,
      riskLevel: analysis.riskLevel,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bot-ai-analysis error:", e);
    return new Response(JSON.stringify({ fallback: true, error: "exception" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
