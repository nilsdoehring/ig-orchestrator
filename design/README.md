# Design in diesem Repo

Dieses Repository trägt Schreibwissen (`knowledge/`, `briefing/`, `prompts/`) und auf der
Design-Seite zwei Dinge: **Fotografie-Vorgaben** (`design/photography/rules.md`) und **eine
Quarantäne** (`design/statements/`). Alles andere, was wie eine Design-Vorgabe aussieht, wird beim
Export absichtlich verweigert — nicht aus Vergesslichkeit, sondern weil es an anderer Stelle bereits
verwaltet wird und eine zweite, hier mitgeschriebene Kopie über kurz oder lang von der echten Quelle
abweicht.

## Die Quarantäne: `design/statements/`

Hier liegen die migrierten Statements der Typen `visual_identity` und `image_style`. Sie enthalten
genau das, was dieses Repo sonst verweigert: eine vollständige Farbpalette mit Hex-Werten,
Schriftfamilien, Maßangaben in px und mm sowie die zweistelligen Token-Codes des Styleguides.

**Warum sie trotzdem hier liegen.** Der Bild-Workflow in n8n liest diesen Text live und hat keine
andere Quelle. Ihn zu löschen würde diesen Workflow brechen — ein Ausfall, kein aufgeräumtes Repo.
Den Export daran scheitern zu lassen würde den Inhalt auch nicht entfernen, sondern nur verhindern,
dass dieses Bundle überhaupt ausgeliefert wird.

**Was daraus folgt, verbindlich.**

- Diese Dateien liegen bewusst **außerhalb von `knowledge/`**, damit kein Text-Pfad sie über ein
  `knowledge/**`-Glob einsammeln kann.
- Sie sind **ausschließlich** für die Zusammenstellung von Bild-Prompts bestimmt.
- Sie sind **keine gepflegte Design-Vorgabe**, sondern unreviewter, migrierter Prosa-Text. Wer eine
  Design-Frage hat, findet die zuständigen Systeme in der Tabelle unten — nicht hier.
- Für Texte (Copy) sind sie **nie** zu verwenden.

Neue Design-Inhalte werden weiterhin verweigert, auch in `design/photography/rules.md`. Die
Quarantäne ist eine Ausnahme für vorhandene Inhalte mit lebendem Konsumenten, kein offenes Tor.

**Diese Datei ist von der Design-Firewall-Prüfung ausgenommen.** Der Export scannt jede erzeugte
Datei auf Design-Inhalte, die hier nichts zu suchen haben, und lehnt Treffer ab. `design/README.md`
selbst steht auf der Ausnahmeliste, weil ihre einzige Aufgabe ist, über genau diese Grenze zu
sprechen — Hex-Codes und Maßangaben als Beispiel zu nennen ist hier kein Fehler, sondern der Zweck der
Datei. Niemand sollte das je "reparieren".

## Was hier abgelehnt wird — und wer es wirklich verwaltet

| Inhalt | Beispiel | Zuständiges System |
|---|---|---|
| Farbwerte (Hex, RGB, CMYK) und Markenfarben als Wort | `#0057B7`, `rgba(0,0,0,.6)`, "IONOS Midnight Blue" | Design-Tokens im Unima-Editor |
| Schriftarten und Typo-Skala | `Overpass`, `font-weight`, Schriftgrößen-Stufen | React-Komponentenbibliothek (uds-orchestrator) |
| Logo-Aufbau, Schutzraum, Mindestgrößen | Logo-Lockup, Clear Space, Mindestbreite | Brand Portal |
| Abstände und Raster | Pixel-, Punkt- oder rem-Angaben, Grid-Spalten | Unima-Editor |
| Komponentennamen | interne UI-Komponentenbezeichnungen | React-Komponentenbibliothek |

Eine abgelehnte Zeile verschwindet nicht ersatzlos: Der Export vermerkt zu jedem Treffer, welches der
oben genannten Systeme dafür zuständig ist, damit die Information nicht verloren geht, sondern nur an
der richtigen Stelle landet.

## Die Farbnamen-Stoppliste ist ein Boden, keine Garantie

Ein Teil der obigen Prüfung ist eine feste Liste bekannter Markenfarbnamen. Sie fängt viele, aber
nachweislich nicht alle Fälle: Wörter wie **"Amber"**, **"Purple"** oder **"Cool Black"** können die
Liste passieren, weil sie als gewöhnliche Adjektive lesbar sind und kein Muster sie zuverlässig von
einer Farbangabe unterscheidet. Wer diese Liste liest, sollte sie als Mindestschutz verstehen, nicht
als Beweis, dass kein Farbname mehr durchrutscht.

## Wo die Grenze nachweislich schon überschritten wurde

`knowledge/UNGUARDED.md` (Repo-Wurzel) benennt konkrete, bereits gefundene Fälle, in denen Design-
Inhalt trotz dieser Grenze in einen Prompt gelangt ist — mit Fundstelle. Diese Datei ist die ehrliche
Ergänzung zu diesem Dokument: Sie sagt nicht "das kann nicht passieren", sondern "das ist passiert,
und hier ist wo".
