/**
 * Urban Heat Risk & Intervention Mathematical Model
 * Fully explainable, transparent, rule-based algorithmic engine.
 */

const HeatRiskEngine = {
  // Configurable weights for hazard and vulnerability factors
  weights: {
    hazard: {
      surfaceTemp: 0.32,
      buildingDensity: 0.22,
      populationExposure: 0.26
    },
    protective: {
      greenCover: 0.22,
      waterAvailability: 0.12,
      healthcareCapacity: 0.14
    }
  },

  // Range normalization reference bounds
  bounds: {
    tempMin: 22.0, // Baseline urban comfortable surface temp (°C)
    tempMax: 44.0, // Extreme urban heat anomaly (°C)
    greenCoverTarget: 60.0 // Optimal resilient city canopy (%)
  },

  /**
   * Calculate normalized sub-indices (0 to 1)
   */
  normalize(zone) {
    const normTemp = Math.min(Math.max((zone.surfaceTemp - this.bounds.tempMin) / (this.bounds.tempMax - this.bounds.tempMin), 0), 1);
    const normDensity = Math.min(Math.max(zone.buildingDensity / 100, 0), 1);
    const normPop = Math.min(Math.max(zone.populationExposure / 100, 0), 1);
    const normGreen = Math.min(Math.max(zone.greenCover / this.bounds.greenCoverTarget, 0), 1);
    const normWater = Math.min(Math.max(zone.waterAvailability / 100, 0), 1);
    const normHealth = Math.min(Math.max(zone.healthcareCapacity / 100, 0), 1);

    return { normTemp, normDensity, normPop, normGreen, normWater, normHealth };
  },

  /**
   * Compute comprehensive Urban Heat Risk Index (UHRI: 0 - 100)
   */
  computeRisk(zone) {
    const n = this.normalize(zone);

    // Hazard & Exposure Component (Weighted sum)
    const hazardWeightTotal = this.weights.hazard.surfaceTemp + this.weights.hazard.buildingDensity + this.weights.hazard.populationExposure;
    const hazardRaw = (
      (n.normTemp * this.weights.hazard.surfaceTemp) +
      (n.normDensity * this.weights.hazard.buildingDensity) +
      (n.normPop * this.weights.hazard.populationExposure)
    ) / hazardWeightTotal;
    const hazardScore = hazardRaw * 100;

    // Protective & Resilience Component (Weighted sum)
    const protectiveWeightTotal = this.weights.protective.greenCover + this.weights.protective.waterAvailability + this.weights.protective.healthcareCapacity;
    const protectiveRaw = (
      (n.normGreen * this.weights.protective.greenCover) +
      (n.normWater * this.weights.protective.waterAvailability) +
      (n.normHealth * this.weights.protective.healthcareCapacity)
    ) / protectiveWeightTotal;
    const protectiveScore = protectiveRaw * 100;

    // Integrated UHRI: Combines thermal hazard pressure with resilience offset
    // Base formula: UHRI = 0.75 * Hazard - 0.25 * Protective + 12
    let uhri = (0.75 * hazardScore) - (0.25 * protectiveScore) + 12;
    uhri = Math.round(Math.min(Math.max(uhri, 0), 100) * 10) / 10;

    // Classification
    let category = "Low Risk";
    let colorClass = "risk-low";
    let hexColor = "#10b981"; // Emerald
    let badgeClass = "badge-low";

    if (uhri >= 70) {
      category = "Critical Risk";
      colorClass = "risk-critical";
      hexColor = "#ef4444"; // Crimson Red
      badgeClass = "badge-critical";
    } else if (uhri >= 55) {
      category = "High Risk";
      colorClass = "risk-high";
      hexColor = "#f97316"; // Bright Orange
      badgeClass = "badge-high";
    } else if (uhri >= 32) {
      category = "Moderate Risk";
      colorClass = "risk-moderate";
      hexColor = "#eab308"; // Amber
      badgeClass = "badge-moderate";
    }

    // Driver breakdown & qualitative explainability
    const drivers = this.generateExplanations(zone, n, hazardScore, protectiveScore, uhri, category);

    return {
      score: uhri,
      category,
      colorClass,
      hexColor,
      badgeClass,
      hazardScore: Math.round(hazardScore * 10) / 10,
      protectiveScore: Math.round(protectiveScore * 10) / 10,
      normalized: n,
      drivers
    };
  },

  /**
   * Explainable AI Rule-Based Driver Generation
   */
  generateExplanations(zone, n, hazard, protective, score, category) {
    const list = [];

    // Temperature factor
    if (zone.surfaceTemp >= 37.0) {
      list.push({
        type: "negative",
        factor: "Extreme Thermal Radiation",
        impact: "+High Hazard",
        text: `Surface temperature of ${zone.surfaceTemp.toFixed(1)}°C exceeds comfort threshold by ${(zone.surfaceTemp - 24).toFixed(1)}°C, generating severe radiative heat.`
      });
    } else if (zone.surfaceTemp <= 29.0) {
      list.push({
        type: "positive",
        factor: "Sub-Thermal Surface Temperature",
        impact: "-Mitigating",
        text: `Surface temperature of ${zone.surfaceTemp.toFixed(1)}°C remains well buffered due to low thermal mass and albedo.`
      });
    }

    // Green Cover factor
    if (zone.greenCover < 15.0) {
      list.push({
        type: "negative",
        factor: "Critical Green Cover Deficit",
        impact: "+Amplifies Heat",
        text: `Vegetative cover is only ${zone.greenCover.toFixed(1)}% (minimum recommended: 30%), severely restricting shade and evaporative cooling.`
      });
    } else if (zone.greenCover >= 35.0) {
      list.push({
        type: "positive",
        factor: "Healthy Tree Canopy Buffer",
        impact: "-Cooling Buffer",
        text: `Vegetative canopy of ${zone.greenCover.toFixed(1)}% provides extensive natural shading and localized microclimate cooling.`
      });
    }

    // Building Density factor
    if (zone.buildingDensity >= 80) {
      list.push({
        type: "negative",
        factor: "High Urban Canyon Trapping",
        impact: "+Traps Heat",
        text: `Building density at ${zone.buildingDensity}% creates deep urban canyons that trap infrared radiation and impede natural breeze circulation.`
      });
    }

    // Population Exposure factor
    if (zone.populationExposure >= 85) {
      list.push({
        type: "negative",
        factor: "Severe Population Vulnerability",
        impact: "+Health Hazard",
        text: `Estimated ${zone.vulnerablePop.toLocaleString()} vulnerable residents (infants/elderly) in high-density conditions without adequate climate refuge.`
      });
    }

    // Water & Healthcare protective factors
    if (zone.healthcareCapacity >= 75) {
      list.push({
        type: "positive",
        factor: "Robust Medical Capacity",
        impact: "-Resilience Buffer",
        text: `Emergency medical infrastructure rated at ${zone.healthcareCapacity}/100 provides high survivability support during heat shock events.`
      });
    } else if (zone.healthcareCapacity < 50) {
      list.push({
        type: "negative",
        factor: "Limited Emergency Medical Access",
        impact: "+Vulnerability",
        text: `Healthcare response score of ${zone.healthcareCapacity}/100 indicates prolonged ambulance transit or limited emergency beds.`
      });
    }

    return list;
  },

  /**
   * Simulate Interventions on a given zone
   * 
   * @param {Object} zone - Baseline zone data
   * @param {Object} appliedInterventions - Map of interventionId -> { active: boolean, intensity: number }
   */
  simulate(zone, appliedInterventions) {
    // Clone baseline
    const simulated = JSON.parse(JSON.stringify(zone));
    let totalTempReduction = 0;
    let totalGreenCoverGain = 0;
    let totalCostEst = 0;
    let activeInterventionDetails = [];

    // Evaluate each intervention
    for (const [id, config] of Object.entries(appliedInterventions)) {
      if (!config.active) continue;

      const catalogItem = INTERVENTION_CATALOG.find(i => i.id === id);
      if (!catalogItem) continue;

      const intensity = config.intensity || catalogItem.defaultIntensity;

      // Calculate cooling delta based on physical/empirical approximation
      // For instance: 20% tree canopy increase -> -1.3°C surface cooling
      const tempDelta = catalogItem.tempReductionFactor * intensity;
      const greenDelta = catalogItem.greenCoverGainFactor * intensity;
      const cost = (intensity / 10) * catalogItem.costPerUnit;

      totalTempReduction += tempDelta;
      totalGreenCoverGain += greenDelta;
      totalCostEst += cost;

      // Special intervention side-effects
      if (id === "cooling_centres") {
        simulated.coolingCentresCount += Math.round(intensity);
        simulated.healthcareCapacity = Math.min(simulated.healthcareCapacity + (intensity * 4), 100);
      }
      if (id === "water_features") {
        simulated.waterAvailability = Math.min(simulated.waterAvailability + (intensity * 0.4), 100);
      }
      if (id === "cool_roofs") {
        simulated.albedo = Math.min(simulated.albedo + (intensity * 0.0035), 0.75);
      }
      if (id === "urban_green_spaces") {
        simulated.waterAvailability = Math.min(simulated.waterAvailability + (intensity * 0.2), 100);
      }

      activeInterventionDetails.push({
        id: catalogItem.id,
        name: catalogItem.name,
        intensity,
        unit: catalogItem.unit,
        tempReduction: Math.round(tempDelta * 100) / 100,
        greenCoverGain: Math.round(greenDelta * 10) / 10,
        cost,
        timeHorizon: catalogItem.timeHorizon,
        resourceTier: catalogItem.resourceTier
      });
    }

    // Apply cumulative changes with realistic physical saturation limits
    simulated.surfaceTemp = Math.max(simulated.surfaceTemp - Math.min(totalTempReduction, 6.5), 23.0);
    simulated.ambientTemp = Math.max(simulated.ambientTemp - Math.min(totalTempReduction * 0.65, 4.0), 22.0);
    simulated.greenCover = Math.min(simulated.greenCover + totalGreenCoverGain, 85.0);

    // Round for clean presentation
    simulated.surfaceTemp = Math.round(simulated.surfaceTemp * 10) / 10;
    simulated.ambientTemp = Math.round(simulated.ambientTemp * 10) / 10;
    simulated.greenCover = Math.round(simulated.greenCover * 10) / 10;

    // Recompute baseline risk and simulated risk
    const baselineRisk = this.computeRisk(zone);
    const simulatedRisk = this.computeRisk(simulated);

    // Delta calculations
    const scoreDelta = Math.round((simulatedRisk.score - baselineRisk.score) * 10) / 10;
    const tempDelta = Math.round((simulated.surfaceTemp - zone.surfaceTemp) * 10) / 10;
    const greenDelta = Math.round((simulated.greenCover - zone.greenCover) * 10) / 10;

    // Simulation explanation summary
    let explanation = "";
    if (activeInterventionDetails.length === 0) {
      explanation = "No active interventions selected. Baseline climate metrics remain unchanged.";
    } else {
      explanation = `Simulated deployment of ${activeInterventionDetails.length} resilience intervention(s) projected an estimated ${Math.abs(tempDelta).toFixed(1)}°C surface cooling and reduced the Urban Heat Risk Index from ${baselineRisk.score} (${baselineRisk.category}) to ${simulatedRisk.score} (${simulatedRisk.category}).`;
    }

    return {
      baseline: zone,
      baselineRisk,
      simulated,
      simulatedRisk,
      activeInterventions: activeInterventionDetails,
      delta: {
        score: scoreDelta,
        temp: tempDelta,
        green: greenDelta,
        costTotal: totalCostEst
      },
      explanation,
      disclaimer: DISCLAIMERS.scientific
    };
  }
};
