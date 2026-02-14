interface Props {
  rows?: number;
  height?: string;
}

const SkeletonWidget = ({ rows = 4, height = 'h-12' }: Props) => (
  <div className="space-y-3">
    <div className="h-5 w-40 rounded bg-gold/5 skeleton-shimmer" />
    {[...Array(rows)].map((_, i) => (
      <div
        key={i}
        className={`${height} rounded bg-navy-light/30 skeleton-shimmer`}
        style={{ animationDelay: `${i * 0.1}s` }}
      />
    ))}
  </div>
);

export default SkeletonWidget;
