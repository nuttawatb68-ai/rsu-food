import { str, int } from "./validate";

export function readMenu(b: Record<string, unknown>) {
  const name = str(b.name, 100);
  const price = int(b.price, 1, 1000);
  const hasSpecial = b.specialPrice !== "" && b.specialPrice != null;
  const special = hasSpecial ? int(b.specialPrice, 1, 1000) : null;
  if (!name || price === null || (hasSpecial && special === null)) return null;
  return { name, price, specialPrice: special, description: str(b.description, 200) || null };
}
