# LB2 Applikation
Diese Applikation ist bewusst unsicher programmiert und sollte nie in produktiven Umgebungen zum Einsatz kommen. Ziel der Applikation ist es, Lernende für mögliche Schwachstellen in Applikationen zu sensibilisieren, diese anzuleiten, wie die Schwachstellen aufgespürt und geschlossen werden können.

Die Applikation wird im Rahmen der LB2 im [Modul 183](https://gitlab.com/ch-tbz-it/Stud/m183/m183) durch die Lernenden bearbeitet.

## Getting Started

Follow these steps to get the project up and running on your local machine.

### Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop/) installed and running.
- [Node.js](https://nodejs.org/) installed (for Node.js version).

### Running the Node.js Application

1. **Install Dependencies:**
   Navigate into the `todo-list-node` directory and install the required npm packages:
   ```powershell
   cd todo-list-node
   npm install
   cd ..
   ```

2. **Start the Containers:**
   Use Docker Compose to build and start the application and database:
   ```powershell
   docker compose -f docker/compose.node.yaml up -d
   ```

3. **Access the App:**
   Open your browser and go to `http://localhost`. 
   *Note: Ensure port 80 is not already in use by another application.*

## Hinweise zur Installation (Deutsch)
Die Applikation steht als PHP- oder NodeJS-Applikation zur Verfügung. Abhängig davon, ob Sie die LB2 mit PHP oder NodeJS umsetzen möchten, müssen Sie entweder `compose.php.yaml` oder `compose.node.yaml` dem Docker-Compose-Befehl mit übergeben:
* PHP: `docker compose -f docker/compose.php.yaml up`
* NodeJS: `docker compose -f docker/compose.node.yaml up`

Bei NodeJS müssen vor dem Start der Container noch mit `npm install` die Abhängigkeiten installiert werden (wichtig: der Befehl muss innerhalb vom `todo-list-node`-Verzeichnis ausgeführt werden).

Der include-Befehl in den YAML-Files steht erst ab der Docker Compose Version 2.20.3 zur Verfügung. Sollte der Rechner einen Fehler bezüglich include werfen, aktualisieren Sie Docker Compose oder kopieren Sie die Containerdefinition von `compose.db.yaml` in die jeweilige YAML-Datei.

Wichtig: Der Port 80 muss auf Ihrem lokalen Rechner zur Verfügung stehen.

## Vulnerabilities in Project 
A report of vulnerabilities in the project can be found in the [file](VulnerabilityReport.md).