// ===============================
// CAPITAL PIZZA ADMIN v5.0
// ===============================

// KONFIGURACJA
const repoOwner = "viacheslavantipov"; // zmień na nazwę użytkownika
const repoName = "capital-pizza";      // zmień na nazwę repozytorium
const branch = "main";
const filePath = "menu.json";

let githubToken = localStorage.getItem("githubToken");
let menuData = {};
let activeCategory = null;
let sessionTimer;

// ===============================
// LOGOWANIE I SESJA
// ===============================
async function authenticate() {
  if (!githubToken) {
    githubToken = prompt("🔐 Wprowadź GitHub Personal Access Token:");
    if (githubToken) {
      localStorage.setItem("githubToken", githubToken);
      setStatus("✅ Zalogowano pomyślnie.");
    } else {
      alert("❌ Token wymagany do zalogowania.");
      return false;
    }
  }

  startSessionTimer();
  return true;
}

function startSessionTimer() {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    localStorage.removeItem("githubToken");
    alert("⏱️ Sesja wygasła. Zaloguj się ponownie.");
    location.reload();
  }, 30 * 60 * 1000); // 30 minut
}

// ===============================
// STATUS I POWIADOMIENIA
// ===============================
function setStatus(message) {
  const statusEl = document.getElementById("statusMessage");
  if (statusEl) statusEl.textContent = message;
}

// ===============================
// POBIERANIE MENU
// ===============================
async function loadMenu() {
  setStatus("📡 Pobieranie menu.json...");

  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
  const response = await fetch(url, {
    headers: { Authorization: `token ${githubToken}` }
  });

  if (!response.ok) {
    setStatus("❌ Błąd pobierania menu.json");
    return;
  }

  const data = await response.json();
  const content = atob(data.content);
  menuData = JSON.parse(content);
  setStatus("✅ Menu wczytane pomyślnie.");
  renderCategories();
}

// ===============================
// RENDEROWANIE KATEGORII
// ===============================
function renderCategories() {
  const categoryList = document.getElementById("categoryList");
  categoryList.innerHTML = "";

  Object.keys(menuData).forEach(category => {
    const li = document.createElement("li");
    li.textContent = category;
    li.addEventListener("click", () => {
      document
        .querySelectorAll("#categoryList li")
        .forEach(el => el.classList.remove("active"));
      li.classList.add("active");
      activeCategory = category;
      renderItems(category);
    });
    categoryList.appendChild(li);
  });
}

// ===============================
// WYŚWIETLANIE POZYCJI W KATEGORII
// ===============================
function renderItems(category) {
  const container = document.getElementById("editFormContainer");
  container.innerHTML = "";

  const items = menuData[category];
  if (!items || items.length === 0) {
    container.innerHTML = "<p>Brak pozycji w tej kategorii.</p>";
    return;
  }

  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.classList.add("edit-item");

    div.innerHTML = `
      <label>Nazwa:</label>
      <input type="text" value="${item.nazwa || ""}" id="name-${index}">
      
      <label>Składniki:</label>
      <textarea id="desc-${index}">${item.skladniki || ""}</textarea>
      
      <label>Ceny:</label>
      <input type="text" value="${(item.ceny || []).join(", ")}" id="price-${index}">

      <button onclick="saveItem('${category}', ${index})">💾 Zapisz</button>
      <button onclick="deleteItem('${category}', ${index})">🗑️ Usuń</button>
    `;

    container.appendChild(div);
  });
}

// ===============================
// ZAPIS POZYCJI
// ===============================
async function saveItem(category, index) {
  const name = document.getElementById(`name-${index}`).value.trim();
  const desc = document.getElementById(`desc-${index}`).value.trim();
  const prices = document
    .getElementById(`price-${index}`)
    .value.split(",")
    .map(p => p.trim());

  if (!name) {
    alert("⚠️ Nazwa jest wymagana.");
    return;
  }

  menuData[category][index] = { nazwa: name, skladniki: desc, ceny: prices };
  await saveToGitHub();
}

// ===============================
// USUWANIE POZYCJI
// ===============================
async function deleteItem(category, index) {
  if (confirm("🗑️ Czy na pewno chcesz usunąć tę pozycję?")) {
    menuData[category].splice(index, 1);
    await saveToGitHub();
    renderItems(category);
  }
}

// ===============================
// DODAWANIE NOWEJ POZYCJI
// ===============================
document.getElementById("addNewItem").addEventListener("click", async () => {
  if (!activeCategory) {
    alert("⚠️ Najpierw wybierz kategorię!");
    return;
  }

  menuData[activeCategory].push({
    nazwa: "Nowa pozycja",
    skladniki: "",
    ceny: ["0 zł"]
  });
  await saveToGitHub();
  renderItems(activeCategory);
});

// ===============================
// ZAPIS NA GITHUB
// ===============================
async function saveToGitHub() {
  setStatus("💾 Zapisywanie zmian na GitHub...");

  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
  const getRes = await fetch(url, {
    headers: { Authorization: `token ${githubToken}` }
  });
  const fileData = await getRes.json();

  const updatedContent = btoa(JSON.stringify(menuData, null, 2));

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${githubToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Aktualizacja menu przez Capital Pizza Admin",
      content: updatedContent,
      sha: fileData.sha,
      branch
    })
  });

  if (res.ok) {
    setStatus("✅ Zapisano zmiany na GitHub.");
    setTimeout(() => loadMenu(), 1500);
  } else {
    setStatus("❌ Błąd przy zapisie zmian.");
  }
}

// ===============================
// SCROLL TO TOP
// ===============================
const scrollTopBtn = document.getElementById("scrollTopBtn");

window.addEventListener("scroll", () => {
  if (document.documentElement.scrollTop > 150) {
    scrollTopBtn.style.display = "block";
  } else {
    scrollTopBtn.style.display = "none";
  }
});

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ===============================
// START PANELU
// ===============================
(async function initAdmin() {
  const authOK = await authenticate();
  if (authOK) await loadMenu();
})();
