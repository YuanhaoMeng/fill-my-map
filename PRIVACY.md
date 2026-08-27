# Privacy policy (v0.1)

Last updated: 2026-08-27

Fill My Map has no account, backend, analytics, advertising, telemetry, cloud
sync, or track upload. The App does not send location tracks to the developer or
any map provider.

## On-device data

When the user starts exploring, the App records location fixes, accuracy, speed,
heading, and timestamps. It derives street progress and rewards locally. Raw
tracks, exclusions, progress, settings, and rewards remain in app-owned storage.
Background location lets an active exploration continue while the phone is
locked. Force-quitting stops recording; the next launch marks the session interrupted.

## City map downloads

The App binary contains no city maps. When the user explicitly opens the city
catalog or downloads a package, it contacts this project's GitHub Pages and
GitHub Releases over HTTPS. GitHub may receive ordinary web-request information
such as IP address, time, and the requested city-package URL under GitHub's own
privacy terms. Fill My Map does not attach location, tracks, identifiers, or
progress to those requests. Installed maps work without a network connection.

Users may also import a `.fillmap` file through the iOS document picker.

## User controls and sharing

Users can view or export a selected raw track as GPX, delete raw tracks while
keeping progress, delete city-map files while keeping progress, or reset all user
data after two confirmations.

Finishing an exploration creates a local screenshot of the active city coverage.
It omits the exact route, endpoints, user marker, residence, and precise time.
Export and sharing use the system share sheet; the user chooses the recipient.

Questions and security reports: https://github.com/YuanhaoMeng/fill-my-map/issues
