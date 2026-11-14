# Campus Device Tracker Part 2

SE411 project integrating the existing React tracker with a Java Spring Boot REST server. Device records live in the server's memory and reset when the server restarts. Refreshing React does not reset them.

## Run locally

Requirements: JDK 17 or newer and Node.js 20 or newer. The first run needs internet access for dependencies.

From the project folder, open two terminals. In the first (Windows PowerShell):

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

In the second:

```powershell
cd frontend
npm ci
npm start
```

Open http://localhost:3000. The API is at http://localhost:8080/assets. Use localhost rather than 127.0.0.1 for the frontend because the server allows that browser origin. On macOS/Linux use `bash ./mvnw` instead of `.\mvnw.cmd`.

## Architecture and routes

React sends HTTP requests and displays the JSON results. The Spring controller routes requests to a service that validates input and applies filtering and pagination. An in-memory store holds devices and assigns IDs. The backend is the source of truth.

| Method | Route | Purpose | Responses |
|---|---|---|---|
| POST | `/assets` | Create a device from name and status | 201, 400 |
| GET | `/assets/{id}` | Look up one device by ID | 200, 404 |
| GET | `/assets?page=0&size=3&q=` | List devices with an optional name/status filter | 200, 400 |
| PUT | `/assets/{id}` | Update the device name and status | 200, 400, 404 |
| DELETE | `/assets/{id}` | Remove a device | 204, 404 |

Pages are zero-based in the API and one-based in the browser. The API returns items, page totals, matching record count, and inventory counts. The page size must be between 1 and 100.

## Tests

Run `.\mvnw.cmd test` inside `backend/`. JUnit and Mockito cover controller HTTP behavior and service logic. A JUnit store test covers storage operations and ID allocation. The Part 1 JavaScript tests remain as regression tests for the historical in-memory helper, which is no longer used by the running React app.

Verification on 14 November 2026: 12 backend tests and 7 Part 1 JavaScript tests passed. Against a running Spring server, HTTP checks passed for create, ID lookup, paginated results, name search, update, delete, invalid pagination, and the React development origin.

## Presentation demo

1. Start both apps and open Home. Use **Next** and **Previous** to show that the backend returns pages of three devices.
2. Add a device. Find it by name to see its assigned ID.
3. Enter that ID in **Find by ID**, then edit the result and change its status.
4. Refresh the page, look up the same ID again, and show that the server retained the update. Try a missing ID to show the error.
5. Run the backend tests and explain how Mockito isolates the controller and service.
