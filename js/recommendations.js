/**
 * Transparent Climate Resilience Recommendation Engine - Tamil Nadu
 * Generates tailored immediate & long-term mitigation strategies based on transparent heuristic rules.
 */

const RecommendationEngine = {
  /**
   * Generate recommendations for a specific district or urban zone
   * @param {Object} zone 
   * @param {Object} riskResult 
   */
  generate(zone, riskResult) {
    const immediate = [];
    const longTerm = [];

    const risk = riskResult || HeatRiskEngine.computeRisk(zone);
    const score = risk.score;

    // Rule 1: High Population Exposure + High Surface Temp -> Immediate Cooling Centres & Heat Alerts
    if (zone.populationExposure >= 72 && zone.surfaceTemp >= 36.0) {
      immediate.push({
        id: "rec-imm-1",
        title: "TNDSMA Red Heat Emergency Alerts & Mobile 'Thaneer Pandal' Hydration",
        category: "Emergency Public Health",
        priority: "Immediate Critical",
        priorityClass: "priority-critical",
        icon: "fa-bullhorn",
        reason: `${zone.name} experiences acute thermal stress (${zone.surfaceTemp.toFixed(1)}°C) combined with very high population exposure (${zone.populationExposure}/100) affecting ${zone.vulnerablePop.toLocaleString()} vulnerable residents.`,
        expectedBenefit: "Reduces acute heat-stroke and hyperthermia hospital admissions by up to 35% during peak afternoon hours (12 PM - 3:30 PM).",
        resourceRequirement: "Low (State SMS emergency broadcast + dispatch of 6 municipal water tankers and oral rehydration salt kiosks)",
        timeToImplement: "Within 2 Hours",
        leadAgency: "TNDSMA, Greater Chennai Corporation / District Disaster Management Authority"
      });

      immediate.push({
        id: "rec-imm-2",
        title: "Deploy Climate Refuge Hubs & Air-Conditioned Kalyana Mandapams",
        category: "Community Refuge",
        priority: "High Priority",
        priorityClass: "priority-high",
        icon: "fa-snowflake",
        reason: `Current capacity of ${zone.coolingCentresCount} cooling shelter(s) in ${zone.name} is insufficient for high vulnerable population volume (${zone.vulnerablePop.toLocaleString()}).`,
        expectedBenefit: "Provides accessible indoor climate refuge with drinking water and medical first-aid within 10 minutes transit distance.",
        resourceRequirement: "Low-Medium (Operationalizing government community halls, libraries, and primary health centres with TANGEDCO backup diesel generators)",
        timeToImplement: "Immediate (24 - 48 Hours)",
        leadAgency: "Directorate of Municipal Administration (DMA) & Public Health Department"
      });
    }

    // Rule 2: Water Availability Deficit in Dense or Exposed Districts
    if (zone.waterAvailability < 50) {
      immediate.push({
        id: "rec-imm-3",
        title: "Evaporative Micro-Misting Sprinklers & Tanker Hydration Stations",
        category: "Thermal Relief Stations",
        priority: score >= 60 ? "Immediate Critical" : "Medium Priority",
        priorityClass: score >= 60 ? "priority-critical" : "priority-medium",
        icon: "fa-droplet",
        reason: `Freshwater accessibility index is restricted (${zone.waterAvailability}/100), magnifying dehydration risk for outdoor street vendors, gig workers, and daily-wage laborers.`,
        expectedBenefit: "Local micro-cooling drops perceived ambient temperature by 2.2°C to 3.8°C at major bus stops and market entrances.",
        resourceRequirement: "Low-Capital (₹14,00,000 for 8 solar-powered misting pods and purified water refill stations)",
        timeToImplement: "3 - 5 Days",
        leadAgency: "Chennai Metro Water / TWAD Board & Local Municipal Councils"
      });
    }

    // Rule 3: High Building Density + Low Albedo -> Tamil Nadu Cool Roof Policy (Long Term)
    if (zone.buildingDensity >= 68 && zone.albedo <= 0.20) {
      longTerm.push({
        id: "rec-lt-1",
        title: "Tamil Nadu Cool Roof Policy Implementation & High-Albedo Retrofit",
        category: "Building Envelope Retrofit",
        priority: "High Priority",
        priorityClass: "priority-high",
        icon: "fa-shield-halved",
        reason: `Dense built-up footprint (${zone.buildingDensity}%) with low thermal reflectivity (albedo ${zone.albedo}) creates massive thermal storage in concrete and tin roofs.`,
        expectedBenefit: "Reduces indoor ambient temperature by 2.5°C - 4.5°C, lowers air-conditioning power grid surge on TANGEDCO by 18%, and drops urban heat island intensity.",
        resourceRequirement: "Medium (State municipal subsidy ₹30 per sq. meter for white reflective coating / lime wash application)",
        timeToImplement: "4 - 8 Months",
        leadAgency: "Housing and Urban Development Department & CMDA / DTCP"
      });
    }

    // Rule 4: Critical Green Cover Deficit (< 20%) -> Green Tamil Nadu Mission
    if (zone.greenCover < 20.0) {
      longTerm.push({
        id: "rec-lt-2",
        title: "Green Tamil Nadu Mission: Native Micro-Forestry & Miyawaki Afforestation",
        category: "Nature-Based Solutions",
        priority: "Immediate Critical",
        priorityClass: "priority-critical",
        icon: "fa-tree",
        reason: `Canopy cover is severely depressed at ${zone.greenCover.toFixed(1)}%, providing minimal natural shade and zero evapotranspiration cooling.`,
        expectedBenefit: "Targeting +15% tree canopy with native drought-tolerant species (Neem, Pungai, Marudham) decreases localized ground surface temps by 2.0°C to 3.4°C.",
        resourceRequirement: "Medium-High (₹45,00,000 for seedling procurement, drip irrigation, and community nursing)",
        timeToImplement: "12 - 24 Months",
        leadAgency: "Forest Department & Green Tamil Nadu Mission (Pasumai Tamil Nadu)"
      });
    }

    // Rule 5: Shaded Walkways for High Density / Transit Hubs
    if (zone.buildingDensity >= 65) {
      longTerm.push({
        id: "rec-lt-3",
        title: "Solar-Shaded Bus Shelters & Uzhavar Sandhai Canopies",
        category: "Civil Infrastructure",
        priority: "Medium Priority",
        priorityClass: "priority-medium",
        icon: "fa-umbrella",
        reason: `Transit commuters and vegetable market vendors are subjected to unshaded, high-intensity ultraviolet solar radiance throughout mid-day.`,
        expectedBenefit: "Eliminates direct solar irradiation over pedestrian waiting zones, lowering radiant thermal heat stress by up to 7°C.",
        resourceRequirement: "Medium (₹25,00,000 per transit hub incorporating rooftop solar panels for local lighting)",
        timeToImplement: "3 - 6 Months",
        leadAgency: "Highways and Minor Ports Department & State Transport Corporations (SETC/TNSTC)"
      });
    }

    // Rule 6: Ecological Buffer Conservation for Hill & Forest Districts (e.g., Nilgiris, Theni, Kanniyakumari)
    if (score < 40) {
      longTerm.push({
        id: "rec-lt-4",
        title: "Western Ghats Ecological Biosphere Protection & Watershed Stewardship",
        category: "Conservation & Monitoring",
        priority: "Advisory",
        priorityClass: "priority-advisory",
        icon: "fa-seedling",
        reason: `${zone.name} serves as a critical state climate cooling sink (UHRI: ${score}, Green Cover: ${zone.greenCover.toFixed(1)}%). Preventing unchecked construction and deforestation is vital.`,
        expectedBenefit: "Preserves the microclimate cooling and rain-capturing capacity of the Western Ghats catchment basin for the entire state.",
        resourceRequirement: "Low (Enforcement of Hill Area Conservation Authority regulations and IoT microclimate beacons)",
        timeToImplement: "Ongoing Stewardship",
        leadAgency: "Environment, Climate Change and Forests Department"
      });
    }

    return {
      immediate,
      longTerm,
      disclaimer: DISCLAIMERS.governance
    };
  },

  /**
   * Aggregate State-wide summary statistics across all 38 districts
   */
  getCitySummary(zones) {
    const totalZones = zones.length;
    let sumTemp = 0;
    let sumGreen = 0;
    let highRiskCount = 0;
    let criticalRiskCount = 0;
    let totalVulnerable = 0;
    let totalPop = 0;

    zones.forEach(z => {
      sumTemp += z.surfaceTemp;
      sumGreen += z.greenCover;
      totalVulnerable += z.vulnerablePop || 0;
      totalPop += z.totalPop || 0;

      const r = HeatRiskEngine.computeRisk(z);
      if (r.category === "Critical Risk") criticalRiskCount++;
      if (r.category === "High Risk") highRiskCount++;
    });

    const avgTemp = Math.round((sumTemp / totalZones) * 10) / 10;
    const avgGreen = Math.round((sumGreen / totalZones) * 10) / 10;

    return {
      totalZones,
      highRiskCount,
      criticalRiskCount,
      highOrCriticalTotal: highRiskCount + criticalRiskCount,
      avgTemp,
      avgGreen,
      totalVulnerable,
      totalPop,
      vulnerablePercent: Math.round((totalVulnerable / totalPop) * 100)
    };
  }
};
