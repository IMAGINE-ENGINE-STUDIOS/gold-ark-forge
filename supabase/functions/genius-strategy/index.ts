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

interface PortfolioSnapshot {
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
}

interface GeniusRequest {
  mode: 'strategy' | 'chat' | 'goal';
  timeline?: 'short' | 'mid' | 'long';
  assets?: MarketAsset[];
  portfolio?: PortfolioSnapshot;
  riskTolerance?: number;
  // Chat mode
  chatMessage?: string;
  chatHistory?: Array<{ role: string; content: string }>;
  // Goal mode
  goal?: {
    type: 'hourly_target' | 'daily_target' | 'total_target' | 'percentage';
    amount: number;
    timeframeHours?: number;
    description: string;
  };
  // Performance context
  performanceContext?: {
    totalPnl: number;
    winRate: number;
    totalTrades: number;
    currentStreak: number;
    goalProgress?: number;
  };
  // News/sentiment
  newsSentiment?: {
    headlines: string[];
    overallSentiment: number; // -1 to 1
    topMentions: string[];
  };
}

function buildAssetSummary(assets: MarketAsset[]): string {
  return assets
    .filter(a => a.price > 0 && Math.abs(a.change24h) > 0.01)
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 30)
    .map(a => {
      let line = `${a.ticker} (${a.cat}): $${a.price} | 24h: ${a.change24h > 0 ? '+' : ''}${a.change24h.toFixed(2)}%`;
      if (a.technicals) {
        line += ` | RSI:${a.technicals.rsi.toFixed(0)} ADX:${a.technicals.adx.toFixed(0)} Signal:${a.technicals.overallSignal} Regime:${a.technicals.regime}`;
      }
      return line;
    }).join('\n');
}

function buildPortfolioSummary(portfolio: PortfolioSnapshot): string {
  const posSummary = portfolio.positions.length > 0
    ? portfolio.positions.map(p => `${p.symbol} ${p.side} ${p.qty}@${p.entryPrice.toFixed(2)} PnL:$${p.pnl.toFixed(2)}`).join('\n')
    : 'No open positions';
  return `Cash: $${portfolio.cash.toFixed(2)}\nEquity: $${portfolio.equity.toFixed(2)}\nPositions:\n${posSummary}`;
}

// ─── Strategy Mode ──────────────────────────────────────

function buildStrategyPrompt(body: GeniusRequest): { system: string; user: string } {
  const { timeline = 'short', assets = [], portfolio, riskTolerance = 5 } = body;
  const holdDuration: Record<string, string> = { short: '1-15 minutes', mid: '1-6 hours', long: '1-7 days' };
  const timelineDesc: Record<string, string> = {
    short: '1-15 minutes scalping — target volatile assets with tight spreads, fast momentum plays',
    mid: '1-6 hours swing — target trending assets with clear directional bias and moderate volatility',
    long: '1-7 days position — target strong trend continuations with fundamental backing',
  };

  const sentimentBlock = body.newsSentiment ? `\nNEWS SENTIMENT: ${body.newsSentiment.overallSentiment > 0.3 ? 'BULLISH' : body.newsSentiment.overallSentiment < -0.3 ? 'BEARISH' : 'NEUTRAL'} (${body.newsSentiment.overallSentiment.toFixed(2)})\nTop headlines: ${body.newsSentiment.headlines.slice(0, 5).join(' | ')}\nMost mentioned: ${body.newsSentiment.topMentions.join(', ')}` : '';
  const perfBlock = body.performanceContext ? `\nSESSION PERFORMANCE: P&L $${body.performanceContext.totalPnl.toFixed(2)} | Win Rate: ${body.performanceContext.winRate.toFixed(0)}% | Trades: ${body.performanceContext.totalTrades} | Streak: ${body.performanceContext.currentStreak}` : '';

  const system = `You are GENIUS, an elite quantitative trading strategist. You analyze real-time market data and produce ACTIONABLE trade recommendations.

DESK DOCTRINE (Gold Arrow): the desk harvests +1% take-profit targets with -0.5% stops, per-trade risk capped at 0.10-0.25% of capital, a hard daily loss limit of -2% to -3%, and everything flat before the close. A +1% gain on ONE trade is a harvest target, not a promise — never present any return as guaranteed or typical. Prefer trades in liquid, in-play assets with real breakouts over quiet sideways names; a flat tape means the honest recommendation is to wait.

RULES:
1. ONLY recommend assets from the provided market data — never invent tickers
2. Every recommendation must have a clear entry, target, and stop-loss
3. Position sizing must respect available cash and risk tolerance
4. For ${timeline} term: ${timelineDesc[timeline]}
5. Hold duration: ${holdDuration[timeline]}
6. Max 3-5 trades per cycle — quality over quantity
7. Never recommend more than 30% of equity in a single trade
8. Prefer assets with high ADX (>20) for trending, low ADX + extreme RSI for mean-reversion
9. Account for existing positions — avoid doubling down or conflicting hedges
10. Risk tolerance: ${riskTolerance}/10 (${riskTolerance <= 3 ? 'conservative' : riskTolerance <= 6 ? 'moderate' : 'aggressive'})
11. CRITICAL: Factor in news sentiment — bullish sentiment confirms bullish technicals, bearish sentiment warns of reversals
12. NEVER LOSE MORE THAN 20% OF PREDICTIONS — if recent accuracy is dropping, become more conservative and selective

You MUST respond with ONLY a valid JSON object:
{
  "strategy": "string",
  "confidence": number 0-100,
  "trades": [{ "ticker": "string", "action": "BUY"|"SELL", "qty": number, "reason": "string", "entryPrice": number, "targetPrice": number, "stopLoss": number, "holdMinutes": number, "confidence": number }],
  "marketRegime": "trending"|"ranging"|"volatile"|"calm",
  "riskAssessment": "string"
}`;

  const user = `PORTFOLIO STATE:\n${portfolio ? buildPortfolioSummary(portfolio) : 'No portfolio data'}
Risk tolerance: ${riskTolerance}/10
Timeline: ${timeline} term (${holdDuration[timeline]})
${perfBlock}${sentimentBlock}

LIVE MARKET DATA:
${buildAssetSummary(assets)}

Analyze and provide top trade recommendations. Position size: max ${riskTolerance <= 3 ? '5%' : riskTolerance <= 6 ? '10%' : '20%'} of equity per trade.`;

  return { system, user };
}

// ─── Chat Mode ──────────────────────────────────────────

function buildChatPrompt(body: GeniusRequest): { system: string; messages: Array<{ role: string; content: string }> } {
  const { assets = [], portfolio, chatMessage = '', chatHistory = [] } = body;
  const sentimentBlock = body.newsSentiment ? `\nNEWS SENTIMENT: ${body.newsSentiment.overallSentiment > 0.3 ? 'BULLISH' : body.newsSentiment.overallSentiment < -0.3 ? 'BEARISH' : 'NEUTRAL'} (${body.newsSentiment.overallSentiment.toFixed(2)})\nHeadlines: ${body.newsSentiment.headlines.slice(0, 5).join(' | ')}` : '';

  const system = `You are GENIUS, an elite AI trading strategist embedded in a professional trading terminal. You have access to live market data, portfolio state, and news sentiment.

You can:
- Answer any market/data question using the live data provided
- Suggest specific trades with entry/target/stop-loss
- Execute buy/sell orders when the user asks (respond with a JSON trade block)
- Create strategic plans to achieve financial goals
- Analyze portfolio performance and suggest optimizations

CURRENT PORTFOLIO:
${portfolio ? buildPortfolioSummary(portfolio) : 'Not available'}

LIVE MARKET SNAPSHOT:
${buildAssetSummary(assets).slice(0, 2000)}
${sentimentBlock}

When the user asks to buy/sell or you want to suggest a trade, include a JSON block in your response:
\`\`\`trade
{"action":"BUY|SELL","ticker":"EXACT_TICKER","qty":number,"reason":"why"}
\`\`\`

Be concise, data-driven, and bold. Use real numbers from the data.`;

  const messages = [
    ...chatHistory.slice(-20),
    { role: 'user', content: chatMessage },
  ];

  return { system, messages };
}

// ─── Goal Mode ──────────────────────────────────────────

function buildGoalPrompt(body: GeniusRequest): { system: string; user: string } {
  const { assets = [], portfolio, goal, riskTolerance = 5 } = body;
  const sentimentBlock = body.newsSentiment ? `\nSENTIMENT: ${body.newsSentiment.overallSentiment.toFixed(2)} | ${body.newsSentiment.headlines.slice(0, 3).join(' | ')}` : '';
  const perfBlock = body.performanceContext ? `\nCurrent progress: P&L $${body.performanceContext.totalPnl.toFixed(2)} | Win Rate: ${body.performanceContext.winRate.toFixed(0)}%` : '';

  const system = `You are GENIUS, an elite AI strategist creating a GOAL-BASED trading plan. The user has set a specific financial target. You must design a realistic, achievable strategy.

RULES:
1. ONLY use assets from the provided market data
2. Be REALISTIC — if the goal is unachievable given the portfolio size, say so
3. Include risk management — NEVER risk more than 20% drawdown on the total goal budget
4. Break the plan into phases if needed
5. Set clear milestones and checkpoints
6. If the goal requires aggressive trading, warn the user
7. Include a circuit breaker: auto-stop if losses exceed 20% of predictions

You MUST respond with ONLY a valid JSON object:
{
  "feasible": boolean,
  "plan": {
    "summary": "1-2 sentence strategy overview",
    "estimatedTimeHours": number,
    "riskLevel": "low"|"moderate"|"high"|"extreme",
    "phases": [
      {
        "name": "string",
        "durationMinutes": number,
        "targetPnl": number,
        "assetFocus": ["ticker1", "ticker2"],
        "approach": "string"
      }
    ],
    "circuitBreaker": {
      "maxLossPercent": 20,
      "maxConsecutiveLosses": number,
      "pauseDurationMinutes": number
    }
  },
  "initialTrades": [
    { "ticker": "string", "action": "BUY"|"SELL", "qty": number, "reason": "string", "entryPrice": number, "targetPrice": number, "stopLoss": number, "holdMinutes": number, "confidence": number }
  ],
  "warning": "string or null"
}`;

  const user = `USER GOAL: ${goal?.description || 'Make money'}
Goal type: ${goal?.type || 'total_target'}
Target amount: $${goal?.amount || 0}
Timeframe: ${goal?.timeframeHours || 24} hours

PORTFOLIO:
${portfolio ? buildPortfolioSummary(portfolio) : 'Not available'}
Risk tolerance: ${riskTolerance}/10
${perfBlock}${sentimentBlock}

LIVE MARKET DATA:
${buildAssetSummary(assets)}

Design a realistic plan to achieve this goal. Be specific with assets, quantities, and timing.`;

  return { system, user };
}

// ─── Groq-only transport (founder directive: Genius runs on Groq, nothing else).
// Chain mirrors Startup Factory Hub: Llama first, Groq's GPT-OSS models as the
// safety net, Llama 3.1 8B last. A model-level failure advances the chain;
// only an auth failure (401) stops it.
const GROQ_MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.1-8b-instant"];

async function groqComplete(key: string, messages: unknown, temperature: number): Promise<Response> {
  let last: Response | null = null;
  for (const model of GROQ_MODELS) {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature }),
    });
    if (r.ok) return r;
    const errText = await r.text().catch(() => "");
    console.error(`groq ${r.status} on ${model}: ${errText.slice(0, 200)}`);
    last = new Response(errText, { status: r.status, headers: r.headers });
    if (r.status === 401) break;
  }
  return last!;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const body: GeniusRequest = await req.json();
    const mode = body.mode || 'strategy';

    // ─── CHAT MODE ───
    if (mode === 'chat') {
      const { system, messages } = buildChatPrompt(body);
      const response = await groqComplete(GROQ_API_KEY, [{ role: "system", content: system }, ...messages], 0.4);

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited — please wait" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiResult = await response.json();
      const content = aiResult.choices?.[0]?.message?.content || "";

      // Extract trade blocks if any
      const tradeMatch = content.match(/```trade\s*([\s\S]*?)```/);
      let suggestedTrade = null;
      if (tradeMatch) {
        try { suggestedTrade = JSON.parse(tradeMatch[1].trim()); } catch { /* ignore */ }
      }

      return new Response(JSON.stringify({ success: true, mode: 'chat', reply: content, suggestedTrade, timestamp: Date.now() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── GOAL MODE ───
    if (mode === 'goal') {
      const { system, user } = buildGoalPrompt(body);
      const response = await groqComplete(GROQ_API_KEY, [{ role: "system", content: system }, { role: "user", content: user }], 0.3);

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiResult = await response.json();
      const content = aiResult.choices?.[0]?.message?.content || "";
      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON");
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return new Response(JSON.stringify({ error: "AI returned invalid format", raw: content }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Validate tickers
      const validTickers = new Set((body.assets || []).map(a => a.ticker));
      if (parsed.initialTrades) {
        parsed.initialTrades = parsed.initialTrades.filter((t: any) => validTickers.has(t.ticker));
      }

      return new Response(JSON.stringify({ success: true, mode: 'goal', plan: parsed, timestamp: Date.now() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── STRATEGY MODE (default) ───
    const { assets = [] } = body;
    if (!assets || assets.length === 0) {
      return new Response(JSON.stringify({ error: "No market data" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { system, user } = buildStrategyPrompt(body);
    const response = await groqComplete(GROQ_API_KEY, [{ role: "system", content: system }, { role: "user", content: user }], 0.3);

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return new Response(JSON.stringify({ error: "AI returned invalid format", raw: content }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const validTickers = new Set(assets.map(a => a.ticker));
    if (parsed.trades) parsed.trades = parsed.trades.filter((t: any) => validTickers.has(t.ticker));

    return new Response(JSON.stringify({ success: true, mode: 'strategy', analysis: parsed, timestamp: Date.now() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("genius-strategy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
