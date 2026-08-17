const STORAGE_KEY = "recipe_app_recipes_v1";

const form = document.getElementById("recipeForm");
const editingIdInput = document.getElementById("editingId");
const urlInput = document.getElementById("urlInput");
const fetchButton = document.getElementById("fetchButton");
const fetchMessage = document.getElementById("fetchMessage");
const pasteHtmlInput = document.getElementById("pasteHtmlInput");
const parsePasteButton = document.getElementById("parsePasteButton");
const nameInput = document.getElementById("nameInput");
const ingredientsInput = document.getElementById("ingredientsInput");
const servingsInput = document.getElementById("servingsInput");
const stepsInput = document.getElementById("stepsInput");
const photoInput = document.getElementById("photoInput");
const photoPreviewRow = document.getElementById("photoPreviewRow");
const photoPreview = document.getElementById("photoPreview");
const removePhotoButton = document.getElementById("removePhotoButton");
const starButtons = document.querySelectorAll(".star-button");
const noteInput = document.getElementById("noteInput");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const searchBox = document.getElementById("searchBox");
const tabButtons = document.querySelectorAll(".tab-button");
const listEl = document.getElementById("list");
const cardTemplate = document.getElementById("cardTemplate");
const randomPickButton = document.getElementById("randomPickButton");
const togglePlannerButton = document.getElementById("togglePlannerButton");
const plannerPanel = document.getElementById("plannerPanel");
const plannerDaysEl = document.getElementById("plannerDays");
const buildShoppingListButton = document.getElementById("buildShoppingListButton");
const recipesTabButton = document.getElementById("recipesTabButton");
const shoppingTabButton = document.getElementById("shoppingTabButton");
const recipesView = document.getElementById("recipesView");
const shoppingView = document.getElementById("shoppingView");
const shoppingItemInput = document.getElementById("shoppingItemInput");
const addShoppingItemButton = document.getElementById("addShoppingItemButton");
const shoppingListEl = document.getElementById("shoppingListEl");
const clearCheckedButton = document.getElementById("clearCheckedButton");
const clearAllButton = document.getElementById("clearAllButton");
const toggleTimerButton = document.getElementById("toggleTimerButton");
const timerPanel = document.getElementById("timerPanel");
const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");
const presetButtons = document.querySelectorAll(".preset-button");
const timerCustomMinutes = document.getElementById("timerCustomMinutes");
const timerStartCustomButton = document.getElementById("timerStartCustomButton");
const timerPauseResumeButton = document.getElementById("timerPauseResumeButton");
const timerResetButton = document.getElementById("timerResetButton");
const installBanner = document.getElementById("installBanner");
const installBannerText = document.getElementById("installBannerText");
const installActionButton = document.getElementById("installActionButton");
const dismissInstallBannerButton = document.getElementById("dismissInstallBannerButton");

const WEEK_PLAN_KEY = "recipe_app_week_plan_v1";
const DAY_NAMES = ["月", "火", "水", "木", "金", "土", "日"];
const SHOPPING_LIST_KEY = "recipe_app_shopping_list_v1";

let recipes = loadRecipes();
let weekPlan = loadWeekPlan();
let shoppingList = loadShoppingList();
let currentStatusFilter = "all";
let pendingPhotoDataUrl = null;
let pendingRating = 0;

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

function loadWeekPlan() {
  const raw = localStorage.getItem(WEEK_PLAN_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveWeekPlan() {
  localStorage.setItem(WEEK_PLAN_KEY, JSON.stringify(weekPlan));
}

function loadShoppingList() {
  const raw = localStorage.getItem(SHOPPING_LIST_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveShoppingList() {
  localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(shoppingList));
}

function addShoppingItems(lines, source) {
  lines.forEach((text) => {
    shoppingList.push({ id: generateId(), text, checked: false, source: source || null });
  });
  saveShoppingList();
  renderShoppingList();
}

function renderShoppingList() {
  shoppingListEl.innerHTML = "";
  // 未チェックを上、チェック済みを下にして、スーパーで見やすくする
  const sortedList = [...shoppingList].sort((a, b) => Number(a.checked) - Number(b.checked));

  sortedList.forEach((item) => {
    const li = document.createElement("li");
    if (item.checked) li.classList.add("checked");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;
    checkbox.addEventListener("change", () => {
      item.checked = checkbox.checked;
      saveShoppingList();
      renderShoppingList();
    });

    const span = document.createElement("span");
    span.className = "shopping-item-text";
    span.textContent = item.text;
    if (item.source) {
      const sourceSpan = document.createElement("span");
      sourceSpan.className = "shopping-item-source";
      sourceSpan.textContent = `(${item.source})`;
      span.appendChild(sourceSpan);
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "shopping-item-delete";
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => {
      shoppingList = shoppingList.filter((i) => i.id !== item.id);
      saveShoppingList();
      renderShoppingList();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteButton);
    shoppingListEl.appendChild(li);
  });
}

function setRatingDisplay(value) {
  starButtons.forEach((btn) => {
    btn.classList.toggle("filled", Number(btn.dataset.value) <= value);
  });
}

function resetForm() {
  form.reset();
  editingIdInput.value = "";
  submitButton.textContent = "追加";
  cancelEditButton.classList.add("hidden");
  fetchMessage.textContent = "";
  pendingPhotoDataUrl = null;
  photoPreview.src = "";
  photoPreviewRow.classList.add("hidden");
  pendingRating = 0;
  setRatingDisplay(0);
}

function startEdit(recipe) {
  nameInput.value = recipe.name;
  urlInput.value = recipe.url || "";
  ingredientsInput.value = recipe.ingredients || "";
  servingsInput.value = recipe.servings || "";
  stepsInput.value = recipe.steps || "";
  noteInput.value = recipe.note || "";
  form.querySelector(`input[name="status"][value="${recipe.status}"]`).checked = true;
  editingIdInput.value = recipe.id;
  submitButton.textContent = "更新";
  cancelEditButton.classList.remove("hidden");
  fetchMessage.textContent = "";

  pendingRating = recipe.rating || 0;
  setRatingDisplay(pendingRating);

  pendingPhotoDataUrl = recipe.photo || null;
  if (recipe.photo) {
    photoPreview.src = recipe.photo;
    photoPreviewRow.classList.remove("hidden");
  } else {
    photoPreview.src = "";
    photoPreviewRow.classList.add("hidden");
  }

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

// 材料タグの自動生成に使うキーワード辞書(ベストエフォート。網羅は目指さない)
const INGREDIENT_TAGS = [
  "鶏肉", "豚肉", "牛肉", "ひき肉", "ベーコン", "ソーセージ", "ハム",
  "魚", "鮭", "さば", "まぐろ", "えび", "いか", "たこ", "ツナ",
  "卵", "豆腐", "納豆", "牛乳", "チーズ", "バター", "ヨーグルト",
  "玉ねぎ", "にんじん", "じゃがいも", "キャベツ", "白菜", "ほうれん草",
  "トマト", "きゅうり", "なす", "ピーマン", "もやし", "ねぎ", "大根",
  "きのこ", "しいたけ", "えのき", "ブロッコリー", "アスパラ",
  "米", "ごはん", "パスタ", "うどん", "そば", "パン",
];

function extractIngredientTags(ingredientsText) {
  if (!ingredientsText) return [];
  return INGREDIENT_TAGS.filter((tag) => ingredientsText.includes(tag));
}

function splitIngredientLines(ingredients) {
  return (ingredients || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// 分量計算(人数変更): 材料の各行にある数値・簡単な分数(例:1/2)を比率倍にする
// あくまで自由記述テキストへのベストエフォートな置換であり、完璧な計算は保証しない
function scaleIngredientLine(line, ratio) {
  if (!ratio || ratio === 1) return line;
  return line.replace(/\d+\/\d+|\d+(?:\.\d+)?/g, (match) => {
    let value;
    if (match.includes("/")) {
      const [n, d] = match.split("/").map(Number);
      value = d ? n / d : n;
    } else {
      value = Number(match);
    }
    const scaled = Math.round(value * ratio * 100) / 100;
    return String(scaled);
  });
}

function renderIngredientsChecklist(listEl, recipe, ratio) {
  listEl.innerHTML = "";
  const lines = splitIngredientLines(recipe.ingredients);
  const checked = new Set(recipe.checkedIngredients || []);

  lines.forEach((line, index) => {
    const li = document.createElement("li");
    if (checked.has(index)) li.classList.add("checked");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checked.has(index);
    checkbox.addEventListener("change", () => {
      const set = new Set(recipe.checkedIngredients || []);
      if (checkbox.checked) {
        set.add(index);
      } else {
        set.delete(index);
      }
      recipe.checkedIngredients = [...set];
      li.classList.toggle("checked", checkbox.checked);
      saveRecipes();
    });

    const span = document.createElement("span");
    span.textContent = scaleIngredientLine(line, ratio);

    li.appendChild(checkbox);
    li.appendChild(span);
    listEl.appendChild(li);
  });
}

function buildCard(recipe) {
  const node = cardTemplate.content.cloneNode(true);
  const card = node.querySelector(".card");

  const statusBadge = card.querySelector(".status-badge");
  statusBadge.textContent = recipe.status === "made" ? "作った" : "気になる";
  statusBadge.classList.add(recipe.status);

  card.querySelector(".card-name").textContent = recipe.name;

  const ratingEl = card.querySelector(".card-rating");
  if (recipe.rating) {
    ratingEl.textContent = "★".repeat(recipe.rating) + "☆".repeat(5 - recipe.rating);
  }

  const tagsEl = card.querySelector(".card-tags");
  extractIngredientTags(recipe.ingredients).forEach((tag) => {
    const tagButton = document.createElement("button");
    tagButton.type = "button";
    tagButton.className = "tag-button";
    tagButton.textContent = tag;
    tagButton.addEventListener("click", () => {
      searchBox.value = tag;
      applyFilters();
    });
    tagsEl.appendChild(tagButton);
  });

  const thumbEl = card.querySelector(".card-thumb");
  const photoFullEl = card.querySelector(".card-photo-full");
  if (recipe.photo) {
    thumbEl.src = recipe.photo;
    thumbEl.classList.remove("hidden");
    photoFullEl.src = recipe.photo;
    photoFullEl.classList.remove("hidden");
  }

  const linkEl = card.querySelector(".card-link");
  if (recipe.url) {
    linkEl.href = recipe.url;
    linkEl.textContent = recipe.url;
  } else {
    linkEl.classList.add("hidden");
  }

  const detailEl = card.querySelector(".card-detail");
  const stepsEl = card.querySelector(".card-steps");
  stepsEl.textContent = recipe.steps ? `作り方:\n${recipe.steps}` : "";

  const noteEl = card.querySelector(".card-note");
  noteEl.textContent = recipe.note ? `メモ: ${recipe.note}` : "";

  const ingredientsListEl = card.querySelector(".ingredients-checklist");
  const ingredientsLabelEl = card.querySelector(".ingredients-label");
  const resetCheckButton = card.querySelector(".reset-check-button");
  const ingredientLines = splitIngredientLines(recipe.ingredients);
  let currentRatio = 1;

  if (ingredientLines.length > 0) {
    ingredientsLabelEl.classList.remove("hidden");
    resetCheckButton.classList.remove("hidden");
  }

  const servingsControl = card.querySelector(".servings-control");
  const servingsInputEl = card.querySelector(".servings-input");
  if (recipe.servings) {
    servingsControl.classList.remove("hidden");
    servingsInputEl.value = recipe.servings;
    servingsInputEl.addEventListener("input", () => {
      const newServings = Number(servingsInputEl.value);
      currentRatio = newServings > 0 ? newServings / recipe.servings : 1;
      renderIngredientsChecklist(ingredientsListEl, recipe, currentRatio);
    });
  }

  renderIngredientsChecklist(ingredientsListEl, recipe, currentRatio);

  resetCheckButton.addEventListener("click", () => {
    recipe.checkedIngredients = [];
    saveRecipes();
    renderIngredientsChecklist(ingredientsListEl, recipe, currentRatio);
  });

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

  const sendToShoppingButton = card.querySelector(".send-to-shopping-button");
  const copyMessageEl = card.querySelector(".copy-message");
  sendToShoppingButton.addEventListener("click", () => {
    const lines = splitIngredientLines(recipe.ingredients).map((line) =>
      scaleIngredientLine(line, currentRatio)
    );
    if (lines.length === 0) {
      copyMessageEl.textContent = "材料が登録されていません。";
      return;
    }
    addShoppingItems(lines, recipe.name);
    copyMessageEl.textContent = `${lines.length}件を買い物リストに追加しました。`;
  });

  const sendButton = card.querySelector(".send-button");
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

  card.dataset.id = recipe.id;
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
  renderPlannerDays();
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

// --- 写真添付(任意。localStorageの容量を圧迫しないよう、保存前に縮小・圧縮する) ---

function resizeImageFile(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

photoInput.addEventListener("change", async () => {
  const file = photoInput.files[0];
  if (!file) return;
  try {
    pendingPhotoDataUrl = await resizeImageFile(file);
    photoPreview.src = pendingPhotoDataUrl;
    photoPreviewRow.classList.remove("hidden");
  } catch (e) {
    alert("写真の読み込みに失敗しました。別の写真でお試しください。");
  }
});

removePhotoButton.addEventListener("click", () => {
  pendingPhotoDataUrl = null;
  photoInput.value = "";
  photoPreview.src = "";
  photoPreviewRow.classList.add("hidden");
});

// --- お気に入り度(★) ---

starButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const value = Number(btn.dataset.value);
    pendingRating = pendingRating === value ? 0 : value;
    setRatingDisplay(pendingRating);
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;

  const recipeData = {
    name,
    url: urlInput.value.trim(),
    ingredients: ingredientsInput.value.trim(),
    servings: servingsInput.value ? Number(servingsInput.value) : undefined,
    steps: stepsInput.value.trim(),
    photo: pendingPhotoDataUrl || undefined,
    rating: pendingRating || undefined,
    note: noteInput.value.trim(),
    status: form.querySelector('input[name="status"]:checked').value,
    checkedIngredients: [],
  };

  if (editingIdInput.value) {
    const target = recipes.find((r) => r.id === editingIdInput.value);
    if (target) Object.assign(target, recipeData);
  } else {
    recipes.push({ id: generateId(), createdAt: Date.now(), ...recipeData });
  }

  try {
    saveRecipes();
  } catch (err) {
    if (err && err.name === "QuotaExceededError") {
      alert("保存容量が一杯です。写真を減らすか、他のレシピの写真を削除してから、もう一度試してください。");
      return;
    }
    throw err;
  }

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

// --- レシピ一覧/買い物リストのタブ切り替え ---

function showRecipesView() {
  recipesView.classList.remove("hidden");
  shoppingView.classList.add("hidden");
  recipesTabButton.classList.add("active");
  shoppingTabButton.classList.remove("active");
}

function showShoppingView() {
  shoppingView.classList.remove("hidden");
  recipesView.classList.add("hidden");
  shoppingTabButton.classList.add("active");
  recipesTabButton.classList.remove("active");
}

recipesTabButton.addEventListener("click", showRecipesView);
shoppingTabButton.addEventListener("click", showShoppingView);

// --- 買い物リスト(手入力・チェック・削除) ---

addShoppingItemButton.addEventListener("click", () => {
  const text = shoppingItemInput.value.trim();
  if (!text) return;
  addShoppingItems([text], null);
  shoppingItemInput.value = "";
});

shoppingItemInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addShoppingItemButton.click();
  }
});

clearCheckedButton.addEventListener("click", () => {
  shoppingList = shoppingList.filter((item) => !item.checked);
  saveShoppingList();
  renderShoppingList();
});

clearAllButton.addEventListener("click", () => {
  if (shoppingList.length === 0) return;
  if (!confirm("買い物リストをすべて削除しますか?")) return;
  shoppingList = [];
  saveShoppingList();
  renderShoppingList();
});

// --- 今日のごはんをおまかせ ---

randomPickButton.addEventListener("click", () => {
  const madeRecipes = recipes.filter((r) => r.status === "made");
  if (madeRecipes.length === 0) {
    alert("「作った」レシピがまだ登録されていません。");
    return;
  }

  const picked = madeRecipes[Math.floor(Math.random() * madeRecipes.length)];

  searchBox.value = "";
  tabButtons.forEach((b) => b.classList.toggle("active", b.dataset.status === "made"));
  currentStatusFilter = "made";
  applyFilters();

  const card = listEl.querySelector(`.card[data-id="${picked.id}"]`);
  if (!card) return;

  const detailEl = card.querySelector(".card-detail");
  const toggleDetailButton = card.querySelector(".toggle-detail-button");
  detailEl.classList.remove("hidden");
  toggleDetailButton.textContent = "閉じる";

  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("highlight");
  setTimeout(() => card.classList.remove("highlight"), 1600);
});

// --- 週間献立プランナー ---

function renderPlannerDays() {
  const validIds = new Set(recipes.map((r) => r.id));
  let changed = false;
  DAY_NAMES.forEach((day) => {
    if (weekPlan[day] && !validIds.has(weekPlan[day])) {
      weekPlan[day] = "";
      changed = true;
    }
  });
  if (changed) saveWeekPlan();

  plannerDaysEl.innerHTML = "";
  DAY_NAMES.forEach((day) => {
    const row = document.createElement("div");
    row.className = "planner-day-row";

    const label = document.createElement("span");
    label.className = "day-label";
    label.textContent = day;

    const select = document.createElement("select");
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "-- 未定 --";
    select.appendChild(emptyOption);

    recipes.forEach((recipe) => {
      const option = document.createElement("option");
      option.value = recipe.id;
      option.textContent = recipe.name;
      if (weekPlan[day] === recipe.id) option.selected = true;
      select.appendChild(option);
    });

    select.addEventListener("change", () => {
      weekPlan[day] = select.value;
      saveWeekPlan();
    });

    row.appendChild(label);
    row.appendChild(select);
    plannerDaysEl.appendChild(row);
  });
}

togglePlannerButton.addEventListener("click", () => {
  plannerPanel.classList.toggle("hidden");
});

buildShoppingListButton.addEventListener("click", () => {
  let addedCount = 0;

  DAY_NAMES.forEach((day) => {
    const recipeId = weekPlan[day];
    if (!recipeId) return;
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;
    const lines = splitIngredientLines(recipe.ingredients);
    if (lines.length === 0) return;

    addShoppingItems(lines, `${day}: ${recipe.name}`);
    addedCount += lines.length;
  });

  if (addedCount === 0) {
    alert("献立が選択されていません。曜日ごとにレシピを選んでください。");
    return;
  }

  showShoppingView();
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

// レシピサイトはCORSで直接fetchできないことが多いため、公開プロキシ経由でHTMLを取得する。
// 1つ目がダメでも2つ目を試す(それでもダメなサイトはあり得る)
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

async function fetchHtmlViaProxies(url) {
  let lastError;
  for (const buildProxyUrl of CORS_PROXIES) {
    try {
      const res = await fetch(buildProxyUrl(url));
      if (!res.ok) throw new Error("proxy request failed");
      return await res.text();
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("all proxies failed");
}

// JSON-LD(schema.org Recipe)→OGPの順で探す。ネットワーク取得とは独立しているので、
// 自動取得(fetchRecipeSiteData)・手動貼り付け(parsePasteButton)の両方から使える
function parseRecipeHtml(html) {
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

  return extractOgFallback(doc);
}

// JSON-LDが無いサイト向けの最終手段。og:titleがあれば料理名だけでも拾う
function extractOgFallback(doc) {
  const ogTitle = doc.querySelector('meta[property="og:title"]');
  const title = ogTitle ? ogTitle.getAttribute("content") : null;
  if (!title) return null;
  return { name: title, ingredients: "", steps: "" };
}

async function fetchRecipeSiteData(url) {
  const html = await fetchHtmlViaProxies(url);
  return parseRecipeHtml(html);
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

parsePasteButton.addEventListener("click", () => {
  const html = pasteHtmlInput.value.trim();
  if (!html) {
    fetchMessage.textContent = "貼り付け内容が空です。";
    return;
  }

  const recipe = parseRecipeHtml(html);
  if (!recipe) {
    fetchMessage.textContent = "貼り付けた内容からは読み取れませんでした。";
    return;
  }

  if (recipe.name) nameInput.value = recipe.name;
  if (recipe.ingredients) ingredientsInput.value = recipe.ingredients;
  if (recipe.steps) stepsInput.value = recipe.steps;
  fetchMessage.textContent = "貼り付けた内容から取り込みました。内容を確認してください。";
});

// --- 調理タイマー(レシピとは独立したシンプルなキッチンタイマー。同時に1つだけ) ---

let timerRemainingSeconds = 0;
let timerIntervalId = null;
let timerRunning = false;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(Math.max(0, timerRemainingSeconds));
}

function tickTimer() {
  timerRemainingSeconds--;
  updateTimerDisplay();
  if (timerRemainingSeconds <= 0) {
    stopTimerInterval();
    onTimerFinish();
  }
}

function startTimerInterval() {
  clearInterval(timerIntervalId);
  timerIntervalId = setInterval(tickTimer, 1000);
  timerRunning = true;
  timerPauseResumeButton.disabled = false;
  timerPauseResumeButton.textContent = "一時停止";
}

function stopTimerInterval() {
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  timerRunning = false;
}

function setAndStartTimer(minutes) {
  timerPanel.classList.remove("timer-finished");
  timerStatus.textContent = "";
  timerRemainingSeconds = Math.round(minutes * 60);
  updateTimerDisplay();
  startTimerInterval();
}

// 音声ファイルなしで、その場で短いビープ音を鳴らす
function playBeep() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.8);
}

function onTimerFinish() {
  playBeep();
  setTimeout(playBeep, 900);
  if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
  timerStatus.textContent = "タイマー終了!";
  timerPanel.classList.add("timer-finished");
  timerPauseResumeButton.disabled = true;
}

toggleTimerButton.addEventListener("click", () => {
  timerPanel.classList.toggle("hidden");
});

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setAndStartTimer(Number(btn.dataset.minutes));
  });
});

timerStartCustomButton.addEventListener("click", () => {
  const minutes = Number(timerCustomMinutes.value);
  if (!minutes || minutes <= 0) return;
  setAndStartTimer(minutes);
});

timerPauseResumeButton.addEventListener("click", () => {
  if (timerRemainingSeconds <= 0) return;
  if (timerRunning) {
    stopTimerInterval();
    timerPauseResumeButton.textContent = "再開";
  } else {
    startTimerInterval();
  }
});

timerResetButton.addEventListener("click", () => {
  stopTimerInterval();
  timerRemainingSeconds = 0;
  updateTimerDisplay();
  timerStatus.textContent = "";
  timerPanel.classList.remove("timer-finished");
  timerPauseResumeButton.disabled = true;
  timerPauseResumeButton.textContent = "一時停止";
});

updateTimerDisplay();
timerPauseResumeButton.disabled = true;

// --- ホーム画面追加バナー(すでにホーム画面から開いている場合は出さない) ---

let deferredInstallPrompt = null;

function isRunningStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function setupInstallBanner() {
  if (isRunningStandalone()) return;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) {
    installBannerText.textContent =
      "共有ボタン(□に↑のアイコン)をタップして「ホーム画面に追加」を選ぶと、アプリのように使えます。";
  } else {
    installBannerText.textContent = "ホーム画面に追加すると、アプリのようにワンタップで開けます。";
    installActionButton.classList.remove("hidden");
  }
  installBanner.classList.remove("hidden");
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installActionButton.classList.remove("hidden");
});

installActionButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    alert("ブラウザのメニューから「ホーム画面に追加」または「アプリをインストール」を選んでください。");
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBanner.classList.add("hidden");
});

dismissInstallBannerButton.addEventListener("click", () => {
  installBanner.classList.add("hidden");
});

setupInstallBanner();

// --- PWA化: ホーム画面追加・オフライン閲覧に対応 ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

renderList();
renderShoppingList();
