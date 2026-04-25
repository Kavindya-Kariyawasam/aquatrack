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
    id: "uom-learn-to-swim-2026",
    title: "Swim or Sink",
    event: "Learn-to-Swim Program",
    year: "2026",
    category: "Team Spirit",
    team: "Team",
    imageUrl:
      "https://res.cloudinary.com/dhgwrlkrp/image/upload/f_auto,q_auto,w_1400/v1777104237/Learn_to_Swim_26_cftsrg.png",
    alt: "Learn to Swim program 2026",
  },
  {
    id: "uom-colors-awards-2025",
    title: "Swimming Colors Awardees",
    event: "UOM Colors Awards",
    year: "2025",
    category: "Podium Moments",
    team: "Team",
    imageUrl:
      "https://res.cloudinary.com/dhgwrlkrp/image/upload/f_auto,q_auto,w_1400/v1777134750/UOM_Colors_Awards_25_arxiux.jpg",
    alt: "UOM Swimming Colors awardees",
  },
  {
    id: "uom-slug-squad-2025",
    title: "Overall Runners-Up",
    event: "SLUG Championship",
    year: "2025",
    category: "Podium Moments",
    team: "Team",
    imageUrl:
      "https://res.cloudinary.com/dhgwrlkrp/image/upload/f_auto,q_auto,w_1400/v1777094454/Full_Team_Posed_-_SLUG_2025_ltxfui.jpg",
    alt: "Team celebrating overall runners-up on podium",
  },
  {
    id: "uom-after-party-2025",
    title: "Champions Dinner Outing",
    event: "After-Party Celebration",
    year: "2025",
    category: "Team Spirit",
    team: "Team",
    imageUrl:
      "https://res.cloudinary.com/dhgwrlkrp/image/upload/f_auto,q_auto,w_1400/v1777133983/After_Party_Dinner_Out_25_v0msp9.jpg",
    alt: "Team outing to celebrate championship win with dinner and fun",
  },
  {
    id: "uom-team-trip-2024",
    title: "Team trip to Mirissa",
    event: "Team Trip",
    year: "2024",
    category: "Team Spirit",
    team: "Team",
    imageUrl:
      "https://res.cloudinary.com/dhgwrlkrp/image/upload/f_auto,q_auto,w_1400/v1777136688/Team_Trip_24_sdueoy.jpg",
    alt: "Team trip to Mirissa for bonding",
  },
  {
    id: "uom-inter-university-2024",
    title: "Inter-University Championship Team",
    event: "Inter-University Meet",
    year: "2024",
    category: "Competition Day",
    team: "Team",
    imageUrl:
      "https://res.cloudinary.com/dhgwrlkrp/image/upload/f_auto,q_auto,w_1400/v1777136003/Inter_Uni_24_m15kae.jpg",
    alt: "Inter-University Championship team posing",
  },
  {
    id: "uom-slug-championship-2023",
    title: "SLUG Championship Team",
    event: "SLUG Championship",
    year: "2023",
    category: "Competition Day",
    team: "Team",
    imageUrl:
      "https://res.cloudinary.com/dhgwrlkrp/image/upload/f_auto,q_auto,w_1400/v1777136987/SLUG_23_bioprn.jpg",
    alt: "SLUG Championship team posing and race day action",
  },
];

export const cultureLines: string[] = [
  "Discipline in every session, from warm-up to final lap.",
  "A team-first mindset where every split matters.",
  "Resilience under pressure, in water and in academics.",
  "Respect for teammates, rivals, and the sport itself.",
];
