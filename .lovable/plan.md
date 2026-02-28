

# Add AI-Powered Trading Intelligence to the Bot

## What Changes

The bot currently uses a pure math-based signal engine (30+ indicators). We'll add an **AI layer** that analyzes market context before every trade decision, making the bot dramatically smarter. The AI will:

- Analyze the full indicator breakdown + price action pattern before each entry
- Provide a confidence score and reasoning for each trade
- Detect market regimes (crash, rally, choppy) that pure indicators miss
- Filter out bad trades that look good on paper but have weak context

## Architecture

```text
Current:  Indicators → Composite Score → Entry/Exit
New:      Indicators → Composite Score → AI Analysis → Entry/Exit
                                            ↑
                                    Edge Function (Gemini Flash)
                                            ↑
                                    Price history + signal breakdown
```

## Implementation Steps

### 1. Create Edge Function: `supabase/functions/bot-ai-analysis/index.ts`
- Accepts: symbol, signal breakdown, recent price action (last 20 closes), current price, ATR, RSI, MACD values, market regime (trending/ranging), strategy preset
- Calls Lovable AI Gateway with `google/gemini-3-flash-preview` (fast, cheap)
- System prompt: expert quant trader analyzing whether to enter a trade
- Uses tool calling to extract structured output: `{ confidence: 0-100, action: "ENTER"|"SKIP", reasoning: string, riskLevel: "low"|"medium"|"high" }`
- Returns the structured analysis
- Handles 429/402 errors gracefully — bot falls back to indicator-only mode if AI is unavailable

### 2. Update `src/hooks/useTradingBot.ts` — Add AI gate before execution
- After composite signal passes entry threshold, call the edge function with the signal context
- If AI returns `confidence >= 60` and `action === "ENTER"` → proceed with trade
- If AI returns `"SKIP"` → log the decision with AI reasoning but don't trade
- If AI call fails (network, rate limit) → fall back to indicator-only mode (current behavior)
- Add AI reasoning to `BotDecision.reason` field so it shows in the activity log
- Add `aiConfidence` and `aiReasoning` fields to `BotDecision` interface
- Non-blocking: AI analysis runs with a 5-second timeout; if slow, skip AI and use indicators only

### 3. Update `src/components/trading/BotControlPanel.tsx` — Show AI insights
- In the activity log entries, display the AI reasoning and confidence badge
- Add a small "🧠 AI" badge next to trades that were AI-validated
- Show AI confidence as a colored badge (green 80+, yellow 60-79, red <60)

### 4. Update `supabase/config.toml` — Register the new function
- Add `[functions.bot-ai-analysis]` with `verify_jwt = false`

## Files to Create/Modify

| File | Action |
|---|---|
| `supabase/functions/bot-ai-analysis/index.ts` | **Create** — AI analysis edge function |
| `src/hooks/useTradingBot.ts` | **Modify** — Add async AI gate before trade execution |
| `src/components/trading/BotControlPanel.tsx` | **Modify** — Show AI reasoning + confidence in UI |

## AI Prompt Design (Edge Function)

The system prompt will be a concise quant analyst persona that receives structured market data and returns a go/no-go decision. Key instructions:
- Analyze trend alignment across timeframes
- Check for exhaustion signals (RSI divergence, volume decline)
- Consider risk-reward ratio quality
- Flag potential false breakouts or traps
- Be conservative — when in doubt, SKIP

## Fallback Strategy

If AI is unavailable (rate limited, network error, timeout), the bot operates exactly as it does now — pure indicator-based decisions. AI is an enhancement layer, not a dependency.

