# Now Playing

A Home Assistant Lovelace card that displays all active media players with their current playing content, including artwork, progress bars, and metadata.

Useful if you wish to monitor the Jellyfin or Plex integrations which create a slew of media player entities to represent your users.

<img width="397" height="639" alt="Screenshot 2026-03-01 at 8 21 45 PM" src="https://github.com/user-attachments/assets/61822c76-3baa-4379-9a5c-5e4569833550" />

> [!IMPORTANT]
> This card works on its own with the Core Plex/Jellyfin components, however my custom override [Plex](https://github.com/XanderStrike/plex-hass-custom) and [Jellyfin](https://github.com/XanderStrike/jf-custom) integrations add additional data like transcoding info. I make no guarantees that those are actively maintained or will be kept up to date though.

## Installation

Add it as a HACS custom repository:

1. Go to HACS → the three dots menu → Custom repositories
3. Click "Add custom repository"
4. URL: `XanderStrike/now-playing`
5. Category: Dashboard
6. Click "Add"
7. Search for Now Playing and install

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
