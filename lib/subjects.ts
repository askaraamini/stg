export interface SubjectMeta {
  imageUrl: string;
  gradient: string;
  textColor: string;
  progressColor: string;
  ringColor: string;
}

export const SUBJECT_ICONS: Record<string, SubjectMeta> = {
  "Matematika": {
    imageUrl: "",
    gradient: "from-purple-100 to-pink-100",
    textColor: "text-purple-900",
    progressColor: "bg-purple-600",
    ringColor: "#fdc003",
  },
  "IPA (Sains)": {
    imageUrl: "",
    gradient: "from-blue-100 to-teal-100",
    textColor: "text-blue-900",
    progressColor: "bg-teal-600",
    ringColor: "#005da7",
  },
  "IPS (Sejarah)": {
    imageUrl: "",
    gradient: "from-orange-50 to-yellow-100",
    textColor: "text-orange-900",
    progressColor: "bg-orange-500",
    ringColor: "#785900",
  },
  "Bahasa Inggris": {
    imageUrl: "",
    gradient: "from-indigo-100 to-blue-100",
    textColor: "text-indigo-900",
    progressColor: "bg-indigo-600",
    ringColor: "#005da7",
  },
  "Bahasa Indonesia": {
    imageUrl: "",
    gradient: "from-red-50 to-orange-100",
    textColor: "text-red-900",
    progressColor: "bg-red-600",
    ringColor: "#ba1a1a",
  },
  "Seni & Budaya": {
    imageUrl: "",
    gradient: "from-emerald-100 to-green-100",
    textColor: "text-emerald-900",
    progressColor: "bg-emerald-600",
    ringColor: "#0060ac",
  },
};

export const SUBJECT_ORDER = [
  "Matematika",
  "IPA (Sains)",
  "IPS (Sejarah)",
  "Bahasa Inggris",
  "Bahasa Indonesia",
  "Seni & Budaya",
];

export const SUBJECT_HERO_GRADIENTS: Record<string, string> = {
  "Matematika": "from-purple-600 to-indigo-600",
  "IPA (Sains)": "from-blue-600 to-teal-600",
  "IPS (Sejarah)": "from-orange-600 to-yellow-600",
  "Bahasa Inggris": "from-indigo-600 to-blue-600",
  "Bahasa Indonesia": "from-red-600 to-orange-600",
  "Seni & Budaya": "from-emerald-600 to-green-600",
};

export const SUBJECT_IMAGE_FILE: Record<string, string> = {
  "Matematika": "/images/Matematika.png",
  "IPA (Sains)": "/images/IPA.png",
  "IPS (Sejarah)": "/images/IPS.png",
  "Bahasa Inggris": "/images/Bahasa inggris.png",
  "Bahasa Indonesia": "/images/Bahasa Indonesia.png",
  "Seni & Budaya": "/images/Seni & Budaya.png",
};

export const SUBJECT_ICON_NAMES: Record<string, string> = {
  "Matematika": "calculate",
  "IPA (Sains)": "science",
  "IPS (Sejarah)": "history_edu",
  "Bahasa Inggris": "language",
  "Bahasa Indonesia": "translate",
  "Seni & Budaya": "palette",
};
