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
  const sumCount = document.getElementById("sum-count");
  const sumValue = document.getElementById("sum-value");

  dateInput.value = new Date().toISOString().slice(0, 10);

  const configured =
    config.url &&
    config.publishableKey &&
    !config.url.includes("YOUR_PROJECT_REF") &&
    !config.publishableKey.includes("REPLACE_ME");

  if (!configured || !window.supabase?.createClient) {
    loginButton.disabled = true;
    loginStatus.textContent = "Die App ist vorbereitet. Trage zuerst Project URL und Publishable Key in supabase-config.js ein.";
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey);
  const bestand = () => client.schema("Buchungen").from("Bestand");

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
    node.textContent = value ?? "";
    parent.append(node);
    return node;
  }

  function formatMoney(value, currency = "EUR") {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: String(currency).trim() || "EUR"
    }).format(Number(value));
  }

  function renderEntries(rows) {
    entryList.replaceChildren();
    sumCount.textContent = rows.length.toLocaleString("de-DE");
    sumValue.textContent = formatMoney(rows.reduce((total, row) => total + Number(row.gesamtbetrag || 0), 0));
    if (!rows.length) {
      addText(entryList, "div", "empty", "Noch kein Material im Bestand.");
      return;
    }

    for (const row of rows) {
      const card = document.createElement("article");
      card.className = "entry";
      const body = document.createElement("div");
      body.className = "entry-body";
      const head = document.createElement("div");
      head.className = "entry-head";
      const copy = document.createElement("div");
      addText(copy, "h3", "", row.bezeichnung);
      const date = row.buchungsdatum
        ? new Date(row.buchungsdatum + "T12:00:00").toLocaleDateString("de-DE")
        : "";
      addText(copy, "div", "meta", [row.kategorie, date].filter(Boolean).join(" · "));
      head.append(copy);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger";
      remove.textContent = "Löschen";
      remove.setAttribute("aria-label", "Position löschen: " + row.bezeichnung);
      remove.addEventListener("click", () => deleteEntry(row.id, remove));
      head.append(remove);
      body.append(head);

      const amount = Number(row.menge).toLocaleString("de-DE", { maximumFractionDigits: 3 });
      addText(body, "p", "", `${amount} × ${formatMoney(row.einzelpreis, row.waehrung)} = ${formatMoney(row.gesamtbetrag, row.waehrung)}`);
      card.append(body);
      entryList.append(card);
    }
  }

  async function loadEntries() {
    setStatus(listStatus, "Lade Bestand …");
    const { data, error } = await bestand()
      .select("id,bezeichnung,kategorie,buchungsdatum,menge,einzelpreis,gesamtbetrag,waehrung,erstellt_am")
      .order("buchungsdatum", { ascending: false })
      .order("erstellt_am", { ascending: false });

    if (error) {
      setStatus(listStatus, "Bestand konnte nicht geladen werden: " + error.message, true);
      entryList.replaceChildren();
      return;
    }
    setStatus(listStatus, "");
    renderEntries(data || []);
  }

  async function deleteEntry(id, button) {
    if (!window.confirm("Diese Position wirklich aus dem Bestand löschen?")) return;
    button.disabled = true;
    const { error } = await bestand().delete().eq("id", id);
    if (error) {
      setStatus(listStatus, "Position konnte nicht gelöscht werden: " + error.message, true);
      button.disabled = false;
      return;
    }
    setStatus(listStatus, "Position gelöscht.");
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
    setBusy(saveButton, true, "Wird gebucht …", "In Bestand buchen");
    const form = new FormData(entryForm);
    const { error } = await bestand().insert({
      bezeichnung: String(form.get("title")).trim(),
      kategorie: String(form.get("category")).trim() || "Allgemein",
      buchungsdatum: String(form.get("entry_date")),
      menge: Number(form.get("quantity")),
      einzelpreis: Number(form.get("unit_price")),
      waehrung: "EUR"
    });
    setBusy(saveButton, false, "", "In Bestand buchen");
    if (error) {
      setStatus(saveStatus, "Speichern fehlgeschlagen: " + error.message, true);
      return;
    }

    entryForm.reset();
    dateInput.value = new Date().toISOString().slice(0, 10);
    document.getElementById("category").value = "Schnittholz";
    document.getElementById("quantity").value = "1";
    setStatus(saveStatus, "Position gebucht.");
    await loadEntries();
  });

  client.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      showSignedIn(session.user);
      window.setTimeout(() => loadEntries(), 0);
    } else {
      showSignedOut();
      entryList.replaceChildren();
      sumCount.textContent = "–";
      sumValue.textContent = "–";
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
