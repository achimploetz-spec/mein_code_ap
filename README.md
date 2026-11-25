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

Die Datei [app.html](app.html) enthält eine Anmeldemaske und eine Buchungsverwaltung. Die Website nutzt das Supabase-Projekt für Anmeldung und Datenzugriff.

### Supabase-Einrichtung

1. Das Projekt und das Schema `"Buchungen"."Bestand"` sind bereits angelegt.
2. `supabase-config.js` enthält die Project URL und den öffentlichen Publishable Key. Dieser Schlüssel ist für Browser-Apps vorgesehen. Niemals einen Secret- oder `service_role`-Key veröffentlichen.
3. In Supabase **Project Settings → Data API** muss `Buchungen` zu **Exposed schemas** hinzugefügt sein, damit die App die Tabelle über die API erreicht.
4. Lege unter **Authentication → Users** dein Benutzerkonto an und deaktiviere öffentliche Registrierung, damit Besucher kein eigenes App-Konto erstellen können.
5. Nach GitHub Pages-Veröffentlichung öffne `https://ap-benutzer.github.io/github_repo_ap/app.html` und melde dich mit deinem Supabase-Konto an.

### Datenschutz und Berechtigungen

Die Tabelle `"Buchungen"."Bestand"` hat Row Level Security (RLS). Nur die Rolle `authenticated` erhält Tabellenzugriff. Richtlinien prüfen bei Lesen, Anlegen, Ändern und Löschen, dass `user_id` dem angemeldeten Supabase-Konto entspricht. `user_id` wird automatisch aus der Anmeldesitzung gesetzt. `gesamtbetrag` wird von der Datenbank aus Menge × Einzelpreis berechnet.
