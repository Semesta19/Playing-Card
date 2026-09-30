export type Rank =
  | 'Ace'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'Jack'
  | 'Queen'
  | 'King'
  | 'Joker';

export type RankLetter =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | '★';

export type Suit = 'Diamond' | 'Heart' | 'Club' | 'Spade' | 'None';
export type SuitSymbol = '♢' | '♡' | '♧' | '♤' | '★';
export type SuitColor = 'red' | 'black';

/**
 * rank & rankLetter bertipe string (bukan union ketat) supaya nama kartu
 * bisa dikustomisasi pengguna, mis. "V" untuk Valet atau "D" untuk Dame.
 */
export interface CardOption {
  id: string;
  rank: Rank | string;
  rankLetter: RankLetter | string;
  suit: Suit;
  suitSymbol: SuitSymbol;
  suitColor: SuitColor;
  label: string;
}

export interface PromptResult {
  fullPrompt: string;
  rank: Rank | string;
  rankLetter: RankLetter | string;
  suit: Suit;
  suitColor: SuitColor;
  symbolicObjectDesc: string;
}