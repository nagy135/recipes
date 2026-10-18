import { readFileSync, writeFileSync } from 'node:fs';

const recipes = JSON.parse(readFileSync(new URL('../src/data/recipes.json', import.meta.url)));
const ingredients = JSON.parse(readFileSync(new URL('../src/data/ingredient-nutrition.json', import.meta.url)));
const nutrients = ['calories', 'protein', 'carbs', 'fat'];
const rounded = (values) => Object.fromEntries(nutrients.map(key => [key, key === 'calories' ? Math.round(values[key]) : Math.round(values[key] * 10) / 10]));

const nutrition = Object.fromEntries(recipes.map(recipe => {
  if (recipe.providedNutrition) return [recipe.id, recipe.providedNutrition];
  const batch = Object.fromEntries(nutrients.map(key => [key, 0]));
  for (const [food, grams] of recipe.nutritionInputs) {
    if (!ingredients[food] || !Number.isFinite(grams) || grams < 0) throw new Error(`Invalid nutrition input: ${recipe.id} / ${food}`);
    for (const key of nutrients) batch[key] += ingredients[food].per100g[key] * grams / 100;
  }
  return [recipe.id, {
    perServing: rounded(Object.fromEntries(nutrients.map(key => [key, batch[key] / recipe.servings]))),
    batch: rounded(batch),
  }];
}));

writeFileSync(new URL('../src/data/nutrition.json', import.meta.url), `${JSON.stringify(nutrition, null, 2)}\n`);
console.log(`Calculated calories, protein, carbs, and fat for ${recipes.length} recipes.`);
