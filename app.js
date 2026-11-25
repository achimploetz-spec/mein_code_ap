(() => {
  const config = window.SUPABASE_CONFIG || {};
  const loginPanel = document.getElementById("login-panel");
  const dataPanel = document.getElementById("data-panel");
  const loginForm = document.getElementById("login-form");
  const loginButton = document.getElementById("login-button");
  const loginStatus = document.getElementById("login-status");
  const logoutButton = document.getElementById("logout-button");
  const signedInEmail = document.getElementById("signed-in-email");
  const entryForm = document.getElementById("entry-form");
  const saveButton = document.getElementById("save-button");
  const saveStatus = document.getElementById("save-status");
  const listStatus = document.getElementById("list-status");
  const entryList = document.getElementById("entry-list");
  const dateInput = document.getElementById("entry-date");

  dateInput.value = new Date().toISOString().slice(0, 10);

  const configured =
    config.url &&
    config.publishableKey &&
    !config.url.includes("YOUR_PROJECT_REF") &&
    !config.publishableKey.includes("REPLACE_ME");

  if (!configured || !window.supabase?.createClient) {
    loginButton.disabled = true;
    loginStatus.textContent = "Die App ist vorbereitet. Richte zuerst das Supabase-Projekt ein und trage URL sowie Publishable Key in supabase-config.js ein.";
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey);

  function setStatus(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("error", isError);
  }

  function setBusy(button, busy, busyText, normalText) {
    button.disabled = busy;
    button.textContent = busy ? busyText : normalText;
  }

  function showSignedOut(message = "") {
    loginPanel.classList.remove("hidden");
    dataPanel.classList.add("hidden");
    signedInEmail.textContent = "";
    if (message) setStatus(loginStatus, message);
  }

  function showSignedIn(user) {
    loginPanel.classList.add("hidden");
    dataPanel.classList.remove("hidden");
    signedInEmail.textContent = user.email || "Konto";
  }

  function addText(parent, tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value || "";
    parent.append(node);
    return node;
  }

  function renderEntries(rows) {
    entryList.replaceChildren();
    if (!rows.length) {
      addText(entryList, "div", "empty", "Noch keine Einträge gespeichert.");
      return;
    }

    for (const row of rows) {
      const card = document.createElement("article");
      card.className = "entry";
      const head = document.createElement("div");
      head.className = "entry-head";
      const copy = document.createElement("div");
      addText(copy, "h3", "", row.title);
      const date = row.entry_date
        ? new Date(row.entry_date + "T12:00:00").toLocaleDateString("de-DE")
        : "";
      addText(copy, "div", "meta", [row.category, date].filter(Boolean).join(" · "));
      head.append(copy);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger";
      remove.textContent = "Löschen";
      remove.setAttribute("aria-label", "Eintrag löschen: " + row.title);
      remove.addEventListener("click", () => deleteEntry(row.id, remove));
      head.append(remove);
      card.append(head);
      if (row.notes) addText(card, "p", "", row.notes);
      entryList.append(card);
    }
  }

  async function loadEntries() {
    setStatus(listStatus, "Lade Einträge …");
    const { data, error } = await client
      .from("private_entries")
      .select("id,title,category,entry_date,notes")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(listStatus, "Einträge konnten nicht geladen werden: " + error.message, true);
      entryList.replaceChildren();
      return;
    }
    setStatus(listStatus, "");
    renderEntries(data || []);
  }

  async function deleteEntry(id, button) {
    if (!window.confirm("Diesen Eintrag wirklich löschen?")) return;
    button.disabled = true;
    const { error } = await client.from("private_entries").delete().eq("id", id);
    if (error) {
      setStatus(listStatus, "Eintrag konnte nicht gelöscht werden: " + error.message, true);
      button.disabled = false;
      return;
    }
    setStatus(listStatus, "Eintrag gelöscht.");
    await loadEntries();
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(loginStatus, "");
    setBusy(loginButton, true, "Anmeldung läuft …", "Anmelden");
    const form = new FormData(loginForm);
    const { error } = await client.auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password"))
    });
    setBusy(loginButton, false, "", "Anmelden");
    if (error) setStatus(loginStatus, "Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort.", true);
  });

  logoutButton.addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    if (error) setStatus(listStatus, "Abmelden fehlgeschlagen: " + error.message, true);
    else showSignedOut("Du bist abgemeldet.");
  });

  entryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(saveStatus, "");
    setBusy(saveButton, true, "Speichert …", "Eintrag speichern");
    const form = new FormData(entryForm);
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      setBusy(saveButton, false, "", "Eintrag speichern");
      showSignedOut("Bitte melde dich erneut an.");
      return;
    }

    const { error } = await client.from("private_entries").insert({
      user_id: user.id,
      title: String(form.get("title")).trim(),
      category: String(form.get("category")).trim() || "Allgemein",
      entry_date: String(form.get("entry_date")),
      notes: String(form.get("notes")).trim()
    });
    setBusy(saveButton, false, "", "Eintrag speichern");
    if (error) {
      setStatus(saveStatus, "Speichern fehlgeschlagen: " + error.message, true);
      return;
    }

    entryForm.reset();
    dateInput.value = new Date().toISOString().slice(0, 10);
    document.getElementById("category").value = "Allgemein";
    setStatus(saveStatus, "Eintrag gespeichert.");
    await loadEntries();
  });

  client.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      showSignedIn(session.user);
      window.setTimeout(() => loadEntries(), 0);
    } else {
      showSignedOut();
      entryList.replaceChildren();
    }
  });

  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      showSignedOut("Anmeldestatus konnte nicht geprüft werden. Bitte lade die Seite neu.");
      return;
    }
    if (data.session?.user) {
      showSignedIn(data.session.user);
      loadEntries();
    } else {
      showSignedOut();
    }
  });
})();
