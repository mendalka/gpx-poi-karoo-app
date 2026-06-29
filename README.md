# Karoo GPX POI Fixer (Web App PWA)

A responsive, offline-first Progressive Web App (PWA) to convert GPX waypoints into compatible POIs for Hammerhead Karoo Dashboard imports.

🌐 **Live Demo:** [https://mendalka.github.io/gpx-poi-karoo-app/](https://mendalka.github.io/gpx-poi-karoo-app/)

## Features

- **Offline-First**: Fully functional without an internet connection using Service Workers.
- **Client-Side Only**: Files are processed locally in your browser. Your data never leaves your device (100% private).
- **Android Support**: Can be installed directly to the home screen of Android devices as a native-like app.
- **Premium GUI**: Modern, clean, dark glassmorphism design with responsive layout.

## How to use

1. Open the website on your desktop or mobile device.
2. Select or drag-and-drop your GPX file (e.g., exported from route planners like VeloPlanner).
3. View the summary card showing mapped POI counts and categories.
4. Click **Download Fixed GPX** to download the corrected GPX file (prefixed with `KAROO_`).
5. Import the new file into your Hammerhead Karoo Dashboard.

## Under the Hood

The web app maps various custom POI types to one of the **9 supported case-sensitive Karoo POI types** (`Food`, `Water`, `Parking`, `Camping`, `Lodging`, `Geocache`, `Summit`, `Generic`, `Danger`) and ensures that both `<type>` and `<sym>` tags are correctly added to each waypoint.

## Development

To run locally:
```bash
./run_server.sh
```
And navigate to `http://localhost:8000`.

## License

This project is licensed under the MIT License.
