import { Link } from "react-router-dom";
import { Car } from "@/types/car";
import { Badge } from "@/components/ui/badge";
import { Fuel, Gauge, Settings2, Star } from "lucide-react";
import { computeDisplayPrice } from "@/services/backendService";

export function CarCard({ car }: { car: Car }) {
  const cover = car.images?.[0] || "/placeholder.svg";
  const priceDisplay = computeDisplayPrice(car);

  return (
    <Link to={`/cars/${car.id}`} className={`luxury-card group block relative ${car.isPremium ? 'border-[#ffd700]/20 shadow-[0_4px_20px_rgba(255,215,0,0.05)]' : ''}`}>
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        <img
          src={cover}
          alt={`${car.brand} ${car.model} ${car.year}`}
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
          {car.status && ['SOLD', 'RESERVED', 'COMING_SOON'].includes(car.status) && (
            <Badge className={`border-0 font-display tracking-widest text-[10px] shadow-lg ${
              car.status === 'SOLD' ? 'bg-red-600 text-white hover:bg-red-600' :
              car.status === 'RESERVED' ? 'bg-orange-500 text-white hover:bg-orange-500' :
              car.status === 'COMING_SOON' ? 'bg-blue-600 text-white hover:bg-blue-600' :
              'bg-zinc-700 text-white hover:bg-zinc-700'
            }`}>
              {car.status.replace('_', ' ')}
            </Badge>
          )}
          {car.featured && (
            <Badge className="bg-white text-black border-0 font-display tracking-widest text-[10px] shadow-lg hover:bg-white">
              FEATURED
            </Badge>
          )}
          {car.priceBadge === 'HOT_DEAL' && <Badge className="bg-red-500 text-white border-0 font-display tracking-widest text-[10px] shadow-lg hover:bg-red-500">HOT DEAL</Badge>}
          {car.priceBadge === 'LIMITED_OFFER' && <Badge className="bg-green-600 text-white border-0 font-display tracking-widest text-[10px] shadow-lg hover:bg-green-600">LIMITED OFFER</Badge>}
        </div>
        {car.isPremium && (
          <div className="absolute top-3 right-3 p-1.5 bg-black/60 backdrop-blur-sm rounded-full border border-[#ffd700]/30 shadow-lg">
            <Star className="h-4 w-4 text-[#ffd700] fill-[#ffd700]" />
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="text-xs font-display tracking-[0.3em] text-muted-foreground mb-1 flex items-center justify-between">
            {car.brand} {car.isPremium && <span className="text-[#ffd700]">PREMIUM</span>}
        </div>
        <div className="flex items-start justify-between gap-3 mt-1">
          <h3 className="font-display font-bold text-lg text-foreground group-hover:text-metal transition-colors line-clamp-1">
            {car.title || car.model}
          </h3>
          <div className="flex flex-col items-end">
            {priceDisplay.text ? (
              <span className="text-lg font-display font-bold text-metal">{priceDisplay.text}</span>
            ) : (
              <>
                <span className="text-xl font-display font-bold text-foreground whitespace-nowrap">
                  ₹{priceDisplay.value?.toLocaleString("en-IN")}
                </span>
                {priceDisplay.hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                    ₹{priceDisplay.originalValue?.toLocaleString("en-IN")}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        {car.isOnOffer && car.offerText && <div className="text-[10px] text-green-400 mt-2 bg-green-500/10 inline-block px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-widest">{car.offerText}</div>}
        <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] sm:text-xs text-muted-foreground border-t hairline pt-4">
          <div className="flex items-center gap-1 sm:gap-1.5 truncate"><Gauge className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0" /><span className="truncate">{car.year}</span></div>
          <div className="flex items-center gap-1 sm:gap-1.5 truncate"><Fuel className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0" /><span className="truncate">{car.fuel}</span></div>
          <div className="flex items-center gap-1 sm:gap-1.5 truncate"><Settings2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0" /><span className="truncate">{car.transmission}</span></div>
        </div>
      </div>
    </Link>
  );
}
