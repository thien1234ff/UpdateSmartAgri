export interface DOMElementInfo {
  text: string;
  tagName?: string;
  role?: string;
  ariaLabel?: string;
  id?: string;
  type?: string;
  placeholder?: string;
  alt?: string;
}

export interface FormInfo {
  id?: string;
  ariaLabel?: string;
  inputs: DOMElementInfo[];
  buttons: DOMElementInfo[];
}

export interface TableInfo {
  id?: string;
  ariaLabel?: string;
  headers: string[];
  rowsCount: number;
  cells: string[];
}

export interface NavigationInfo {
  id?: string;
  ariaLabel?: string;
  links: DOMElementInfo[];
}

export interface CardInfo {
  title: string;
  content: string;
  buttons: DOMElementInfo[];
  links: DOMElementInfo[];
}

export interface DOMExtractedData {
  pageTitle: string;
  headings: DOMElementInfo[];
  paragraphs: string[];
  buttons: DOMElementInfo[];
  forms: FormInfo[];
  tables: TableInfo[];
  navigation: NavigationInfo[];
  cards: CardInfo[];
  alerts: DOMElementInfo[];
  dialogs: DOMElementInfo[];
  imageAlts: DOMElementInfo[];
  ariaLabels: DOMElementInfo[];
  validationMessages: DOMElementInfo[];
  landmarks: DOMElementInfo[];
  isCartOpen?: boolean;
  cartItems?: {
    name: string;
    price: string;
    quantity: string;
    actions: string[];
  }[];
  cartTotal?: string;
  isCheckoutOpen?: boolean;
}

export interface SpeechConfig {
  volume: number;      // 0 to 1
  rate: number;        // 0.5 to 2
  pitch: number;       // 0.5 to 2
  voiceName: string;   // SpeechSynthesisVoice name
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface FocusedElementData {
  text: string;
  type: string;
  tagName: string;
  id?: string;
  ariaLabel?: string;
  description?: string;
}
