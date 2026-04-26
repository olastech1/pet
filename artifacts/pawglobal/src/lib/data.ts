export type Currency = 'USD' | 'EUR' | 'GBP';

export function petDisplayId(id: string): string {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) + h) ^ id.charCodeAt(i);
    h = h >>> 0;
  }
  return `ID${100000 + (h % 900000)}`;
}

export interface EuthanasiaListing {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string;
  age: string;
  gender: 'male' | 'female' | 'unknown';
  shelter: string;
  location: string;
  deadline: string; // ISO date string
  image: string;
  description: string;
  status: 'at-risk' | 'rescued';
  author: string;
  addedAt: string;
}

export const defaultEuthanasiaListings: EuthanasiaListing[] = [
  {
    id: 'euth-1',
    name: 'Bruno',
    species: 'dog',
    breed: 'American Pit Bull Terrier',
    age: '4 years',
    gender: 'male',
    shelter: 'LA City Shelter',
    location: 'Los Angeles, USA',
    deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80',
    description: 'Bruno is a gentle, affectionate dog who has been at the shelter for over a year. He is great with adults and loves long walks. Time is running out — he needs a home or a rescue to step in immediately.',
    status: 'at-risk',
    author: 'EuthList Team',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'euth-2',
    name: 'Mochi',
    species: 'cat',
    breed: 'Domestic Shorthair',
    age: '2 years',
    gender: 'female',
    shelter: 'Chicago Animal Care',
    location: 'Chicago, USA',
    deadline: new Date(Date.now() + 6 * 86400000).toISOString(),
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    description: 'Mochi is a sweet, quiet cat who loves to curl up on laps. She was surrendered when her owner moved abroad. She is healthy, spayed and vaccinated. Please give her a chance.',
    status: 'at-risk',
    author: 'EuthList Team',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'euth-3',
    name: 'Rex',
    species: 'dog',
    breed: 'German Shepherd Mix',
    age: '6 years',
    gender: 'male',
    shelter: 'Houston SPCA',
    location: 'Houston, USA',
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    image: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=800&q=80',
    description: 'Rex is a loyal and intelligent dog who was used as a working dog before being surrendered. He knows basic commands and is house-trained. He deserves a second chance at life.',
    status: 'at-risk',
    author: 'EuthList Team',
    addedAt: new Date().toISOString(),
  },
];

export interface Product {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'supply';
  category?: string; // For supplies (Food, Accessories, etc.)
  breed?: string;
  age?: string;
  gender?: 'male' | 'female';
  location: string;
  priceNGN: number;
  priceUSD: number;
  status: 'sale' | 'adopt';
  images: string[];
  description: string;
  vaccinated?: boolean;
  dewormed?: boolean;
}

export const dogs: Product[] = [
  {
    id: 'dog-1',
    name: 'Loki',
    type: 'dog',
    breed: 'Golden Retriever',
    age: '3 months',
    gender: 'male',
    location: 'London',
    priceNGN: 450000,
    priceUSD: 300,
    status: 'sale',
    vaccinated: true,
    dewormed: true,
    description: 'A playful and loving Golden Retriever puppy, perfect for families. Loki loves to fetch and cuddle.',
    images: ['https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'dog-2',
    name: 'Amara',
    type: 'dog',
    breed: 'Mixed Breed (Rescue)',
    age: '1 year',
    gender: 'female',
    location: 'Toronto Shelter',
    priceNGN: 85000,
    priceUSD: 55,
    status: 'adopt',
    vaccinated: true,
    dewormed: true,
    description: 'Amara was rescued and has blossomed into an incredibly smart, loyal companion. She is looking for a forever home.',
    images: ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'dog-3',
    name: 'Duke',
    type: 'dog',
    breed: 'German Shepherd',
    age: '4 months',
    gender: 'male',
    location: 'New York',
    priceNGN: 550000,
    priceUSD: 360,
    status: 'sale',
    vaccinated: true,
    dewormed: true,
    description: 'Duke is a strong, alert German Shepherd puppy with excellent guard dog potential and a sweet demeanor.',
    images: ['https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'dog-4',
    name: 'Bella',
    type: 'dog',
    breed: 'Maltese',
    age: '2 months',
    gender: 'female',
    location: 'Sydney',
    priceNGN: 380000,
    priceUSD: 250,
    status: 'sale',
    vaccinated: true,
    dewormed: true,
    description: 'Tiny, fluffy, and full of joy. Bella is the ultimate lap dog for apartment living.',
    images: ['https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'dog-5',
    name: 'Rex',
    type: 'dog',
    breed: 'Boerboel',
    age: '5 months',
    gender: 'male',
    location: 'Dubai',
    priceNGN: 280000,
    priceUSD: 185,
    status: 'sale',
    vaccinated: true,
    dewormed: true,
    description: 'A growing Boerboel with a protective instinct and a big heart. Great for families who want a loyal guardian.',
    images: ['https://images.unsplash.com/photo-1601979031925-424e53b6caaa?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'dog-6',
    name: 'Sisi',
    type: 'dog',
    breed: 'Mixed Breed (Rescue)',
    age: '2 years',
    gender: 'female',
    location: 'City Rescue Centre',
    priceNGN: 0,
    priceUSD: 0,
    status: 'adopt',
    vaccinated: true,
    dewormed: true,
    description: 'Sisi is a gentle soul who has spent a year at the shelter. She is calm, house-trained, and ready for a loving family.',
    images: ['https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'dog-7',
    name: 'Bruno',
    type: 'dog',
    breed: 'Rottweiler',
    age: '3 months',
    gender: 'male',
    location: 'Berlin',
    priceNGN: 500000,
    priceUSD: 330,
    status: 'sale',
    vaccinated: true,
    dewormed: true,
    description: 'A beautiful Rottweiler puppy with champion bloodlines. Confident, calm, and eager to please.',
    images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'dog-8',
    name: 'Coco',
    type: 'dog',
    breed: 'Chihuahua',
    age: '6 months',
    gender: 'female',
    location: 'Paris',
    priceNGN: 200000,
    priceUSD: 130,
    status: 'sale',
    vaccinated: true,
    dewormed: true,
    description: 'Small but mighty! Coco is full of personality and loves to be the center of attention.',
    images: ['https://images.unsplash.com/photo-1605639156481-244775d6f803?auto=format&fit=crop&w=800&q=80']
  }
];

export const cats: Product[] = [
  {
    id: 'cat-1',
    name: 'Miso',
    type: 'cat',
    breed: 'Persian',
    age: '2 months',
    gender: 'male',
    location: 'Tokyo',
    priceNGN: 180000,
    priceUSD: 120,
    status: 'sale',
    vaccinated: true,
    dewormed: true,
    description: 'A gorgeous Persian kitten with a fluffy coat and a sweet purr. Loves gentle cuddles and quiet homes.',
    images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'cat-2',
    name: 'Zara',
    type: 'cat',
    breed: 'Domestic Shorthair (Rescue)',
    age: '8 months',
    gender: 'female',
    location: 'Animal Rescue Centre',
    priceNGN: 0,
    priceUSD: 0,
    status: 'adopt',
    vaccinated: true,
    dewormed: true,
    description: 'Rescued and fully rehabilitated, Zara is a resilient survivor who loves a quiet sunbeam and a patient owner.',
    images: ['https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'cat-3',
    name: 'Tiger',
    type: 'cat',
    breed: 'Tabby',
    age: '3 months',
    gender: 'male',
    location: 'Melbourne',
    priceNGN: 120000,
    priceUSD: 80,
    status: 'sale',
    vaccinated: true,
    dewormed: true,
    description: 'Playful and adventurous, Tiger is ready to explore every corner of your home.',
    images: ['https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'cat-4',
    name: 'Luna',
    type: 'cat',
    breed: 'Siamese',
    age: '4 months',
    gender: 'female',
    location: 'New York',
    priceNGN: 220000,
    priceUSD: 145,
    status: 'sale',
    vaccinated: true,
    dewormed: true,
    description: 'Vocal and affectionate, Luna is a classic Siamese beauty who will talk your ear off.',
    images: ['https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'cat-5',
    name: 'Kalu',
    type: 'cat',
    breed: 'Domestic Shorthair (Rescue)',
    age: '1 year',
    gender: 'male',
    location: 'Community Shelter',
    priceNGN: 0,
    priceUSD: 0,
    status: 'adopt',
    vaccinated: true,
    dewormed: true,
    description: 'A handsome and independent cat looking for a patient owner. Kalu warms up slowly but loves deeply.',
    images: ['https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'cat-6',
    name: 'Nala',
    type: 'cat',
    breed: 'British Shorthair',
    age: '3 months',
    gender: 'female',
    location: 'Amsterdam',
    priceNGN: 280000,
    priceUSD: 185,
    status: 'sale',
    vaccinated: true,
    dewormed: true,
    description: 'Chunky and cute, Nala is a highly sought-after British Shorthair with a calm and easygoing personality.',
    images: ['https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'cat-7',
    name: 'Shadow',
    type: 'cat',
    breed: 'Black Cat (Rescue)',
    age: '2 years',
    gender: 'male',
    location: 'Pet Haven Shelter',
    priceNGN: 0,
    priceUSD: 0,
    status: 'adopt',
    vaccinated: true,
    dewormed: true,
    description: 'A sleek mini-panther with a heart of gold. Shadow is gentle, quiet, and deserves a second chance.',
    images: ['https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'cat-8',
    name: 'Cleo',
    type: 'cat',
    breed: 'Ragdoll',
    age: '2 months',
    gender: 'female',
    location: 'Vancouver',
    priceNGN: 350000,
    priceUSD: 230,
    status: 'sale',
    vaccinated: true,
    dewormed: true,
    description: 'Flops like a ragdoll when picked up — the ultimate cuddler for anyone who loves a laid-back, loving cat.',
    images: ['https://images.unsplash.com/photo-1511275539165-cc46b1ee89bf?auto=format&fit=crop&w=800&q=80']
  }
];

export const supplies: Product[] = [
  {
    id: 'sup-1',
    name: 'Premium Dry Dog Food 5kg',
    type: 'supply',
    category: 'Food',
    location: 'Global',
    priceNGN: 18000,
    priceUSD: 12,
    status: 'sale',
    description: 'High-protein dry food for adult dogs. Made with real meat and vegetables.',
    images: ['https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'sup-2',
    name: 'Royal Canin Cat Food 2kg',
    type: 'supply',
    category: 'Food',
    location: 'Global',
    priceNGN: 22000,
    priceUSD: 15,
    status: 'sale',
    description: 'Balanced nutrition for indoor cats. Promotes a healthy coat.',
    images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'sup-3',
    name: 'Orthopedic Dog Bed (Large)',
    type: 'supply',
    category: 'Housing',
    location: 'Global',
    priceNGN: 45000,
    priceUSD: 30,
    status: 'sale',
    description: 'Supportive memory foam bed for large breeds and senior dogs.',
    images: ['https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'sup-4',
    name: 'Cat Tree & Scratching Post',
    type: 'supply',
    category: 'Housing',
    location: 'Global',
    priceNGN: 35000,
    priceUSD: 23,
    status: 'sale',
    description: 'Multi-level cat tree with sisal scratching posts and cozy hideouts.',
    images: ['https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'sup-5',
    name: 'Adjustable Dog Harness',
    type: 'supply',
    category: 'Accessories',
    location: 'Global',
    priceNGN: 12000,
    priceUSD: 8,
    status: 'sale',
    description: 'Comfortable, no-pull harness with reflective stitching.',
    images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'sup-6',
    name: 'Stainless Steel Bowl Set',
    type: 'supply',
    category: 'Accessories',
    location: 'Global',
    priceNGN: 8500,
    priceUSD: 6,
    status: 'sale',
    description: 'Durable, easy-to-clean bowls for food and water with non-slip base.',
    images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'sup-7',
    name: 'Monthly Flea & Tick Treatment',
    type: 'supply',
    category: 'Health',
    location: 'Global',
    priceNGN: 15000,
    priceUSD: 10,
    status: 'sale',
    description: 'Effective topical treatment to protect your pet from parasites.',
    images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'sup-8',
    name: 'Pet First Aid Kit',
    type: 'supply',
    category: 'Health',
    location: 'Global',
    priceNGN: 25000,
    priceUSD: 17,
    status: 'sale',
    description: 'Essential first aid supplies for pet emergencies.',
    images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'sup-9',
    name: 'Dog Grooming Kit',
    type: 'supply',
    category: 'Grooming',
    location: 'Global',
    priceNGN: 20000,
    priceUSD: 13,
    status: 'sale',
    description: 'Complete kit with clippers, scissors, and a brush for at-home grooming.',
    images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'sup-10',
    name: 'Cat Grooming Brush',
    type: 'supply',
    category: 'Grooming',
    location: 'Global',
    priceNGN: 9000,
    priceUSD: 6,
    status: 'sale',
    description: 'Gentle deshedding brush to reduce hairballs and keep coat shiny.',
    images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'sup-11',
    name: 'Deluxe Dog Crate (Medium)',
    type: 'supply',
    category: 'Housing',
    location: 'Global',
    priceNGN: 38000,
    priceUSD: 25,
    status: 'sale',
    description: 'Sturdy wire crate with a divider panel and leak-proof pan.',
    images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'sup-12',
    name: 'Interactive Pet Toy Bundle',
    type: 'supply',
    category: 'Accessories',
    location: 'Global',
    priceNGN: 14000,
    priceUSD: 9,
    status: 'sale',
    description: 'A bundle of engaging toys to keep your pet mentally stimulated.',
    images: ['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80']
  }
];

export const allProducts = [...dogs, ...cats, ...supplies];
