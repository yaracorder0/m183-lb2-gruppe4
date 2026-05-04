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
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the `todo-list-node` directory with the following content:
   ```env
   RECAPTCHA_SITE_KEY=6Lc3v5MsAAAAAMGuKeiW1pNTDSR5czy0ODF6pXu2
   RECAPTCHA_SECRET_KEY=6Lc3v5MsAAAAAG_iOnaAfi9lv7QeU9_pFzbcWR4s
   SESSION_SECRET=a-very-secure-random-secret-key-9876543210
   DB_HOST=m183-lb2-db
   DB_USER=root
   DB_PASSWORD=Some.Real.Secr3t
   DB_NAME=m183_lb2
   ```
   *Note: Make sure `SESSION_SECRET` is set to a secure random string.*

3. **Default Credentials:**
   The following users are available for testing:
   - **Admin:** `admin1`
   - **User:** `user1`
   - **Password:** `Awesome.Pass34`

4. **Start the Containers:**
   Go back to the root directory and use Docker Compose to build and start the application and database:
   ```powershell
   cd ..
   docker compose -f docker/compose.node.yaml up -d
   ```

4. **Access the App:**
   Open your browser and go to `http://localhost`. 
   *Note: Ensure port 80 is not already in use by another application.*

## Hinweise zur Installation (Deutsch)
Die Applikation steht als PHP- oder NodeJS-Applikation zur Verfügung. Abhängig davon, ob Sie die LB2 mit PHP oder NodeJS umsetzen möchten, müssen Sie entweder `compose.php.yaml` oder `compose.node.yaml` dem Docker-Compose-Befehl mit übergeben:
* PHP: `docker compose -f docker/compose.php.yaml up`
* NodeJS: `docker compose -f docker/compose.node.yaml up`

Bei NodeJS müssen vor dem Start der Container noch mit `npm install` die Abhängigkeiten installiert werden (wichtig: der Befehl muss innerhalb vom `todo-list-node`-Verzeichnis ausgeführt werden) und die `.env`-Datei erstellt werden:
* `cp .env.example .env` (innerhalb vom `todo-list-node`-Verzeichnis)

Der include-Befehl in den YAML-Files steht erst ab der Docker Compose Version 2.20.3 zur Verfügung. Sollte der Rechner einen Fehler bezüglich include werfen, aktualisieren Sie Docker Compose oder kopieren Sie die Containerdefinition von `compose.db.yaml` in die jeweilige YAML-Datei.

Wichtig: Der Port 80 muss auf Ihrem lokalen Rechner zur Verfügung stehen.

## Vulnerabilities in Project 
A report of vulnerabilities in the project can be found in the [file](VulnerabilityReport.md).