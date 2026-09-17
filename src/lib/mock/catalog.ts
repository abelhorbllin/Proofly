export const NICHES = [
  "Beauty",
  "Fitness",
  "Home",
  "Pets",
  "Fashion",
  "Tech Accessories",
  "Health & Wellness",
  "Travel",
  "Kitchen",
  "Baby & Kids",
] as const;

export const PLATFORMS = ["Shopify", "WooCommerce", "Custom", "BigCommerce"] as const;

export const COUNTRIES = ["France", "Germany", "United States", "United Kingdom", "Spain", "Italy", "Netherlands"] as const;

export const PRODUCT_TEMPLATES: Record<(typeof NICHES)[number], string[]> = {
  Beauty: ["LED Face Mask", "Jade Facial Roller", "Hair Growth Serum", "Vitamin C Serum", "Cordless Hair Curler"],
  Fitness: ["Resistance Bands Set", "Portable Massage Gun", "Ankle Weights", "Foldable Yoga Mat", "Grip Strengthener"],
  Home: ["Sunset Projection Lamp", "Aromatherapy Diffuser", "Magnetic Knife Rack", "Smart Motion Light", "Cloud Slippers"],
  Pets: ["Automatic Pet Feeder", "Dog Calming Bed", "Interactive Cat Toy", "Pet Hair Remover Roller", "No-Pull Dog Harness"],
  Fashion: ["Oversized Blazer", "Minimalist Chain Necklace", "Convertible Crossbody Bag", "Wide-Leg Denim", "Statement Earrings Set"],
  "Tech Accessories": ["MagSafe Wallet Stand", "Retractable USB-C Cable", "Mini Projector", "Wireless Charging Pad", "Phone Camera Lens Kit"],
  "Health & Wellness": ["Posture Corrector", "Compression Socks", "Sleep Mask with Bluetooth", "Cold Therapy Roller", "Magnesium Sleep Gummies"],
  Travel: ["Compression Packing Cubes", "Neck Pillow with Hood", "Portable Luggage Scale", "Anti-Theft Backpack", "Travel Toiletry Organizer"],
  Kitchen: ["Electric Garlic Chopper", "Reusable Silicone Bags", "Mini Waffle Maker", "Herb Preserver Jar", "Multi-Purpose Vegetable Cutter"],
  "Baby & Kids": ["Baby Carrier Wrap", "Silicone Feeding Set", "Portable Night Light", "Teething Toy Set", "Baby Swaddle Blanket"],
};

export const AD_ANGLES = [
  "PROBLEM_SOLUTION",
  "BEFORE_AFTER",
  "DEMONSTRATION",
  "UGC",
  "TESTIMONIAL",
  "LIFESTYLE",
  "CURIOSITY",
  "FOMO",
  "DISCOUNT",
  "SOCIAL_PROOF",
  "EDUCATIONAL",
  "EMOTIONAL",
] as const;

export const HOOKS = [
  "Stop scrolling if you deal with this every day...",
  "I was skeptical until I tried this for 7 days",
  "This sold out 3 times last month",
  "POV: you finally found the thing that actually works",
  "Nobody is talking about this but they should be",
  "Here's why everyone is switching to this",
  "The before and after speaks for itself",
  "I wish I knew about this sooner",
  "This is not a drill, it's back in stock",
  "Doctors and reviewers can't stop recommending this",
];

export const CTAS = ["Shop Now", "Get Yours Today", "Learn More", "Claim Offer", "Try Risk-Free", "Order Now"];

export const OFFERS = ["20% off today only", "Buy 2 Get 1 Free", "Free shipping worldwide", "Limited stock drop", "30-day money back guarantee", "Bundle & save 35%"];

export const HEADLINES = [
  "The product everyone's talking about",
  "Finally, a solution that works",
  "Rated 4.8/5 by over 12,000 customers",
  "As seen on social media",
  "Your new daily essential",
];

const STORE_PREFIXES = ["Lumo", "Nova", "Verve", "Aura", "Kindra", "Blume", "Orbis", "Vello", "Crest", "Solace", "Miro", "Tidal"];
const STORE_SUFFIXES = ["Co", "Shop", "Studio", "Goods", "Store", "Lab", "House", "Market"];

export function storeNameFromDomain(domain: string, rand: { int: (a: number, b: number) => number }) {
  const prefix = STORE_PREFIXES[rand.int(0, STORE_PREFIXES.length - 1)];
  const suffix = STORE_SUFFIXES[rand.int(0, STORE_SUFFIXES.length - 1)];
  const cleaned = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split(".")[0];
  if (cleaned.length > 2) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return `${prefix} ${suffix}`;
}
