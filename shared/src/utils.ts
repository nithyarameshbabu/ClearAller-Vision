import type { SeverityLevel } from "./types.js";

export const severityWeight: Record<SeverityLevel, number> = {
  low: 0.25,
  medium: 0.5,
  high: 0.75,
  critical: 1
};

const stopPhrases = [
  "contains",
  "may contain",
  "allergen",
  "allergens",
  "warning",
  "distributed by",
  "imported by",
  "nutrition",
  "product description",
  "how to use",
  "description",
  "ingredients",
  "directions",
  "usage",
  "customer care",
  "best before",
  "manufactured by",
  "marketed by",
  "instructions",
  "method",
  "recipe",
  "blend together",
  "mix everything",
  "let the dough",
  "shape into",
  "top",
  "bake in",
  "cool completely",
  "preheated oven",
  "dairy based"
];

const metadataFieldPatterns = [
  /^brand\s*name\b/i,
  /^item\s*form\b/i,
  /^unit\s*count\b/i,
  /^container\s*type\b/i,
  /^product\s*shelf\s*life\b/i,
  /^shelf\s*life\b/i,
  /^speciality\b/i,
  /^specialty\b/i,
  /^variety\b/i,
  /^drink\s*variety\b/i,
  /^pasteuri[sz]ation\s*type\b/i,
  /^flavo[u]?r\b/i
];

const ingredientValueFieldPatterns = [
  /^allergen\s*information\b/i,
  /^special\s*ingredients\b/i,
  /^ingredients?\b/i
];

function stripLabelField(value: string): string {
  const trimmed = value.trim();

  if (metadataFieldPatterns.some((pattern) => pattern.test(trimmed))) {
    return "";
  }

  for (const pattern of ingredientValueFieldPatterns) {
    if (pattern.test(trimmed)) {
      return trimmed.replace(pattern, " ");
    }
  }

  return trimmed;
}

export function normalizeIngredientToken(value: string): string {
  return stripLabelField(value)
    .toLowerCase()
    .replace(/\bbrand\s*name\b/g, " ")
    .replace(/\ballergen\s*information\b/g, " ")
    .replace(/\bspecial\s*ingredients\b/g, " ")
    .replace(/\bitem\s*form\b/g, " ")
    .replace(/\bunit\s*count\b/g, " ")
    .replace(/\bcontainer\s*type\b/g, " ")
    .replace(/\bproduct\s*shelf\s*life\b/g, " ")
    .replace(/\bshelf\s*life\b/g, " ")
    .replace(/\bdrink\s*variety\b/g, " ")
    .replace(/\bpasteuri[sz]ation\s*type\b/g, " ")
    .replace(/\bflavo[u]?r\b/g, " ")
    .replace(/ingredients?\s*:/g, " ")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\((?:e\d+[a-z]?|ci\s*\d+|ins\s*\d+)\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b\d+\s*-\s*\d+\b/g, " ")
    .replace(/\b\d+\s*\/\s*\d+\b/g, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(%|mg|mcg|g|kg|ml|l|gram|grams|day|days|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pinch|pcs|pieces)\b/g, " ")
    .replace(/\b\d+(?:\.\d+)?\b/g, " ")
    .replace(/\b(gram|grams|day|days|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pinch|pcs|pieces)\b/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+-\s+/g, " ")
    .replace(/(^-|-$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeIngredient(value: string): boolean {
  if (!value || value.length < 3 || value.length > 80) {
    return false;
  }

  if (stopPhrases.some((phrase) => value.includes(phrase))) {
    return false;
  }

  if (value.split(" ").length > 8) {
    return false;
  }

  if (/\b(vitamin|mineral|daily value|serving|calorie|product|description|directions|smooth|dough|cookies|enjoy|oven|minutes|golden|grams|dairy based)\b/.test(value)) {
    return false;
  }

  if (/^[a-z]-?\d{1,4}$/.test(value)) {
    return false;
  }

  return true;
}

export function splitIngredients(text: string): string[] {
  const preparedText = text
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\|/g, "\n")
    .replace(/(Brand\s*Name|Allergen\s*Information|Item\s*Form|Unit\s*Count|Container\s*Type|Special\s*Ingredients|Product\s*Shelf\s*Life|Speciality|Specialty|Drink\s*Variety|Pasteuri[sz]ation\s*Type|Flavo[u]?r)/gi, "\n$1 ")
    .replace(/\b(and|with)\b/gi, ",");

  return Array.from(
    new Set(
      preparedText
        .split(/[,.;\n]+/g)
        .map((item) => normalizeIngredientToken(item))
        .filter((item) => looksLikeIngredient(item))
    )
  );
}
