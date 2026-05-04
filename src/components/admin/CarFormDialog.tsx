import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db, storage, handleFirestoreError, OperationType } from "@/lib/firebase";
import { doc, collection, addDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Car, CATEGORIES, FUEL_TYPES, TRANSMISSIONS, STATUSES, PRICE_BADGES } from "@/types/car";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { logActivity, parsePriceToNumber } from "@/services/backendService";

// ... you'll need the rest of the imports that were already here

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(120),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 2),
  price: z.string().min(1, "Required"),
  discountedPrice: z.string().optional().nullable(),
  offerText: z.string().trim().optional().nullable(),
  mileage: z.coerce.number().int().min(0),
  fuel: z.string(),
  transmission: z.string(),
  category: z.string(),
  engine: z.string().trim().max(120).optional().or(z.literal("")),
  ownership: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  metaTitle: z.string().trim().max(150).optional().nullable(),
  metaDescription: z.string().trim().max(300).optional().nullable(),
  slug: z.string().trim().optional().nullable(),
  publishAt: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
});

type Values = z.infer<typeof schema>;

export function CarFormDialog({ open, onOpenChange, car, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; car: Car | null; onSaved: () => void;
}) {
  const [images, setImages] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [isOnOffer, setIsOnOffer] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [warrantyAvailable, setWarrantyAvailable] = useState(false);
  const [inspectionPassed, setInspectionPassed] = useState(false);
  const [priceBadge, setPriceBadge] = useState<string>("NONE");
  const [status, setStatus] = useState<string>("AVAILABLE");
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fuel: "Petrol", transmission: "Automatic", category: "Sedan" },
  });

  useEffect(() => {
    if (open) {
      if (car) {
        reset({
          title: car.title || "",
          brand: car.brand,
          model: car.model,
          year: car.year,
          price: String(car.price ?? ""),
          discountedPrice: car.discountedPrice !== null && car.discountedPrice !== undefined ? String(car.discountedPrice) : "",
          offerText: car.offerText ?? "",
          mileage: car.mileage,
          fuel: car.fuel,
          transmission: car.transmission,
          category: car.category,
          engine: car.engine ?? "",
          ownership: car.ownership ?? "",
          description: car.description ?? "",
          metaTitle: car.metaTitle ?? "",
          metaDescription: car.metaDescription ?? "",
          slug: car.slug ?? "",
          publishAt: car.publishAt ?? "",
          expiryDate: car.expiryDate ?? "",
        });
        setImages(car.images ?? []);
        setFeatured(car.featured);
        setPublished(car.published);
        setShowPrice(car.showPrice ?? true);
        setIsOnOffer(car.isOnOffer ?? false);
        setIsCertified(car.isCertified ?? false);
        setIsPremium(car.isPremium ?? false);
        setWarrantyAvailable(car.warrantyAvailable ?? false);
        setInspectionPassed(car.inspectionPassed ?? false);
        setPriceBadge(car.priceBadge ?? "NONE");
        setStatus(car.status ?? "AVAILABLE");
      } else {
        reset({
          title: "",
          brand: "",
          model: "",
          fuel: "Petrol",
          transmission: "Automatic",
          category: "Sedan",
          year: new Date().getFullYear(),
          price: "",
          discountedPrice: "",
          mileage: 0,
        } as any);
        setImages([]);
        setFeatured(false);
        setPublished(true);
        setShowPrice(true);
        setIsOnOffer(false);
        setIsCertified(false);
        setIsPremium(false);
        setWarrantyAvailable(false);
        setInspectionPassed(false);
        setPriceBadge("NONE");
        setStatus("AVAILABLE");
      }
    }
  }, [open, car, reset]);

  const onInvalid = (errors: any) => {
    // Avoid logging the entire errors object because it contains circular references (refs to HTML elements)
    const errorMessages = Object.entries(errors).map(([key, err]: [string, any]) => `${key}: ${err?.message}`);
    console.error("Form Validation Errors:", errorMessages);
    
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    } else {
      toast.error("Please fill all required fields correctly");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    if (!files.length) return;
    
    // Validate files
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isSmallEnough = file.size <= 3 * 1024 * 1024; // 3MB limit before resizing
      
      if (!isImage) toast.error(`File "${file.name}" is not an image.`);
      if (!isSmallEnough) toast.error(`File "${file.name}" is too large (max 3MB).`);
      
      return isImage && isSmallEnough;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    
    const uploaded: string[] = [];
    let processedCount = 0;
    
    for (const file of validFiles) {
      try {
        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              let width = img.width;
              let height = img.height;
              const MAX_SIZE = 1200;
              
              if (width > height) {
                if (width > MAX_SIZE) {
                  height *= MAX_SIZE / width;
                  width = MAX_SIZE;
                }
              } else {
                if (height > MAX_SIZE) {
                  width *= MAX_SIZE / height;
                  height = MAX_SIZE;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (!ctx) return reject(new Error("Canvas context creation failed"));
              ctx.drawImage(img, 0, 0, width, height);
              
              canvas.toBlob(async (blob) => {
                if (!blob) return reject(new Error("Blob creation failed"));
                try {
                  const storageRef = ref(storage, `cars/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`);
                  await uploadBytes(storageRef, blob);
                  const downloadUrl = await getDownloadURL(storageRef);
                  resolve(downloadUrl);
                } catch (err) {
                  reject(err);
                }
              }, "image/webp", 0.85);
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
            img.src = e.target?.result as string;
          };
          reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
          reader.readAsDataURL(file);
        });
        
        uploaded.push(url);
        processedCount++;
        setUploadProgress(Math.round((processedCount / validFiles.length) * 100));
      } catch (err) {
        console.error("Image processing error:", err);
        toast.error(err instanceof Error ? err.message : `Failed to process ${file.name}`);
      }
    }
    
    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
    setUploadProgress(0);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    await processFiles(files);
    e.target.value = "";
  };

  const onSubmit = async (v: Values) => {
    const numericShowPrice = parsePriceToNumber(v.price);
    const numericDiscounted = v.discountedPrice ? parsePriceToNumber(v.discountedPrice) : null;

    if (numericDiscounted !== null && numericDiscounted >= numericShowPrice && numericShowPrice > 0) {
      toast.error("Discounted price must be less than original price");
      return;
    }
    setSaving(true);
    const payload = {
      title: v.title, brand: v.brand, model: v.model, year: v.year, price: v.price, showPrice,
      discountedPrice: v.discountedPrice || null, isOnOffer, offerText: v.offerText || null, priceBadge,
      isCertified, isPremium, warrantyAvailable, inspectionPassed,
      metaTitle: v.metaTitle || null, metaDescription: v.metaDescription || null,
      slug: v.slug || v.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      status, publishAt: v.publishAt || null, expiryDate: v.expiryDate || null,
      mileage: v.mileage, fuel: v.fuel, transmission: v.transmission, category: v.category,
      engine: v.engine || null, ownership: v.ownership || null, description: v.description || null,
      images, featured, published,
      updated_at: new Date().toISOString(),
      ...(car ? {} : { archived: false, created_at: new Date().toISOString() })
    };
    try {
      if (car) {
        await updateDoc(doc(db, "cars", car.id), payload);
        await logActivity("admin", "UPDATE_CAR", "cars", car.id, { changedFields: Object.keys(payload) });
      } else {
        const docRef = await addDoc(collection(db, "cars"), payload);
        await logActivity("admin", "CREATE_CAR", "cars", docRef.id, { payload });
      }
      toast.success(car ? "Car updated" : "Car added");
      onOpenChange(false);
      onSaved();
    } catch (e: unknown) {
      handleFirestoreError(e, car ? OperationType.UPDATE : OperationType.CREATE, car ? `cars/${car.id}` : "cars");
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const fuel = watch("fuel"); const trans = watch("transmission"); const cat = watch("category");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-surface border-white/10 p-0">
        <DialogHeader className="px-6 pt-6"><DialogTitle className="font-display tracking-wider">{car ? "Edit Car" : "Add New Car"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-6 pt-2">
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6 bg-surface-2 border-white/5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="trust">Trust</TabsTrigger>
              <TabsTrigger value="automation">Status & SEO</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Field label="Title" error={errors.title?.message}><Input {...register("title")} className="bg-surface-2 border-white/10" /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Brand" error={errors.brand?.message}><Input {...register("brand")} className="bg-surface-2 border-white/10" /></Field>
                <Field label="Model" error={errors.model?.message}><Input {...register("model")} className="bg-surface-2 border-white/10" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Year" error={errors.year?.message}><Input type="number" {...register("year")} className="bg-surface-2 border-white/10" /></Field>
                <Field label="Mileage" error={errors.mileage?.message}><Input type="number" {...register("mileage")} className="bg-surface-2 border-white/10" /></Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Fuel"><SelectFld value={fuel} onChange={(v) => setValue("fuel", v)} options={[...FUEL_TYPES]} /></Field>
                <Field label="Transmission"><SelectFld value={trans} onChange={(v) => setValue("transmission", v)} options={[...TRANSMISSIONS]} /></Field>
                <Field label="Category"><SelectFld value={cat} onChange={(v) => setValue("category", v)} options={[...CATEGORIES]} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Engine"><Input {...register("engine")} className="bg-surface-2 border-white/10" placeholder="5.0L V8" /></Field>
                <Field label="Ownership"><Input {...register("ownership")} className="bg-surface-2 border-white/10" placeholder="First" /></Field>
              </div>
              <Field label="Description"><Textarea rows={4} {...register("description")} className="bg-surface-2 border-white/10" /></Field>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price ($)" error={errors.price?.message}><Input {...register("price")} className="bg-surface-2 border-white/10" placeholder="e.g. 45000 or POA" /></Field>
                <Field label="Discounted Price ($)" error={errors.discountedPrice?.message}><Input {...register("discountedPrice")} className="bg-surface-2 border-white/10" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Offer Text" error={errors.offerText?.message}><Input {...register("offerText")} placeholder="e.g. Save 10% this week" className="bg-surface-2 border-white/10" /></Field>
                <Field label="Price Badge"><SelectFld value={priceBadge} onChange={setPriceBadge} options={[...PRICE_BADGES]} /></Field>
              </div>
              <div className="flex gap-6 mt-4 p-4 border hairline bg-surface-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={showPrice} onCheckedChange={setShowPrice} /> Show Price publicly</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={isOnOffer} onCheckedChange={setIsOnOffer} /> Has Active Offer</label>
              </div>
            </TabsContent>

            <TabsContent value="trust" className="space-y-6">
               <div className="grid grid-cols-2 gap-6 p-4 border hairline bg-surface-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={isCertified} onCheckedChange={setIsCertified} /> Is Certified Pre-Owned</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={isPremium} onCheckedChange={setIsPremium} /> Is Premium Collection</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={warrantyAvailable} onCheckedChange={setWarrantyAvailable} /> Warranty Available</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={inspectionPassed} onCheckedChange={setInspectionPassed} /> Inspection Passed</label>
              </div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b hairline pb-6">
                <Field label="Status"><SelectFld value={status} onChange={setStatus} options={[...STATUSES]} /></Field>
                <div />
                <Field label="Publish At (Optional)" error={errors.publishAt?.message}><Input type="datetime-local" {...register("publishAt")} className="bg-surface-2 border-white/10" /></Field>
                <Field label="Expiry Date (Optional)" error={errors.expiryDate?.message}><Input type="datetime-local" {...register("expiryDate")} className="bg-surface-2 border-white/10" /></Field>
              </div>
              <div className="space-y-4 pt-4">
                <h4 className="font-display text-sm tracking-widest text-muted-foreground">SEO</h4>
                <Field label="Slug (Auto-generated if empty)" error={errors.slug?.message}><Input {...register("slug")} className="bg-surface-2 border-white/10" /></Field>
                <Field label="Meta Title" error={errors.metaTitle?.message}><Input {...register("metaTitle")} className="bg-surface-2 border-white/10" /></Field>
                <Field label="Meta Description" error={errors.metaDescription?.message}><Textarea rows={2} {...register("metaDescription")} className="bg-surface-2 border-white/10" /></Field>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div>
                <Label className="text-xs tracking-widest text-muted-foreground">IMAGES</Label>
                <div className="mt-2 flex gap-2">
                  <Input 
                    id="manual-url"
                    placeholder="Paste image URL..." 
                    className="bg-surface-2 border-white/10"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          setImages([...images, val]);
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outlineLuxury" 
                    onClick={() => {
                      const el = document.getElementById('manual-url') as HTMLInputElement;
                      const val = el?.value.trim();
                      if (val) {
                        setImages([...images, val]);
                        el.value = "";
                      }
                    }}
                  >
                    Add URL
                  </Button>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((url, i) => (
                    <div key={`${url}-${i}`} className="relative aspect-square rounded-md overflow-hidden border hairline group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1">
                        <button 
                          type="button" 
                          onClick={() => setImages(images.filter((_, j) => j !== i))}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transform transition active:scale-90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      {i === 0 && (
                        <div className="absolute bottom-0 inset-x-0 bg-luxury/90 text-[8px] text-black font-bold text-center py-0.5 tracking-tighter">
                          COVER IMAGE
                        </div>
                      )}
                    </div>
                  ))}
                  <label 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      aspect-square rounded-md border border-dashed flex flex-col items-center justify-center text-xs transition-all relative
                      ${isDragging ? 'border-luxury bg-luxury/5 ring-2 ring-luxury/20' : 'hairline border-white/20 text-muted-foreground hover:border-luxury/50 hover:text-foreground cursor-pointer'}
                      ${uploading ? 'pointer-events-none opacity-80' : ''}
                    `}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center p-2 w-full">
                        <div className="w-full bg-surface-2 rounded-full h-1 mb-2 overflow-hidden">
                          <div 
                            className="bg-luxury h-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] animate-pulse">Processing {uploadProgress}%</span>
                      </div>
                    ) : (
                      <>
                        <Upload className={`h-5 w-5 mb-1 transition-transform ${isDragging ? 'scale-110 text-luxury' : ''}`} />
                        <span className="text-center px-2">{isDragging ? "Drop to upload" : "Drop or click to upload"}</span>
                      </>
                    )}
                    <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>
              <div className="flex gap-6 pt-4">
                <label className="flex items-center gap-2 text-sm"><Switch checked={featured} onCheckedChange={setFeatured} />Featured on Home</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={published} onCheckedChange={setPublished} />Published publicly</label>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 mt-4 border-t hairline">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="luxury" disabled={saving || uploading}>{saving ? "Saving…" : car ? "Save changes" : "Add car"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <Label className="text-xs tracking-widest text-muted-foreground">{label.toUpperCase()}</Label>
      <div className="mt-1">{children}</div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function SelectFld({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-surface-2 border-white/10"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}
