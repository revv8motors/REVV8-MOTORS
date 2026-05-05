import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useCar, useCars } from "@/hooks/useCars";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CarCard } from "@/components/site/CarCard";
import { ArrowLeft, Calendar, Fuel, Gauge, Settings2, ShieldCheck, Phone, CheckCircle2, Award, Star } from "lucide-react";
import { ContactDealerForm } from "@/components/site/ContactDealerForm";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { computeDisplayPrice, trackCarView } from "@/services/backendService";

export default function CarDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: car, isLoading } = useCar(id);
  const { data: related } = useCars({ published: true, limit: 4 });
  const { data: contact } = useSiteContent<{ whatsapp: string; phone: string }>("contact");
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (car?.id) trackCarView(car.id);
  }, [car?.id]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  useEffect(() => {
    if (car) document.title = car.metaTitle || `${car.brand} ${car.model} — REVV8 Motors`;
  }, [car]);

  if (isLoading) return <div className="pt-40 container text-center text-muted-foreground">Loading…</div>;
  if (!car) return (
    <div className="pt-40 container text-center">
      <p className="text-muted-foreground mb-4">Car not found.</p>
      <Button variant="outlineLuxury" onClick={() => nav("/cars")}>Back to inventory</Button>
    </div>
  );

  const images = car.images?.length ? car.images : ["/placeholder.svg"];
  const priceDisplay = computeDisplayPrice(car);
  const waMsg = encodeURIComponent(`Hi, I'm interested in the ${car.year} ${car.brand} ${car.model}.`);
  const waLink = contact?.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${waMsg}` : null;

  const related4 = (related ?? []).filter(r => r.id !== car.id).slice(0, 3);

  return (
    <div className="pt-28 pb-24">
      <div className="container">
        <Button variant="ghost" size="sm" onClick={() => nav(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10">
          {/* Gallery */}
          <div>
            <Carousel setApi={setApi} className={`w-full ${car.isPremium ? 'border border-[#ffd700]/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(255,215,0,0.1)]' : ''}`}>
              <CarouselContent>
                {images.map((src, i) => (
                  <CarouselItem key={i}>
                    <div className="luxury-card overflow-hidden aspect-[16/10] relative">
                      {car.isPremium && <div className="absolute top-4 right-4 z-10 p-2 bg-black/60 backdrop-blur-md border border-[#ffd700]/50 rounded-full"><Star className="h-5 w-5 text-[#ffd700] fill-[#ffd700]" /></div>}
                      <img src={src} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-4 bg-black/50 border-white/10 hover:bg-black/80 text-white" />
                  <CarouselNext className="right-4 bg-black/50 border-white/10 hover:bg-black/80 text-white" />
                </>
              )}
            </Carousel>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {images.map((src, i) => (
                  <button key={i} onClick={() => api?.scrollTo(i)}
                    className={`aspect-square rounded-md overflow-hidden border transition-all ${i === current ? "border-white/60" : "border-white/10 opacity-60 hover:opacity-100"}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {car.status && ['SOLD', 'RESERVED', 'COMING_SOON'].includes(car.status) && (
                <Badge className={`border-0 font-display tracking-widest text-[10px] hover:opacity-90 ${
                  car.status === 'SOLD' ? 'bg-red-600 text-white' :
                  car.status === 'RESERVED' ? 'bg-orange-500 text-white' :
                  car.status === 'COMING_SOON' ? 'bg-blue-600 text-white' :
                  'bg-zinc-700 text-white'
                }`}>
                  {car.status.replace('_', ' ')}
                </Badge>
              )}
              {car.featured && <Badge className="bg-white text-black border-0 font-display tracking-widest text-[10px] hover:bg-white">FEATURED</Badge>}
              {car.priceBadge === 'HOT_DEAL' && <Badge className="bg-red-500/20 text-red-500 border border-red-500/30 font-display tracking-widest text-[10px] hover:bg-red-500/20">HOT DEAL</Badge>}
              {car.priceBadge === 'LIMITED_OFFER' && <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 font-display tracking-widest text-[10px] hover:bg-green-500/20">LIMITED OFFER</Badge>}
            </div>
            <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-2 flex items-center gap-2">
              {car.brand} {car.isPremium && <span className="text-[#ffd700] flex items-center"><Award className="h-3 w-3 mr-1"/> PREMIUM</span>}
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-metal mb-4">
              {car.title || `${car.brand} ${car.model}`}
            </h1>
            
            <div className="mb-6">
              {priceDisplay.text ? (
                <div className="text-3xl font-display font-bold text-metal">{priceDisplay.text}</div>
              ) : (
                <div className="flex items-baseline gap-3">
                  <div className="text-3xl font-display font-bold">₹{priceDisplay.value?.toLocaleString("en-IN")}</div>
                  {priceDisplay.hasDiscount && (
                    <div className="text-lg text-muted-foreground line-through decoration-red-500/50">₹{priceDisplay.originalValue?.toLocaleString("en-IN")}</div>
                  )}
                </div>
              )}
              {car.isOnOffer && car.offerText && <div className="text-sm text-green-400 mt-2 bg-green-500/10 inline-block px-3 py-1 rounded-md border border-green-500/20">{car.offerText}</div>}
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {car.isCertified && <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10"><CheckCircle2 className="h-3 w-3 mr-1" /> Certified Pre-Owned</Badge>}
              {car.warrantyAvailable && <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10"><ShieldCheck className="h-3 w-3 mr-1" /> Warranty Included</Badge>}
              {car.inspectionPassed && <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/10"><Settings2 className="h-3 w-3 mr-1" /> 150-Pt Inspection</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <Spec icon={Calendar} label="Year" value={String(car.year)} />
              <Spec icon={Gauge} label="Mileage" value={`${car.mileage.toLocaleString()} mi`} />
              <Spec icon={Fuel} label="Fuel" value={car.fuel} />
              <Spec icon={Settings2} label="Transmission" value={car.transmission} />
              {car.engine && <Spec icon={ShieldCheck} label="Engine" value={car.engine} />}
              {car.ownership && <Spec icon={ShieldCheck} label="Ownership" value={car.ownership} />}
            </div>

            {car.description && (
              <div className="mb-8">
                <h3 className="font-display tracking-[0.2em] text-sm mb-3 text-muted-foreground">DESCRIPTION</h3>
                <p className="text-foreground/90 leading-relaxed">{car.description}</p>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="luxury" 
                    size="lg"
                    className="w-full md:flex-1 h-12 md:h-14 text-[11px] font-display tracking-[0.2em] uppercase transition-all duration-300 hover:scale-[1.01] active:scale-95 flex items-center justify-center"
                  >
                    <Phone className="h-4 w-4 mr-2 shrink-0 mb-0.5" />
                    Contact Dealer
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface border-white/10">
                  <DialogHeader><DialogTitle className="font-display tracking-wider">Contact about {car.brand} {car.model}</DialogTitle></DialogHeader>
                  <ContactDealerForm carId={car.id} defaultMessage={`I'm interested in the ${car.year} ${car.brand} ${car.model}.`} />
                </DialogContent>
              </Dialog>
              {waLink && (
                <Button 
                  asChild 
                  variant="whatsapp" 
                  size="lg"
                  className="w-full md:flex-1 h-12 md:h-14 text-[11px] font-display tracking-[0.2em] uppercase transition-all duration-300 hover:scale-[1.01] active:scale-95 flex items-center justify-center"
                >
                  <a href={waLink} target="_blank" rel="noreferrer">
                    <WhatsAppIcon className="h-5 w-5 mr-2 shrink-0 text-white" />
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Related */}
        {related4.length > 0 && (
          <div className="mt-24">
            <h2 className="font-display font-bold text-3xl text-metal mb-8">More from the collection</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {related4.map(c => <CarCard key={c.id} car={c} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Spec({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="luxury-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground tracking-wider"><Icon className="h-3.5 w-3.5" />{label.toUpperCase()}</div>
      <div className="font-display mt-1">{value}</div>
    </div>
  );
}
