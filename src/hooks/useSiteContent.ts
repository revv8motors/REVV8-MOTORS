import { useQuery } from "@tanstack/react-query";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const DEFAULT_CONTENT: Record<string, any> = {
  hero: {
    title: "The Pinnacle of Automotive Engineering.",
    subtitle: "Experience driving perfection. We curate only the most exceptional luxury vehicles for our discerning clientele.",
    cta: "Explore Our Collection"
  },
  about: {
    title: "A Legacy of Automotive Excellence",
    body: "For over two decades, REVV8 Motors has been the premier destination for luxury automotive enthusiasts. Our meticulously curated inventory represents the pinnacle of engineering, performance, and design.",
    stats: [
      { label: "Vehicles Sold", value: "2,500+" },
      { label: "Years Experience", value: "20+" },
      { label: "Service Awards", value: "15" },
      { label: "Happy Clients", value: "100%" }
    ]
  },
  contact: {
    email: "contact@revv8motors.com",
    phone: "+1 (555) 019-8888",
    whatsapp: "15550198888",
    address: "100 Luxury Avenue, Beverly Hills, CA 90210",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3304.76442654394!2d-118.4064789233674!3d34.0755106731481!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2bc04d3d147ab%3A0x8ac7c460d3d528b1!2sRodeo%20Dr%2C%20Beverly%20Hills%2C%20CA%2090210!5e0!3m2!1sen!2sus!4v1689123456789!5m2!1sen!2sus"
  },
  testimonials: [],
  footer: {
    tagline: "Curated luxury. Uncompromised performance.",
    links: [
      { label: "Home", href: "/" },
      { label: "Inventory", href: "/cars" },
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" }
    ]
  }
};

export function useSiteContent<T = unknown>(key: string) {
  return useQuery({
    queryKey: ["site_content", key],
    queryFn: async () => {
      try {
        const docRef = doc(db, "site_content", key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return (docSnap.data().value ?? DEFAULT_CONTENT[key] ?? null) as T;
        }
        return (DEFAULT_CONTENT[key] ?? null) as T;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `site_content/${key}`);
        return (DEFAULT_CONTENT[key] ?? null) as T;
      }
    },
  });
}

