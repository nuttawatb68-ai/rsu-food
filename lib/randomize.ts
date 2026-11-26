import { prisma } from "./prisma";
import { RSU, RADIUS_KM } from "./constants";
import { distanceKm, mapsUrl } from "./geo";

type Menu = { name: string; price: number; description?: string };
type Candidate = {
  key: string;
  source: "DB" | "GOOGLE" | "OSM";
  name: string;
  lat: number;
  lng: number;
  placeId?: string;
  rating?: number;
  ratingCount?: number;
  address?: string;
  zone?: string;
  hours?: string;
  distanceKm: number;
  menus: Menu[]; // ร้านจาก Google จะว่าง (Google ไม่มีข้อมูลเมนู)
};

export type SpinResult = {
  key: string;
  mode: "AI" | "RANDOM";
  budget: number;
  shop: {
    name: string; zone?: string; address?: string; hours?: string;
    rating?: number; ratingCount?: number; distanceKm: number; minutes: number;
    source: "DB" | "GOOGLE" | "OSM"; lat: number; lng: number;
  };
  menu: { name: string; price: number; description?: string; estimated: boolean };
  humor: string;
  mapsUrl: string;
  alternatives: { name: string; price: number; distanceKm: number }[];
};

// เมนูสำรอง ใช้กับร้านจาก Google ตอนไม่มี Gemini (ราคาเป็นค่าประมาณ)
const FALLBACK_DISHES: Menu[] = [
  { name: "ข้าวกะเพราหมูสับไข่ดาว", price: 50 },
  { name: "ข้าวไข่เจียวหมูสับ", price: 45 },
  { name: "ผัดซีอิ๊วหมู", price: 50 },
  { name: "ก๋วยเตี๋ยวหมูน้ำใส", price: 40 },
  { name: "ข้าวมันไก่", price: 45 },
  { name: "ข้าวหมูทอดกระเทียม", price: 50 },
  { name: "บะหมี่เกี๊ยวหมูแดง", price: 45 },
  { name: "ข้าวผัดหมู", price: 40 },
  { name: "ข้าวราดแกง 2 อย่าง", price: 40 },
];

const pickRandom = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const cheapest = (m: Menu[]) => Math.min(...m.map((x) => x.price));
const nearBudget = (menus: Menu[], budget: number) => {
  const good = menus.filter((m) => m.price >= budget * 0.6);
  return good.length ? good : [menus.reduce((a, b) => (b.price > a.price ? b : a))];
};

/* ---------- 1) ร้านจากฐานข้อมูล (อนุมัติแล้วเท่านั้น) ---------- */
async function fromDb(budget: number): Promise<Candidate[]> {
  try {
    const shops = await prisma.shop.findMany({
      where: { status: "APPROVED" },
      include: { menus: true },
    });
    return shops
      .map((s) => ({
        key: `db-${s.id}`,
        source: "DB" as const,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        address: s.address ?? undefined,
        zone: s.zone,
        hours: `${s.openTime} - ${s.closeTime} น.`,
        distanceKm: distanceKm(RSU.lat, RSU.lng, s.lat, s.lng),
        menus: s.menus
          .map((m) => ({ name: m.name, price: m.specialPrice ?? m.price, description: m.description ?? undefined }))
          .filter((m) => m.price <= budget),
      }))
      .filter((c) => c.menus.length > 0);
  } catch (e) {
    console.error("DB error:", e);
    return [];
  }
}

/* ---------- 2) Google Places (cache 10 นาที ประหยัดโควตา) ---------- */
let placesCache: { at: number; data: Candidate[] } | null = null;

async function fromGoogle(): Promise<Candidate[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return [];
  if (placesCache && Date.now() - placesCache.at < 10 * 60 * 1000) return placesCache.data;
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.formattedAddress,places.priceLevel,places.currentOpeningHours.openNow",
      },
      body: JSON.stringify({
        includedTypes: ["restaurant"],
        maxResultCount: 20,
        rankPreference: "POPULARITY",
        languageCode: "th",
        locationRestriction: {
          circle: { center: { latitude: RSU.lat, longitude: RSU.lng }, radius: RADIUS_KM * 1000 },
        },
      }),
    });
    if (!res.ok) throw new Error(`Places ${res.status} ${await res.text()}`);
    const json = await res.json();
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const data: Candidate[] = (json.places ?? [])
      .filter((p: any) => p.location && p.displayName?.text)
      .filter((p: any) => p.currentOpeningHours?.openNow !== false) // ตัดร้านที่ปิดอยู่
      .filter((p: any) => !["PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"].includes(p.priceLevel))
      .map((p: any) => ({
        key: `g-${p.id}`,
        source: "GOOGLE" as const,
        name: p.displayName.text,
        lat: p.location.latitude,
        lng: p.location.longitude,
        placeId: p.id,
        rating: p.rating,
        ratingCount: p.userRatingCount,
        address: p.formattedAddress,
        distanceKm: distanceKm(RSU.lat, RSU.lng, p.location.latitude, p.location.longitude),
        menus: [],
      }));
    placesCache = { at: Date.now(), data };
    return data;
  } catch (e) {
    console.error("Google Places error:", e);
    return [];
  }
}


/* ---------- 2b) OpenStreetMap (ฟรี ไม่ต้องมี API Key / ไม่ต้องผูกบัตร) ---------- */
let osmCache: { at: number; data: Candidate[] } | null = null;

async function fromOsm(): Promise<Candidate[]> {
  if (osmCache && Date.now() - osmCache.at < 10 * 60 * 1000) return osmCache.data;
  const around = `(around:${RADIUS_KM * 1000},${RSU.lat},${RSU.lng})`;
  const query = `[out:json][timeout:15];(node["amenity"~"^(restaurant|fast_food|food_court)$"]${around};way["amenity"~"^(restaurant|fast_food|food_court)$"]${around};);out center 80;`;
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "rsu-food-randomizer/1.0 (student project)" },
      body: "data=" + encodeURIComponent(query),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    const json = await res.json();
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const data: Candidate[] = (json.elements ?? [])
      .map((e: any) => {
        const lat = e.lat ?? e.center?.lat;
        const lng = e.lon ?? e.center?.lon;
        const name = e.tags?.["name:th"] ?? e.tags?.name;
        if (!lat || !lng || !name) return null;
        return {
          key: `osm-${e.type}-${e.id}`,
          source: "OSM" as const,
          name,
          lat,
          lng,
          hours: e.tags?.opening_hours,
          distanceKm: distanceKm(RSU.lat, RSU.lng, lat, lng),
          menus: [],
        };
      })
      .filter(Boolean);
    osmCache = { at: Date.now(), data };
    return data;
  } catch (e) {
    console.error("OSM error:", e);
    return osmCache?.data ?? [];
  }
}

/* ---------- 3) Gemini เลือกร้าน + เมนู ---------- */
async function askGemini(budget: number, list: Candidate[]) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const lines = list
    .map((c, i) => {
      const menus = c.menus.length
        ? " เมนูในร้าน: " + c.menus.map((m) => `${m.name}(${m.price}฿)`).join(", ")
        : " (ไม่มีข้อมูลเมนู ให้เสนอเมนูยอดนิยมที่ราคาจริงไม่เกินงบ)";
      return `${i}. ${c.name} ห่าง ${c.distanceKm.toFixed(1)} กม.${c.rating ? ` ดาว ${c.rating}` : ""}.${menus}`;
    })
    .join("\n");
  const prompt = `คุณคือผู้ช่วยเลือกอาหารให้นักศึกษามหาวิทยาลัยรังสิต งบ ${budget} บาท
เลือกร้านเดียวจากรายการ และเมนูที่ราคาไม่เกินงบ แต่ต้องใกล้เคียงงบให้มากที่สุด (อย่างน้อย 60% ของงบ ถ้าทำได้) ถ้างบสูงให้เสนอมื้อที่เหมาะกับงบนั้น เช่น เซ็ตหรือมื้อใหญ่ (ถ้าร้านมีรายการเมนูให้เลือกจากรายการนั้นเท่านั้น)
ตอบเป็น JSON เท่านั้น รูปแบบ {"index":number,"menuName":string,"price":number,"humor":string}
humor = มุกสั้นๆ ภาษาไทย 1 ประโยค สไตล์เด็กมอ ไม่หยาบคาย
รายการร้าน:
${lines}`;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 1 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status} ${await res.text()}`);
    const j = await res.json();
    const text = j.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return JSON.parse(text.replace(/```json|```/g, "").trim()) as {
      index: number; menuName: string; price: number; humor: string;
    };
  } catch (e) {
    console.error("Gemini error:", e);
    return null;
  }
}

const HUMOR = [
  "ตังค์น้อยแต่ใจใหญ่ มื้อนี้อิ่มแน่นอน!",
  "ไม่ต้องคิดแล้ว ให้ดวงเลือกให้",
  "เดินไปกินเถอะ ได้เผาผลาญด้วย",
  "งบแค่นี้ก็อร่อยได้ เชื่อเรา",
];

/* ---------- ตัวหลัก ---------- */
export async function spin(budget: number, exclude: string[] = []): Promise<SpinResult | null> {
  const [db, google] = await Promise.all([fromDb(budget), fromGoogle()]);
  // ไม่มี Google Key หรือ Google ไม่ตอบ => ใช้ OpenStreetMap (ฟรี) แทน
  const outside = google.length ? google : await fromOsm();
  let all = [...db, ...outside];
  const fresh = all.filter((c) => !exclude.includes(c.key));
  if (fresh.length > 0) all = fresh; // ถ้าสุ่มครบทุกร้านแล้ว ให้เริ่มวนใหม่
  if (all.length === 0) return null;

  // ให้ Gemini เห็นสูงสุด 25 ร้าน (ร้านจาก DB มาก่อน เพราะมีเมนูจริง)
  const shortlist = all.sort(() => Math.random() - 0.5).sort((a, b) => (a.source === b.source ? 0 : a.source === "DB" ? -1 : 1)).slice(0, 25);

  const ai = await askGemini(budget, shortlist);
  let chosen = shortlist[0];
  let menu: Menu | undefined;
  let humor = pickRandom(HUMOR);
  let mode: "AI" | "RANDOM" = "RANDOM";

  if (ai && Number.isInteger(ai.index) && shortlist[ai.index]) {
    chosen = shortlist[ai.index];
    mode = "AI";
    humor = ai.humor || humor;
    if (chosen.menus.length) {
      menu = chosen.menus.find((m) => m.name === ai.menuName) ?? pickRandom(nearBudget(chosen.menus, budget));
    } else if (ai.menuName && Number(ai.price) > 0 && Number(ai.price) <= budget) {
      menu = { name: ai.menuName, price: Math.round(Number(ai.price)) };
    }
  } else {
    chosen = pickRandom(shortlist);
  }
  if (!menu) {
    menu = chosen.menus.length
      ? pickRandom(nearBudget(chosen.menus, budget))
      : pickRandom(FALLBACK_DISHES.filter((d) => d.price <= budget).length ? FALLBACK_DISHES.filter((d) => d.price <= budget) : [{ name: "ข้าวไข่เจียว", price: Math.min(budget, 35) }]);
  }

  const alternatives = all
    .filter((c) => c.key !== chosen.key && c.menus.length)
    .slice(0, 3)
    .map((c) => ({ name: c.name, price: cheapest(c.menus), distanceKm: Number(c.distanceKm.toFixed(1)) }));

  try {
    await prisma.spinLog.create({ data: { budget, shopName: chosen.name, menuName: menu.name, source: mode } });
  } catch {}

  const km = chosen.distanceKm;
  return {
    key: chosen.key,
    mode,
    budget,
    shop: {
      name: chosen.name, zone: chosen.zone, address: chosen.address, hours: chosen.hours,
      rating: chosen.rating, ratingCount: chosen.ratingCount,
      distanceKm: Number(km.toFixed(1)), minutes: Math.max(1, Math.round(km * 4)),
      source: chosen.source, lat: chosen.lat, lng: chosen.lng,
    },
    menu: { name: menu.name, price: menu.price, description: menu.description, estimated: chosen.source !== "DB" },
    humor,
    mapsUrl: mapsUrl(chosen.lat, chosen.lng, chosen.placeId),
    alternatives,
  };
}
