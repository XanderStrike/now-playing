# Now Playing

A Home Assistant Lovelace card that displays all active media players with their current playing content, including artwork, progress bars, and metadata.

Useful if you wish to monitor the Jellyfin or Plex integrations which create a slew of media player entities to represent your users.

<img width="398" height="467" alt="image" src="https://github.com/user-attachments/assets/9380cd39-ca9f-463c-b4c7-ef549741ee3f" />


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
