import { readFileSync, writeFileSync } from 'node:fs';

const recipes = JSON.parse(readFileSync(new URL('../src/data/recipes.json', import.meta.url)));
const nutrition = JSON.parse(readFileSync(new URL('../src/data/nutrition.json', import.meta.url)));
const prompts = recipes.filter(recipe => !recipe.providedCard).map((recipe, index) => {
  const n = nutrition[recipe.id].perServing;
  const text = [
    `THE RECIPE SHELF / ${String(index + 1).padStart(2, '0')}`,
    recipe.title,
    recipe.time,
    ...recipe.ingredients.flatMap(group => [group.title.toUpperCase(), ...group.items]),
    ...recipe.method.flatMap(group => [group.title.toUpperCase(), ...group.steps.map((step, i) => `${i + 1}. ${step}`)]),
    ...recipe.notes.map(note => `RECIPE NOTE: ${note}`),
    `ESTIMATED NUTRITION / ${recipe.servingLabel}`,
    `${n.calories} kcal | PROTEIN ${n.protein} g | CARBS ${n.carbs} g | FAT ${n.fat} g`,
    ...recipe.assumptions,
    'Nutrition: USDA FoodData Central; ingredient and portion assumptions apply.',
  ].join('\n');
  return {
    id: recipe.id,
    referencePhoto: recipe.photo ? `public/photos/${recipe.photo}` : null,
    output: `public/recipe-cards/${recipe.id}.jpg`,
    prompt: `Use case: infographic-diagram. Asset type: complete photographic recipe card, one standalone portrait image, aspect ratio 2:3, ideally 1536×2304 or similar high resolution.\nCreate a beautifully typeset cookbook recipe card. Warm ivory paper, deep olive typography, fine ruled lines, generous but efficient margins, understated ${recipe.accent} accent. Crisp legible print typography, elegant large serif title, clean sans-serif body. Consistent editorial recipe-shelf series. No UI, no frames outside the page, no watermark.\n${recipe.photo ? 'Input image 1 is the user’s reference food photograph. Base the food photography on that exact homemade dish, retaining its distinctive appearance and texture; improve lighting and framing tastefully. For ice cream preserve the floral porcelain cup and wooden table.' : 'No reference photo exists for this recipe. Create natural editorial food photography showing only the described finished food, based on the ingredients. No invented reference attribution.'}\nComposition: a shallow photographic banner occupying at most the top 20–25%, followed by title, time, ingredients and numbered method. Use two columns for ingredients and method where needed, with full-width nutrition and assumption notes at the bottom. For long recipes allocate most space to text and reduce the photo to 15%. Everything must fit. All of the recipe content, numbers, units, recipe notes, nutrition and assumptions below MUST appear inside the image, exactly and legibly. Do not invent cooking steps, quantities or nutrition. Do not omit the nutrition panel. All temperatures are Celsius.\nText (verbatim):\n${text}`,
  };
}).map((entry, index) => {
  if (index === 0) return entry;
  const guidance = entry.referencePhoto
    ? '\nInput image 2 is a STYLE REFERENCE ONLY: the already-created Focaccia recipe card. Match its typography, ivory paper, olive dividers, food photograph banner, layout system, and nutrition footer. Use image 1 for the dish, never copy focaccia into this card.'
    : '\nThe attached image is a STYLE REFERENCE ONLY: the Focaccia recipe card. Match its typography, ivory paper, olive dividers, photo banner, layout, and nutrition footer. Generate the correct food for this recipe; never reuse the focaccia photograph or words.';
  return { ...entry, styleReference: 'public/recipe-cards/focaccia.jpg', prompt: entry.prompt + guidance };
});
writeFileSync(new URL('../assets/recipe-card-prompts.json', import.meta.url), `${JSON.stringify(prompts, null, 2)}\n`);
console.log(`Saved ${prompts.length} card prompts.`);
