// Verileri LocalStorage'dan Çek
export function getRecipes() {
    return JSON.parse(localStorage.getItem('sweetLabRecipes')) || [];
}

// Veriyi Kaydet
export function saveRecipe(recipe) {
    const recipes = getRecipes();
    recipes.push(recipe);
    localStorage.setItem('sweetLabRecipes', JSON.stringify(recipes));
}

// Veriyi Sil
export function removeRecipeFromStorage(id) {
    let recipes = getRecipes();
    recipes = recipes.filter(r => r.id !== id);
    localStorage.setItem('sweetLabRecipes', JSON.stringify(recipes));
}