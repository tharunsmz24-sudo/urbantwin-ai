/**
 * Interactive Tamil Nadu Climate Digital Twin Map
 * Leaflet.js Map Controller with District Boundaries, Urban Monitoring Zones, Thematic Overlays, and Interactive Selection
 */

const CityMapController = {
  map: null,
  layers: {
    dark: null,
    streets: null,
    satellite: null
  },
  districtLayerGroup: null,
  urbanZoneLayerGroup: null,
  markersMap: {},
  selectedLocationId: null,
  onLocationSelectCallback: null,

  // Active View & Thematic Display Modes
  activeView: "districts", // 'districts' | 'urban_zones' | 'combined'
  thematicMode: "heat_risk", // 'heat_risk' | 'green_cover' | 'population'

  /**
   * Initialize Leaflet map focused on Tamil Nadu, India
   */
  init(mapElementId, districts, urbanZones, onLocationSelect) {
    if (this.map) return; // Prevent re-initialization

    this.onLocationSelectCallback = onLocationSelect;

    // Centered on Tamil Nadu geographic center (near Tiruchirappalli / Karur)
    const tnCenter = [11.1271, 78.6569];

    this.map = L.map(mapElementId, {
      center: tnCenter,
      zoom: 7.5,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    });

    // Custom positioned zoom control
    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    // Custom attribution for Tamil Nadu Digital Twin
    L.control.attribution({
      position: "bottomleft",
      prefix: '<span>Tamil Nadu UrbanTwin AI &bull; OpenStreetMap contributors &bull; CartoDB</span>'
    }).addTo(this.map);

    // Dark Matter tile layer as default (sleek navy tech look)
    this.layers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.map);

    // Standard OpenStreetMap layer
    this.layers.streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    });

    // Satellite Imagery layer
    this.layers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18
    });

    // Layer Groups
    this.districtLayerGroup = L.layerGroup().addTo(this.map);
    this.urbanZoneLayerGroup = L.layerGroup().addTo(this.map);

    // Initial render
    this.renderAllLayers(districts, urbanZones);

    // Setup Map Legend
    this.addLegend();

    // Invalidate size after layout rendering
    setTimeout(() => {
      this.map.invalidateSize();
      this.fitTamilNaduBounds();
    }, 250);
  },

  /**
   * Fit map viewport to encompass the entire state of Tamil Nadu
   */
  fitTamilNaduBounds() {
    if (!this.map) return;
    // Bounding box for Tamil Nadu from Kanniyakumari (8.0°N) to Tiruvallur (13.5°N)
    const tnBounds = L.latLngBounds(
      [8.05, 76.2],  // Southwest corner
      [13.55, 80.35] // Northeast corner
    );
    this.map.fitBounds(tnBounds, { padding: [20, 20] });
  },

  /**
   * Render or update all district and urban zone layers
   */
  renderAllLayers(districts, urbanZones) {
    this.districtLayerGroup.clearLayers();
    this.urbanZoneLayerGroup.clearLayers();
    this.markersMap = {};

    // 1. Render 38 Tamil Nadu Districts
    districts.forEach(district => {
      const risk = HeatRiskEngine.computeRisk(district);
      const isSelected = district.id === this.selectedLocationId;

      // Determine color according to active thematic mode
      const themeColor = this.getThematicColor(district, risk);

      // District Territorial Influence Circle
      const circle = L.circle([district.lat, district.lng], {
        color: themeColor,
        fillColor: themeColor,
        fillOpacity: isSelected ? 0.38 : 0.20,
        weight: isSelected ? 3.5 : 1.5,
        dashArray: isSelected ? null : "4, 4",
        radius: district.radius || 16000
      });

      // Custom Center Marker Icon
      const markerHtml = `
        <div class="custom-map-marker district-marker ${risk.colorClass} ${isSelected ? 'marker-selected' : ''}">
          <div class="marker-core">
            <span class="marker-score">${Math.round(risk.score)}</span>
          </div>
          <div class="marker-pulse"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'div-icon-wrapper',
        html: markerHtml,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });

      const marker = L.marker([district.lat, district.lng], { icon: customIcon });

      const handleSelect = () => {
        this.selectLocation(district.id, districts, urbanZones);
        if (this.onLocationSelectCallback) {
          this.onLocationSelectCallback(district);
        }
      };

      circle.on('click', handleSelect);
      marker.on('click', handleSelect);

      // Tooltip on Hover
      const tooltipContent = `
        <div class="map-tooltip-content">
          <div class="tooltip-header">
            <span class="zone-badge ${risk.badgeClass}">${risk.category}</span>
            <strong class="tooltip-title">${district.name} District</strong>
          </div>
          <div class="tooltip-metrics">
            <div class="tm-row"><span>Surface Temp (LST):</span> <b>${district.surfaceTemp.toFixed(1)}°C</b></div>
            <div class="tm-row"><span>Ambient Temp:</span> <b>${district.ambientTemp.toFixed(1)}°C</b></div>
            <div class="tm-row"><span>Green Canopy:</span> <b>${district.greenCover.toFixed(1)}%</b></div>
            <div class="tm-row"><span>Building Density:</span> <b>${district.buildingDensity}%</b></div>
            <div class="tm-row"><span>Vulnerable Pop:</span> <b>${district.vulnerablePop.toLocaleString()}</b></div>
            <div class="tm-row"><span>Heat-Risk Score:</span> <b style="color: ${risk.hexColor}">${risk.score} / 100</b></div>
          </div>
          <div class="tooltip-footer">Click to inspect district & simulate interventions</div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        className: 'digital-twin-tooltip',
        offset: [0, -18],
        opacity: 0.98
      });

      circle.addTo(this.districtLayerGroup);
      marker.addTo(this.districtLayerGroup);

      this.markersMap[district.id] = { circle, marker, data: district, risk, type: "district" };
    });

    // 2. Render Urban Monitoring Micro-Zones
    urbanZones.forEach(zone => {
      const risk = HeatRiskEngine.computeRisk(zone);
      const isSelected = zone.id === this.selectedLocationId;
      const themeColor = this.getThematicColor(zone, risk);

      // Micro Heat Boundary Circle
      const circle = L.circle([zone.lat, zone.lng], {
        color: themeColor,
        fillColor: themeColor,
        fillOpacity: isSelected ? 0.45 : 0.28,
        weight: isSelected ? 3 : 2,
        radius: zone.radius || 900
      });

      // Distinct Urban Zone Marker
      const markerHtml = `
        <div class="custom-map-marker urban-zone-marker ${risk.colorClass} ${isSelected ? 'marker-selected' : ''}">
          <div class="marker-core micro-core">
            <i class="fa-solid fa-city"></i>
          </div>
          <div class="marker-pulse"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'div-icon-wrapper',
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([zone.lat, zone.lng], { icon: customIcon });

      const handleSelect = () => {
        this.selectLocation(zone.id, districts, urbanZones);
        if (this.onLocationSelectCallback) {
          this.onLocationSelectCallback(zone);
        }
      };

      circle.on('click', handleSelect);
      marker.on('click', handleSelect);

      const tooltipContent = `
        <div class="map-tooltip-content">
          <div class="tooltip-header">
            <span class="zone-badge ${risk.badgeClass}">${risk.category}</span>
            <span class="badge badge-subtle" style="font-size: 0.65rem;">Urban Micro-Zone</span>
            <strong class="tooltip-title">${zone.name}</strong>
            <small style="color: var(--cyan-primary);">${zone.districtName} &bull; ${zone.type}</small>
          </div>
          <div class="tooltip-metrics">
            <div class="tm-row"><span>Surface Temp:</span> <b>${zone.surfaceTemp.toFixed(1)}°C</b></div>
            <div class="tm-row"><span>Green Cover:</span> <b>${zone.greenCover.toFixed(1)}%</b></div>
            <div class="tm-row"><span>Density:</span> <b>${zone.buildingDensity}%</b></div>
            <div class="tm-row"><span>Heat-Risk:</span> <b style="color: ${risk.hexColor}">${risk.score} / 100</b></div>
          </div>
          <div class="tooltip-footer">Click to simulate cooling interventions</div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        className: 'digital-twin-tooltip',
        offset: [0, -16],
        opacity: 0.98
      });

      circle.addTo(this.urbanZoneLayerGroup);
      marker.addTo(this.urbanZoneLayerGroup);

      this.markersMap[zone.id] = { circle, marker, data: zone, risk, type: "urban_zone" };
    });

    // Apply active view filter
    this.applyViewFilter();
  },

  /**
   * Determine color based on active thematic visualization mode
   */
  getThematicColor(item, risk) {
    if (this.thematicMode === "green_cover") {
      // Emerald gradient for green cover percentage
      if (item.greenCover >= 45) return "#10b981"; // Lush green
      if (item.greenCover >= 25) return "#34d399";
      if (item.greenCover >= 15) return "#eab308";
      return "#ef4444"; // Deficit
    } else if (this.thematicMode === "population") {
      // Magenta/Purple for high demographic exposure
      if (item.populationExposure >= 85) return "#d946ef";
      if (item.populationExposure >= 70) return "#a855f7";
      if (item.populationExposure >= 50) return "#3b82f6";
      return "#06b6d4";
    }
    // Default: Heat-Risk
    return risk.hexColor;
  },

  /**
   * Filter visible map layers based on view toggle
   */
  applyViewFilter() {
    if (!this.map) return;

    if (this.activeView === "districts") {
      if (!this.map.hasLayer(this.districtLayerGroup)) this.districtLayerGroup.addTo(this.map);
      if (this.map.hasLayer(this.urbanZoneLayerGroup)) this.map.removeLayer(this.urbanZoneLayerGroup);
    } else if (this.activeView === "urban_zones") {
      if (this.map.hasLayer(this.districtLayerGroup)) this.map.removeLayer(this.districtLayerGroup);
      if (!this.map.hasLayer(this.urbanZoneLayerGroup)) this.urbanZoneLayerGroup.addTo(this.map);
    } else { // combined
      if (!this.map.hasLayer(this.districtLayerGroup)) this.districtLayerGroup.addTo(this.map);
      if (!this.map.hasLayer(this.urbanZoneLayerGroup)) this.urbanZoneLayerGroup.addTo(this.map);
    }
  },

  /**
   * Switch between District view and Urban Zone view
   */
  setViewMode(mode) {
    this.activeView = mode;
    this.applyViewFilter();

    if (mode === "districts") {
      this.fitTamilNaduBounds();
    } else if (mode === "urban_zones") {
      // Zoom into central Tamil Nadu corridor
      this.map.setView([11.5, 78.5], 8, { duration: 0.8 });
    }
  },

  /**
   * Switch thematic visualization mode (heat_risk, green_cover, population)
   */
  setThematicMode(mode, districts, urbanZones) {
    this.thematicMode = mode;
    this.renderAllLayers(districts, urbanZones);
    this.updateLegend();
  },

  /**
   * Highlight and fly to a selected district or urban zone
   */
  selectLocation(locationId, districts, urbanZones) {
    this.selectedLocationId = locationId;

    if (this.markersMap[locationId]) {
      const { data, type } = this.markersMap[locationId];
      const targetZoom = type === "district" ? 10 : 14;

      this.map.flyTo([data.lat, data.lng], targetZoom, {
        duration: 0.8
      });

      // Ensure appropriate layer is visible
      if (type === "urban_zone" && this.activeView === "districts") {
        this.setViewMode("urban_zones");
      }

      this.renderAllLayers(districts, urbanZones);
    }
  },

  /**
   * Change Base Map Layer (dark, streets, satellite)
   */
  setBaseLayer(type) {
    if (!this.map || !this.layers[type]) return;

    Object.values(this.layers).forEach(layer => {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });

    this.layers[type].addTo(this.map);
  },

  /**
   * Add Interactive Legend to Map
   */
  addLegend() {
    const legend = L.control({ position: 'topright' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend-card');
      div.id = 'mapLegendCard';
      div.innerHTML = this.getLegendHtml();
      return div;
    };

    legend.addTo(this.map);
  },

  /**
   * Dynamic Legend HTML based on active thematic mode
   */
  getLegendHtml() {
    if (this.thematicMode === "green_cover") {
      return `
        <div class="legend-header">
          <i class="fa-solid fa-tree text-success"></i>
          <span>Vegetative Canopy Cover</span>
        </div>
        <div class="legend-scale">
          <div class="legend-item"><span class="legend-color-dot" style="background: #10b981;"></span><span>&ge; 45% (Dense Buffer)</span></div>
          <div class="legend-item"><span class="legend-color-dot" style="background: #34d399;"></span><span>25% - 44% (Moderate)</span></div>
          <div class="legend-item"><span class="legend-color-dot" style="background: #eab308;"></span><span>15% - 24% (Low)</span></div>
          <div class="legend-item"><span class="legend-color-dot" style="background: #ef4444;"></span><span>&lt; 15% (Critical Deficit)</span></div>
        </div>
        <div class="legend-disclaimer"><i class="fa-solid fa-circle-info"></i> Tamil Nadu Green Mission</div>
      `;
    } else if (this.thematicMode === "population") {
      return `
        <div class="legend-header">
          <i class="fa-solid fa-users text-cyan"></i>
          <span>Population Heat Exposure</span>
        </div>
        <div class="legend-scale">
          <div class="legend-item"><span class="legend-color-dot" style="background: #d946ef;"></span><span>&ge; 85 (Severe Exposure)</span></div>
          <div class="legend-item"><span class="legend-color-dot" style="background: #a855f7;"></span><span>70 - 84 (High Exposure)</span></div>
          <div class="legend-item"><span class="legend-color-dot" style="background: #3b82f6;"></span><span>50 - 69 (Moderate)</span></div>
          <div class="legend-item"><span class="legend-color-dot" style="background: #06b6d4;"></span><span>&lt; 50 (Low Exposure)</span></div>
        </div>
        <div class="legend-disclaimer"><i class="fa-solid fa-circle-info"></i> TNDSMA Vulnerability Map</div>
      `;
    }

    // Default Heat Risk Legend
    return `
      <div class="legend-header">
        <i class="fa-solid fa-layer-group text-cyan"></i>
        <span>Heat-Risk Classification (UHRI)</span>
      </div>
      <div class="legend-scale">
        <div class="legend-item">
          <span class="legend-color-dot" style="background: #ef4444;"></span>
          <span class="legend-label">Critical Risk (&ge; 70)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color-dot" style="background: #f97316;"></span>
          <span class="legend-label">High Risk (55 - 69)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color-dot" style="background: #eab308;"></span>
          <span class="legend-label">Moderate Risk (32 - 54)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color-dot" style="background: #10b981;"></span>
          <span class="legend-label">Low Risk (&lt; 32)</span>
        </div>
      </div>
      <div class="legend-disclaimer">
        <i class="fa-solid fa-circle-info"></i> Tamil Nadu State Twin
      </div>
    `;
  },

  updateLegend() {
    const card = document.getElementById("mapLegendCard");
    if (card) {
      card.innerHTML = this.getLegendHtml();
    }
  }
};
