# ImagePreprocessing-Website

Ein einfaches statisches Projekt zur Vorverarbeitung von Bildern im Browser.

## Funktionsumfang

* Bild hochladen
* Auswahl eines eigenen Quadratausschnitts durch Ziehen im Vorschaubereich (oder zentriert, wenn nichts ausgewählt)
* Zuschneiden auf das ausgewählte Quadrat
* Skalierung auf 35×35 Pixel
* Umwandlung in Graustufen
* Schwellenwertbasierte Verstärkung (standardmäßig &lt;=100 schwarz, &gt;=160 weiß)
* Invertierung des Bildes
* Vorschau anzeigen – bei verarbeiteter Darstellung wird das Ergebnis auf ~350 px hochskaliert
* Schwellenwerte anpassen
* Ergebnis herunterladen

## Nutzung

1. Öffne `index.html` in einem Browser (z. B. per [VS Code Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) oder mit einem einfachen Python-HTTP-Server).
```sh
# im Projektordner
python3 -m http.server 8000
```
2. Lade ein beliebiges Bild hoch.
3. Passe bei Bedarf die Schwellenwerte an und klicke auf “Verarbeiten”.
4. Über die Download-Schaltfläche das verarbeitete Bild speichern.
