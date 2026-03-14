import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { components } from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/catalog_db";
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

const seedData = [
  // CPUs
  {
    name: "AMD Ryzen 7 7800X3D",
    brand: "AMD",
    type: "CPU" as const,
    price: 349.99,
    specs: {
      cores: "8",
      threads: "16",
      socket: "AM5",
      baseClock: "4.2 GHz",
      boostClock: "5.0 GHz",
      tdp: "120W",
    },
  },
  {
    name: "AMD Ryzen 9 7950X",
    brand: "AMD",
    type: "CPU" as const,
    price: 549.99,
    specs: {
      cores: "16",
      threads: "32",
      socket: "AM5",
      baseClock: "4.5 GHz",
      boostClock: "5.7 GHz",
      tdp: "170W",
    },
  },
  {
    name: "Intel Core i7-14700K",
    brand: "Intel",
    type: "CPU" as const,
    price: 399.99,
    specs: {
      cores: "20",
      threads: "28",
      socket: "LGA1700",
      baseClock: "3.4 GHz",
      boostClock: "5.6 GHz",
      tdp: "125W",
    },
  },
  {
    name: "Intel Core i5-14600K",
    brand: "Intel",
    type: "CPU" as const,
    price: 289.99,
    specs: {
      cores: "14",
      threads: "20",
      socket: "LGA1700",
      baseClock: "3.5 GHz",
      boostClock: "5.3 GHz",
      tdp: "125W",
    },
  },
  {
    name: "AMD Ryzen 5 7600X",
    brand: "AMD",
    type: "CPU" as const,
    price: 229.99,
    specs: {
      cores: "6",
      threads: "12",
      socket: "AM5",
      baseClock: "4.7 GHz",
      boostClock: "5.3 GHz",
      tdp: "105W",
    },
  },
  {
    name: "Intel Core i9-14900K",
    brand: "Intel",
    type: "CPU" as const,
    price: 569.99,
    specs: {
      cores: "24",
      threads: "32",
      socket: "LGA1700",
      baseClock: "3.2 GHz",
      boostClock: "6.0 GHz",
      tdp: "125W",
    },
  },

  // GPUs
  {
    name: "NVIDIA GeForce RTX 4090",
    brand: "NVIDIA",
    type: "GPU" as const,
    price: 1599.99,
    specs: {
      vram: "24 GB GDDR6X",
      coreClock: "2520 MHz",
      bus: "PCIe 4.0 x16",
      tdp: "450W",
    },
  },
  {
    name: "NVIDIA GeForce RTX 4070 Ti",
    brand: "NVIDIA",
    type: "GPU" as const,
    price: 799.99,
    specs: {
      vram: "12 GB GDDR6X",
      coreClock: "2610 MHz",
      bus: "PCIe 4.0 x16",
      tdp: "285W",
    },
  },
  {
    name: "AMD Radeon RX 7900 XTX",
    brand: "AMD",
    type: "GPU" as const,
    price: 949.99,
    specs: {
      vram: "24 GB GDDR6",
      coreClock: "2500 MHz",
      bus: "PCIe 4.0 x16",
      tdp: "355W",
    },
  },
  {
    name: "NVIDIA GeForce RTX 4060 Ti",
    brand: "NVIDIA",
    type: "GPU" as const,
    price: 399.99,
    specs: {
      vram: "8 GB GDDR6",
      coreClock: "2535 MHz",
      bus: "PCIe 4.0 x16",
      tdp: "160W",
    },
  },
  {
    name: "AMD Radeon RX 7800 XT",
    brand: "AMD",
    type: "GPU" as const,
    price: 499.99,
    specs: {
      vram: "16 GB GDDR6",
      coreClock: "2430 MHz",
      bus: "PCIe 4.0 x16",
      tdp: "263W",
    },
  },
  {
    name: "NVIDIA GeForce RTX 4070",
    brand: "NVIDIA",
    type: "GPU" as const,
    price: 599.99,
    specs: {
      vram: "12 GB GDDR6X",
      coreClock: "2475 MHz",
      bus: "PCIe 4.0 x16",
      tdp: "200W",
    },
  },

  // RAM
  {
    name: "Corsair Vengeance DDR5-6000 32GB",
    brand: "Corsair",
    type: "RAM" as const,
    price: 109.99,
    specs: {
      capacity: "32 GB (2x16)",
      speed: "6000 MHz",
      type: "DDR5",
      cas: "CL36",
    },
  },
  {
    name: "G.Skill Trident Z5 DDR5-6400 32GB",
    brand: "G.Skill",
    type: "RAM" as const,
    price: 134.99,
    specs: {
      capacity: "32 GB (2x16)",
      speed: "6400 MHz",
      type: "DDR5",
      cas: "CL32",
    },
  },
  {
    name: "Kingston Fury Beast DDR5-5600 16GB",
    brand: "Kingston",
    type: "RAM" as const,
    price: 54.99,
    specs: {
      capacity: "16 GB (2x8)",
      speed: "5600 MHz",
      type: "DDR5",
      cas: "CL36",
    },
  },
  {
    name: "Corsair Dominator Platinum DDR5-7200 32GB",
    brand: "Corsair",
    type: "RAM" as const,
    price: 189.99,
    specs: {
      capacity: "32 GB (2x16)",
      speed: "7200 MHz",
      type: "DDR5",
      cas: "CL34",
    },
  },
  {
    name: "G.Skill Ripjaws S5 DDR5-5600 32GB",
    brand: "G.Skill",
    type: "RAM" as const,
    price: 89.99,
    specs: {
      capacity: "32 GB (2x16)",
      speed: "5600 MHz",
      type: "DDR5",
      cas: "CL28",
    },
  },

  // Storage
  {
    name: "Samsung 990 Pro 2TB",
    brand: "Samsung",
    type: "Storage" as const,
    price: 169.99,
    specs: {
      capacity: "2 TB",
      interface: "NVMe PCIe 4.0",
      read: "7450 MB/s",
      write: "6900 MB/s",
      formFactor: "M.2 2280",
    },
  },
  {
    name: "WD Black SN850X 1TB",
    brand: "Western Digital",
    type: "Storage" as const,
    price: 89.99,
    specs: {
      capacity: "1 TB",
      interface: "NVMe PCIe 4.0",
      read: "7300 MB/s",
      write: "6300 MB/s",
      formFactor: "M.2 2280",
    },
  },
  {
    name: "Crucial T700 2TB",
    brand: "Crucial",
    type: "Storage" as const,
    price: 219.99,
    specs: {
      capacity: "2 TB",
      interface: "NVMe PCIe 5.0",
      read: "12400 MB/s",
      write: "11800 MB/s",
      formFactor: "M.2 2280",
    },
  },
  {
    name: "Samsung 870 EVO 1TB",
    brand: "Samsung",
    type: "Storage" as const,
    price: 79.99,
    specs: {
      capacity: "1 TB",
      interface: "SATA III",
      read: "560 MB/s",
      write: "530 MB/s",
      formFactor: "2.5 inch",
    },
  },
  {
    name: "Seagate Barracuda 2TB",
    brand: "Seagate",
    type: "Storage" as const,
    price: 54.99,
    specs: {
      capacity: "2 TB",
      interface: "SATA III",
      rpm: "7200",
      formFactor: "3.5 inch",
    },
  },

  // Motherboards
  {
    name: "ASUS ROG Strix X670E-E Gaming",
    brand: "ASUS",
    type: "Motherboard" as const,
    price: 449.99,
    specs: {
      socket: "AM5",
      chipset: "X670E",
      formFactor: "ATX",
      memorySlots: "4",
      maxMemory: "128 GB",
    },
  },
  {
    name: "MSI MAG B650 Tomahawk",
    brand: "MSI",
    type: "Motherboard" as const,
    price: 219.99,
    specs: {
      socket: "AM5",
      chipset: "B650",
      formFactor: "ATX",
      memorySlots: "4",
      maxMemory: "128 GB",
    },
  },
  {
    name: "Gigabyte Z790 Aorus Elite AX",
    brand: "Gigabyte",
    type: "Motherboard" as const,
    price: 259.99,
    specs: {
      socket: "LGA1700",
      chipset: "Z790",
      formFactor: "ATX",
      memorySlots: "4",
      maxMemory: "128 GB",
    },
  },
  {
    name: "ASRock B760M Pro RS",
    brand: "ASRock",
    type: "Motherboard" as const,
    price: 109.99,
    specs: {
      socket: "LGA1700",
      chipset: "B760",
      formFactor: "mATX",
      memorySlots: "2",
      maxMemory: "64 GB",
    },
  },
  {
    name: "ASUS ROG Strix B650E-F Gaming",
    brand: "ASUS",
    type: "Motherboard" as const,
    price: 289.99,
    specs: {
      socket: "AM5",
      chipset: "B650E",
      formFactor: "ATX",
      memorySlots: "4",
      maxMemory: "128 GB",
    },
  },

  // PSUs
  {
    name: "Corsair RM850x",
    brand: "Corsair",
    type: "PSU" as const,
    price: 139.99,
    specs: {
      wattage: "850W",
      efficiency: "80+ Gold",
      modular: "Full",
      formFactor: "ATX",
    },
  },
  {
    name: "Seasonic Focus GX-1000",
    brand: "Seasonic",
    type: "PSU" as const,
    price: 169.99,
    specs: {
      wattage: "1000W",
      efficiency: "80+ Gold",
      modular: "Full",
      formFactor: "ATX",
    },
  },
  {
    name: "be quiet! Straight Power 12 750W",
    brand: "be quiet!",
    type: "PSU" as const,
    price: 129.99,
    specs: {
      wattage: "750W",
      efficiency: "80+ Platinum",
      modular: "Full",
      formFactor: "ATX",
    },
  },
  {
    name: "EVGA SuperNOVA 1000 G7",
    brand: "EVGA",
    type: "PSU" as const,
    price: 189.99,
    specs: {
      wattage: "1000W",
      efficiency: "80+ Gold",
      modular: "Full",
      formFactor: "ATX",
    },
  },
  {
    name: "Corsair RM1200x Shift",
    brand: "Corsair",
    type: "PSU" as const,
    price: 219.99,
    specs: {
      wattage: "1200W",
      efficiency: "80+ Gold",
      modular: "Full",
      formFactor: "ATX",
    },
  },

  // Cases
  {
    name: "Fractal Design North",
    brand: "Fractal Design",
    type: "Case" as const,
    price: 139.99,
    specs: {
      formFactor: "ATX Mid Tower",
      color: "Charcoal Black",
      gpuMaxLength: "355 mm",
      fans: "2x 140mm",
    },
  },
  {
    name: "NZXT H7 Flow",
    brand: "NZXT",
    type: "Case" as const,
    price: 129.99,
    specs: {
      formFactor: "ATX Mid Tower",
      color: "White",
      gpuMaxLength: "400 mm",
      fans: "2x 120mm",
    },
  },
  {
    name: "Lian Li O11 Dynamic EVO",
    brand: "Lian Li",
    type: "Case" as const,
    price: 169.99,
    specs: {
      formFactor: "ATX Mid Tower",
      color: "Black",
      gpuMaxLength: "422 mm",
      fans: "None included",
    },
  },
  {
    name: "Corsair 4000D Airflow",
    brand: "Corsair",
    type: "Case" as const,
    price: 104.99,
    specs: {
      formFactor: "ATX Mid Tower",
      color: "Black",
      gpuMaxLength: "360 mm",
      fans: "2x 120mm",
    },
  },
  {
    name: "be quiet! Pure Base 500DX",
    brand: "be quiet!",
    type: "Case" as const,
    price: 109.99,
    specs: {
      formFactor: "ATX Mid Tower",
      color: "Black",
      gpuMaxLength: "369 mm",
      fans: "3x 140mm",
    },
  },

  // Cooling
  {
    name: "Noctua NH-D15",
    brand: "Noctua",
    type: "Cooling" as const,
    price: 109.99,
    specs: { type: "Air", fans: "2x 150mm", height: "165 mm", tdp: "250W" },
  },
  {
    name: "Corsair iCUE H150i Elite",
    brand: "Corsair",
    type: "Cooling" as const,
    price: 169.99,
    specs: {
      type: "AIO Liquid",
      radiator: "360mm",
      fans: "3x 120mm",
      tdp: "350W",
    },
  },
  {
    name: "be quiet! Dark Rock Pro 5",
    brand: "be quiet!",
    type: "Cooling" as const,
    price: 89.99,
    specs: { type: "Air", fans: "2x 135mm", height: "168 mm", tdp: "270W" },
  },
  {
    name: "NZXT Kraken X63",
    brand: "NZXT",
    type: "Cooling" as const,
    price: 149.99,
    specs: {
      type: "AIO Liquid",
      radiator: "280mm",
      fans: "2x 140mm",
      tdp: "300W",
    },
  },
  {
    name: "Arctic Liquid Freezer II 360",
    brand: "Arctic",
    type: "Cooling" as const,
    price: 109.99,
    specs: {
      type: "AIO Liquid",
      radiator: "360mm",
      fans: "3x 120mm",
      tdp: "350W",
    },
  },
  {
    name: "Noctua NH-U12S",
    brand: "Noctua",
    type: "Cooling" as const,
    price: 69.99,
    specs: { type: "Air", fans: "1x 120mm", height: "158 mm", tdp: "200W" },
  },
];

await db.execute(sql`DELETE FROM components`);
await db.insert(components).values(seedData);

console.log(`Seeded ${seedData.length} components`);
await client.end();
