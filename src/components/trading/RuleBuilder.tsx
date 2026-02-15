import { useState, useCallback } from 'react';
import { Plus, Trash2, Play, Save, Pause, AlertTriangle, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ConditionType = 'price_above' | 'price_below' | 'rsi_above' | 'rsi_below' | 'sma_cross_up' | 'sma_cross_down';
type ActionType = 'buy' | 'sell' | 'set_stop' | 'alert';
type Broker = 'alpaca' | 'coinbase' | 'ibkr';

interface Condition {
  id: string;
  type: ConditionType;
  value: string;
}

interface Action {
  id: string;
  type: ActionType;
  value: string;
  broker: Broker;
}

interface Rule {
  id: string;
  name: string;
  conditions: Condition[];
  actions: Action[];
  active: boolean;
  dryRun: boolean;
}

const CONDITION_LABELS: Record<ConditionType, string> = {
  price_above: 'Price Above',
  price_below: 'Price Below',
  rsi_above: 'RSI Above',
  rsi_below: 'RSI Below',
  sma_cross_up: 'SMA Cross Up',
  sma_cross_down: 'SMA Cross Down',
};

const ACTION_LABELS: Record<ActionType, string> = {
  buy: 'BUY',
  sell: 'SELL',
  set_stop: 'Set Stop Loss',
  alert: 'Send Alert',
};

const DEFAULT_RULE: Rule = {
  id: '',
  name: 'New Strategy',
  conditions: [{ id: crypto.randomUUID(), type: 'price_below', value: '80000' }],
  actions: [{ id: crypto.randomUUID(), type: 'buy', value: '0.01', broker: 'coinbase' }],
  active: false,
  dryRun: true,
};

const RuleBuilder = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [editing, setEditing] = useState<Rule | null>(null);

  const startNew = () => {
    setEditing({ ...DEFAULT_RULE, id: crypto.randomUUID(), conditions: [{ ...DEFAULT_RULE.conditions[0], id: crypto.randomUUID() }], actions: [{ ...DEFAULT_RULE.actions[0], id: crypto.randomUUID() }] });
  };

  const saveRule = () => {
    if (!editing) return;
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === editing.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = editing; return copy; }
      return [...prev, editing];
    });
    setEditing(null);
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const toggleActive = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const addCondition = () => {
    if (!editing) return;
    setEditing({ ...editing, conditions: [...editing.conditions, { id: crypto.randomUUID(), type: 'price_above', value: '' }] });
  };

  const addAction = () => {
    if (!editing) return;
    setEditing({ ...editing, actions: [...editing.actions, { id: crypto.randomUUID(), type: 'buy', value: '', broker: 'alpaca' }] });
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    if (!editing) return;
    setEditing({ ...editing, conditions: editing.conditions.map(c => c.id === id ? { ...c, ...updates } : c) });
  };

  const updateAction = (id: string, updates: Partial<Action>) => {
    if (!editing) return;
    setEditing({ ...editing, actions: editing.actions.map(a => a.id === id ? { ...a, ...updates } : a) });
  };

  const removeCondition = (id: string) => {
    if (!editing) return;
    setEditing({ ...editing, conditions: editing.conditions.filter(c => c.id !== id) });
  };

  const removeAction = (id: string) => {
    if (!editing) return;
    setEditing({ ...editing, actions: editing.actions.filter(a => a.id !== id) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-gold" />
          <span className="font-display text-sm tracking-wider text-gold-light">VISUAL RULE BUILDER</span>
        </div>
        {!editing && (
          <Button onClick={startNew} className="bg-gold/20 text-gold border border-gold/30 font-display text-[10px] tracking-wider hover:bg-gold/30 h-7 px-3">
            <Plus className="w-3 h-3 mr-1" /> NEW RULE
          </Button>
        )}
      </div>

      {/* Editor */}
      {editing && (
        <div className="bg-navy-light/30 rounded-lg p-3 border border-gold/20 space-y-3">
          <Input
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="bg-navy-light border-gold/15 text-marble font-display text-xs h-8"
            placeholder="Strategy name"
          />

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-display tracking-wider text-emerald-400/60">IF CONDITIONS</span>
              <button onClick={addCondition} className="text-[8px] text-gold/50 hover:text-gold flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> ADD
              </button>
            </div>
            <div className="space-y-1.5">
              {editing.conditions.map((cond) => (
                <div key={cond.id} className="flex items-center gap-1.5 bg-navy-dark/50 rounded p-1.5">
                  <span className="text-[9px] font-mono text-emerald-400 flex-shrink-0">IF</span>
                  <select
                    value={cond.type}
                    onChange={(e) => updateCondition(cond.id, { type: e.target.value as ConditionType })}
                    className="bg-navy-light border border-gold/10 text-marble text-[10px] rounded px-1.5 py-1 font-mono flex-1"
                  >
                    {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <Input
                    value={cond.value}
                    onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                    className="bg-navy-light border-gold/10 text-marble font-mono text-[10px] h-7 w-24"
                    placeholder="value"
                  />
                  <button onClick={() => removeCondition(cond.id)} className="text-red-400/40 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-display tracking-wider text-gold/60">THEN ACTIONS</span>
              <button onClick={addAction} className="text-[8px] text-gold/50 hover:text-gold flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> ADD
              </button>
            </div>
            <div className="space-y-1.5">
              {editing.actions.map((action) => (
                <div key={action.id} className="flex items-center gap-1.5 bg-navy-dark/50 rounded p-1.5">
                  <span className="text-[9px] font-mono text-gold flex-shrink-0">THEN</span>
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(action.id, { type: e.target.value as ActionType })}
                    className="bg-navy-light border border-gold/10 text-marble text-[10px] rounded px-1.5 py-1 font-mono"
                  >
                    {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <Input
                    value={action.value}
                    onChange={(e) => updateAction(action.id, { value: e.target.value })}
                    className="bg-navy-light border-gold/10 text-marble font-mono text-[10px] h-7 w-20"
                    placeholder="qty"
                  />
                  <select
                    value={action.broker}
                    onChange={(e) => updateAction(action.id, { broker: e.target.value as Broker })}
                    className="bg-navy-light border border-gold/10 text-marble text-[10px] rounded px-1.5 py-1 font-mono"
                  >
                    <option value="alpaca">Alpaca</option>
                    <option value="coinbase">Coinbase</option>
                    <option value="ibkr">IBKR</option>
                  </select>
                  <button onClick={() => removeAction(action.id)} className="text-red-400/40 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dry run toggle + save */}
          <div className="flex items-center justify-between pt-2 border-t border-gold/10">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.dryRun}
                onChange={(e) => setEditing({ ...editing, dryRun: e.target.checked })}
                className="rounded border-gold/30"
              />
              <span className="text-[9px] text-marble/40 font-display tracking-wider">DRY RUN (paper test)</span>
              {editing.dryRun && <AlertTriangle className="w-3 h-3 text-amber-400/50" />}
            </label>
            <div className="flex gap-1.5">
              <Button onClick={() => setEditing(null)} variant="ghost" className="text-[10px] text-marble/30 h-7 px-3">
                CANCEL
              </Button>
              <Button onClick={saveRule} className="bg-gold/20 text-gold border border-gold/30 font-display text-[10px] tracking-wider hover:bg-gold/30 h-7 px-3">
                <Save className="w-3 h-3 mr-1" /> SAVE RULE
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Saved rules list */}
      {rules.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[8px] font-display tracking-wider text-marble/25">SAVED RULES</span>
          {rules.map(rule => (
            <div key={rule.id} className={`flex items-center justify-between p-2 rounded border ${rule.active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-navy-light/20 border-gold/5'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-marble/60 truncate">{rule.name}</span>
                  {rule.dryRun && <span className="text-[7px] bg-amber-500/20 text-amber-400 px-1 rounded">DRY</span>}
                  {rule.active && <span className="text-[7px] bg-emerald-500/20 text-emerald-400 px-1 rounded">LIVE</span>}
                </div>
                <div className="text-[8px] text-marble/25 font-mono mt-0.5">
                  {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''} → {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleActive(rule.id)} className={`p-1 rounded ${rule.active ? 'text-emerald-400' : 'text-marble/25 hover:text-marble/50'}`}>
                  {rule.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setEditing(rule)} className="p-1 text-marble/25 hover:text-gold">
                  <Bot className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteRule(rule.id)} className="p-1 text-marble/25 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rules.length === 0 && !editing && (
        <div className="text-center py-6 text-marble/20 text-[10px] font-display tracking-wider">
          NO RULES CONFIGURED · CLICK NEW RULE TO START
        </div>
      )}
    </div>
  );
};

export default RuleBuilder;
