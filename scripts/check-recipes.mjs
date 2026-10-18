import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root)));
const recipes = read('src/data/recipes.json');
const nutrition = read('src/data/nutrition.json');
const manifest = read('assets/generated-cards.json');
const ids = new Set();
for (const recipe of recipes) {
  assert(!ids.has(recipe.id), `Duplicate recipe: ${recipe.id}`);
  ids.add(recipe.id);
  assert(recipe.servings > 0 && recipe.assumptions.length > 0, `Missing serving assumptions: ${recipe.id}`);
  assert(recipe.ingredients.length && (recipe.method.length || (recipe.providedCard && recipe.notes.length)), `Incomplete recipe: ${recipe.id}`);
  assert(existsSync(new URL(`recipes/${recipe.source}`, root)), `Missing original notes: ${recipe.source}`);
  if (recipe.photo) assert(existsSync(new URL(`public/photos/${recipe.photo}`, root)), `Missing source photo: ${recipe.id}`);
  if (recipe.providedCard) assert(existsSync(new URL(recipe.providedCard, root)), `Missing supplied card: ${recipe.id}`);
  for (const suffix of ['.jpg', '-small.jpg']) assert(existsSync(new URL(`public/recipe-cards/${recipe.id}${suffix}`, root)), `Missing recipe card: ${recipe.id}${suffix}`);
  for (const key of ['calories', 'protein', 'carbs', 'fat']) {
    assert(Number.isFinite(nutrition[recipe.id]?.perServing[key]) && nutrition[recipe.id].perServing[key] >= 0, `Missing nutrition: ${recipe.id} / ${key}`);
    const tolerance = key === 'calories' ? recipe.servings : recipe.servings * (recipe.nutritionRounding ?? 0.1);
    assert(Math.abs(nutrition[recipe.id].perServing[key] * recipe.servings - nutrition[recipe.id].batch[key]) <= tolerance, `Serving and batch nutrition disagree: ${recipe.id}`);
  }
  const hash = createHash('sha256').update(JSON.stringify({ recipe, nutrition: nutrition[recipe.id] })).digest('hex');
  assert.equal(manifest[recipe.id]?.contentHash, hash, `Recipe or nutrition changed since the image was generated: ${recipe.id}. Update its card and manifest.`);
}
for (const file of readdirSync(new URL('recipes/', root)).filter(name => name.endsWith('.md'))) {
  assert(recipes.some(recipe => recipe.source === file), `Original recipe omitted from app: ${file}`);
}
assert.equal(Object.keys(nutrition).length, recipes.length, 'Orphaned nutrition entry');
console.log(`Verified ${recipes.length} recipes: original notes, photos, image cards, and matching nutrition.`);
