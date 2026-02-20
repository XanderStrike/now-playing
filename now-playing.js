class NowPlaying extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    const players = this.getMediaPlayers();
    const key = JSON.stringify(players.map(p => ({
      id: p.entity_id,
      title: p.attributes.media_title,
      picture: p.attributes.entity_picture,
      image_url: p.attributes.media_image_url,
      image_hash: p.attributes.media_image_hash
    })));

    if (this._lastKey !== key) {
      this._lastKey = key;
      this.render();
    }
  }

  setConfig(config) {
    this._config = config;
    this._exclude = config.exclude || [];
  }

  disconnectedCallback() {
    if (this._progressInterval) {
      clearInterval(this._progressInterval);
      this._progressInterval = null;
    }
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: 'exclude',
          selector: {
            entity: {
              multiple: true,
              filter: { domain: 'media_player' }
            }
          }
        },
      ],
      computeLabel: (schema) => schema.name === 'exclude' ? 'Excluded Entities' : undefined,
      computeHelper: (schema) => schema.name === 'exclude' ? 'Media players to hide from this card' : undefined,
    };
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return Math.max(4, this.getMediaPlayers().length * 3.5);
  }

  getMediaPlayers() {
    if (!this._hass) return [];
    return Object.values(this._hass.states)
      .filter(s => s.entity_id.startsWith('media_player.'))
      .filter(s => s.attributes.media_content_type)
      .filter(s => !this._exclude.includes(s.entity_id));
  }

  getDisplay(state) {
    const attrs = state.attributes;
    const contentType = attrs.media_content_type;
    const title = attrs.media_title || 'Unknown';
    const icon = { movie: '🎬', tvshow: '📺', music: '🎵', playlist: '📋', video: '▶' }[contentType] || '📺';

    let subtitle = '';
    if (contentType === 'movie') {
      subtitle = attrs.media_year || '';
    } else if (contentType === 'tvshow') {
      const series = attrs.media_series_title || '';
      const ep = series ? `S${attrs.media_season || '?'}E${attrs.media_episode || '?'}` : '';
      subtitle = series + (ep ? ` • ${ep}` : '');
    } else if (contentType === 'music') {
      const artist = attrs.media_artist || '';
      const album = attrs.media_album_name || '';
      subtitle = artist + (album ? ` • ${album}` : '');
    }

    return { icon, title, subtitle };
  }

  getProgress(state) {
    const position = state.attributes.media_position;
    const duration = state.attributes.media_duration;
    if (position == null || !duration) return null;

    const updatedAt = state.attributes.media_position_updated_at;
    const elapsed = updatedAt ? (Date.now() - new Date(updatedAt).getTime()) / 1000 : 0;
    const current = Math.min(position + elapsed, duration);

    return { position: current, duration, percent: (current / duration) * 100 };
  }

  formatTime(seconds) {
    if (!seconds) return '';
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
  }

  getStateIcon(state) {
    return { playing: 'mdi:play', paused: 'mdi:pause', idle: 'mdi:sleep', standby: 'mdi:sleep', off: 'mdi:stop' }[state] || 'mdi:stop-circle';
  }

  getMediaImageUrl(state) {
    const { media_image_url, media_image_hash, entity_picture } = state.attributes;
    if (media_image_url && media_image_hash && this._hass) {
      return this._hass.hassUrl(`/api/media_player_proxy/${state.entity_id}/${media_image_hash}`);
    }
    if (entity_picture && this._hass) {
      return this._hass.hassUrl(entity_picture);
    }
    return media_image_url || null;
  }

  render() {
    const players = this.getMediaPlayers();

    if (this._progressInterval) {
      clearInterval(this._progressInterval);
      this._progressInterval = null;
    }
    this._progressElements = [];

    this.innerHTML = `
      <style>
        :host { display: block; }
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
        }
        .player-list { display: flex; flex-direction: column; gap: 16px; }
        .player { display: flex; gap: 12px; padding: 8px 0; cursor: pointer; }
        .player-image {
          width: 80px; height: 80px; min-width: 80px;
          display: flex; align-items: center; justify-content: center;
          font-size: 2.5rem; overflow: hidden; flex-shrink: 0;
        }
        .player-image img { width: 100%; height: 100%; object-fit: contain; }
        .player-content { flex: 1; min-width: 0; }
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
        .player-meta span { margin-right: 8px; }
        .progress-container { display: flex; align-items: center; gap: 8px; }
        .progress-icon { --mdc-icon-size: 16px; color: var(--secondary-text-color, #888); }
        .progress-bar {
          flex: 1; height: 4px;
          background: var(--disabled-text-color, #e0e0e0);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-fill { height: 100%; background: var(--primary-color, #03a9f4); border-radius: 2px; }
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
        .no-players-icon { font-size: 3rem; margin-bottom: 12px; opacity: 0.5; }
      </style>
      <div class="card">
        <div class="header">Now Playing</div>
        <div class="player-list">
          ${players.length === 0 ? `
            <div class="no-players">
              <div class="no-players-icon">🎵</div>
              <div>Nothing playing right now</div>
            </div>
          ` : players.map(player => {
            const attrs = player.attributes;
            const { icon, title, subtitle } = this.getDisplay(player);
            const progress = this.getProgress(player);
            const imageUrl = this.getMediaImageUrl(player);
            const name = attrs.friendly_name || player.entity_id;
            const meta = [
              attrs.media_track && `Track ${attrs.media_track}`,
              attrs.media_album_artist,
              attrs.media_playlist && `📋 ${attrs.media_playlist}`
            ].filter(Boolean);

            const progressId = progress ? `progress-${player.entity_id.replace('.', '-')}` : null;
            if (progress) {
              this._progressElements.push({ id: progressId, player, progress });
            }

            return `
              <div class="player" data-entity="${player.entity_id}">
                <div class="player-image">
                  ${imageUrl ? `<img src="${imageUrl}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${icon}'">` : icon}
                </div>
                <div class="player-content">
                  <div class="player-source">${name}${attrs.app_name ? `<span class="player-app">${attrs.app_name}</span>` : ''}</div>
                  <div class="player-title">${title}</div>
                  ${subtitle ? `<div class="player-subtitle">${subtitle}</div>` : ''}
                  ${meta.length ? `<div class="player-meta">${meta.map(m => `<span>${m}</span>`).join('')}</div>` : ''}
                  ${progress ? `
                    <div class="progress-container">
                      <ha-icon icon="${this.getStateIcon(player.state)}" class="progress-icon"></ha-icon>
                      <div class="progress-bar">
                        <div class="progress-fill" id="${progressId}-bar" style="width: ${progress.percent}%"></div>
                      </div>
                      <div class="progress-text" id="${progressId}-text">${this.formatTime(progress.position)} / ${this.formatTime(progress.duration)}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.querySelectorAll('.player').forEach(el => {
      el.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('hass-more-info', {
          bubbles: true,
          composed: true,
          detail: { entityId: el.dataset.entity }
        }));
      });
    });

    if (this._progressElements.length) {
      this._progressInterval = setInterval(() => {
        this._progressElements.forEach(el => {
          if (el.player.state !== 'playing') return;
          const bar = this.querySelector(`#${el.id}-bar`);
          const text = this.querySelector(`#${el.id}-text`);
          if (!bar || !text) return;

          const elapsed = (Date.now() - new Date(el.player.attributes.media_position_updated_at).getTime()) / 1000;
          const position = Math.min(el.progress.position + elapsed, el.progress.duration);
          bar.style.width = `${(position / el.progress.duration) * 100}%`;
          text.textContent = `${this.formatTime(position)} / ${this.formatTime(el.progress.duration)}`;
        });
      }, 1000);
    }
  }
}

customElements.define('now-playing', NowPlaying);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'now-playing',
  name: 'Now Playing',
  description: 'Displays all active media players and their current playing content',
  preview: true,
  documentationURL: 'https://github.com/xanderstrike/now-playing',
});
