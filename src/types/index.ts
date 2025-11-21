export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Word = {
    word: string;
    meaning: string;
    difficulty: Difficulty;
};

export interface ValidateSentenceResponse {
  score: number;
  level: string;
  suggestion: string;
  corrected_sentence: string;
}