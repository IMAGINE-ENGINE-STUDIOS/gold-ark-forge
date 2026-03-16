import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MarketAsset {
  key: string;
  ticker: string;
  cat: string;
  label: string;
  price: number;
  change24h: number;
  volume?: number;
  sparkline?: number[];
  technicals?: {
    rsi: number;
    macdSignal: string;
    smaSignal: string;
    adx: number;
    overallBias: number;
    overallSignal: string;
    regime: string;
  };
}

interface GeniusRequest {
  timeline: 'short' | 'mid' | 'long';
  assets: MarketAsset[];
  portfolio: {
    cash: number;
    equity: number;
    positions: Array<{
      symbol: string;
      side: string;
      qty: number;
      entryPrice: number;
      currentPrice: number;
      pnl: number;
    }>;
  };
  riskTolerance: number; // 1-10
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body: GeniusRequest = await req.json();
    const { timeline, assets, portfolio, riskTolerance } = body;

    if (!assets || assets.length === 0) {
      return new Response(JSON.stringify({ error: "No market data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a concise market snapshot for AI
    const topAssets = assets
      .filter(a => a.price > 0 && Math.abs(a.change24h) > 0.01)
      .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
      .slice(0, 30);

    const assetSummary = topAssets.map(a => {
      let line = `${a.ticker} (${a.cat}): $${a.price} | 24h: ${a.change24h > 0 ? '+' : ''}${a.change24h.toFixed(2)}%`;
      if (a.technicals) {
        line += ` | RSI:${a.technicals.rsi.toFixed(0)} ADX:${a.technicals.adx.toFixed(0)} Signal:${a.technicals.overallSignal} Regime:${a.technicals.regime}`;
      }
      return line;
    }).join('\n');

    const positionSummary = portfolio.positions.length > 0
      ? portfolio.positions.map(p => `${p.symbol} ${p.side} ${p.qty}@${p.entryPrice.toFixed(2)} PnL:$${p.pnl.toFixed(2)}`).join('\n')
      : 'No open positions';

    const timelineDesc = {
      short: '1-15 minutes scalping — target volatile assets with tight spreads, fast momentum plays',
      mid: '1-6 hours swing — target trending assets with clear directional bias and moderate volatility',
      long: '1-7 days position — target strong trend continuations with fundamental backing',
    }[timeline];

    const holdDuration = {
      short: '1-15 minutes',
      mid: '1-6 hours',
      long: '1-7 days',
    }[timeline];

    const systemPrompt = `You are GENIUS, an elite quantitative trading strategist. You analyze real-time market data and produce ACTIONABLE trade recommendations.

RULES:
1. ONLY recommend assets from the provided market data — never invent tickers
2. Every recommendation must have a clear entry, target, and stop-loss
3. Position sizing must respect available cash and risk tolerance
4. For ${timeline} term: ${timelineDesc}
5. Hold duration: ${holdDuration}
6. Max 3-5 trades per cycle — quality over quantity
7. Never recommend more than 30% of equity in a single trade
8. Prefer assets with high ADX (>20) for trending, low ADX + extreme RSI for mean-reversion
9. Account for existing positions — avoid doubling down or conflicting hedges
10. Risk tolerance: ${riskTolerance}/10 (${riskTolerance <= 3 ? 'conservative' : riskTolerance <= 6 ? 'moderate' : 'aggressive'})

STRATEGY FRAMEWORK:
- SHORT TERM: Look for momentum bursts, breakouts from tight ranges, RSI divergences, high volume spikes
- MID TERM: Trend-following on strong ADX signals, MACD crossovers, support/resistance plays
- LONG TERM: Strong trend continuation, sector rotation, fundamental catalysts reflected in technicals

You MUST respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "strategy": "string — one-sentence strategy description",
  "confidence": number 0-100,
  "trades": [
    {
      "ticker": "string — exact ticker from data",
      "action": "BUY" | "SELL",
      "qty": number,
      "reason": "string — 1 sentence why",
      "entryPrice": number,
      "targetPrice": number,
      "stopLoss": number,
      "holdMinutes": number,
      "confidence": number 0-100
    }
  ],
  "marketRegime": "trending" | "ranging" | "volatile" | "calm",
  "riskAssessment": "string — 1 sentence risk warning"
}`;

    const userPrompt = `PORTFOLIO STATE:
Cash: $${portfolio.cash.toFixed(2)}
Equity: $${portfolio.equity.toFixed(2)}
Risk tolerance: ${riskTolerance}/10
Timeline: ${timeline} term (${holdDuration})

CURRENT POSITIONS:
${positionSummary}

LIVE MARKET DATA (sorted by volatility):
${assetSummary}

Analyze this data and provide your top trade recommendations for the ${timeline} term timeline. Be specific with quantities based on available cash. Position size: max ${riskTolerance <= 3 ? '5%' : riskTolerance <= 6 ? '10%' : '20%'} of equity per trade.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please wait a moment" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted — add funds in Settings" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse the JSON from AI response (may have markdown wrapping)
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "AI returned invalid format", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate trade tickers exist in provided assets
    const validTickers = new Set(assets.map(a => a.ticker));
    if (parsed.trades) {
      parsed.trades = parsed.trades.filter((t: any) => validTickers.has(t.ticker));
    }

    return new Response(JSON.stringify({ success: true, analysis: parsed, timestamp: Date.now() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("genius-strategy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
