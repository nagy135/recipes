import { useEffect, useRef, useState } from 'react';
import recipeData from './data/recipes.json';
import nutritionData from './data/nutrition.json';
import './styles.css';

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
const recipes = recipeData.map(recipe => ({ ...recipe, image: asset(`recipe-cards/${recipe.id}.jpg`), thumbnail: asset(`recipe-cards/${recipe.id}-small.jpg`), nutrition: nutritionData[recipe.id] }));
const categories = ['All recipes', 'Bread & dough', 'Sweet treats', 'Breakfast & snacks', 'Ice cream'];
const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').toLowerCase();

function Icon({ name, size = 20, ...props }) {
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    close: <><path d="m6 6 12 12M6 18 18 6" /></>,
    expand: <><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" /></>,
    text: <><path d="M4 5h16M4 10h16M4 15h10M4 20h7" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>,
    book: <><path d="M12 5v16M12 5C9 2 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-2-1-7-2-10 1Z" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

function Nutrition({ recipe }) {
  const [batch, setBatch] = useState(false);
  const values = recipe.nutrition[batch ? 'batch' : 'perServing'];
  return <section className="nutrition" aria-labelledby="nutrition-title">
    <div className="nutrition-heading">
      <h3 id="nutrition-title">Estimated nutrition</h3>
      <div className="portion-toggle" aria-label="Nutrition quantity">
        <button aria-pressed={!batch} onClick={() => setBatch(false)}>Per serving</button>
        <button aria-pressed={batch} onClick={() => setBatch(true)}>Whole batch</button>
      </div>
    </div>
    <p className="portion-label">{batch ? `Whole recipe · ${recipe.servings} ${recipe.servings === 1 ? 'serving' : 'servings'}` : recipe.servingLabel}</p>
    <dl className="nutrition-values">
      {[['calories', 'Calories', 'kcal'], ['protein', 'Protein', 'g'], ['carbs', 'Carbs', 'g'], ['fat', 'Fat', 'g']].map(([key, label, unit]) => <div key={key}><dd>{values[key]}<span>{unit}</span></dd><dt>{label}</dt></div>)}
    </dl>
    <details className="nutrition-notes">
      <summary>{recipe.providedNutrition ? 'Nutrition source and assumptions' : 'How this estimate was calculated'}</summary>
      <ul>{recipe.assumptions.map(note => <li key={note}>{note}</li>)}</ul>
      {recipe.providedNutrition ? <p>Estimates transcribed from the supplied recipe card, including its rounding. Values vary with ingredients, toppings, and portion size.</p> : <p>Calculated from ingredient weights using <a href="https://fdc.nal.usda.gov/download-datasets/" target="_blank" rel="noreferrer">USDA FoodData Central, SR Legacy</a>{recipe.id === 'doctors-bread' && <> and the <a href="https://www.nowfoods.com/products/supplements/psyllium-husks-whole" target="_blank" rel="noreferrer">NOW psyllium husk label</a></>}. Carbohydrate includes fibre. Values vary with brands, filling, toppings, and portion size.</p>}
    </details>
  </section>;
}

function RecipeDialog({ recipe, initialView, onClose }) {
  const ref = useRef(null);
  const [view, setView] = useState(initialView);
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return <dialog ref={ref} className={`recipe-dialog ${view === 'image' ? 'image-dialog' : ''}`} aria-labelledby="dialog-title" onClose={onClose} onClick={event => { if (event.target === event.currentTarget) ref.current.close(); }}>
    <div className="dialog-shell">
      <header className="dialog-toolbar">
        <div className="view-toggle" aria-label="Recipe view">
          <button aria-pressed={view === 'text'} onClick={() => setView('text')}><Icon name="text" size={16} />Text recipe</button>
          <button aria-pressed={view === 'image'} onClick={() => setView('image')}><Icon name="expand" size={16} />Image card</button>
        </div>
        <button className="icon-button close-button" autoFocus aria-label="Close recipe" onClick={() => ref.current.close()}><Icon name="close" /></button>
      </header>
      <div className="dialog-content">
        {view === 'image' ? <>
          <h2 id="dialog-title" className="sr-only">{recipe.title} recipe card</h2>
          <img className="full-card" src={recipe.image} alt={`${recipe.title}: image recipe with ingredients${recipe.method.length ? ', instructions' : ''}, and estimated nutrition. Use Text recipe for an accessible version.`} />
          <div className="image-actions"><a href={recipe.image} target="_blank" rel="noreferrer">Open full size <Icon name="expand" size={15} /></a><a href={recipe.image} download={`${recipe.id}-recipe.jpg`}>Save card <Icon name="download" size={16} /></a></div>
        </> : <div className="text-recipe">
          <span className="eyebrow">{recipe.category}</span>
          <h2 id="dialog-title">{recipe.title}</h2>
          <p className="recipe-description">{recipe.description}</p>
          <p className="recipe-time">{recipe.time}<span>All temperatures in °C</span></p>
          <Nutrition recipe={recipe} />
          {recipe.notes.length > 0 && <aside className="recipe-note"><h3>A note from the recipe book</h3>{recipe.notes.map(note => <p key={note}>{note}</p>)}</aside>}
          <div className="recipe-columns">
            <section className="ingredients"><h3>Ingredients</h3>{recipe.ingredients.map(group => <div className="ingredient-group" key={group.title}>{recipe.ingredients.length > 1 && <h4>{group.title}</h4>}<ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></div>)}</section>
            <section className="method"><h3>Method</h3>{recipe.method.length ? recipe.method.map(group => <div className="method-group" key={group.title}>{recipe.method.length > 1 && <h4>{group.title}</h4>}<ol>{group.steps.map(step => <li key={step}>{step}</li>)}</ol></div>) : <p className="missing-method">Cooking instructions were not included in the supplied recipe card.</p>}</section>
          </div>
          <footer className="recipe-footer"><span>Made to be made again.</span><a href={recipe.image} download={`${recipe.id}-recipe.jpg`}><Icon name="download" size={16} />Save image card</a></footer>
        </div>}
      </div>
    </div>
  </dialog>;
}

function RecipeCard({ recipe, index, onOpen }) {
  return <article className={`recipe-card accent-${recipe.accent}`} aria-label={recipe.title} style={{ '--card-index': index }}>
    <button className="card-image-button" aria-label={`View ${recipe.title} image card`} onClick={() => onOpen(recipe, 'image')}>
      <img src={recipe.thumbnail} srcSet={`${recipe.thumbnail} 520w, ${recipe.image} 1024w`} sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 960px) 45vw, 30vw" width="1024" height="1536" loading={index < 3 ? 'eager' : 'lazy'} decoding="async" alt={`${recipe.title} recipe card with ingredients${recipe.method.length ? ', method' : ''}, calories, protein, carbs, and fat`} />
      <span className="image-hover"><Icon name="expand" size={17} />Take a closer look</span>
    </button>
    <button className="description-button" aria-label={`Description and instructions for ${recipe.title}`} onClick={() => onOpen(recipe, 'text')}><span><Icon name="text" size={16} />Description & instructions</span><Icon name="arrow" size={18} /></button>
  </article>;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All recipes');
  const [selected, setSelected] = useState(null);
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  const visible = recipes.filter(recipe => {
    const haystack = normalize([recipe.title, recipe.id, recipe.source.replace(/[_-]/g, ' '), recipe.category, recipe.description, ...recipe.ingredients.flatMap(group => group.items)].join(' '));
    return (category === 'All recipes' || recipe.category === category) && words.every(word => haystack.includes(word));
  });
  const reset = () => { setQuery(''); setCategory('All recipes'); };
  return <>
    <a className="skip-link" href="#collection">Skip to recipes</a>
    <div className="page-wrap">
      <main>
        <h1 className="sr-only">Recipes</h1>
        <section id="collection" className="collection" aria-label="Recipe collection">
          <div className="collection-tools">
            <div className="category-filters" aria-label="Filter by category">{categories.map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}{item === 'All recipes' && <span>{recipes.length}</span>}</button>)}</div>
            <label className="search-field"><Icon name="search" size={18} /><span className="sr-only">Search recipes or ingredients</span><input type="search" placeholder="Find a recipe or ingredient" value={query} onChange={event => setQuery(event.target.value)} /></label>
          </div>
          <div className="collection-meta"><p aria-live="polite">{visible.length} {visible.length === 1 ? 'recipe' : 'recipes'}{query || category !== 'All recipes' ? ' found' : ''}</p></div>
          {visible.length ? <div className="recipe-grid">{visible.map((recipe, index) => <RecipeCard key={recipe.id} recipe={recipe} index={index} onOpen={(recipe, view) => setSelected({ recipe, view })} />)}</div> : <div className="empty-state"><Icon name="search" size={28} /><h2>Nothing on this shelf just yet.</h2><p>Try another ingredient or explore the whole collection.</p><button className="reset-button" onClick={reset}>Show all recipes <Icon name="arrow" size={17} /></button></div>}
        </section>
      </main>
      <footer className="site-footer"><span><Icon name="book" size={16} />A small collection. A lot of good meals.</span><span>Made at home. Kept here.</span></footer>
    </div>
    {selected && <RecipeDialog recipe={selected.recipe} initialView={selected.view} onClose={() => setSelected(null)} />}
  </>;
}

