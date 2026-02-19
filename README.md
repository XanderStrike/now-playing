# Now Playing

A Home Assistant Lovelace card that displays all active media players with their current playing content, including artwork, progress bars, and metadata.

## Features

- Shows all media players with active content (movies, TV shows, music, etc.)
- Displays artwork from media sources
- Real-time progress bars for active playback
- Content type icons (🎬 movies, 📺 TV shows, 🎵 music)
- Metadata display (season/episode, artist/album, track number, playlists)
- Click any player to open Home Assistant's more-info dialog
- Exclude specific media players via configuration

## Installation

This card is not in the HACS default repository. Add it as a custom repository:

1. Go to HACS → Frontend
2. Click the three dots menu → Custom repositories
3. Click "Add custom repository"
4. URL: `XanderStrike/now-playing`
5. Category: Lovelace
6. Click "Add"
7. The card will appear in the Frontend list - click to install

## Usage

Add to your Lovelace dashboard:

```yaml
type: custom:now-playing
```

### Optional Configuration

```yaml
type: custom:now-playing
exclude:
  - media_player.bedroom_speaker
  - media_player.kitchen_display
```

The `exclude` option allows you to hide specific media player entities from the card.
