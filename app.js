const STORAGE_KEY = "recipe_app_recipes_v1";

const form = document.getElementById("recipeForm");
const editingIdInput = document.getElementById("editingId");
const urlInput = document.getElementById("urlInput");
const fetchButton = document.getElementById("fetchButton");
const fetchMessage = document.getElementById("fetchMessage");
const nameInput = document.getElementById("nameInput");
const ingredientsInput = document.getElementById("ingredientsInput");
const stepsInput = document.getElementById("stepsInput");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const searchBox = document.getElementById("searchBox");
const tabButtons = document.querySelectorAll(".tab-button");
const listEl = document.getElementById("list");
const cardTemplate = document.getElementById("cardTemplate");

let recipes = loadRecipes();
let currentStatusFilter = "all";

function generateId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadRecipes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveRecipes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

function resetForm() {
  form.reset();
  editingIdInput.value = "";
  submitButton.textContent = "追加";
  cancelEditButton.classList.add("hidden");
  fetchMessage.textContent = "";
}

function startEdit(recipe) {
  nameInput.value = recipe.name;
  urlInput.value = recipe.url || "";
  ingredientsInput.value = recipe.ingredients || "";
  stepsInput.value = recipe.steps || "";
  form.querySelector(`input[name="status"][value="${recipe.status}"]`).checked = true;
  editingIdInput.value = recipe.id;
  submitButton.textContent = "更新";
  cancelEditButton.classList.remove("hidden");
  fetchMessage.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function buildShareText(recipe) {
  let text = `【${recipe.name}】\n`;
  if (recipe.ingredients) {
    text += `材料:\n${recipe.ingredients}\n`;
  }
  if (recipe.steps) {
    text += `作り方:\n${recipe.steps}\n`;
  }
  if (recipe.url) {
    text += `リンク: ${recipe.url}\n`;
  }
  return text.trim();
}

function buildCard(recipe) {
  const node = cardTemplate.content.cloneNode(true);
  const card = node.querySelector(".card");

  const statusBadge = card.querySelector(".status-badge");
  statusBadge.textContent = recipe.status === "made" ? "作った" : "気になる";
  statusBadge.classList.add(recipe.status);

  card.querySelector(".card-name").textContent = recipe.name;

  const linkEl = card.querySelector(".card-link");
  if (recipe.url) {
    linkEl.href = recipe.url;
    linkEl.textContent = recipe.url;
  } else {
    linkEl.classList.add("hidden");
  }

  const detailEl = card.querySelector(".card-detail");
  const ingredientsEl = card.querySelector(".card-ingredients");
  const stepsEl = card.querySelector(".card-steps");
  ingredientsEl.textContent = recipe.ingredients ? `材料:\n${recipe.ingredients}` : "";
  stepsEl.textContent = recipe.steps ? `作り方:\n${recipe.steps}` : "";

  const toggleDetailButton = card.querySelector(".toggle-detail-button");
  toggleDetailButton.addEventListener("click", () => {
    const isHidden = detailEl.classList.toggle("hidden");
    toggleDetailButton.textContent = isHidden ? "詳細" : "閉じる";
  });

  const toggleStatusButton = card.querySelector(".toggle-status-button");
  if (recipe.status === "interested") {
    toggleStatusButton.classList.remove("hidden");
    toggleStatusButton.addEventListener("click", () => {
      recipe.status = "made";
      saveRecipes();
      renderList();
    });
  }

  const sendButton = card.querySelector(".send-button");
  const copyMessageEl = card.querySelector(".copy-message");
  sendButton.addEventListener("click", async () => {
    const text = buildShareText(recipe);
    try {
      await navigator.clipboard.writeText(text);
      copyMessageEl.textContent = "コピーしました!LINEやメールに貼り付けてください。";
    } catch (e) {
      copyMessageEl.textContent = "コピーに失敗しました。お使いのブラウザではこの機能が使えないかもしれません。";
    }
  });

  card.querySelector(".edit-button").addEventListener("click", () => {
    startEdit(recipe);
  });

  card.querySelector(".delete-button").addEventListener("click", () => {
    if (!confirm(`「${recipe.name}」を削除しますか?`)) return;
    recipes = recipes.filter((r) => r.id !== recipe.id);
    saveRecipes();
    renderList();
  });

  card.dataset.name = recipe.name.toLowerCase();
  card.dataset.ingredients = (recipe.ingredients || "").toLowerCase();
  card.dataset.status = recipe.status;

  return card;
}

function renderList() {
  listEl.innerHTML = "";
  for (const recipe of recipes) {
    listEl.appendChild(buildCard(recipe));
  }
  applyFilters();
}

function applyFilters() {
  const keyword = searchBox.value.trim().toLowerCase();
  listEl.querySelectorAll(".card").forEach((card) => {
    const matchesKeyword =
      !keyword || card.dataset.name.includes(keyword) || card.dataset.ingredients.includes(keyword);
    const matchesStatus = currentStatusFilter === "all" || card.dataset.status === currentStatusFilter;
    card.classList.toggle("hidden-by-filter", !(matchesKeyword && matchesStatus));
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;

  const recipeData = {
    name,
    url: urlInput.value.trim(),
    ingredients: ingredientsInput.value.trim(),
    steps: stepsInput.value.trim(),
    status: form.querySelector('input[name="status"]:checked').value,
  };

  if (editingIdInput.value) {
    const target = recipes.find((r) => r.id === editingIdInput.value);
    if (target) Object.assign(target, recipeData);
  } else {
    recipes.push({ id: generateId(), createdAt: Date.now(), ...recipeData });
  }

  saveRecipes();
  resetForm();
  renderList();
});

cancelEditButton.addEventListener("click", resetForm);
searchBox.addEventListener("input", applyFilters);

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentStatusFilter = btn.dataset.status;
    applyFilters();
  });
});

// --- リンクからの自動取得(補助機能。失敗しても手入力を妨げない) ---

function isYouTubeUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host === "youtu.be" || host.endsWith("youtube.com");
  } catch {
    return false;
  }
}

async function fetchYouTubeTitle(url) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembedUrl);
  if (!res.ok) throw new Error("oEmbed request failed");
  const data = await res.json();
  return data.title;
}

// レシピサイトはCORSで直接fetchできないことが多いため、公開プロキシ経由でHTMLを取得する
async function fetchRecipeSiteData(url) {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error("proxy request failed");
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

  for (const script of scripts) {
    let data;
    try {
      data = JSON.parse(script.textContent);
    } catch {
      continue;
    }
    const found = findRecipeObject(data);
    if (found) return found;
  }
  return null;
}

// schema.orgのRecipe構造はサイトによって配列/@graph/入れ子など形が異なるため再帰的に探す
function findRecipeObject(data) {
  const candidates = Array.isArray(data) ? data : [data];
  for (const item of candidates) {
    if (!item || typeof item !== "object") continue;
    if (item["@graph"]) {
      const found = findRecipeObject(item["@graph"]);
      if (found) return found;
    }
    const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
    if (types.includes("Recipe")) {
      return {
        name: item.name || "",
        ingredients: extractIngredients(item.recipeIngredient),
        steps: extractSteps(item.recipeInstructions),
      };
    }
  }
  return null;
}

function extractIngredients(list) {
  if (!list) return "";
  return Array.isArray(list) ? list.join("\n") : String(list);
}

function extractSteps(instructions) {
  if (!instructions) return "";
  if (typeof instructions === "string") return instructions;
  if (Array.isArray(instructions)) {
    return instructions
      .map((step, index) => {
        if (typeof step === "string") return `${index + 1}. ${step}`;
        if (step.text) return `${index + 1}. ${step.text}`;
        if (step.itemListElement) return extractSteps(step.itemListElement);
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

fetchButton.addEventListener("click", async () => {
  const url = urlInput.value.trim();
  if (!url) {
    fetchMessage.textContent = "URLを入力してください。";
    return;
  }

  fetchMessage.textContent = "読み込み中...";
  try {
    if (isYouTubeUrl(url)) {
      const title = await fetchYouTubeTitle(url);
      if (!title) throw new Error("no title");
      nameInput.value = title;
      fetchMessage.textContent = "動画タイトルを取得しました。材料・作り方は手入力してください。";
    } else {
      const recipe = await fetchRecipeSiteData(url);
      if (!recipe) throw new Error("no recipe data");
      if (recipe.name) nameInput.value = recipe.name;
      if (recipe.ingredients) ingredientsInput.value = recipe.ingredients;
      if (recipe.steps) stepsInput.value = recipe.steps;
      fetchMessage.textContent = "レシピ情報を取得しました。内容を確認してください。";
    }
  } catch (e) {
    fetchMessage.textContent = "自動取得できませんでした。お手数ですが手入力してください。";
  }
});

renderList();
