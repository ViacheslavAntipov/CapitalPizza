// === KONFIGURACJA GITHUBA ===
const githubUser = "viacheslavantipov"; // <--- Twój login GitHub
const repoName = "capital-pizza";        // <--- Twoje repozytorium
const filePath = "menu.json";            // <--- Plik menu w repo

let githubToken = localStorage.getItem("githubToken");

// === LOGOWANIE ===
async function login() {
  if (!githubToken) {
    githubToken = prompt("Wprowadź swój GitHub Personal Access Token:");
    localStorage.setItem("githubToken", githubToken);
  }
  if (!githubToken) return alert("Token wymagany do zapisu!");
  loadMenu();
}

// === WCZYTYWANIE MENU ===
async function loadMenu() {
  const res = await fetch(`https://api.github.com/repos/${githubUser}/${repoName}/contents/${filePath}`, {
    headers: { Authorization: `token ${githubToken}` }
  });
  const data = await res.json();
  const content = atob(data.content);
  const menu = JSON.parse(content);
  window.currentSha = data.sha;
  renderMenu(menu);
}

// === ZAPISYWANIE MENU ===
async function saveMenu(newMenu) {
  const encodedContent = btoa(JSON.stringify(newMenu, null, 2));
  const res = await fetch(`https://api.github.com/repos/${githubUser}/${repoName}/contents/${filePath}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${githubToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Aktualizacja menu.json z panelu admina",
      content: encodedContent,
      sha: window.currentSha
    })
  });

  if (res.ok) {
    alert("✅ Menu zapisane pomyślnie!");
    loadMenu();
  } else {
    alert("❌ Błąd podczas zapisu. Sprawdź token i uprawnienia.");
  }
}

// === WYSWIETLANIE MENU ===
function renderMenu(menu) {
  const container = document.getElementById("menuData");
  container.innerHTML = "";
  Object.keys(menu).forEach(category => {
    const section = document.createElement("div");
    section.classList.add("category");
    section.innerHTML = `<h3>${category.toUpperCase()}</h3>`;
    menu[category].forEach((item, index) => {
      const block = document.createElement("div");
      block.classList.add("menu-item");
      block.innerHTML = `
        <p><strong>${item.nazwa || item.kategoria}</strong></p>
        <p>${item.skladniki || ""}</p>
        <p><em>${item.ceny.join(" / ")}</em></p>
        <button onclick="editItem('${category}', ${index})">Edytuj</button>
        <button onclick="deleteItem('${category}', ${index})">Usuń</button>
      `;
      section.appendChild(block);
    });
    container.appendChild(section);
  });
}

// === EDYCJA ===
function editItem(category, index) {
  const newValue = prompt("Podaj nowe dane JSON dla tej pozycji:");
  if (!newValue) return;
  const newItem = JSON.parse(newValue);
  fetchMenuAndUpdate(category, index, newItem);
}

function deleteItem(category, index) {
  if (!confirm("Na pewno chcesz usunąć ten element?")) return;
  fetchMenuAndUpdate(category, index, null, true);
}

async function fetchMenuAndUpdate(category, index, newItem, remove = false) {
  const res = await fetch(`https://api.github.com/repos/${githubUser}/${repoName}/contents/${filePath}`, {
    headers: { Authorization: `token ${githubToken}` }
  });
  const data = await res.json();
  const content = atob(data.content);
  const menu = JSON.parse(content);

  if (remove) {
    menu[category].splice(index, 1);
  } else {
    menu[category][index] = newItem;
  }

  saveMenu(menu);
}

login();
