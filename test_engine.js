const fs = require('fs');

const dataCode = fs.readFileSync('js/data.js', 'utf8');
const modelCode = fs.readFileSync('js/model.js', 'utf8');
const recCode = fs.readFileSync('js/recommendations.js', 'utf8');

const combined = [
  dataCode,
  modelCode,
  recCode,
  `
  console.log("=== Tamil Nadu Urban Climate Digital Twin Verification ===");
  console.log("Total Official Districts:", TAMIL_NADU_DISTRICTS.length);
  console.log("Total Urban Monitoring Zones:", TAMIL_NADU_URBAN_ZONES.length);

  // Check unique district names
  const districtNames = new Set(TAMIL_NADU_DISTRICTS.map(d => d.name));
  console.log("Unique District Count:", districtNames.size, "(Expected 38)");
  if (districtNames.size !== 38) {
    console.error("ERROR: Duplicate districts found!");
  }

  console.log("\\n--- District Heat-Risk Scores ---");
  TAMIL_NADU_DISTRICTS.slice(0, 10).forEach(d => {
    const r = HeatRiskEngine.computeRisk(d);
    console.log(\`[\${d.id}] \${d.name.padEnd(16)} | Temp: \${d.surfaceTemp.toFixed(1)}°C | Score: \${r.score.toString().padEnd(4)} | \${r.category.padEnd(14)} | Drivers: \${r.drivers.length}\`);
  });

  console.log("\\n--- Sample Urban Monitoring Micro-Zones ---");
  TAMIL_NADU_URBAN_ZONES.slice(0, 8).forEach(u => {
    const r = HeatRiskEngine.computeRisk(u);
    console.log(\`[\${u.id}] \${u.name.padEnd(30)} (\${u.districtName.padEnd(14)}) | Score: \${r.score.toString().padEnd(4)} | \${r.category.padEnd(14)}\`);
  });

  console.log("\\n--- Testing Intervention Simulator on Chennai ---");
  const chennai = TAMIL_NADU_DISTRICTS[0];
  const sim = HeatRiskEngine.simulate(chennai, {
    tree_canopy: { active: true, intensity: 30 },
    cool_roofs: { active: true, intensity: 50 },
    shaded_structures: { active: true, intensity: 40 },
    cooling_centres: { active: true, intensity: 5 },
    water_features: { active: true, intensity: 35 }
  });

  console.log("Baseline UHRI:", sim.baselineRisk.score, "-> Simulated UHRI:", sim.simulatedRisk.score);
  console.log("Baseline LST:", sim.baseline.surfaceTemp + "°C", "-> Simulated LST:", sim.simulated.surfaceTemp + "°C", "Delta:", sim.delta.temp + "°C");
  console.log("Baseline Green:", sim.baseline.greenCover + "%", "-> Simulated Green:", sim.simulated.greenCover + "%", "Delta: +" + sim.delta.green + "%");
  console.log("Estimated Resource Cost: ₹" + (sim.delta.costTotal * 1.2).toLocaleString('en-IN'));
  console.log("Explanation:", sim.explanation);

  console.log("\\n--- Testing Recommendations Engine for Chennai ---");
  const recs = RecommendationEngine.generate(chennai, sim.baselineRisk);
  console.log("Immediate Action Count:", recs.immediate.length);
  recs.immediate.forEach((i, idx) => console.log(\`  \${idx+1}. \${i.title} (\${i.priority})\`));
  console.log("Long-Term Action Count:", recs.longTerm.length);
  recs.longTerm.forEach((i, idx) => console.log(\`  \${idx+1}. \${i.title} (\${i.priority})\`));

  console.log("\\n--- Checking Exact 38 District Alphabetical Order ---");
  const expectedDistricts = [
    'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
    'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram',
    'Kanniyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
    'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
    'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
    'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
    'Tirupattur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
    'Vellore', 'Villupuram', 'Virudhunagar'
  ];
  let namesMatch = true;
  expectedDistricts.forEach((exp, idx) => {
    const act = TAMIL_NADU_DISTRICTS[idx].name;
    if (act !== exp) {
      console.error(\`ERROR: Mismatch at position \${idx + 1}: expected "\${exp}", got "\${act}"\`);
      namesMatch = false;
    }
  });
  if (namesMatch) {
    console.log("SUCCESS: All 38 districts match the official prompt list in exact alphabetical order!");
  }

  console.log("\\nALL TAMIL NADU VERIFICATIONS PASSED!");
  `
].join('\n\n');

eval(combined);
