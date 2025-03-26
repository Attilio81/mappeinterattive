export interface Activity {
  id: string;
  nome: string;
  descrizione: string;
  latitudine: number;
  longitudine: number;
  data: string;
  // Proprietà aggiuntive opzionali
  colorePin?: string;
  icona?: string;
  categoria?: string;
}
