import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { trackCarLead } from "@/services/backendService";

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(2000),
});

type FormValues = z.infer<typeof schema>;

export function ContactDealerForm({ carId, defaultMessage }: { carId?: string; defaultMessage?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { message: defaultMessage ?? "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, "inquiries"), {
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        message: values.message,
        car_id: carId ?? null,
        created_at: new Date().toISOString(),
        read: false,
        read_at: null,
      });
      if (carId) {
        await trackCarLead(carId);
      }
      toast.success("Message sent. The team will get back to you shortly.");
      reset({ name: "", email: "", phone: "", message: "" });
    } catch (error: unknown) {
      handleFirestoreError(error, OperationType.CREATE, "inquiries");
      toast.error("Could not send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs tracking-widest text-muted-foreground">NAME</Label>
          <Input {...register("name")} className="bg-surface-2 border-white/10 mt-1" />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label className="text-xs tracking-widest text-muted-foreground">EMAIL</Label>
          <Input type="email" {...register("email")} className="bg-surface-2 border-white/10 mt-1" />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
      </div>
      <div>
        <Label className="text-xs tracking-widest text-muted-foreground">PHONE</Label>
        <Input {...register("phone")} className="bg-surface-2 border-white/10 mt-1" />
      </div>
      <div>
        <Label className="text-xs tracking-widest text-muted-foreground">MESSAGE</Label>
        <Textarea rows={5} {...register("message")} className="bg-surface-2 border-white/10 mt-1" />
        {errors.message && <p className="text-xs text-destructive mt-1">{errors.message.message}</p>}
      </div>
      <Button type="submit" variant="luxury" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
