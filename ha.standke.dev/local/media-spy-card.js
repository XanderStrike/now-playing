class MediaSpyCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    const players = this.getMediaPlayers();
    const playerKey = JSON.stringify(players.map(p => ({
      id: p.entity_id,
      title: p.attributes.media_title,
      picture: p.attributes.entity_picture,
      image_url: p.attributes.media_image_url,
      image_hash: p.attributes.media_image_hash
    })));

    if (this._lastPlayerKey !== playerKey) {
      this._lastPlayerKey = playerKey;
      this.render();
    }
  }

  setConfig(config) {
    this._config = config;
    this._exclude = config.exclude || [];
  }

  getCardSize() {
    const count = this.getMediaPlayers().length;
    return Math.max(4, count * 3.5);
  }

  getMediaPlayers() {
    if (!this._hass) return [];
    return Object.values(this._hass.states)
      .filter(state => state.entity_id.startsWith('media_player.'))
      .filter(state => state.attributes.media_content_type)
      .filter(state => !this._exclude.includes(state.entity_id));
  }

  formatState(state) {
    const friendlyName = state.attributes.friendly_name || state.entity_id;
    const contentType = state.attributes.media_content_type;

    return { friendlyName, contentType };
  }

  getContentTypeIcon(contentType) {
    if (contentType === 'movie') return '🎬';
    if (contentType === 'tvshow') return '📺';
    if (contentType === 'music') return '🎵';
    if (contentType === 'playlist') return '📋';
    if (contentType === 'video') return '▶';
    return '📺';
  }

  getRichDisplay(state) {
    const contentType = state.attributes.media_content_type;
    const title = state.attributes.media_title || 'Unknown';
    const subtitle = state.attributes.media_series_title || '';

    if (contentType === 'movie') {
      const year = state.attributes.media_year || '';
      return { icon: '🎬', title, subtitle: year };
    }

    if (contentType === 'tvshow') {
      const season = state.attributes.media_season || '?';
      const episode = state.attributes.media_episode || '?';
      const episodeInfo = subtitle ? `S${season}E${episode}` : '';
      return { icon: '📺', title, subtitle: subtitle + (episodeInfo ? ` • ${episodeInfo}` : '') };
    }

    if (contentType === 'music') {
      const artist = state.attributes.media_artist || '';
      const album = state.attributes.media_album_name || '';
      return { icon: '🎵', title, subtitle: artist + (album ? ` • ${album}` : '') };
    }

    return { icon: this.getContentTypeIcon(contentType), title, subtitle: '' };
  }

  getProgress(state) {
    const position = state.attributes.media_position;
    const duration = state.attributes.media_duration;
    const updatedAt = state.attributes.media_position_updated_at;

    if (position === null || position === undefined || !duration) {
      return null;
    }

    let currentPosition = position;
    if (updatedAt) {
      const now = new Date().getTime();
      const updatedTime = new Date(updatedAt).getTime();
      const elapsed = (now - updatedTime) / 1000;
      currentPosition = Math.min(position + elapsed, duration);
    }

    return {
      position: currentPosition,
      duration: duration,
      percent: (currentPosition / duration) * 100
    };
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getStateIcon(state) {
    const s = state || 'unknown';
    if (s === 'playing') return 'mdi:play';
    if (s === 'paused') return 'mdi:pause';
    if (s === 'idle') return 'mdi:sleep';
    if (s === 'standby') return 'mdi:sleep';
    if (s === 'off') return 'mdi:stop';
    return 'mdi:stop-circle';
  }

  getMediaImageUrl(state) {
    const imageUrl = state.attributes.media_image_url;
    const imageHash = state.attributes.media_image_hash;
    const entityPicture = state.attributes.entity_picture;

    if (imageUrl && imageHash && this._hass) {
      return this._hass.hassUrl(`/api/media_player_proxy/${state.entity_id}/${imageHash}`);
    }

    if (entityPicture) {
      return this._hass ? this._hass.hassUrl(entityPicture) : entityPicture;
    }

    if (imageUrl) {
      return imageUrl;
    }

    return null;
  }

  render() {
    const players = this.getMediaPlayers();

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
      }
      .card {
        padding: 8px;
        background: var(--ha-card-background, var(--card-background-color, #fff));
        border-radius: var(--ha-card-border-radius, 12px);
        box-shadow: var(--ha-card-box-shadow, none);
      }
      .header {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .header-icon {
        font-size: 1.5rem;
      }
      .player-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .player {
        display: flex;
        gap: 12px;
        padding: 8px 0;
        cursor: pointer;
      }
      .player-image {
        width: 80px;
        height: 80px;
        min-width: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        overflow: hidden;
        flex-shrink: 0;
      }
      .player-image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .player-content {
        flex: 1;
        min-width: 0;
      }
      .player-source {
        font-size: 0.7rem;
        color: var(--secondary-text-color, #888);
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
      }
      .player-app {
        display: inline-block;
        margin-left: 6px;
        padding: 2px 6px;
        background: var(--primary-color, #03a9f4);
        color: var(--text-primary-color, #fff);
        border-radius: 4px;
        font-size: 0.65rem;
        text-transform: uppercase;
      }
      .player-title {
        font-weight: 600;
        font-size: 1rem;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .player-subtitle {
        font-size: 0.85rem;
        color: var(--secondary-text-color, #666);
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .player-meta {
        font-size: 0.75rem;
        color: var(--disabled-text-color, #999);
        margin-bottom: 6px;
      }
      .player-meta span {
        margin-right: 8px;
      }
      .progress-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .progress-icon {
        --mdc-icon-size: 16px;
        color: var(--secondary-text-color, #888);
      }
      .progress-bar {
        flex: 1;
        height: 4px;
        background: var(--disabled-text-color, #e0e0e0);
        border-radius: 2px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: var(--primary-color, #03a9f4);
        border-radius: 2px;
        transition: width 0.3s ease;
      }
      .progress-text {
        font-size: 0.7rem;
        color: var(--secondary-text-color, #888);
        min-width: 80px;
        text-align: right;
      }
      .no-players {
        color: var(--secondary-text-color, #666);
        padding: 32px 16px;
        text-align: center;
        font-size: 0.9rem;
      }
      .no-players-icon {
        font-size: 3rem;
        margin-bottom: 12px;
        opacity: 0.5;
      }
    `;

    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = '<span class="header-icon">🎬</span><span>Now Playing (' + players.length + ')</span>';
    card.appendChild(header);

    const playerList = document.createElement('div');
    playerList.className = 'player-list';

    if (players.length === 0) {
      const noPlayers = document.createElement('div');
      noPlayers.className = 'no-players';
      noPlayers.innerHTML = '<div class="no-players-icon">🎵</div><div>Nothing playing right now</div>';
      playerList.appendChild(noPlayers);
    } else {
      players.forEach(player => {
        const { friendlyName } = this.formatState(player);
        const { icon, title, subtitle } = this.getRichDisplay(player);
        const progress = this.getProgress(player);
        const imageUrl = this.getMediaImageUrl(player);
        const trackNumber = player.attributes.media_track;
        const albumArtist = player.attributes.media_album_artist;
        const playlist = player.attributes.media_playlist;
        const appName = player.attributes.app_name;

        const playerEl = document.createElement('div');
        playerEl.className = 'player';
        playerEl.addEventListener('click', () => {
          const event = new Event('hass-more-info', { bubbles: true, composed: true });
          event.detail = { entityId: player.entity_id };
          this.dispatchEvent(event);
        });

        let imageContent = icon;
        if (imageUrl) {
          imageContent = `<img src="${imageUrl}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${icon}'">`;
        }

        let metaInfo = [];
        if (trackNumber) metaInfo.push(`Track ${trackNumber}`);
        if (albumArtist) metaInfo.push(albumArtist);
        if (playlist) metaInfo.push(`📋 ${playlist}`);

        let progressHtml = '';
        if (progress) {
          const stateIcon = this.getStateIcon(player.state);
          progressHtml = `
            <div class="progress-container">
              <ha-icon icon="${stateIcon}" class="progress-icon"></ha-icon>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress.percent}%"></div>
              </div>
              <div class="progress-text">${this.formatTime(progress.position)} / ${this.formatTime(progress.duration)}</div>
            </div>
          `;
        }

        let appHtml = '';
        if (appName) {
          appHtml = `<span class="player-app">${appName}</span>`;
        }

        playerEl.innerHTML = `
          <div class="player-image">${imageContent}</div>
          <div class="player-content">
            <div class="player-source">${friendlyName}${appHtml}</div>
            <div class="player-title">${title}</div>
            ${subtitle ? '<div class="player-subtitle">' + subtitle + '</div>' : ''}
            ${metaInfo.length ? '<div class="player-meta">' + metaInfo.map(m => `<span>${m}</span>`).join('') + '</div>' : ''}
            ${progressHtml}
          </div>
        `;
        playerList.appendChild(playerEl);
      });
    }

    card.appendChild(playerList);

    this.innerHTML = '';
    this.appendChild(style);
    this.appendChild(card);
  }
}

customElements.define('media-spy-card', MediaSpyCard);
