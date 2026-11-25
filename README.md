# Auto & Zukunft

Eine einfache, responsive deutschsprachige Website über selbstfahrende Autos und Fahrerassistenz – inklusive Tesla-Status in den USA und Deutschland.

## Lokal ansehen

Die Datei `index.html` im Browser öffnen. Es werden keine Build-Tools benötigt.

## Veröffentlichung mit GitHub Pages

1. Im Repository **Settings → Pages** öffnen.
2. Unter **Build and deployment** die Bereitstellung von **Deploy from a branch** wählen.
3. Branch `main` und Ordner `/(root)` auswählen und speichern.

Nach der Veröffentlichung zeigt GitHub die Website-URL in den Pages-Einstellungen an.

## Hinweise

- Der Tesla-Status und die Quellen sind in `index.html` datiert und sollten bei Änderungen erneut geprüft werden.
- Die Fotos werden von Unsplash geladen; für die Anzeige ist eine Internetverbindung nötig.

## Private Datenerfassung mit Supabase

Die Datei [app.html](app.html) enthält eine Anmeldemaske und eine einfache Eintragsverwaltung. **Die Verbindung funktioniert erst nach der Einrichtung deines eigenen Supabase-Projekts.**

### Einrichtung

1. Lege in Supabase ein Projekt im Free-Tarif an.
2. Öffne **SQL Editor** im Supabase-Dashboard und führe [supabase/setup.sql](supabase/setup.sql) aus.
3. Lege in Supabase Auth manuell dein Benutzerkonto an. Deaktiviere öffentliche Registrierung, damit Besucher kein eigenes App-Konto erstellen können.
4. Öffne **Project Settings → API Keys** und kopiere **Project URL** und den **Publishable key**.
5. Trage die Werte in [supabase-config.js](supabase-config.js) ein. Die Datei ist im öffentlichen Repo sichtbar: Das ist für den Publishable key vorgesehen, **wenn** Row Level Security aktiv ist. Niemals einen Secret- oder `service_role`-Key hier eintragen.
6. Rufe nach der Veröffentlichung `https://ap-benutzer.github.io/github_repo_ap/app.html` auf und melde dich mit dem angelegten Benutzer an.

Die Tabelle `\"Buchungen\".\"Bestand\"` hat Row Level Security (RLS). Lese-, Schreib- und Löschregeln erlauben nur Datensätze, deren `user_id` zur angemeldeten Supabase-Identität gehört. Der Gesamtbetrag wird automatisch aus Menge × Einzelpreis berechnet. Die App greift über das Schema `Buchungen` auf die Data API zu; dieses Schema muss in Supabase unter **Project Settings → API → Exposed schemas** hinzugefügt sein. Die Anmeldesitzung wird durch Supabase Auth verwaltet.
