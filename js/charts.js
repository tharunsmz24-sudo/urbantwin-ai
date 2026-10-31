/**
 * AI-Powered Urban Climate Digital Twin - Tamil Nadu
 * Chart.js Visualizations & Reactive Updates
 */

const ChartManager = {
  charts: {
    tempComparison: null,
    greenCoverComparison: null,
    riskDistribution: null,
    factorRadar: null,
    simulationImpact: null,
    districtVsStateComparison: null,
    districtMonthlyTemp: null,
    districtRainfall: null
  },

  // Color Palette Constants
  colors: {
    navyBg: "#0f172a",
    cyan: "#00f0ff",
    cyanGlow: "rgba(0, 240, 255, 0.25)",
    teal: "#14b8a6",
    orange: "#f97316",
    red: "#ef4444",
    green: "#10b981",
    yellow: "#eab308",
    purple: "#a855f7",
    grid: "rgba(255, 255, 255, 0.08)",
    textMuted: "#94a3b8",
    textLight: "#f8fafc"
  },

  /**
   * Initialize all dashboard charts
   */
  init(zones, selectedZone) {
    this.createRiskDistributionChart(zones, selectedZone);
    this.createTempComparisonChart(zones, selectedZone);
    this.createGreenCoverComparisonChart(zones, selectedZone);
    this.createFactorRadarChart(selectedZone);
    this.createSimulationImpactChart(selectedZone, null);
    this.createDistrictVsStateComparisonChart(selectedZone);
    this.createDistrictMonthlyTempChart(selectedZone);
    this.createDistrictRainfallChart(selectedZone);
  },

  /**
   * 1. Zone-Wise Heat-Risk Ranking Chart (Top districts + selected)
   */
  createRiskDistributionChart(zones, selectedZone) {
    const ctx = document.getElementById("riskDistributionChart");
    if (!ctx) return;

    if (this.charts.riskDistribution) {
      this.charts.riskDistribution.destroy();
    }

    // Sort districts by risk score descending
    const sorted = [...zones].map(z => ({
      name: z.name,
      id: z.id,
      risk: HeatRiskEngine.computeRisk(z)
    })).sort((a, b) => b.risk.score - a.risk.score);

    // Pick top 14 districts, ensuring selected district is included
    let displayed = sorted.slice(0, 14);
    if (!displayed.some(d => d.id === selectedZone.id)) {
      const found = sorted.find(d => d.id === selectedZone.id);
      if (found) displayed.push(found);
    }

    const labels = displayed.map(s => s.name);
    const data = displayed.map(s => s.risk.score);
    const bgColors = displayed.map(s => s.id === selectedZone.id ? '#00f0ff' : s.risk.hexColor);

    this.charts.riskDistribution = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Heat-Risk Score (UHRI)',
          data: data,
          backgroundColor: bgColors,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#00f0ff',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              label: (context) => `UHRI Score: ${context.parsed.y} / 100`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this.colors.textMuted, font: { size: 10 }, maxRotation: 45, minRotation: 25 }
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: this.colors.grid },
            ticks: { color: this.colors.textMuted, stepSize: 25 }
          }
        }
      }
    });
  },

  /**
   * 2. Temperature Comparison Chart (Surface vs Ambient across Key Districts)
   */
  createTempComparisonChart(zones, selectedZone) {
    const ctx = document.getElementById("tempComparisonChart");
    if (!ctx) return;

    if (this.charts.tempComparison) {
      this.charts.tempComparison.destroy();
    }

    // Pick top 12 representative districts across thermal spectrum
    let keyDistricts = [...zones].sort((a, b) => b.surfaceTemp - a.surfaceTemp).slice(0, 10);
    // Include the coolest district (Nilgiris) for contrast
    const coolest = [...zones].sort((a, b) => a.surfaceTemp - b.surfaceTemp)[0];
    if (coolest && !keyDistricts.some(k => k.id === coolest.id)) {
      keyDistricts.push(coolest);
    }
    // Include selected district if missing
    if (!keyDistricts.some(k => k.id === selectedZone.id)) {
      keyDistricts.push(selectedZone);
    }

    const labels = keyDistricts.map(z => z.name);
    const surfaceTemps = keyDistricts.map(z => z.surfaceTemp);
    const ambientTemps = keyDistricts.map(z => z.ambientTemp);

    this.charts.tempComparison = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Surface Temp LST (°C)',
            data: surfaceTemps,
            backgroundColor: keyDistricts.map(z => z.id === selectedZone.id ? '#f97316' : 'rgba(249, 115, 22, 0.6)'),
            borderRadius: 4
          },
          {
            label: 'Ambient Air Temp (°C)',
            data: ambientTemps,
            backgroundColor: 'rgba(0, 240, 255, 0.5)',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: this.colors.textLight, font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#00f0ff',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this.colors.textMuted, font: { size: 10 }, maxRotation: 45, minRotation: 25 }
          },
          y: {
            min: 15,
            max: 48,
            grid: { color: this.colors.grid },
            ticks: {
              color: this.colors.textMuted,
              callback: (v) => `${v}°C`
            }
          }
        }
      }
    });
  },

  /**
   * 3. Green Cover Comparison Chart
   */
  createGreenCoverComparisonChart(zones, selectedZone) {
    const ctx = document.getElementById("greenCoverComparisonChart");
    if (!ctx) return;

    if (this.charts.greenCoverComparison) {
      this.charts.greenCoverComparison.destroy();
    }

    // Sort by green cover descending
    const sorted = [...zones].sort((a, b) => b.greenCover - a.greenCover);
    let sample = [
      ...sorted.slice(0, 7), // High canopy (Nilgiris, Kanniyakumari, Theni, Tenkasi...)
      ...sorted.slice(-7)    // Critical deficit (Chennai, George Town, Tiruppur, Vellore...)
    ];
    if (!sample.some(s => s.id === selectedZone.id)) {
      sample.push(selectedZone);
    }
    sample.sort((a, b) => b.greenCover - a.greenCover);

    const labels = sample.map(z => z.name);
    const greenCovers = sample.map(z => z.greenCover);

    this.charts.greenCoverComparison = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Vegetative Canopy Cover (%)',
          data: greenCovers,
          backgroundColor: sample.map(z => z.id === selectedZone.id ? '#10b981' : 'rgba(16, 185, 129, 0.55)'),
          borderColor: sample.map(z => z.id === selectedZone.id ? '#34d399' : 'transparent'),
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#10b981',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              label: (context) => `Green Canopy: ${context.parsed.y}%`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this.colors.textMuted, font: { size: 10 }, maxRotation: 45, minRotation: 25 }
          },
          y: {
            min: 0,
            max: 85,
            grid: { color: this.colors.grid },
            ticks: {
              color: this.colors.textMuted,
              callback: (v) => `${v}%`
            }
          }
        }
      }
    });
  },

  /**
   * 4. Multi-Factor Radar Analysis Chart (for Deep Risk Analysis)
   */
  createFactorRadarChart(selectedZone) {
    const ctx = document.getElementById("factorRadarChart");
    if (!ctx) return;

    if (this.charts.factorRadar) {
      this.charts.factorRadar.destroy();
    }

    const norm = HeatRiskEngine.normalize(selectedZone);

    this.charts.factorRadar = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: [
          'Thermal Hazard',
          'Building Canyon Density',
          'Population Exposure',
          'Tree Canopy Buffer',
          'Water Availability',
          'Healthcare Resilience'
        ],
        datasets: [{
          label: selectedZone.name,
          data: [
            Math.round(norm.normTemp * 100),
            Math.round(norm.normDensity * 100),
            Math.round(norm.normPop * 100),
            Math.round(norm.normGreen * 100),
            Math.round(norm.normWater * 100),
            Math.round(norm.normHealth * 100)
          ],
          backgroundColor: 'rgba(0, 240, 255, 0.22)',
          borderColor: '#00f0ff',
          pointBackgroundColor: '#00f0ff',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#00f0ff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: this.colors.textLight }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#00f0ff',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1
          }
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { display: false, stepSize: 25 },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            angleLines: { color: 'rgba(255, 255, 255, 0.12)' },
            pointLabels: {
              color: '#cbd5e1',
              font: { size: 11, weight: '500' }
            }
          }
        }
      }
    });
  },

  /**
   * 5. Before-and-After Intervention Chart (Bar Comparison)
   */
  createSimulationImpactChart(selectedZone, simulationResult) {
    const ctx = document.getElementById("simulationImpactChart");
    if (!ctx) return;

    if (this.charts.simulationImpact) {
      this.charts.simulationImpact.destroy();
    }

    const baselineRisk = HeatRiskEngine.computeRisk(selectedZone);
    const simRisk = simulationResult ? simulationResult.simulatedRisk : baselineRisk;
    const simZone = simulationResult ? simulationResult.simulated : selectedZone;

    this.charts.simulationImpact = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [
          'Heat-Risk (UHRI)',
          'Surface Temp (°C)',
          'Ambient Temp (°C)',
          'Green Cover (%)'
        ],
        datasets: [
          {
            label: 'Baseline State',
            data: [
              baselineRisk.score,
              selectedZone.surfaceTemp,
              selectedZone.ambientTemp,
              selectedZone.greenCover
            ],
            backgroundColor: 'rgba(148, 163, 184, 0.6)',
            borderColor: '#94a3b8',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Simulated State',
            data: [
              simRisk.score,
              simZone.surfaceTemp,
              simZone.ambientTemp,
              simZone.greenCover
            ],
            backgroundColor: 'rgba(0, 240, 255, 0.75)',
            borderColor: '#00f0ff',
            borderWidth: 1.5,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: this.colors.textLight }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#00f0ff',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this.colors.textMuted }
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: this.colors.grid },
            ticks: { color: this.colors.textMuted }
          }
        }
      }
    });
  },

  /**
   * 6. District vs. Tamil Nadu State Average Benchmark Comparison Chart
   */
  createDistrictVsStateComparisonChart(selectedZone) {
    const ctx = document.getElementById("districtVsStateChart");
    if (!ctx) return;

    if (this.charts.districtVsStateComparison) {
      this.charts.districtVsStateComparison.destroy();
    }

    const stateAvg = typeof TAMIL_NADU_STATE_AVERAGES !== 'undefined' ? TAMIL_NADU_STATE_AVERAGES : {
      avgSurfaceTemp: 38.8,
      avgAmbientTemp: 34.9,
      avgGreenCover: 24.1,
      avgBuildingDensity: 66.8,
      avgPopulationExposure: 72.4,
      avgWaterAvailability: 51.8,
      avgUHRI: 54.3
    };

    const selectedRisk = HeatRiskEngine.computeRisk(selectedZone);

    const labels = [
      'Surface LST (°C)',
      'Ambient Temp (°C)',
      'Green Canopy (%)',
      'Built Density (%)',
      'Pop Exposure (/100)',
      'Water Index (/100)',
      'Heat-Risk (UHRI)'
    ];

    const districtData = [
      selectedZone.surfaceTemp,
      selectedZone.ambientTemp,
      selectedZone.greenCover,
      selectedZone.buildingDensity,
      selectedZone.populationExposure,
      selectedZone.waterAvailability,
      selectedRisk.score
    ];

    const stateData = [
      stateAvg.avgSurfaceTemp,
      stateAvg.avgAmbientTemp,
      stateAvg.avgGreenCover,
      stateAvg.avgBuildingDensity,
      stateAvg.avgPopulationExposure,
      stateAvg.avgWaterAvailability,
      stateAvg.avgUHRI
    ];

    this.charts.districtVsStateComparison = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: `${selectedZone.name} ${selectedZone.category === 'district' ? 'District' : '(Zone)'}`,
            data: districtData,
            backgroundColor: 'rgba(0, 240, 255, 0.75)',
            borderColor: '#00f0ff',
            borderWidth: 1.5,
            borderRadius: 5
          },
          {
            label: 'Tamil Nadu State Average',
            data: stateData,
            backgroundColor: 'rgba(249, 115, 22, 0.65)',
            borderColor: '#f97316',
            borderWidth: 1.5,
            borderRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: this.colors.textLight, font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#00f0ff',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this.colors.textMuted, font: { size: 10 }, maxRotation: 30, minRotation: 0 }
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: this.colors.grid },
            ticks: { color: this.colors.textMuted }
          }
        }
      }
    });
  },

  /**
   * 7. District-Specific 12-Month Temperature Profile Chart (Trend & Extremes)
   */
  createDistrictMonthlyTempChart(selectedZone) {
    const ctx = document.getElementById("districtMonthlyTempChart");
    if (!ctx) return;

    if (this.charts.districtMonthlyTemp) {
      this.charts.districtMonthlyTemp.destroy();
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const temps = selectedZone.monthlyTemps || [26.0, 27.5, 31.0, 35.5, 38.5, 36.5, 35.0, 34.0, 33.0, 31.0, 28.5, 26.5];

    // State baseline normal temperature curve
    const stateNormal = [25.5, 27.2, 30.8, 34.2, 36.5, 34.8, 33.5, 32.8, 32.0, 30.0, 27.5, 25.8];

    this.charts.districtMonthlyTemp = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: `${selectedZone.name} Mean Temp (°C)`,
            data: temps,
            borderColor: '#00f0ff',
            backgroundColor: 'rgba(0, 240, 255, 0.15)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#00f0ff',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2.5
          },
          {
            label: 'TN State Mean Normal (°C)',
            data: stateNormal,
            borderColor: 'rgba(148, 163, 184, 0.55)',
            borderDash: [5, 5],
            fill: false,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: this.colors.textLight, font: { size: 11 } }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#00f0ff',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}°C`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: this.colors.textMuted, font: { size: 10 } }
          },
          y: {
            min: Math.floor(Math.min(...temps) - 4),
            max: Math.ceil(Math.max(...temps) + 4),
            grid: { color: this.colors.grid },
            ticks: {
              color: this.colors.textMuted,
              callback: (v) => `${v}°C`
            }
          }
        }
      }
    });
  },

  /**
   * 8. District-Specific 12-Month Rainfall Distribution (SW vs NE Monsoon)
   */
  createDistrictRainfallChart(selectedZone) {
    const ctx = document.getElementById("districtRainfallChart");
    if (!ctx) return;

    if (this.charts.districtRainfall) {
      this.charts.districtRainfall.destroy();
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const rainfall = selectedZone.monthlyRainfall || [15, 12, 18, 30, 45, 60, 95, 110, 130, 240, 310, 120];

    // Colors: Oct, Nov, Dec are NE Monsoon (primary rain season in Tamil Nadu)
    // Jun, Jul, Aug, Sep are SW Monsoon
    const barColors = months.map((m, idx) => {
      if (idx >= 9) return '#00f0ff'; // Oct, Nov, Dec: NE Monsoon (Cyan)
      if (idx >= 5 && idx <= 8) return '#14b8a6'; // Jun, Jul, Aug, Sep: SW Monsoon (Teal)
      return 'rgba(148, 163, 184, 0.45)'; // Dry/Hot season
    });

    this.charts.districtRainfall = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: `${selectedZone.name} Monthly Rainfall (mm)`,
          data: rainfall,
          backgroundColor: barColors,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#00f0ff',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              afterLabel: (context) => {
                const idx = context.dataIndex;
                if (idx >= 9) return "Season: Northeast Monsoon (Peak)";
                if (idx >= 5 && idx <= 8) return "Season: Southwest Monsoon";
                return "Season: Pre-Monsoon / Summer";
              },
              label: (context) => `Precipitation: ${context.parsed.y} mm`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: this.colors.textMuted, font: { size: 10 } }
          },
          y: {
            min: 0,
            grid: { color: this.colors.grid },
            ticks: {
              color: this.colors.textMuted,
              callback: (v) => `${v} mm`
            }
          }
        }
      }
    });
  },

  /**
   * Update all charts when selected district or urban zone changes
   */
  updateOnZoneChange(zones, selectedZone, simulationResult) {
    this.createRiskDistributionChart(zones, selectedZone);
    this.createTempComparisonChart(zones, selectedZone);
    this.createGreenCoverComparisonChart(zones, selectedZone);
    this.createFactorRadarChart(selectedZone);
    this.createSimulationImpactChart(selectedZone, simulationResult);
    this.createDistrictVsStateComparisonChart(selectedZone);
    this.createDistrictMonthlyTempChart(selectedZone);
    this.createDistrictRainfallChart(selectedZone);
  }
};
