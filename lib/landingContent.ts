export type TeamType = "Men" | "Women" | "Team";

export type Milestone = {
  year: string;
  event: string;
  team: TeamType;
  result: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  event: string;
  year: string;
  category: "Competition Day" | "Podium Moments" | "Team Spirit";
  team: TeamType;
  imageUrl: string;
  alt: string;
};

export const milestones: Milestone[] = [
  {
    year: "2025",
    event: "SLUG Championship",
    team: "Men",
    result: "Champions",
  },
  {
    year: "2025",
    event: "SLUG Championship",
    team: "Women",
    result: "2nd Runner-Up",
  },
  {
    year: "2024",
    event: "Inter-University Meet",
    team: "Men",
    result: "Champions",
  },
  {
    year: "2024",
    event: "Inter-University Meet",
    team: "Women",
    result: "5th Place",
  },
  {
    year: "2023",
    event: "SLUG Championship",
    team: "Men",
    result: "1st Runner-Up",
  },
  {
    year: "2023",
    event: "SLUG Championship",
    team: "Women",
    result: "4th Place",
  },
];

export const galleryItems: GalleryItem[] = [
  {
    id: "uom-squad-entry",
    title: "Team Entry Parade",
    event: "Inter-University Meet",
    year: "2025",
    category: "Competition Day",
    team: "Team",
    imageUrl:
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1400/sample.jpg",
    alt: "University swim team entering competition venue",
  },
  {
    id: "uom-podium-night",
    title: "Podium Celebration",
    event: "SLUG Championship",
    year: "2025",
    category: "Podium Moments",
    team: "Men",
    imageUrl:
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1400/docs/shoes.jpg",
    alt: "Team celebrating on podium after finals",
  },
  {
    id: "uom-lane-heat",
    title: "Final Heat Focus",
    event: "Inter-University Meet",
    year: "2024",
    category: "Competition Day",
    team: "Women",
    imageUrl:
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1400/docs/model.jpg",
    alt: "Athletes preparing at poolside before heat",
  },
  {
    id: "uom-team-circle",
    title: "Pre-Race Huddle",
    event: "SLUG Championship",
    year: "2024",
    category: "Team Spirit",
    team: "Team",
    imageUrl:
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1400/couple.jpg",
    alt: "Team huddle before race session",
  },
  {
    id: "uom-medal-line",
    title: "Medal Line-Up",
    event: "SLUG Championship",
    year: "2023",
    category: "Podium Moments",
    team: "Women",
    imageUrl:
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1400/dog.jpg",
    alt: "Athletes lined up with medals after event",
  },
  {
    id: "uom-support-stand",
    title: "Cheering Stands",
    event: "Inter-University Meet",
    year: "2023",
    category: "Team Spirit",
    team: "Team",
    imageUrl:
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1400/bike.jpg",
    alt: "Teammates cheering from stands during races",
  },
];

export const cultureLines: string[] = [
  "Discipline in every session, from warm-up to final lap.",
  "A team-first mindset where every split matters.",
  "Resilience under pressure, in water and in academics.",
  "Respect for teammates, rivals, and the sport itself.",
];
