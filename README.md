# The recipe shelf

A small React + Vite cookbook that opens directly to the recipe filters and image gallery. Cards include ingredients, available instructions, calories, protein, carbs, and fat. Cards open at full size; **Description & instructions** opens an accessible text recipe with serving/batch nutrition. Search by recipe name or ingredient, or filter by category.

The interface follows your system's light or dark appearance automatically, including changes while the page is open. Recipe card images keep their original colours.

## Run locally

```sh
npm install
npm run dev
```

Vite prints the local URL. `npm run build` validates the collection and creates `dist/`. `npm run preview` serves that production build. The app is static and can be hosted under a subdirectory; it needs no server, login, or API key.

## Collection

All 11 original Markdown files are preserved in `recipes/`, with their photo links updated. Both flavours from `icecream.md` have their own cards. The supplied Kaiserschmarrn card brings the collection to 13 recipes, with a text transcription in `recipes/kaiserschmarrn.md`. The seven original photos and the unmodified supplied card are in `public/photos/`. Four recipes had no source photo; their card photography was generated from the ingredient descriptions.

- `src/data/recipes.json` — recipe text, ingredient quantities, serving sizes, and nutrition assumptions.
- `src/data/ingredient-nutrition.json` — nutrient profiles per 100 g, with individual food IDs and source URLs.
- `src/data/nutrition.json` — calculated per-serving and whole-batch calories, protein, carbohydrate, and fat.
- `public/recipe-cards/` — full image cards and smaller gallery versions.
- `assets/recipe-card-prompts.json` — exact content prompts for the 12 generated cards; supplied cards are excluded from generation.
- `assets/generated-cards.json` — generated/supplied card provenance and recipe content hashes.
- `assets/card-corrections.json` — targeted image correction prompts and their outputs.

## Nutrition

Values are **estimates**, calculated from ingredient weights using [USDA FoodData Central SR Legacy](https://fdc.nal.usda.gov/download-datasets/) and the [NOW Foods whole psyllium husk label](https://www.nowfoods.com/products/supplements/psyllium-husks-whole). Carbohydrate includes fibre. Energy is taken from the ingredient database, rather than reconstructed using 4/4/9 factors.

Kaiserschmarrn preserves the supplied card's estimates and rounding: 1,180 kcal per full recipe, or 590 kcal per half recipe. Its values live in `providedNutrition` and are retained by `npm run nutrition`. Its supplied image has no cooking method; this is explicitly marked in the text view.

Yield and unspecified ingredient amounts are explicitly assumed and listed on the card and in each text recipe's nutrition notes. Pizza nutrition covers dough only; steamed bun nutrition covers dough without filling or extra steamer oil. Tartlet nutrition assumes five tartlets using all three components. Milk/cream volume-to-weight conversions and other substitutions are recorded per recipe. Different brands, portion sizes, and toppings change the results.

The original pizza notes omit baking details, tartlets omit baking/assembly details, and the bun method omits when to add its listed oil and salt. Those gaps are called out in both versions.

## Deploy to nixpi

The site is served at [recipes.infiniter.tech](https://recipes.infiniter.tech/) by nixpi's nginx, using `/var/www/recipes/current` and versioned releases. HTTP redirects to HTTPS, matching the other static sites on this host. nginx, ACME, release directories, and dynamic DNS are declared in `nix-server/hosts/nixpi`.

After committing changes, run `npm run deploy:nixpi` from the Mac. This builds and validates the site, transfers the committed source to `/home/infiniter/services/recipes` over Git, uploads `dist/`, and atomically switches the `current` symlink. Older releases remain available for rollback. The Pi checkout keeps its GitHub `origin`; Git pushes into its checked-out branch use `receive.denyCurrentBranch=updateInstead`.

## Update a recipe

1. Edit `src/data/recipes.json` and, if needed, ingredient nutrient profiles.
2. Run `npm run nutrition` and `npm run card-prompts`.
3. Regenerate the affected image card using its saved prompt and source photo. The built-in image generation tool was used for this collection. Save a full-size JPEG and a 520 px-wide `-small.jpg` gallery copy.
4. Update its provenance and content hash in `assets/generated-cards.json` after checking the card's text and nutrition.
5. Run `npm run build`. The content hash check prevents silently shipping an old card after changing the text or nutrition.

`package-lock.json` pins the installed dependencies. Google Fonts enhance the typography when available, with local font fallbacks when offline.
