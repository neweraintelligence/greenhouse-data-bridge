# AI Image Generation Prompts for Incident Photos
## Big Marble Farms - Controlled Environment Agriculture (CEA) Greenhouse

Use these prompts with AI image generators to create **10 realistic incident photos** specific to Big Marble Farms' greenhouse and pack house operations.

---

## Photo 1: Powdery Mildew on Cucumber Plants (REAL - Severity 4)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/powdery-mildew.jpg`

**Prompt:**
```
Close-up photo of cucumber plants in a commercial greenhouse showing white powdery mildew infection on leaves. Plants growing on vertical trellising systems with drip irrigation visible. Purple and pink LED grow lights overhead. Modern CEA facility with white walls. Professional agricultural photography. Disease outbreak visible, requires immediate attention.
```
**Expected Classification:** Crop Disease, Severity 4, Route to Escalation
**Why:** Crop disease can spread rapidly and affect entire zones. Critical for revenue.

---

## Photo 2: Irrigation Drip Line Leak (REAL - Severity 3)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/irrigation-leak.jpg`

**Prompt:**
```
Photo of irrigation drip line with visible leak dripping onto growing bench in commercial greenhouse. Water pooling around plant root zones. Cucumbers or tomatoes in growing containers on white benches. Purple LED grow lights visible above. Clean modern CEA environment. Agricultural equipment malfunction. Realistic photography.
```
**Expected Classification:** Equipment Maintenance, Severity 3, Route to Review
**Why:** Can cause overwatering and root rot. Needs repair but not immediate crisis.

---

## Photo 3: Failed LED Grow Light Section (REAL - Severity 4)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/led-failure.jpg`

**Prompt:**
```
Section of LED grow light fixture completely dark/off while adjacent sections are lit with purple-pink light. Plants below showing signs of insufficient light. Commercial greenhouse with rows of benches. Modern CEA controlled environment. Equipment failure visible. Professional photography showing clear contrast between lit and unlit areas.
```
**Expected Classification:** Equipment Failure, Severity 4, Route to Escalation
**Why:** Affects crop yield directly. Expensive equipment requiring immediate attention.

---

## Photo 4: Maintenance Tag Overdue on Climate Control (REAL - Severity 3)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/maintenance-tag-overdue.jpg`

**Prompt:**
```
Close-up of red maintenance tag on greenhouse climate control equipment showing "LAST SERVICE: 03/15/2024, NEXT DUE: 09/15/2024" with current date visible as past due. Clean white equipment panel with gauges. Modern CEA facility. Compliance and maintenance tracking. Realistic industrial photography.
```
**Expected Classification:** Maintenance Compliance, Severity 3, Route to Review
**Why:** Equipment overdue for service - could lead to failure. Needs scheduling.

---

## Photo 5: Aphid Infestation on Lettuce (REAL - Severity 5)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/aphid-infestation.jpg`

**Prompt:**
```
Close-up photo of lettuce plants in hydroponic growing system with visible aphid infestation. Small green insects clustered on leaves. Commercial greenhouse with white growing benches and LED grow lights. Modern CEA environment. Serious pest outbreak requiring immediate IPM intervention. Professional agricultural photography.
```
**Expected Classification:** Critical Pest Infestation, Severity 5, Route to Escalation
**Why:** Food safety issue. Can contaminate entire crop. Must be addressed immediately.

---

## Photo 6: Produce Box with Big Marble Farms Logo - Quality Issue (REAL - Severity 3)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/quality-issue-box.jpg`

**Prompt:**
```
Photo of cardboard produce box with "Big Marble Farms" logo and branding, containing cucumbers with visible blemishes and quality defects. Pack house setting with stainless steel packing table. Clean professional environment. Quality control concern. Realistic product photography showing both branding and quality issue.
```
**Expected Classification:** Quality Control, Severity 3, Route to Review
**Why:** Affects brand reputation. Need to identify root cause in growing process.

---

## Photo 7: Fertigation System Error Code (REAL - Severity 4)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/fertigation-error.jpg`

**Prompt:**
```
Digital display panel on fertigation (fertilizer + irrigation) mixing system showing error code "EC-HIGH" with red warning light. Commercial greenhouse nutrient delivery system. White walls, modern equipment. Green plants visible in background. Agricultural technology malfunction. Professional photography.
```
**Expected Classification:** System Error, Severity 4, Route to Escalation
**Why:** Wrong nutrient concentration can damage entire crop. Needs immediate correction.

---

## Photo 8: Dropped Glove on Growing Bench (FALSE POSITIVE)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/dropped-glove.jpg`

**Prompt:**
```
Single work glove lying on clean white growing bench in commercial greenhouse. Plants growing normally around it. Purple LED grow lights overhead. Modern CEA facility. No actual hazard present. Realistic photography showing minor housekeeping item, not a real incident.
```
**Expected Classification:** False Positive, Dismiss
**Why:** Harmless item. Not a safety or operational concern.

---

## Photo 9: Produce Packing in Progress - Normal Operations (FALSE POSITIVE)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/normal-packing.jpg`

**Prompt:**
```
Photo of pack house workers' station with Big Marble Farms branded boxes being filled with fresh cucumbers. Stainless steel table, scale, and packing materials neatly organized. Everything functioning normally. Clean professional pack house environment. Realistic photography of normal daily operations.
```
**Expected Classification:** False Positive, Dismiss
**Why:** Normal operations, no incident. Shows what "good" looks like.

---

## Photo 10: Ambiguous - Possible Leaf Nutrient Deficiency (AMBIGUOUS - Severity 3)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/nutrient-deficiency.jpg`

**Prompt:**
```
Photo of tomato plant leaves in commercial greenhouse showing yellowing between veins. Could be nutrient deficiency (iron/magnesium) OR normal aging of lower leaves OR early disease. Purple LED grow lights overhead. Modern CEA growing benches. Professional agricultural photography showing unclear symptoms requiring expert diagnosis.
```
**Expected Classification:** Ambiguous, Route to Review
**Why:** Unclear if this is normal leaf aging or early problem. Needs grower expertise.

---

## Photo 11: Forklift Hydraulic Leak (REAL - Severity 4)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/forklift-leak.jpg`

**Prompt:**
```
Yellow warehouse forklift parked in shipping area with a visible puddle of red hydraulic fluid leaking onto the concrete floor. Big Marble Farms boxes in background. Industrial safety hazard. Realistic photography.
```
**Expected Classification:** Safety Hazard, Severity 4, Route to Escalation
**Why:** Slip hazard, chemical spill, and equipment failure. Immediate safety concern.

---

## Photo 12: Conveyor Belt Tear (REAL - Severity 3)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/conveyor-damage.jpg`

**Prompt:**
```
Close up of food processing conveyor belt in a packing facility. The belt material is frayed and torn at the edge, exposing internal fibers. Stainless steel equipment. Cucumbers in background. Equipment mechanism failure. Realistic photography.
```
**Expected Classification:** Equipment Failure, Severity 3, Route to Review
**Why:** Needs repair to prevent full failure or product contamination.

---

## Photo 13: Loading Dock Door Seal Damage (REAL - Severity 3)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/dock-door-seal-damage.jpg`

**Prompt:**
```
Interior view of a closed industrial loading dock door. Sunlight beaming through a large gap in the damaged rubber weather seal at the bottom corner. Concrete floor. Pest and temperature control issue. Realistic photography.
```
**Expected Classification:** Infrastructure Damage, Severity 3, Route to Review
**Why:** Entry point for pests and loss of climate control.

---

## Photo 14: Harvest Cart Rail Obstruction (REAL - Severity 3)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/rail-obstruction.jpg`

**Prompt:**
```
Low angle photo of heating pipes on greenhouse floor that serve as rails for harvest carts. A discarded tool and plant debris are blocking the rail track. Tomato vines on both sides. Greenhouse internal logistics hazard. Realistic photography.
```
**Expected Classification:** Safety Hazard, Severity 3, Route to Review
**Why:** Can cause cart derailment or injury. Housekeeping issue.

---

## Photo 15: Collapsed Ventilation Tube (REAL - Severity 4)
**Save Location:** `/Users/jeffr/Local Project Repo/BMF Pipeline OS/greenhouse-data-bridge/public/incidents/ventilation-tube-damage.jpg`

**Prompt:**
```
Commercial greenhouse overhead ventilation system. The long clear plastic air tube (convection tube) is torn and partially detached, hanging down loosely. Purple grow lights. Specialized CEA environment. Infrastructure damage. Realistic photography.
```
**Expected Classification:** Infrastructure Damage, Severity 4, Route to Escalation
**Why:** Critical for climate control and air circulation.

---

## CEA-Specific Environment Details

**Greenhouse Elements to Include:**
- Purple/pink LED grow lights (CEA signature)
- White or light gray growing benches
- Vertical trellising for vine crops (cucumbers, tomatoes)
- Drip irrigation lines
- Hydroponic or container growing systems
- Clean, modern facility aesthetic
- Temperature/humidity control equipment

**Pack House Elements:**
- Stainless steel tables and equipment
- Big Marble Farms branded boxes and packaging
- Produce quality inspection areas
- Scales and weighing equipment
- Clean, food-safe environment

**Big Marble Farms Branding:**
- Logo on produce boxes (can be simple text "Big Marble Farms")
- Professional, premium aesthetic
- Focus on fresh, high-quality produce

**What to AVOID:**
- Heavy industrial warehouse equipment
- Automotive/manufacturing settings
- Dirty or poorly maintained facilities
- Amazon/logistics warehouse aesthetic
- Generic office supplies as "incidents" (unless false positive demo)

---

## Image Generation Settings

**Resolution:** 1024x1024 or higher
**Style:** Realistic photography, documentary style
**Lighting:** Natural + LED grow light mix (purple/pink tones)
**Perspective:** Eye level, clear focus on incident area
**Background:** Always show it's a greenhouse/pack house context

---

## Expected AI Analysis Summary

| # | Type | Severity | Classification | Routing |
|---|------|----------|----------------|---------|
| 1 | Crop Disease | 4 | Real | Escalation |
| 2 | Equipment | 3 | Real | Review |
| 3 | Equipment Failure | 4 | Real | Escalation |
| 4 | Maintenance | 3 | Real | Review |
| 5 | Pest Critical | 5 | Real | Escalation |
| 6 | Quality | 3 | Real | Review |
| 7 | System Error | 4 | Real | Escalation |
| 8 | Housekeeping | N/A | False Positive | Dismiss |
| 9 | Normal Ops | N/A | False Positive | Dismiss |
| 10 | Unclear | 3 | Ambiguous | Review |
| 11 | Safety Hazard | 4 | Real | Escalation |
| 12 | Equipment Failure| 3 | Real | Review |
| 13 | Infrastructure | 3 | Real | Review |
| 14 | Safety Hazard | 3 | Real | Review |
| 15 | Infrastructure | 4 | Real | Escalation |

**Total: 15 photos**
- Real Incidents: 12 (80%)
- False Positives: 2 (13%)
- Ambiguous: 1 (7%)
- Route to Escalation: 6 (40%)
- Route to Review: 7 (47%)
- Dismiss: 2 (13%)
