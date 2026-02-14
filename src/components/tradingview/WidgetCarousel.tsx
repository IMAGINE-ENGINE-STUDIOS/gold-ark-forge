import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WidgetVariant {
  label: string;
  description?: string;
  render: () => React.ReactNode;
}

interface Props {
  variants: WidgetVariant[];
}

const WidgetCarousel = ({ variants }: Props) => {
  const [active, setActive] = useState(0);

  if (variants.length <= 1) {
    return <>{variants[0]?.render()}</>;
  }

  return (
    <div className="space-y-4">
      {/* Variant Tabs */}
      <div className="flex flex-wrap gap-2">
        {variants.map((v, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-4 py-1.5 rounded-md text-xs font-display tracking-wider transition-all ${
              active === i
                ? 'bg-gold text-navy'
                : 'bg-navy-light/50 text-marble/70 hover:bg-navy-light border border-gold/20'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Description */}
      {variants[active]?.description && (
        <p className="text-marble/50 text-xs italic">{variants[active].description}</p>
      )}

      {/* Widget Display */}
      <div className="relative">
        {variants[active]?.render()}

        {/* Nav Arrows */}
        {variants.length > 1 && (
          <>
            <button
              onClick={() => setActive((active - 1 + variants.length) % variants.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-navy/80 border border-gold/30 rounded-full p-2 text-gold hover:bg-navy-light transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActive((active + 1) % variants.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-navy/80 border border-gold/30 rounded-full p-2 text-gold hover:bg-navy-light transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2">
        {variants.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              active === i ? 'bg-gold w-6' : 'bg-gold/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default WidgetCarousel;
