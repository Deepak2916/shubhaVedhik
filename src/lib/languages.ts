export interface LanguageOption {
  code: string
  name: string
  native: string
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
]

export const languageName = (code: string) => LANGUAGES.find((l) => l.code === code)?.name ?? code

export const RELIGIONS = [
  { value: 'hindu', label: 'Hindu' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'christian', label: 'Christian' },
  { value: 'sikh', label: 'Sikh' },
  { value: 'jain', label: 'Jain' },
  { value: 'buddhist', label: 'Buddhist' },
  { value: 'interfaith', label: 'Interfaith' },
  { value: 'other', label: 'Other' },
] as const

/**
 * Ceremony suggestions. These are starting points only — couples pick what
 * they actually observe and can add their own.
 */
export const TRADITION_SUGGESTIONS: Record<string, string[]> = {
  hindu: ['Roka', 'Nischitartham', 'Haldi', 'Mehendi', 'Sangeet', 'Pellikuthuru', 'Pellikoduku', 'Baraat', 'Kanyadaan', 'Jeelakarra Bellam', 'Talambralu', 'Saptapadi', 'Pheras', 'Muhurtham', 'Vidaai', 'Reception'],
  muslim: ['Mangni', 'Manjha', 'Mehndi', 'Nikah', 'Rukhsati', 'Walima'],
  christian: ['Engagement', 'Manasammatham', 'Bridal shower', 'Holy Matrimony', 'Minnu kettu', 'Nuptial Mass', 'Reception'],
  sikh: ['Roka', 'Kurmai', 'Chunni', 'Maiyan', 'Jaggo', 'Anand Karaj', 'Laavan', 'Doli', 'Reception'],
  jain: ['Sagai', 'Lagna Lekhan', 'Mandap Mahurat', 'Pheras', 'Reception'],
  buddhist: ['Engagement', 'Blessing ceremony', 'Pirith chanting', 'Poruwa', 'Reception'],
  interfaith: ['Engagement', 'Haldi', 'Mehendi', 'Sangeet', 'Wedding ceremony', 'Nikah', 'Church blessing', 'Anand Karaj', 'Reception'],
  other: ['Engagement', 'Welcome dinner', 'Wedding ceremony', 'Reception'],
}

export const EVENT_KINDS = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'haldi', label: 'Haldi' },
  { value: 'mehendi', label: 'Mehendi' },
  { value: 'sangeet', label: 'Sangeet' },
  { value: 'pellikuthuru', label: 'Pellikuthuru' },
  { value: 'pellikoduku', label: 'Pellikoduku' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'nikah', label: 'Nikah' },
  { value: 'church', label: 'Church ceremony' },
  { value: 'anand_karaj', label: 'Anand Karaj' },
  { value: 'reception', label: 'Reception' },
  { value: 'other', label: 'Other' },
] as const
