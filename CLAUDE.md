# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Home Assistant custom lovelace card (`now-playing`) that displays all active media players and their current playing content. Shows artwork, progress bars, and metadata for music, movies, TV shows, and other media.

## Architecture

Single-file Web Component (`now-playing.js`) that extends `HTMLElement`. Key lifecycle methods:
- `setConfig(config)` - stores config and optional `exclude` filter
- `set hass(hass)` - Home Assistant state callback, triggers re-render when media content changes
- `disconnectedCallback()` - cleans up progress timer interval
- `render()` - builds DOM with inline styles, sets up 1s interval for live progress updates

Key state comparison uses JSON serialization of player id/title/image to detect actual content changes rather than every state update.

## Progress Tracking

Progress bars update in real-time using `setInterval(1000ms)`. The `getProgress()` method calculates elapsed time from `media_position_updated_at` and clamps to `media_duration`. Updates only apply when player state is 'playing'.

## Image Loading

Falls through multiple sources:
1. `media_image_url` + `media_image_hash` → proxied via `/api/media_player_proxy/`
2. `entity_picture` → resolved via `hass.hassUrl()`
3. `media_image_url` → direct URL

Images have an `onerror` fallback to the content type icon (emoji).

## Click-to-More-Info

Each player row is clickable and dispatches a `hass-more-info` event with the entity_id to open Home Assistant's more-info dialog.

## MDI Icons

Uses Material Design Icons (mdi:) prefix for playback state icons (`mdi:play`, `mdi:pause`, `mdi:sleep`, `mdi:stop`, `mdi:stop-circle`).

## HACS Installation

For HACS publishing, the repository structure is:
- `now-playing.js` - the card (root level)
- `info.md` - HACS metadata with `type: lovelace`
- `README.md` - usage documentation

HACS installs the card to `/www/community/now-playing/` and users reference it as `type: custom:now-playing`.
