# Privacy policy (v0.1)

Last updated: 2026-08-25

Fill My Map v0.1 has no account system, backend, analytics, advertising, telemetry, or runtime map service. The app does not transmit location tracks to the developer or any third party.

## On-device data

When the user explicitly starts an exploration, the app records location, accuracy, speed, heading, mode, and timestamps. It derives local street progress and landmark unlocks. Raw tracks, exclusions, progress, settings, and rewards are stored only in the app's local SQLite database.

Background location is requested so an active exploration can continue while the screen is locked. Recording stops when the user ends the session. Force-quitting the app stops recording and the session is marked interrupted on the next launch.

## User controls

The user can inspect session metadata, view a recorded path, export a selected session as GPX, delete one or all raw tracks without deleting confirmed progress, or reset all app data after a second confirmation.

Share cards are generated locally and omit exact routes, endpoints, residential locations, and precise times. Exporting or sharing opens the operating system share sheet; the user chooses the recipient and is responsible for that external transfer.

## Maps

The bundled offline map is derived from OpenStreetMap and does not contact a map provider while the app runs. See `DATA-LICENSE.md`.

Questions and security reports should be submitted through the public repository once its URL is configured.
