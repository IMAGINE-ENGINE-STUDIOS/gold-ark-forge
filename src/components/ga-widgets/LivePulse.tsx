interface Props {
  connected?: boolean;
  label?: string;
}

const LivePulse = ({ connected = true, label }: Props) => (
  <div className="flex items-center gap-1.5">
    <span className="relative flex h-2.5 w-2.5">
      {connected && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
    </span>
    {label && (
      <span className={`text-[10px] font-mono tracking-wider ${connected ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
        {label}
      </span>
    )}
  </div>
);

export default LivePulse;
