# Changelog

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security


## 0.2.0 - 2026-05-13

### Added

- Added an Islands UI variant named `Islands Asteria` alongside the existing Asteria theme.
- Added generated theme output for the Islands layout and registered it with `targetUi="islands"`.
- Added pnpm-based theme generation scripts.

### Changed

- Migrated theme generation from the previous Deno-based setup to Node.js scripts run through pnpm.
- Updated the Gradle build to use the current IntelliJ Platform Gradle Plugin setup.
- Updated GitHub Actions to install pnpm, use Java 21, and upload artifacts with `actions/upload-artifact@v4`.

## 0.1.1 - 2024-11-13

### Changed

- Removed the plugin `until-build` limit.

## 0.1.0 - 2024-05-05

- Initial release 🎉
