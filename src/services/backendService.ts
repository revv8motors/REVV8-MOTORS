import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, doc, query, where, getDocs, updateDoc, writeBatch, serverTimestamp, getDoc, addDoc, orderBy, limit, increment, setDoc } from "firebase/firestore";
import { Car } from "@/types/car";

export async function bulkActionCars(carIds: string[], action: string, data?: any) {
  const batch = writeBatch(db);
  const successIds: string[] = [];
  const failedIds: string[] = [];
  
  try {
    for (const id of carIds) {
      const ref = doc(db, "cars", id);
      try {
        if (action === "DELETE") {
          batch.delete(ref);
        } else if (action === "ARCHIVE") {
          batch.update(ref, { archived: true, updated_at: new Date().toISOString() });
        } else if (action === "MARK_SOLD") {
          batch.update(ref, { status: "SOLD", updated_at: new Date().toISOString() });
        } else if (action === "UPDATE_STATUS") {
          batch.update(ref, { status: data?.status, updated_at: new Date().toISOString() });
        } else if (action === "TOGGLE_FEATURED") {
          batch.update(ref, { featured: data?.value, updated_at: new Date().toISOString() });
        } else if (action === "TOGGLE_PREMIUM") {
          batch.update(ref, { isPremium: data?.value, updated_at: new Date().toISOString() });
        } else if (action === "TOGGLE_CERTIFIED") {
          batch.update(ref, { isCertified: data?.value, updated_at: new Date().toISOString() });
        } else if (action === "UPDATE_PRICE") {
          if (data?.price && data.price >= 0) {
            batch.update(ref, { price: data.price, updated_at: new Date().toISOString() });
          } else if (data?.percentage) {
            const snap = await getDoc(ref);
            if (snap.exists()) {
              const car = snap.data() as Car;
              const numericPrice = Number(car.price);
              if (!isNaN(numericPrice)) {
                const newPrice = numericPrice + (numericPrice * (data.percentage / 100));
                if (newPrice >= 0) {
                  batch.update(ref, { price: newPrice, updated_at: new Date().toISOString() });
                }
              }
            }
          }
        }
        successIds.push(id);
      } catch (e) {
        failedIds.push(id);
      }
    }
    
    await batch.commit();
    await logActivity("admin", "BULK_ACTION", "cars", null, { action, successIds, data });
    return { successIds, failedIds };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "cars (bulk)");
    throw err;
  }
}

export async function getCarsWithFilters(filters: any) {
  try {
    let q = query(collection(db, "cars"), orderBy("created_at", "desc"));
    if (filters.status) q = query(q, where("status", "==", filters.status));
    else q = query(q, where("archived", "==", false));
    
    if (filters.featured !== undefined) q = query(q, where("featured", "==", filters.featured));
    if (filters.published !== undefined) q = query(q, where("published", "==", filters.published));
    if (filters.brand) q = query(q, where("brand", "==", filters.brand));
    if (filters.category) q = query(q, where("category", "==", filters.category));

    const snap = await getDocs(q);
    let cars = snap.docs.map(d => ({ id: d.id, ...d.data() } as Car));
    
    // In-memory advanced filtering for fields not easily indexed in simple queries
    if (filters.minPrice) cars = cars.filter(c => parsePriceToNumber(c.price) >= filters.minPrice);
    if (filters.maxPrice) cars = cars.filter(c => parsePriceToNumber(c.price) <= filters.maxPrice);
    if (filters.isCertified) cars = cars.filter(c => c.isCertified);
    if (filters.isPremium) cars = cars.filter(c => c.isPremium);

    return cars;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "cars");
    throw err;
  }
}

export async function logActivity(adminId: string, action: string, entityType: string, entityId: string | null, metadata: any) {
  try {
    await addDoc(collection(db, "activityLogs"), {
      adminId, action, entityType, entityId,
      metadata: JSON.stringify(metadata),
      createdAt: new Date().toISOString()
    });
  } catch(e) {
    console.error("Failed to log activity:", e);
  }
}

export async function trackCarView(carId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statId = `${carId}_${today}`;
    const ref = doc(db, "analytics", statId);
    await setDoc(ref, { id: statId, carId, date: today, views: increment(1) }, { merge: true });
  } catch(e) {
    console.error("Failed to track car view:", e);
  }
}

export async function trackCarLead(carId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statId = `${carId}_${today}`;
    const ref = doc(db, "analytics", statId);
    await setDoc(ref, { id: statId, carId, date: today, leads: increment(1) }, { merge: true });
  } catch(e) {
    console.error("Failed to track car lead:", e);
  }
}

export function parsePriceToNumber(price: string | number | undefined | null): number {
  if (price === undefined || price === null || price === "") return 0;
  if (typeof price === "number") return price;

  const str = String(price).toUpperCase().replace(/[^0-9.LCR]/g, "");
  
  if (str.endsWith("CR")) {
    const num = parseFloat(str.replace("CR", ""));
    return isNaN(num) ? 0 : num * 10000000;
  }
  
  if (str.endsWith("L")) {
    const num = parseFloat(str.replace("L", ""));
    return isNaN(num) ? 0 : num * 100000;
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export function computeDisplayPrice(car: Car, globalSettings?: any) {
  if (globalSettings?.hideAllPrices || car.showPrice === false) {
    return { text: "Call for Price", hasDiscount: false, value: null };
  }

  const numericPrice = parsePriceToNumber(car.price);
  const numericDiscounted = parsePriceToNumber(car.discountedPrice);

  // If it's a specific shorthand string like "6.5L", we might want to keep the text 
  // or format it. Let's check if the input was a custom string.
  const isCustomString = typeof car.price === "string" && /[A-Z]/.test(car.price.toUpperCase());

  if (isCustomString && !car.discountedPrice) {
    return { text: String(car.price), hasDiscount: false, value: null };
  }

  if (car.discountedPrice && numericDiscounted < numericPrice) {
    return {
      text: null,
      hasDiscount: true,
      originalValue: numericPrice,
      value: numericDiscounted,
      percentage: numericPrice > 0 ? Math.round(((numericPrice - numericDiscounted) / numericPrice) * 100) : 0
    };
  }
  
  return { text: null, hasDiscount: false, value: numericPrice };
}
