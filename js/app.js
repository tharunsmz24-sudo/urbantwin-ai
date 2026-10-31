/**
 * AI-Powered Urban Climate Digital Twin - Tamil Nadu, India
 * Main Application Orchestrator & State Manager
 */

const App = {
  // Global Application State
  state: {
    districts: [...TAMIL_NADU_DISTRICTS],
    urbanZones: [...TAMIL_NADU_URBAN_ZONES],
    zones: [...TAMIL_NADU_DISTRICTS], // Active list for table & charts
    selectedZone: TAMIL_NADU_DISTRICTS[0], // Defaults to Chennai (or highest risk)
    activeSection: "overview",
    activeMapView: "districts", // 'districts' | 'urban_zones' | 'combined'
    activeThematicMode: "heat_risk", // 'heat_risk' | 'green_cover' | 'population'
    interventions: {
      tree_canopy: { active: true, intensity: 25 },
      cool_roofs: { active: true, intensity: 40 },
      shaded_structures: { active: false, intensity: 35 },
      cooling_centres: { active: true, intensity: 4 },
      water_features: { active: false, intensity: 30 },
      urban_green_spaces: { active: true, intensity: 20 }
    },
    // SaaS Authentication & Multi-Tenant State
    currentUser: {
      id: "usr-pub",
      name: "Public Explorer",
      email: "citizen@urbantwin.ai",
      role: "public", // 'public' | 'government' | 'industry' | 'admin'
      organization: "Tamil Nadu Civic Climate Network",
      token: null
    },
    liveClimateCache: {},
    tableFilter: {
      query: "",
      riskCategory: "ALL",
      locationType: "district", // 'ALL' | 'district' | 'urban_zone'
      tempRange: "ALL", // 'ALL' | 'extreme' | 'high' | 'moderate'
      dataStatus: "ALL", // 'ALL' | 'verified' | 'benchmark' | 'simulated'
      sortBy: "score",
      sortOrder: "desc"
    }
  },

  /**
   * Application Entry Point
   */
  init() {
    console.log("Initializing Tamil Nadu Urban Climate Digital Twin...");

    // Set initial selected location to highest heat-risk district (e.g. Chennai or Vellore)
    const highestRisk = [...this.state.districts].sort((a, b) => 
      HeatRiskEngine.computeRisk(b).score - HeatRiskEngine.computeRisk(a).score
    )[0];
    if (highestRisk) {
      this.state.selectedZone = highestRisk;
    }

    // Run initial baseline simulation
    this.runInterventionSimulation(false);

    // Setup UI components
    this.setupNavigation();
    this.setupGlobalZoneSelectors();
    this.setupClock();
    this.renderDistrictHeaderMeta(this.state.selectedZone);
    this.renderOverviewMetrics();
    this.renderDistrictClimateAnalysis(this.state.selectedZone);
    this.setupDataTable();
    this.setupInterventionControls();
    this.setupRecommendationView();
    this.setupModals();
    this.setupMapControls();

    // Initialize Leaflet Map focused on Tamil Nadu
    CityMapController.init(
      "digitalTwinMap",
      this.state.districts,
      this.state.urbanZones,
      (location) => {
        this.selectZone(location.id);
      }
    );

    // Initialize Charts with state districts
    ChartManager.init(this.state.districts, this.state.selectedZone);

    // Render Deep Analysis & Recommendations
    this.renderDeepAnalysis();
    this.renderRecommendations();

    console.log("Tamil Nadu Climate Digital Twin is fully operational.");
  },

  /**
   * Real-time Clock and Status Ticker
   */
  setupClock() {
    const clockEl = document.getElementById("liveTimeTicker");
    const updateTime = () => {
      const now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " IST";
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  },

  /**
   * Render Top Navbar District Identification & Metadata Strip
   */
  renderDistrictHeaderMeta(district) {
    if (!district) return;
    const codeEl = document.getElementById("navDistrictCode");
    const geoEl = document.getElementById("navDistrictGeo");
    const agroEl = document.getElementById("navDistrictAgroZone");
    const periodEl = document.getElementById("navDistrictPeriod");
    const badgeEl = document.getElementById("navDistrictStatusBadge");

    if (codeEl) codeEl.textContent = district.districtCode || district.id;
    if (geoEl) geoEl.textContent = `${district.lat.toFixed(2)}°N, ${district.lng.toFixed(2)}°E`;
    if (agroEl) agroEl.textContent = district.agroZone || (district.districtName ? `${district.districtName} Core` : "Tamil Nadu");
    if (periodEl) periodEl.textContent = district.dataPeriod ? district.dataPeriod.split('(')[0].trim() : "Normal 1991-2020 / MODIS";

    if (badgeEl) {
      const status = district.dataStatus || "Verified";
      if (status.includes("IMD") || status.includes("Verified")) {
        badgeEl.className = "badge-verified";
        badgeEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> IMD / Earthdata`;
      } else if (status.includes("Benchmark")) {
        badgeEl.className = "badge-benchmark";
        badgeEl.innerHTML = `<i class="fa-solid fa-microchip"></i> Micro-Sensor Benchmark`;
      } else {
        badgeEl.className = "badge-simulated";
        badgeEl.innerHTML = `<i class="fa-solid fa-vial"></i> Simulated Scenario`;
      }
    }
  },

  /**
   * Setup Navigation Tabs
   */
  setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item[data-target]");
    navItems.forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = item.getAttribute("data-target");
        this.navigateTo(targetId);

        // Close mobile drawer if open
        const sidebar = document.getElementById("appSidebar");
        if (sidebar && sidebar.classList.contains("open")) {
          sidebar.classList.remove("open");
        }
      });
    });

    // Mobile sidebar toggle button
    const menuToggle = document.getElementById("sidebarToggleBtn");
    if (menuToggle) {
      menuToggle.addEventListener("click", () => {
        const sidebar = document.getElementById("appSidebar");
        if (sidebar) sidebar.classList.toggle("open");
      });
    }
  },

  /**
   * Switch Active Section
   */
  navigateTo(sectionId) {
    this.state.activeSection = sectionId;

    // Update nav link active classes
    document.querySelectorAll(".nav-item[data-target]").forEach(btn => {
      if (btn.getAttribute("data-target") === sectionId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update section visibility
    document.querySelectorAll(".content-section").forEach(sec => {
      if (sec.id === `section-${sectionId}`) {
        sec.classList.add("active");
      } else {
        sec.classList.remove("active");
      }
    });

    // Handle map redraw if navigating to map
    if (sectionId === "map" && CityMapController.map) {
      setTimeout(() => {
        CityMapController.map.invalidateSize();
        CityMapController.fitTamilNaduBounds();
      }, 200);
    }

    // Scroll to top of content view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Setup Global Location Selectors (Districts & Urban Zones)
   */
  setupGlobalZoneSelectors() {
    const headerSelect = document.getElementById("globalZoneSelect");
    const simSelect = document.getElementById("simZoneSelect");
    const analysisSelect = document.getElementById("analysisZoneSelect");

    const populate = (selectEl) => {
      if (!selectEl) return;
      selectEl.innerHTML = "";

      // 1. Group: 38 Districts of Tamil Nadu (Alphabetical Order 1 to 38)
      const distGroup = document.createElement("optgroup");
      distGroup.label = "Tamil Nadu Districts (38)";

      this.state.districts.forEach(d => {
        const risk = HeatRiskEngine.computeRisk(d);
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.name} (${d.districtCode}) — ${risk.category} [${risk.score}]`;
        if (d.id === this.state.selectedZone.id) {
          opt.selected = true;
        }
        distGroup.appendChild(opt);
      });
      selectEl.appendChild(distGroup);

      // 2. Group: Detailed Urban Monitoring Zones
      const urbanGroup = document.createElement("optgroup");
      urbanGroup.label = "City Urban Monitoring Zones (Micro-Canyons)";

      this.state.urbanZones.forEach(u => {
        const risk = HeatRiskEngine.computeRisk(u);
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = `${u.districtName} - ${u.name} (${risk.category}: ${risk.score})`;
        if (u.id === this.state.selectedZone.id) {
          opt.selected = true;
        }
        urbanGroup.appendChild(opt);
      });
      selectEl.appendChild(urbanGroup);
    };

    populate(headerSelect);
    populate(simSelect);
    populate(analysisSelect);

    const handleChange = (e) => {
      this.selectZone(e.target.value);
    };

    if (headerSelect) headerSelect.addEventListener("change", handleChange);
    if (simSelect) simSelect.addEventListener("change", handleChange);
    if (analysisSelect) analysisSelect.addEventListener("change", handleChange);
  },

  /**
   * Setup Map View & Layer Controls
   */
  setupMapControls() {
    // View Mode Buttons (Districts vs Urban Zones vs Combined)
    const viewButtons = document.querySelectorAll(".btn-view-mode");
    viewButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        viewButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.getAttribute("data-mode");
        this.state.activeMapView = mode;
        CityMapController.setViewMode(mode);
        this.showToast(`Map View: Switched to ${btn.textContent.trim()}`, "info");
      });
    });

    // Thematic Overlay Buttons (Heat Risk, Green Cover, Population Exposure)
    const themeButtons = document.querySelectorAll(".btn-theme-mode");
    themeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        themeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const theme = btn.getAttribute("data-theme");
        this.state.activeThematicMode = theme;
        CityMapController.setThematicMode(theme, this.state.districts, this.state.urbanZones);
        this.showToast(`Thematic Overlay: ${btn.textContent.trim()}`, "info");
      });
    });
  },

  /**
   * Find any district or urban zone by ID
   */
  findLocationById(id) {
    return this.state.districts.find(d => d.id === id) || 
           this.state.urbanZones.find(u => u.id === id);
  },

  /**
   * Change Selected Location and Synchronize across all components
   */
  selectZone(locationId) {
    const loc = this.findLocationById(locationId);
    if (!loc) return;

    this.state.selectedZone = loc;

    // Update dropdown values
    ["globalZoneSelect", "simZoneSelect", "analysisZoneSelect"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = locationId;
    });

    // Re-run simulation for new location
    this.runInterventionSimulation(false);

    // Update Leaflet map selection
    CityMapController.selectLocation(locationId, this.state.districts, this.state.urbanZones);

    // Update Charts (using 38 districts dataset as reference baseline)
    ChartManager.updateOnZoneChange(this.state.districts, this.state.selectedZone, this.state.latestSimulation);

    // Refresh Panels across every tab
    this.renderDistrictHeaderMeta(loc);
    this.renderOverviewMetrics();
    this.renderDistrictClimateAnalysis(loc);
    this.renderDeepAnalysis();
    this.renderRecommendations();
    this.renderSimulatorUI();
    this.renderTableRows();

    // Trigger asynchronous live meteorological station check
    this.fetchLiveClimateForDistrict(loc);

    const locationLabel = loc.category === "district" ? `${loc.name} District` : `${loc.name} (${loc.districtName})`;
    this.showToast(`Selected: ${locationLabel}`, "info");
  },

  /**
   * Render Top Level Overview KPIs & Spotlight Card
   */
  renderOverviewMetrics() {
    const summary = RecommendationEngine.getCitySummary(this.state.districts);
    const sel = this.state.selectedZone;
    const selRisk = HeatRiskEngine.computeRisk(sel);

    // State-wide KPIs
    const totalZonesEl = document.getElementById("kpiTotalZones");
    const highRiskEl = document.getElementById("kpiHighRiskZones");
    const avgTempEl = document.getElementById("kpiAvgTemp");
    const avgGreenEl = document.getElementById("kpiAvgGreen");
    const popExposureEl = document.getElementById("kpiPopExposure");

    if (totalZonesEl) totalZonesEl.textContent = `${summary.totalZones} Districts`;
    if (highRiskEl) highRiskEl.textContent = `${summary.highOrCriticalTotal} (${summary.criticalRiskCount} Critical)`;
    if (avgTempEl) avgTempEl.textContent = `${summary.avgTemp}°C`;
    if (avgGreenEl) avgGreenEl.textContent = `${summary.avgGreen}%`;
    if (popExposureEl) popExposureEl.textContent = `${(summary.totalVulnerable / 1000000).toFixed(1)}M (${summary.vulnerablePercent}%)`;

    // Active Location Spotlight Card (8 Cards & Climate Summary)
    const spotName = document.getElementById("spotZoneName");
    const spotType = document.getElementById("spotZoneType");
    const spotScore = document.getElementById("spotZoneScore");
    const spotBadge = document.getElementById("spotZoneBadge");
    const spotTemp = document.getElementById("spotZoneTemp");
    const spotAirTemp = document.getElementById("spotZoneAirTemp");
    const spotGreen = document.getElementById("spotZoneGreen");
    const spotDensity = document.getElementById("spotZoneDensity");
    const spotPop = document.getElementById("spotZonePop");
    const spotPopExp = document.getElementById("spotZonePopExposure");
    const spotWater = document.getElementById("spotZoneWater");
    const spotDesc = document.getElementById("spotZoneDesc");
    const spotSource = document.getElementById("spotZoneSource");
    const spotVerif = document.getElementById("spotZoneVerification");
    const compTitle = document.getElementById("overviewComparisonChartTitle");

    if (spotName) spotName.textContent = sel.category === "district" ? `${sel.name} District` : sel.name;
    if (spotType) spotType.textContent = `${sel.districtCode || sel.id} &bull; ${sel.agroZone || sel.type} ${sel.districtName ? `(${sel.districtName})` : ''}`;
    if (spotScore) spotScore.textContent = `${selRisk.score} / 100`;
    if (spotBadge) {
      spotBadge.textContent = selRisk.category;
      spotBadge.className = `zone-badge ${selRisk.badgeClass}`;
    }
    if (spotTemp) spotTemp.textContent = `${sel.surfaceTemp.toFixed(1)}°C LST`;
    if (spotAirTemp) spotAirTemp.textContent = `${sel.ambientTemp.toFixed(1)}°C Air Temp (Range: ${sel.minTemp || 24}°C - ${sel.maxTemp || 41}°C)`;
    if (spotGreen) spotGreen.textContent = `${sel.greenCover.toFixed(1)}%`;
    if (spotDensity) spotDensity.textContent = `${sel.buildingDensity}%`;
    if (spotPop) spotPop.textContent = `${sel.vulnerablePop.toLocaleString()} Inhabitants`;
    if (spotPopExp) spotPopExp.textContent = `Heat Exposure Index: ${sel.populationExposure} / 100`;
    if (spotWater) spotWater.textContent = `${sel.waterAvailability} / 100`;
    if (spotDesc) spotDesc.textContent = `${sel.description || ''} Regional Climate Profile: ${sel.seasonalProfile || ''}`;
    if (spotSource) spotSource.textContent = sel.dataSource || "IMD Climatological Normal Tables / NASA MODIS LST";
    if (spotVerif) spotVerif.textContent = sel.dataStatus || "Verified Climatological Dataset";
    if (compTitle) compTitle.textContent = `${sel.name} ${sel.category === 'district' ? 'District' : '(Zone)'} vs. Tamil Nadu State Average Benchmark`;

    // Overview Quick Heatwave Alerts List
    const alertsContainer = document.getElementById("overviewRiskAlertsList");
    if (alertsContainer) {
      alertsContainer.innerHTML = "";

      // Combine high risk districts and urban zones
      const allHigh = [...this.state.districts, ...this.state.urbanZones]
        .map(loc => ({ location: loc, risk: HeatRiskEngine.computeRisk(loc) }))
        .filter(item => item.risk.score >= 60)
        .sort((a, b) => b.risk.score - a.risk.score)
        .slice(0, 5);

      if (allHigh.length === 0) {
        alertsContainer.innerHTML = `<div class="empty-state">No critical heat anomalies detected across Tamil Nadu.</div>`;
      } else {
        allHigh.forEach(item => {
          const div = document.createElement("div");
          div.className = "alert-item-card";
          div.innerHTML = `
            <div class="alert-icon" style="color: ${item.risk.hexColor}">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div class="alert-details">
              <div class="alert-title-row">
                <strong>${item.location.name}</strong>
                <span class="zone-badge ${item.risk.badgeClass}">${item.risk.category}</span>
              </div>
              <p class="alert-metric-text">
                Surface: <b>${item.location.surfaceTemp.toFixed(1)}°C</b> &bull; Canopy: <b>${item.location.greenCover.toFixed(1)}%</b> &bull; Vulnerable: <b>${item.location.vulnerablePop.toLocaleString()}</b>
              </p>
            </div>
            <button class="btn btn-sm btn-ghost" onclick="App.selectZone('${item.location.id}')">
              Inspect <i class="fa-solid fa-arrow-right"></i>
            </button>
          `;
          alertsContainer.appendChild(div);
        });
      }
    }
  },

  /**
   * Render District-Wise Climate Analysis Tab (All Sections A to E)
   */
  renderDistrictClimateAnalysis(district) {
    if (!district) return;
    const risk = HeatRiskEngine.computeRisk(district);

    // Header & Identification
    const codeBadge = document.getElementById("climateDistrictCodeBadge");
    const statusBadge = document.getElementById("climateDistrictStatusBadge");
    const heading = document.getElementById("climateDistrictHeading");
    const subheading = document.getElementById("climateDistrictSubheading");
    const agroBadge = document.getElementById("climAgroZoneBadge");
    const narrative = document.getElementById("climDistrictNarrative");

    if (codeBadge) codeBadge.textContent = district.districtCode || district.id;
    if (statusBadge) {
      statusBadge.textContent = district.dataStatus || "Verified Climatological Normal";
      statusBadge.className = district.dataStatus && district.dataStatus.includes("Benchmark") 
        ? "badge-benchmark" 
        : district.dataStatus && district.dataStatus.includes("Simulated") 
          ? "badge-simulated" 
          : "badge-verified";
    }
    if (heading) heading.textContent = `${district.name} District Climate & Meteorological Intelligence`;
    if (subheading) subheading.textContent = `Official climatological profile, seasonal precipitation patterns, thermal thresholds, and environmental indicators for ${district.name} district, Tamil Nadu.`;
    if (agroBadge) agroBadge.textContent = district.agroZone || "Tamil Nadu Agro-Climatic Zone";
    if (narrative) {
      narrative.textContent = `${district.name} District is situated within the ${district.agroZone || "Tamil Nadu Agro-Zone"} region with a ${district.climateZone || "Tropical Wet-and-Dry"} classification. ${district.seasonalProfile || ""} ${district.description || ""}`;
    }

    // Section A: Temperature Profile
    const ambEl = document.getElementById("climAmbientTemp");
    const surfEl = document.getElementById("climSurfaceTemp");
    const minEl = document.getElementById("climMinTemp");
    const maxEl = document.getElementById("climMaxTemp");
    if (ambEl) ambEl.textContent = `${district.ambientTemp.toFixed(1)}°C`;
    if (surfEl) surfEl.textContent = `${district.surfaceTemp.toFixed(1)}°C`;
    if (minEl) minEl.textContent = `${(district.minTemp || district.ambientTemp - 9.5).toFixed(1)}°C`;
    if (maxEl) maxEl.textContent = `${(district.maxTemp || district.surfaceTemp + 2.0).toFixed(1)}°C`;

    // Section B: Climate & Meteorological Indicators
    const rainEl = document.getElementById("climAnnualRainfall");
    const humEl = document.getElementById("climHumidity");
    const windEl = document.getElementById("climWindSpeed");
    const heatwaveBadge = document.getElementById("climHeatwaveBadge");
    const heatwaveSource = document.getElementById("climHeatwaveSource");

    if (rainEl) rainEl.textContent = `${district.annualRainfall ? district.annualRainfall.toLocaleString() : '980'} mm`;
    if (humEl) humEl.textContent = `${district.relativeHumidity || 64}%`;
    if (windEl) windEl.textContent = `${district.windSpeed ? district.windSpeed.toFixed(1) : '12.5'} km/h`;
    if (heatwaveBadge) {
      const isWave = district.heatwaveStatus && district.heatwaveStatus.includes("Warning");
      heatwaveBadge.textContent = district.heatwaveStatus || "Normal Thermal Envelope";
      heatwaveBadge.className = isWave ? "badge-heatwave-alert" : "badge-heatwave-normal";
    }
    if (heatwaveSource) {
      heatwaveSource.innerHTML = `<span>Authoritative Source: <b>${district.dataSource || "IMD Regional Meteorological Centre Chennai"}</b></span>`;
    }

    // Section C: Environmental Indicators
    const greenEl = document.getElementById("climGreenCover");
    const densEl = document.getElementById("climBuildingDensity");
    const waterEl = document.getElementById("climWaterAvailability");
    const albedoEl = document.getElementById("climAlbedo");
    if (greenEl) greenEl.textContent = `${district.greenCover.toFixed(1)}%`;
    if (densEl) densEl.textContent = `${district.buildingDensity}%`;
    if (waterEl) waterEl.textContent = `${district.waterAvailability} / 100`;
    if (albedoEl) albedoEl.textContent = `${district.albedo ? district.albedo.toFixed(2) : '0.14'}`;

    // Section D: Risk & Resilience Indicators
    const scoreEl = document.getElementById("climUhriScore");
    const badgeEl = document.getElementById("climUhriBadge");
    const popEl = document.getElementById("climPopExposure");
    const vulPopEl = document.getElementById("climVulnerablePop");
    const healthEl = document.getElementById("climHealthResilience");
    const coolEl = document.getElementById("climCoolingCentres");

    if (scoreEl) scoreEl.textContent = `${risk.score} / 100`;
    if (badgeEl) {
      badgeEl.textContent = risk.category;
      badgeEl.className = `zone-badge ${risk.badgeClass}`;
    }
    if (popEl) popEl.textContent = `Score: ${district.populationExposure} / 100`;
    if (vulPopEl) vulPopEl.textContent = `${district.vulnerablePop.toLocaleString()} Inhabitants`;
    if (healthEl) healthEl.textContent = `${district.healthcareCapacity} / 100`;
    if (coolEl) coolEl.textContent = `${district.coolingCentresCount || 2} Facilities`;

    // Section E: Data Provenance & Footer Notes
    const ds = document.getElementById("climDataSource");
    const dp = document.getElementById("climDataPeriod");
    const dst = document.getElementById("climDataStatusText");
    if (ds) ds.textContent = district.dataSource || "IMD Climatological Normal Tables / NASA Earthdata MOD11A1 LST";
    if (dp) dp.textContent = district.dataPeriod || "Climatological Reference (IMD 1991-2020 / MODIS 2024-2026)";
    if (dst) dst.textContent = district.dataStatus || "Verified Climatological Reference Normal";

    // Chart Titles
    const ctm = document.getElementById("chartTitleMonthlyTemp");
    const ctr = document.getElementById("chartTitleRainfall");
    if (ctm) ctm.textContent = `${district.name} Monthly Mean Temperature Trend (°C)`;
    if (ctr) ctr.textContent = `${district.name} Monthly Precipitation Distribution (mm)`;
  },

  /**
   * Render Deep Heat-Risk Analysis Section
   */
  renderDeepAnalysis() {
    const sel = this.state.selectedZone;
    const risk = HeatRiskEngine.computeRisk(sel);
    const norm = risk.normalized;

    const hazardEl = document.getElementById("analysisHazardScore");
    const protectiveEl = document.getElementById("analysisProtectiveScore");
    const finalScoreEl = document.getElementById("analysisFinalScore");
    const finalBadgeEl = document.getElementById("analysisFinalBadge");

    if (hazardEl) hazardEl.textContent = `${risk.hazardScore} / 100`;
    if (protectiveEl) protectiveEl.textContent = `${risk.protectiveScore} / 100`;
    if (finalScoreEl) finalScoreEl.textContent = `${risk.score} / 100`;
    if (finalBadgeEl) {
      finalBadgeEl.textContent = risk.category;
      finalBadgeEl.className = `zone-badge ${risk.badgeClass}`;
    }

    // Explainable AI Driver Cards
    const driversContainer = document.getElementById("analysisDriversList");
    if (driversContainer) {
      driversContainer.innerHTML = "";
      if (risk.drivers.length === 0) {
        driversContainer.innerHTML = `<p class="text-muted">No extreme deviation drivers recorded for this location.</p>`;
      } else {
        risk.drivers.forEach(d => {
          const card = document.createElement("div");
          card.className = `driver-card ${d.type === 'negative' ? 'driver-negative' : 'driver-positive'}`;
          card.innerHTML = `
            <div class="driver-header">
              <div class="driver-title">
                <i class="fa-solid ${d.type === 'negative' ? 'fa-circle-exclamation text-danger' : 'fa-circle-check text-success'}"></i>
                <span>${d.factor}</span>
              </div>
              <span class="driver-badge ${d.type === 'negative' ? 'badge-hazard' : 'badge-buffer'}">${d.impact}</span>
            </div>
            <p class="driver-text">${d.text}</p>
          `;
          driversContainer.appendChild(card);
        });
      }
    }

    // Formula Progress Bars
    const setProgress = (id, val, text) => {
      const bar = document.getElementById(id);
      const txt = document.getElementById(`${id}-val`);
      if (bar) bar.style.width = `${Math.min(val, 100)}%`;
      if (txt) txt.textContent = text;
    };

    setProgress("barNormTemp", norm.normTemp * 100, `${sel.surfaceTemp.toFixed(1)}°C (Norm: ${(norm.normTemp * 100).toFixed(0)}%)`);
    setProgress("barNormDensity", norm.normDensity * 100, `${sel.buildingDensity}% (Norm: ${(norm.normDensity * 100).toFixed(0)}%)`);
    setProgress("barNormPop", norm.normPop * 100, `${sel.populationExposure}/100 (Norm: ${(norm.normPop * 100).toFixed(0)}%)`);
    setProgress("barNormGreen", norm.normGreen * 100, `${sel.greenCover.toFixed(1)}% (Target: 60%)`);
    setProgress("barNormWater", norm.normWater * 100, `${sel.waterAvailability}/100`);
    setProgress("barNormHealth", norm.normHealth * 100, `${sel.healthcareCapacity}/100`);
  },

  /**
   * Setup Intervention Simulator Controls & Listeners
   */
  setupInterventionControls() {
    const catalogContainer = document.getElementById("interventionCatalogList");
    if (!catalogContainer) return;

    catalogContainer.innerHTML = "";

    INTERVENTION_CATALOG.forEach(item => {
      const config = this.state.interventions[item.id] || { active: false, intensity: item.defaultIntensity };

      const card = document.createElement("div");
      card.className = `intervention-config-card ${config.active ? 'active' : ''}`;
      card.id = `card-int-${item.id}`;

      card.innerHTML = `
        <div class="int-header">
          <label class="switch">
            <input type="checkbox" id="chk-int-${item.id}" ${config.active ? 'checked' : ''}>
            <span class="slider round"></span>
          </label>
          <div class="int-title-group">
            <div class="int-icon-title">
              <i class="fa-solid ${item.icon} text-cyan"></i>
              <strong>${item.name}</strong>
            </div>
            <span class="badge badge-subtle">${item.resourceTier} Resource</span>
          </div>
        </div>
        <p class="int-desc">${item.description}</p>
        <div class="int-controls-row">
          <div class="int-slider-label">
            <span>Target Scale (${item.unit}):</span>
            <b id="val-int-${item.id}">${config.intensity}</b>
          </div>
          <input type="range" class="custom-range" id="range-int-${item.id}" 
            min="5" max="${item.maxIntensity}" step="5" value="${config.intensity}"
            ${config.active ? '' : 'disabled'}>
        </div>
        <div class="int-meta-footer">
          <span><i class="fa-solid fa-clock"></i> ${item.implementationTime}</span>
          <span><i class="fa-solid fa-tag"></i> ${item.timeHorizon === 'immediate' ? 'Immediate Response' : 'Long-Term Resilience'}</span>
        </div>
      `;

      catalogContainer.appendChild(card);

      const chk = card.querySelector(`#chk-int-${item.id}`);
      const range = card.querySelector(`#range-int-${item.id}`);
      const valDisp = card.querySelector(`#val-int-${item.id}`);

      chk.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        this.state.interventions[item.id].active = isChecked;
        range.disabled = !isChecked;
        card.classList.toggle("active", isChecked);
      });

      range.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        this.state.interventions[item.id].intensity = val;
        valDisp.textContent = val;
      });
    });

    // "Simulate Intervention" Main Button
    const simBtn = document.getElementById("btnRunSimulation");
    if (simBtn) {
      simBtn.addEventListener("click", () => {
        this.runInterventionSimulation(true);
      });
    }

    // Reset Simulation Button
    const resetBtn = document.getElementById("btnResetSimulation");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.state.interventions = {
          tree_canopy: { active: true, intensity: 25 },
          cool_roofs: { active: true, intensity: 40 },
          shaded_structures: { active: false, intensity: 35 },
          cooling_centres: { active: true, intensity: 4 },
          water_features: { active: false, intensity: 30 }
        };
        this.setupInterventionControls();
        this.runInterventionSimulation(true);
        this.showToast("Intervention parameters reset to Tamil Nadu state resilience package.", "info");
      });
    }
  },

  /**
   * Run Intervention Simulation Computation
   */
  runInterventionSimulation(notify = true) {
    const selZone = this.state.selectedZone;
    const result = HeatRiskEngine.simulate(selZone, this.state.interventions);
    this.state.latestSimulation = result;

    this.renderSimulatorUI();

    // Refresh comparative chart
    ChartManager.createSimulationImpactChart(selZone, result);

    if (notify) {
      this.showToast(`Simulation updated for ${selZone.name}!`, "success");
    }
  },

  /**
   * Render Simulator Output Cards & Results
   */
  renderSimulatorUI() {
    const sim = this.state.latestSimulation;
    if (!sim) return;

    const baseScoreEl = document.getElementById("simBaselineScore");
    const simScoreEl = document.getElementById("simProjectedScore");
    const deltaScoreEl = document.getElementById("simDeltaScore");

    const baseTempEl = document.getElementById("simBaselineTemp");
    const simTempEl = document.getElementById("simProjectedTemp");
    const deltaTempEl = document.getElementById("simDeltaTemp");

    const baseGreenEl = document.getElementById("simBaselineGreen");
    const simGreenEl = document.getElementById("simProjectedGreen");
    const deltaGreenEl = document.getElementById("simDeltaGreen");

    const costEl = document.getElementById("simEstimatedCost");
    const explainEl = document.getElementById("simExplainText");

    if (baseScoreEl) baseScoreEl.textContent = `${sim.baselineRisk.score} (${sim.baselineRisk.category})`;
    if (simScoreEl) simScoreEl.textContent = `${sim.simulatedRisk.score} (${sim.simulatedRisk.category})`;
    if (deltaScoreEl) {
      const sign = sim.delta.score <= 0 ? "" : "+";
      deltaScoreEl.textContent = `${sign}${sim.delta.score} pts`;
      deltaScoreEl.className = sim.delta.score <= 0 ? "metric-delta delta-positive" : "metric-delta delta-negative";
    }

    if (baseTempEl) baseTempEl.textContent = `${sim.baseline.surfaceTemp.toFixed(1)}°C`;
    if (simTempEl) simTempEl.textContent = `${sim.simulated.surfaceTemp.toFixed(1)}°C`;
    if (deltaTempEl) {
      const sign = sim.delta.temp <= 0 ? "" : "+";
      deltaTempEl.textContent = `${sign}${sim.delta.temp.toFixed(1)}°C`;
      deltaTempEl.className = sim.delta.temp <= 0 ? "metric-delta delta-positive" : "metric-delta delta-negative";
    }

    if (baseGreenEl) baseGreenEl.textContent = `${sim.baseline.greenCover.toFixed(1)}%`;
    if (simGreenEl) simGreenEl.textContent = `${sim.simulated.greenCover.toFixed(1)}%`;
    if (deltaGreenEl) {
      const sign = sim.delta.green >= 0 ? "+" : "";
      deltaGreenEl.textContent = `${sign}${sim.delta.green.toFixed(1)}%`;
      deltaGreenEl.className = sim.delta.green >= 0 ? "metric-delta delta-positive" : "metric-delta delta-negative";
    }

    if (costEl) costEl.textContent = `₹${(sim.delta.costTotal * 1.2).toLocaleString('en-IN')}`;
    if (explainEl) explainEl.textContent = sim.explanation;

    const activeList = document.getElementById("simActiveInterventionsList");
    if (activeList) {
      activeList.innerHTML = "";
      if (sim.activeInterventions.length === 0) {
        activeList.innerHTML = `<span class="text-muted">No interventions currently active.</span>`;
      } else {
        sim.activeInterventions.forEach(item => {
          const badge = document.createElement("div");
          badge.className = "sim-applied-item";
          badge.innerHTML = `
            <strong>${item.name}</strong>: ${item.intensity} ${item.unit} 
            <span class="text-cyan">(&minus;${item.tempReduction}°C)</span>
          `;
          activeList.appendChild(badge);
        });
      }
    }
  },

  /**
   * Setup Recommendation View
   */
  setupRecommendationView() {
    const tabs = document.querySelectorAll(".rec-time-tab");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        const targetHorizon = tab.getAttribute("data-horizon");
        const immContainer = document.getElementById("recImmediateContainer");
        const ltContainer = document.getElementById("recLongTermContainer");

        if (targetHorizon === "immediate") {
          immContainer.style.display = "grid";
          ltContainer.style.display = "none";
        } else if (targetHorizon === "longterm") {
          immContainer.style.display = "none";
          ltContainer.style.display = "grid";
        } else {
          immContainer.style.display = "grid";
          ltContainer.style.display = "grid";
        }
      });
    });
  },

  /**
   * Render Action Cards for Selected District / Urban Zone
   */
  renderRecommendations() {
    const sel = this.state.selectedZone;
    const recs = RecommendationEngine.generate(sel);

    const renderList = (items, containerId) => {
      const el = document.getElementById(containerId);
      if (!el) return;
      el.innerHTML = "";

      if (items.length === 0) {
        el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-check-circle"></i> No critical actions required under this horizon for ${sel.name}.</div>`;
        return;
      }

      items.forEach(rec => {
        const card = document.createElement("div");
        card.className = "recommendation-card";
        card.innerHTML = `
          <div class="rec-card-header">
            <div class="rec-icon-group">
              <i class="fa-solid ${rec.icon}"></i>
              <div>
                <h4 class="rec-title">${rec.title}</h4>
                <span class="rec-cat">${rec.category}</span>
              </div>
            </div>
            <span class="rec-priority-badge ${rec.priorityClass}">${rec.priority}</span>
          </div>
          <div class="rec-card-body">
            <div class="rec-detail-block">
              <span class="rec-label"><i class="fa-solid fa-circle-question"></i> Rationale:</span>
              <p class="rec-text">${rec.reason}</p>
            </div>
            <div class="rec-detail-block">
              <span class="rec-label"><i class="fa-solid fa-chart-line"></i> Projected Benefit:</span>
              <p class="rec-text text-cyan">${rec.expectedBenefit}</p>
            </div>
          </div>
          <div class="rec-card-footer">
            <div class="rec-meta-item"><i class="fa-solid fa-coins"></i> <span>${rec.resourceRequirement}</span></div>
            <div class="rec-meta-item"><i class="fa-solid fa-hourglass-half"></i> <span>${rec.timeToImplement}</span></div>
            <div class="rec-meta-item"><i class="fa-solid fa-building-shield"></i> <span>${rec.leadAgency}</span></div>
          </div>
        `;
        el.appendChild(card);
      });
    };

    renderList(recs.immediate, "recImmediateContainer");
    renderList(recs.longTerm, "recLongTermContainer");
  },

  /**
   * Setup Data Management Table (Search, Filter, Sorting)
   */
  setupDataTable() {
    const searchInput = document.getElementById("tableSearchInput");
    const riskFilter = document.getElementById("tableRiskFilter");
    const locTypeFilter = document.getElementById("tableLocationTypeFilter");
    const tempFilter = document.getElementById("tableTempFilter");
    const statusFilter = document.getElementById("tableStatusFilter");
    const resetBtn = document.getElementById("btnResetDataset");
    const addZoneBtn = document.getElementById("btnAddZoneModal");
    const exportCsvBtn = document.getElementById("btnExportCsv");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.state.tableFilter.query = e.target.value.toLowerCase();
        this.renderTableRows();
      });
    }

    if (riskFilter) {
      riskFilter.addEventListener("change", (e) => {
        this.state.tableFilter.riskCategory = e.target.value;
        this.renderTableRows();
      });
    }

    if (locTypeFilter) {
      locTypeFilter.addEventListener("change", (e) => {
        this.state.tableFilter.locationType = e.target.value;
        this.renderTableRows();
      });
    }

    if (tempFilter) {
      tempFilter.addEventListener("change", (e) => {
        this.state.tableFilter.tempRange = e.target.value;
        this.renderTableRows();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener("change", (e) => {
        this.state.tableFilter.dataStatus = e.target.value;
        this.renderTableRows();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.state.districts = JSON.parse(JSON.stringify(TAMIL_NADU_DISTRICTS));
        this.state.urbanZones = JSON.parse(JSON.stringify(TAMIL_NADU_URBAN_ZONES));
        this.setupGlobalZoneSelectors();
        this.selectZone(this.state.districts[0].id);
        this.renderTableRows();
        CityMapController.renderAllLayers(this.state.districts, this.state.urbanZones);
        this.showToast("Dataset successfully restored to standard 38 districts & urban zones.", "info");
      });
    }

    if (addZoneBtn) {
      addZoneBtn.addEventListener("click", () => {
        const modal = document.getElementById("addZoneModal");
        if (modal) modal.classList.add("active");
      });
    }

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => {
        this.exportDataAsCsv();
      });
    }

    document.querySelectorAll(".sortable-header").forEach(th => {
      th.addEventListener("click", () => {
        const sortKey = th.getAttribute("data-sort");
        if (this.state.tableFilter.sortBy === sortKey) {
          this.state.tableFilter.sortOrder = this.state.tableFilter.sortOrder === "asc" ? "desc" : "asc";
        } else {
          this.state.tableFilter.sortBy = sortKey;
          this.state.tableFilter.sortOrder = "desc";
        }
        this.renderTableRows();
      });
    });

    this.renderTableRows();
  },

  /**
   * Render Table Rows based on current filters and sorting
   */
  renderTableRows() {
    const tbody = document.getElementById("zonesTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const { query, riskCategory, locationType, tempRange, dataStatus, sortBy, sortOrder } = this.state.tableFilter;

    // Combined list of districts and urban zones
    let allLocations = [...this.state.districts, ...this.state.urbanZones];

    // Multi-factor Filter
    let filtered = allLocations.filter(loc => {
      const risk = HeatRiskEngine.computeRisk(loc);
      const matchesQuery = loc.name.toLowerCase().includes(query) || 
                           loc.type.toLowerCase().includes(query) || 
                           loc.id.toLowerCase().includes(query) ||
                           (loc.districtCode && loc.districtCode.toLowerCase().includes(query)) ||
                           (loc.districtName && loc.districtName.toLowerCase().includes(query));
      
      const matchesCategory = riskCategory === "ALL" || risk.category === riskCategory;
      const matchesType = locationType === "ALL" || loc.category === locationType;

      // Temperature Range filter
      let matchesTemp = true;
      if (tempRange === "extreme") matchesTemp = loc.surfaceTemp >= 40.0;
      else if (tempRange === "high") matchesTemp = loc.surfaceTemp >= 36.0 && loc.surfaceTemp < 40.0;
      else if (tempRange === "moderate") matchesTemp = loc.surfaceTemp < 36.0;

      // Data Status filter
      let matchesStatus = true;
      const statusText = loc.dataStatus || "Verified";
      if (dataStatus === "verified") {
        matchesStatus = statusText.includes("IMD") || statusText.includes("Verified");
      } else if (dataStatus === "benchmark") {
        matchesStatus = statusText.includes("Benchmark");
      } else if (dataStatus === "simulated") {
        matchesStatus = statusText.includes("Simulated");
      }

      return matchesQuery && matchesCategory && matchesType && matchesTemp && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let valA, valB;
      if (sortBy === "score") {
        valA = HeatRiskEngine.computeRisk(a).score;
        valB = HeatRiskEngine.computeRisk(b).score;
      } else if (sortBy === "category") {
        valA = HeatRiskEngine.computeRisk(a).category;
        valB = HeatRiskEngine.computeRisk(b).category;
      } else {
        valA = a[sortBy] !== undefined ? a[sortBy] : 0;
        valB = b[sortBy] !== undefined ? b[sortBy] : 0;
      }

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-4">No locations match current search criteria.</td></tr>`;
      return;
    }

    filtered.forEach(loc => {
      const risk = HeatRiskEngine.computeRisk(loc);
      const isSelected = loc.id === this.state.selectedZone.id;

      const tr = document.createElement("tr");
      if (isSelected) tr.classList.add("row-selected");

      const typeBadge = loc.category === "district" 
        ? `<span class="badge badge-subtle" style="font-size: 0.65rem;">District</span>` 
        : `<span class="badge" style="background: rgba(0, 240, 255, 0.15); color: var(--cyan-primary); font-size: 0.65rem;">Urban Zone</span>`;

      let statusBadgeHtml = `<span class="badge-verified"><i class="fa-solid fa-circle-check"></i> IMD Normal</span>`;
      if (loc.dataStatus && loc.dataStatus.includes("Benchmark")) {
        statusBadgeHtml = `<span class="badge-benchmark"><i class="fa-solid fa-microchip"></i> Benchmark</span>`;
      } else if (loc.dataStatus && loc.dataStatus.includes("Simulated")) {
        statusBadgeHtml = `<span class="badge-simulated"><i class="fa-solid fa-vial"></i> Simulated</span>`;
      }

      tr.innerHTML = `
        <td><b>${loc.districtCode || loc.id}</b></td>
        <td>
          <div class="table-zone-name">
            <strong>${loc.name} ${typeBadge}</strong>
            <small class="text-muted">${loc.districtName ? `${loc.districtName} &bull; ` : ''}${loc.agroZone || loc.type}</small>
          </div>
        </td>
        <td><b>${loc.ambientTemp ? loc.ambientTemp.toFixed(1) : '34.0'}°C</b></td>
        <td><b style="color: ${loc.surfaceTemp >= 40 ? 'var(--risk-critical)' : 'var(--risk-high)'}">${loc.surfaceTemp.toFixed(1)}°C</b></td>
        <td>${loc.annualRainfall ? loc.annualRainfall.toLocaleString() : '980'} mm</td>
        <td>${loc.greenCover.toFixed(1)}%</td>
        <td>
          <strong style="color: ${risk.hexColor}">${risk.score}</strong>
        </td>
        <td>
          <span class="zone-badge ${risk.badgeClass}">
            ${risk.category}
          </span>
        </td>
        <td>${statusBadgeHtml}</td>
        <td class="text-right">
          <button class="btn btn-xs btn-primary btn-view-profile" data-id="${loc.id}">
            <i class="fa-solid fa-arrow-right"></i> Profile
          </button>
        </td>
      `;

      // Clicking any row opens that district's detailed climate profile
      tr.addEventListener("click", () => {
        this.selectZone(loc.id);
        this.navigateTo("climate");
      });

      tbody.appendChild(tr);
    });
  },

  /**
   * Export Tamil Nadu Dataset to CSV
   */
  exportDataAsCsv() {
    const headers = [
      "LocationID", "LocationName", "DistrictName", "ClassificationType", "LandUseType",
      "SurfaceTempLST_C", "AmbientTemp_C", "GreenCanopyCoverPct", "BuildingDensityPct",
      "SurfaceAlbedo", "PopulationExposureIndex", "VulnerablePopulationCount", "TotalPopulationCount",
      "WaterAvailabilityIndex", "HealthcareCapacityIndex", "CoolingCentresCount",
      "UrbanHeatRiskIndex_UHRI", "HeatRiskCategory"
    ];

    const allLocations = [...this.state.districts, ...this.state.urbanZones];

    const rows = allLocations.map(loc => {
      const risk = HeatRiskEngine.computeRisk(loc);
      return [
        `"${loc.id}"`, `"${loc.name}"`, `"${loc.districtName || loc.name}"`, `"${loc.category}"`, `"${loc.type}"`,
        loc.surfaceTemp, loc.ambientTemp, loc.greenCover, loc.buildingDensity,
        loc.albedo, loc.populationExposure, loc.vulnerablePop, loc.totalPop,
        loc.waterAvailability, loc.healthcareCapacity, loc.coolingCentresCount,
        risk.score, `"${risk.category}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tamil_nadu_climate_resilience_twin_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast("Tamil Nadu climate dataset exported as CSV file successfully.", "success");
  },

  /**
   * Setup Modal Windows
   */
  setupModals() {
    const addModal = document.getElementById("addZoneModal");
    const closeBtns = document.querySelectorAll(".close-modal-btn");
    const addForm = document.getElementById("formAddZone");

    closeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
      });
    });

    if (addForm) {
      addForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = `UZ-CUSTOM-${this.state.urbanZones.length + 1}`;
        const name = document.getElementById("inpZoneName").value || "Custom Urban Monitoring Sector";
        const districtName = document.getElementById("inpDistrictSelect") ? document.getElementById("inpDistrictSelect").value : "Chennai";
        const type = document.getElementById("inpZoneType").value || "Urban Mixed Commercial";
        const surfaceTemp = parseFloat(document.getElementById("inpSurfaceTemp").value) || 39.5;
        const greenCover = parseFloat(document.getElementById("inpGreenCover").value) || 12.0;
        const buildingDensity = parseInt(document.getElementById("inpDensity").value, 10) || 80;
        const populationExposure = parseInt(document.getElementById("inpPopExposure").value, 10) || 75;
        const vulnerablePop = parseInt(document.getElementById("inpVulnerablePop").value, 10) || 25000;
        const waterAvailability = parseInt(document.getElementById("inpWater").value, 10) || 45;
        const healthcareCapacity = parseInt(document.getElementById("inpHealth").value, 10) || 70;

        // Parent district
        const parentDist = this.state.districts.find(d => d.name === districtName) || this.state.districts[0];

        const newZone = {
          id,
          name,
          districtName: parentDist.name,
          districtId: parentDist.id,
          type,
          lat: parentDist.lat + (Math.random() - 0.5) * 0.04,
          lng: parentDist.lng + (Math.random() - 0.5) * 0.04,
          radius: 900,
          surfaceTemp,
          ambientTemp: surfaceTemp - 4.5,
          greenCover,
          buildingDensity,
          albedo: 0.16,
          populationExposure,
          vulnerablePop,
          totalPop: vulnerablePop * 3,
          waterAvailability,
          healthcareCapacity,
          coolingCentresCount: 2,
          category: "urban_zone",
          description: `Custom urban monitoring micro-zone commissioned in ${parentDist.name} for heat resilience simulation.`
        };

        this.state.urbanZones.push(newZone);
        this.setupGlobalZoneSelectors();
        this.renderTableRows();
        CityMapController.renderAllLayers(this.state.districts, this.state.urbanZones);
        this.selectZone(newZone.id);

        if (addModal) addModal.classList.remove("active");
        addForm.reset();
        this.showToast(`Custom zone "${newZone.name}" registered in ${parentDist.name}.`, "success");
      });
    }
  },

  /**
   * SaaS Role Switcher (For Pilots and RBAC demonstration)
   */
  switchRole(role) {
    if (!["public", "government", "industry", "admin"].includes(role)) return;

    this.state.currentUser.role = role;
    if (role === "admin") {
      this.state.currentUser.name = "Platform Administrator";
      this.state.currentUser.email = "admin@urbantwin.ai";
      this.state.currentUser.organization = "UrbanTwin AI Global";
    } else if (role === "government") {
      this.state.currentUser.name = "Dr. S. Meenakshi IAS";
      this.state.currentUser.email = "officer.chennai@tndsma.gov.in";
      this.state.currentUser.organization = "Greater Chennai Corporation / TNDSMA";
    } else if (role === "industry") {
      this.state.currentUser.name = "R. Karthik";
      this.state.currentUser.email = "sustainability@tvs-auto.com";
      this.state.currentUser.organization = "TVS Mobility & Engineering Ltd.";
    } else {
      this.state.currentUser.name = "Ananya Sundaram";
      this.state.currentUser.email = "citizen@gmail.com";
      this.state.currentUser.organization = "Tamil Nadu Civic Climate Network";
    }

    // Update quick switcher button styling
    document.querySelectorAll(".role-quick-btn").forEach(btn => {
      if (btn.getAttribute("data-role") === role) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update sidebar navigation visibility based on role permissions
    const govLink = document.getElementById("nav-link-gov");
    const indLink = document.getElementById("nav-link-industry");
    const adminLink = document.getElementById("nav-link-admin");

    if (govLink) govLink.style.display = (role === "government" || role === "admin") ? "flex" : "none";
    if (indLink) indLink.style.display = (role === "industry" || role === "admin") ? "flex" : "none";
    if (adminLink) adminLink.style.display = (role === "admin") ? "flex" : "none";

    this.renderAuthNavButton();

    // Trigger role-specific data fetches
    if (role === "government" || role === "admin") this.fetchGovernmentProjects();
    if (role === "industry" || role === "admin") this.fetchIndustryFacilities();
    if (role === "admin") this.fetchAdminData();

    this.showToast(`Switched active workspace to: ${role.toUpperCase()}`, "info");
  },

  renderAuthNavButton() {
    const wrapper = document.getElementById("authNavWrapper");
    if (!wrapper) return;
    const user = this.state.currentUser;
    const roleBadgeClass = user.role === 'admin' ? 'role-admin' : user.role === 'government' ? 'role-gov' : user.role === 'industry' ? 'role-ind' : 'role-pub';

    wrapper.innerHTML = `
      <div class="user-auth-bar">
        <span class="user-badge-role ${roleBadgeClass}">${user.role}</span>
        <span style="font-size: 0.82rem; font-weight: 600; color: #fff;">${user.name}</span>
        <button class="btn btn-ghost btn-sm" onclick="App.openAuthModal('login')" title="Account Settings / Switch"><i class="fa-solid fa-gear"></i></button>
      </div>
    `;
  },

  openAuthModal(tab = 'login') {
    const modal = document.getElementById("authModal");
    if (modal) modal.classList.add("active");
    this.toggleAuthTab(tab);
  },

  closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.classList.remove("active");
  },

  toggleAuthTab(tab) {
    const tabLogin = document.getElementById("authTabLogin");
    const tabReg = document.getElementById("authTabRegister");
    const tabForgot = document.getElementById("authTabForgot");
    const formLogin = document.getElementById("formAuthLogin");
    const formReg = document.getElementById("formAuthRegister");
    const formForgot = document.getElementById("formAuthForgot");

    [tabLogin, tabReg, tabForgot].forEach(t => t && t.classList.remove("active", "btn-outline-cyan"));
    [formLogin, formReg, formForgot].forEach(f => f && (f.style.display = "none"));

    if (tab === 'register') {
      if (tabReg) tabReg.classList.add("active", "btn-outline-cyan");
      if (formReg) formReg.style.display = "block";
    } else if (tab === 'forgot') {
      if (tabForgot) tabForgot.classList.add("active", "btn-outline-cyan");
      if (formForgot) formForgot.style.display = "block";
    } else {
      if (tabLogin) tabLogin.classList.add("active", "btn-outline-cyan");
      if (formLogin) formLogin.style.display = "block";
    }
  },

  onAccountTypeChange(type) {
    const container = document.getElementById("regRoleFields");
    if (!container) return;
    if (type === "government") {
      container.innerHTML = `
        <div class="form-group" style="margin-bottom: 12px;">
          <label>Government Department / Municipal Body</label>
          <input type="text" id="regOrg" class="form-control" placeholder="e.g. Greater Chennai Corporation" required>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label>Official Jurisdiction</label>
          <input type="text" id="regJurisdiction" class="form-control" placeholder="e.g. Chennai / North Region" required>
        </div>
      `;
    } else if (type === "industry") {
      container.innerHTML = `
        <div class="form-group" style="margin-bottom: 12px;">
          <label>Enterprise / Company Name</label>
          <input type="text" id="regOrg" class="form-control" placeholder="e.g. Ashok Leyland Ltd." required>
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label>Industrial Sector</label>
          <input type="text" id="regSector" class="form-control" placeholder="e.g. Heavy Commercial Vehicles & Foundry" required>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="form-group" style="margin-bottom: 12px;">
          <label>Preferred District Focus</label>
          <select id="regDistrictPref" class="form-control">
            <option value="Chennai">Chennai</option>
            <option value="Coimbatore">Coimbatore</option>
            <option value="All">All 38 Districts</option>
          </select>
        </div>
      `;
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        this.showToast(data.error || "Authentication failed", "warning");
        return;
      }

      this.state.currentUser = {
        ...data.user,
        token: data.token
      };
      this.closeAuthModal();
      this.switchRole(data.user.role);
      this.showToast(`Welcome back, ${data.user.name}! (${data.user.role.toUpperCase()})`, "success");
    } catch (err) {
      console.error(err);
      this.showToast("Network error connecting to backend auth.", "warning");
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const role = document.getElementById("regAccountType").value;
    const name = document.getElementById("regFullName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const org = document.getElementById("regOrg") ? document.getElementById("regOrg").value.trim() : null;
    const jurisdiction = document.getElementById("regJurisdiction") ? document.getElementById("regJurisdiction").value.trim() : null;
    const sector = document.getElementById("regSector") ? document.getElementById("regSector").value.trim() : null;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, organization: org, jurisdiction, sector })
      });
      const data = await res.json();
      if (!res.ok) {
        this.showToast(data.error || "Registration failed", "warning");
        return;
      }

      this.state.currentUser = {
        ...data.user,
        token: data.token
      };
      this.closeAuthModal();
      this.switchRole(data.user.role);
      this.showToast(`Account successfully registered! Logged in as ${data.user.name}.`, "success");
    } catch (err) {
      console.error(err);
      this.showToast("Registration error.", "warning");
    }
  },

  handleForgot(e) {
    e.preventDefault();
    const email = document.getElementById("forgotEmail").value.trim();
    this.showToast(`Password reset link generated and dispatched to ${email}.`, "info");
    this.closeAuthModal();
  },

  /**
   * Live Climate Data Ingestion with Fallback
   */
  async fetchLiveClimateForDistrict(district) {
    if (!district) return;
    const code = district.districtCode || district.id;
    const tagEl = document.getElementById("navLiveStationTag");

    try {
      const res = await fetch(`/api/live-climate/${code}`);
      if (res.ok) {
        const data = await res.json();
        const obs = data.live_observation;
        if (tagEl) {
          tagEl.innerHTML = `<span class="live-station-badge ${obs.status.includes('LIVE') ? '' : 'historical'}"><i class="fa-solid fa-satellite-dish"></i> ${obs.ambient_temp_c}°C (${obs.status.includes('LIVE') ? 'Live WMO' : 'IMD Cached'})</span>`;
        }
      }
    } catch (e) {
      console.log("Using cached meteorological baseline.");
    }
  },

  /**
   * Government Projects API Data Load
   */
  async fetchGovernmentProjects() {
    const tableBody = document.getElementById("govProjectsTableBody");
    if (!tableBody) return;

    try {
      const headers = this.state.currentUser.token ? { "Authorization": `Bearer ${this.state.currentUser.token}` } : {};
      const res = await fetch("/api/government/projects", { headers });
      if (res.ok) {
        const data = await res.json();
        const projects = data.projects || [];
        tableBody.innerHTML = projects.map(p => `
          <tr>
            <td><code>${p.id}</code></td>
            <td><b>${p.title}</b></td>
            <td>${p.district_id.toUpperCase()}</td>
            <td><span class="badge badge-subtle">${p.intervention_type}</span></td>
            <td>₹${(p.budget_inr / 100000).toFixed(1)} Lakh</td>
            <td><span class="badge badge-verified">${p.status}</span></td>
          </tr>
        `).join("");
      }
    } catch (e) {
      console.error("Gov projects fetch error", e);
    }
  },

  /**
   * Industry Facilities API Data Load
   */
  async fetchIndustryFacilities() {
    const tableBody = document.getElementById("indFacilitiesTableBody");
    if (!tableBody) return;

    try {
      const headers = this.state.currentUser.token ? { "Authorization": `Bearer ${this.state.currentUser.token}` } : {};
      const res = await fetch("/api/industry/facilities", { headers });
      if (res.ok) {
        const data = await res.json();
        const facs = data.facilities || [];
        tableBody.innerHTML = facs.map(f => `
          <tr>
            <td><code>${f.id}</code></td>
            <td><b>${f.name}</b></td>
            <td>${f.district_id.toUpperCase()}</td>
            <td>${f.facility_type}</td>
            <td><span class="text-warning">${f.outdoor_workers} personnel</span></td>
            <td>${f.roof_area_sqm.toLocaleString()} m²</td>
            <td><span class="badge badge-verified">${f.target_resilience_level}</span></td>
            <td><button class="btn btn-outline-cyan btn-sm" onclick="App.simulateFacilityCoolRoof('${f.id}')">Simulate</button></td>
          </tr>
        `).join("");
      }
    } catch (e) {
      console.error("Industry facilities fetch error", e);
    }
  },

  /**
   * Admin Platform Data Load
   */
  async fetchAdminData() {
    const usersBody = document.getElementById("adminUsersTableBody");
    const auditBody = document.getElementById("adminAuditTableBody");

    try {
      const headers = this.state.currentUser.token ? { "Authorization": `Bearer ${this.state.currentUser.token}` } : {};
      const [uRes, aRes] = await Promise.all([
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/audit-logs", { headers })
      ]);

      if (uRes.ok && usersBody) {
        const uData = await uRes.json();
        usersBody.innerHTML = (uData.users || []).map(u => `
          <tr>
            <td><code>${u.id}</code></td>
            <td><b>${u.name}</b></td>
            <td>${u.email}</td>
            <td><span class="user-badge-role ${u.role === 'admin' ? 'role-admin' : u.role === 'government' ? 'role-gov' : u.role === 'industry' ? 'role-ind' : 'role-pub'}">${u.role}</span></td>
            <td>${u.organization || 'General Public'}</td>
            <td>${u.jurisdiction || 'All'}</td>
            <td><span class="badge badge-verified">${u.status}</span></td>
          </tr>
        `).join("");
      }

      if (aRes.ok && auditBody) {
        const aData = await aRes.json();
        auditBody.innerHTML = (aData.logs || []).map(l => `
          <tr>
            <td>${l.timestamp.split('T')[1].split('.')[0]} UTC</td>
            <td><b>${l.user_email || 'anonymous'}</b></td>
            <td><code>${l.action}</code></td>
            <td>${l.resource}</td>
            <td>${l.ip_address}</td>
          </tr>
        `).join("");
      }
    } catch (e) {
      console.error("Admin data fetch error", e);
    }
  },

  openCreateProjectModal() {
    const modal = document.getElementById("createProjectModal");
    if (modal) modal.classList.add("active");
  },

  async handleCreateProject(e) {
    e.preventDefault();
    const title = document.getElementById("projTitle").value.trim();
    const district_id = document.getElementById("projDistrict").value;
    const intervention_type = document.getElementById("projStrategy").value;
    const budget_inr = parseInt(document.getElementById("projBudget").value, 10);

    try {
      const headers = { "Content-Type": "application/json" };
      if (this.state.currentUser.token) headers["Authorization"] = `Bearer ${this.state.currentUser.token}`;

      const res = await fetch("/api/government/projects", {
        method: "POST",
        headers,
        body: JSON.stringify({ title, district_id, intervention_type, budget_inr })
      });
      if (res.ok) {
        document.getElementById("createProjectModal").classList.remove("active");
        this.showToast(`Commissioned municipal project: "${title}"`, "success");
        this.fetchGovernmentProjects();
      }
    } catch (err) {
      this.showToast("Error commissioning project", "warning");
    }
  },

  openRegisterFacilityModal() {
    const modal = document.getElementById("registerFacilityModal");
    if (modal) modal.classList.add("active");
  },

  async handleRegisterFacility(e) {
    e.preventDefault();
    const name = document.getElementById("facName").value.trim();
    const district_id = document.getElementById("facDistrict").value;
    const outdoor_workers = parseInt(document.getElementById("facWorkers").value, 10);
    const roof_area_sqm = parseFloat(document.getElementById("facRoofArea").value);
    const target_resilience_level = document.getElementById("facTier").value;

    try {
      const headers = { "Content-Type": "application/json" };
      if (this.state.currentUser.token) headers["Authorization"] = `Bearer ${this.state.currentUser.token}`;

      const res = await fetch("/api/industry/facilities", {
        method: "POST",
        headers,
        body: JSON.stringify({ name, district_id, outdoor_workers, roof_area_sqm, target_resilience_level })
      });
      if (res.ok) {
        document.getElementById("registerFacilityModal").classList.remove("active");
        this.showToast(`Registered industrial campus: "${name}"`, "success");
        this.fetchIndustryFacilities();
      }
    } catch (err) {
      this.showToast("Error registering facility", "warning");
    }
  },

  simulateFacilityCoolRoof(facilityId) {
    this.navigateTo("simulator");
    this.state.interventions.cool_roofs.active = true;
    this.state.interventions.cool_roofs.intensity = 50;
    this.runInterventionSimulation(true);
    this.showToast(`Loaded industrial facility cool-roof parameters into simulation engine.`, "info");
  },

  exportDistrictReport(role = "public") {
    const dist = this.state.selectedZone;
    const risk = HeatRiskEngine.computeRisk(dist);
    const content = `URBANTWIN AI - CLIMATE RESILIENCE REPORT
Generated: ${new Date().toISOString()}
Jurisdiction / Focus: ${dist.name} (${dist.districtCode})
Role Authorization: ${this.state.currentUser.role.toUpperCase()}
Surface Temperature: ${dist.surfaceTemp}°C | Air Temp: ${dist.ambientTemp}°C
Green Canopy Cover: ${dist.greenCover}% | Building Density: ${dist.buildingDensity}%
Calculated UHRI Risk Score: ${risk.score} / 100 (${risk.category})
Data Source: IMD Normals & NASA MODIS Thermal Infrared Calibrated Baseline
Notice: Decision-support guidance under Challenge 13 AI for Impact.`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `UrbanTwin_${dist.id}_Resilience_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast(`Exported Resilience Report for ${dist.name}.`, "success");
  },

  /**
   * System Toast Notification Banner
   */
  showToast(message, type = "info") {
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast-banner toast-${type}`;
    const icon = type === "success" ? "fa-circle-check" : type === "warning" ? "fa-triangle-exclamation" : "fa-circle-info";

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
};

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
  App.switchRole("public");
});
