// ============================================================================
// RouteReady Campus - Leaflet Map Service & Live Bus Visualizer
// ============================================================================

const MapService = {
  // MRECW Campus Coordinates
  MRECW_COORDS: [17.5615000, 78.4485000],

  createMap(containerId, options = {}) {
    if (typeof L === 'undefined') {
      console.error('[MapService] Leaflet library is not loaded');
      return null;
    }

    const map = L.map(containerId, {
      center: options.center || this.MRECW_COORDS,
      zoom: options.zoom || 12,
      attributionControl: true
    });

    // OpenStreetMap Standard Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | RouteReady Campus MRECW'
    }).addTo(map);

    return map;
  },

  // Custom Icon Helpers
  getCampusIcon() {
    return L.divIcon({
      className: 'custom-map-icon campus-icon',
      html: `<div style="background-color: #0A2540; color: #FFF; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid #00A896; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">🎓</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  },

  getStopIcon(seqNumber) {
    return L.divIcon({
      className: 'custom-map-icon stop-icon',
      html: `<div style="background-color: #FFFFFF; color: #0A2540; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; border: 2px solid #0A2540; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${seqNumber}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
  },

  getBusIcon(isSimulated = true) {
    const bg = isSimulated ? '#F59E0B' : '#10B981';
    const border = isSimulated ? '#B45309' : '#047857';
    return L.divIcon({
      className: 'custom-map-icon bus-icon',
      html: `<div style="background-color: ${bg}; color: #FFF; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid ${border}; box-shadow: 0 4px 8px rgba(0,0,0,0.4); animation: pulse 2s infinite;">🚌</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  },

  getUserLocationIcon() {
    return L.divIcon({
      className: 'custom-map-icon user-icon',
      html: `<div style="background-color: #3B82F6; color: #FFF; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 3px solid #FFFFFF; box-shadow: 0 0 10px rgba(59,130,246,0.6);">📍</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  },

  renderRoute(map, stops) {
    if (!map || !stops || stops.length === 0) return null;

    const latLngs = [];
    const markers = [];

    stops.forEach((stop, index) => {
      if (stop.latitude && stop.longitude) {
        const point = [stop.latitude, stop.longitude];
        latLngs.push(point);

        const isCampus = index === stops.length - 1;
        const icon = isCampus ? this.getCampusIcon() : this.getStopIcon(stop.sequence || index + 1);

        const marker = L.marker(point, { icon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 180px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700;">Stop ${stop.sequence || index + 1}</div>
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${stop.name}</div>
            <div style="font-size: 12px; color: #475569;">${stop.address_label || stop.description || ''}</div>
            ${stop.scheduled_arrival_offset_minutes !== undefined ? `
              <div style="margin-top: 6px; font-size: 12px; background: #F1F5F9; padding: 4px 8px; border-radius: 4px;">
                ⏱ Offset: +${stop.scheduled_arrival_offset_minutes} mins from start
              </div>
            ` : ''}
          </div>
        `);
        markers.push(marker);
      }
    });

    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#00A896',
        weight: 5,
        opacity: 0.85,
        lineJoin: 'round'
      }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }

    return markers;
  }
};

window.MapService = MapService;

