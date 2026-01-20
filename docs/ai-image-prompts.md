# AI Image Generation Prompts for Incident Photos
## Controlled Environment Agriculture (CEA) Greenhouse Setting

Use these prompts with AI image generators (Midjourney, DALL-E, Stable Diffusion) to create realistic incident photos for Big Marble Farms.

---

## Location 1: Conveyor Belt Z3-R12

### Photo 1: Conveyor Jam (REAL - Severity 4)
**Prompt:**
```
Photo of an industrial conveyor belt system in a modern greenhouse with visible jam. Plastic growing trays stacked and jammed at the belt junction. Overhead LED grow lights visible. Clean industrial environment. Realistic photography, slightly concerned perspective. Safety hazard visible.
```
**Expected Classification:** Equipment Malfunction, Severity 4, Route to Escalation

### Photo 2: Wet Floor Hazard (REAL - Severity 3)
**Prompt:**
```
Puddle of water on clean epoxy floor next to a conveyor belt in a greenhouse facility. Irrigation system drip visible. Yellow caution cone visible in background. Natural daylight through greenhouse panels. Realistic industrial photography. Moderate safety concern.
```
**Expected Classification:** Safety Hazard, Severity 3, Route to Review

### Photo 3: Loose Belt Guard (REAL - Severity 4)
**Prompt:**
```
Close-up photo of industrial conveyor belt with loose safety guard panel hanging open, exposing moving parts. Modern greenhouse setting with plants in background. Maintenance issue visible. Realistic photography, safety equipment compromised.
```
**Expected Classification:** Equipment/Safety, Severity 4, Route to Escalation

### Photo 4: Dropped Pen Near Conveyor (FALSE POSITIVE)
**Prompt:**
```
Ballpoint pen lying on clean epoxy floor near a conveyor belt system in a bright greenhouse. Pen appears recently dropped. Clean modern facility. No actual hazard present. Realistic photography, mundane object out of place.
```
**Expected Classification:** False Positive, Dismiss

### Photo 5: Normal Operating Conveyor (FALSE POSITIVE)
**Prompt:**
```
Clean industrial conveyor belt system running smoothly in a modern greenhouse. Plants on trays moving along belt. Everything functioning normally. Bright LED grow lights overhead. Professional facility photography. No issues visible.
```
**Expected Classification:** False Positive, Dismiss

### Photo 6: Oil Leak (REAL - Severity 3)
**Prompt:**
```
Small dark oil stain on floor beneath conveyor belt motor housing in greenhouse facility. Drip pattern visible. Clean industrial environment otherwise. Maintenance concern. Realistic photography showing mechanical fluid leak.
```
**Expected Classification:** Maintenance Issue, Severity 3, Route to Review

### Photo 7: Frayed Electrical Cord (REAL - Severity 5)
**Prompt:**
```
Exposed frayed electrical wire near conveyor belt control panel in greenhouse. Insulation damaged, copper visible. Serious electrical hazard. Modern industrial setting. Realistic photography, critical safety issue.
```
**Expected Classification:** Critical Safety, Severity 5, Route to Escalation

---

## Location 2: HVAC Unit Z2-R08

### Photo 1: Ice Buildup (REAL - Severity 4)
**Prompt:**
```
Industrial HVAC unit in greenhouse with excessive ice formation on coils and exterior housing. Frost covering significant portion. Temperature control system malfunction. Modern facility. Realistic photography showing equipment failure.
```
**Expected Classification:** Equipment Failure, Severity 4, Route to Escalation

### Photo 2: Temperature Display Error (REAL - Severity 3)
**Prompt:**
```
Digital thermostat display showing error code "E-03" in greenhouse climate control system. Clean modern panel. Green plants visible in background. System malfunction indicator. Realistic photography.
```
**Expected Classification:** System Error, Severity 3, Route to Review

### Photo 3: Mold Near Vent (REAL - Severity 4)
**Prompt:**
```
Black mold growth visible on ceiling around HVAC air vent in greenhouse facility. Moisture damage pattern. White ceiling tiles. Health hazard. Realistic photography showing environmental concern.
```
**Expected Classification:** Health/Environmental, Severity 4, Route to Escalation

### Photo 4: Normal Condensation (FALSE POSITIVE - Ambiguous)
**Prompt:**
```
Water condensation on HVAC pipe in greenhouse. Normal moisture droplets on cold surface. Modern facility. Could be mistaken for leak. Realistic photography, ambiguous concern.
```
**Expected Classification:** Ambiguous (could be mistaken for leak), Route to Review

### Photo 5: Blocked Air Intake (REAL - Severity 3)
**Prompt:**
```
HVAC unit air intake partially blocked by cardboard box and supplies in greenhouse. Restricted airflow. Clean modern facility. Operational inefficiency. Realistic photography showing maintenance issue.
```
**Expected Classification:** Operational Issue, Severity 3, Route to Review

### Photo 6: Clean Filter Check (FALSE POSITIVE)
**Prompt:**
```
Open HVAC filter panel showing clean, recently replaced air filter in greenhouse system. Maintenance in progress. Everything normal. Professional facility. Realistic photography of routine maintenance.
```
**Expected Classification:** False Positive (routine maintenance), Dismiss

### Photo 7: Unusual Vibration Source (REAL - Severity 2)
**Prompt:**
```
HVAC unit with visible loose mounting bracket causing minor vibration. Small maintenance concern in greenhouse climate system. Not critical but should be addressed. Realistic industrial photography.
```
**Expected Classification:** Minor Maintenance, Severity 2, Log Only

---

## Location 3: Packing Station A4

### Photo 1: Spilled Sanitizer (REAL - Severity 2)
**Prompt:**
```
Small puddle of hand sanitizer spilled on packing station counter in greenhouse facility. Cleaning supplies nearby. Minor hygiene concern. Clean modern workstation. Realistic photography, small spill.
```
**Expected Classification:** Minor Safety, Severity 2, Log Only

### Photo 2: Pest Droppings (REAL - Severity 5)
**Prompt:**
```
Mouse droppings visible on packing station shelf in greenhouse facility. Food safety critical concern. Clean otherwise. Serious pest control issue. Realistic photography showing pest evidence.
```
**Expected Classification:** Critical Food Safety, Severity 5, Route to Escalation

### Photo 3: Broken Scale (REAL - Severity 3)
**Prompt:**
```
Digital weighing scale on packing station with cracked display screen showing error. Cannot read weight accurately. Modern greenhouse packing area. Equipment malfunction. Realistic photography.
```
**Expected Classification:** Equipment Issue, Severity 3, Route to Review

### Photo 4: Empty Coffee Cup (FALSE POSITIVE)
**Prompt:**
```
Empty coffee cup left on packing station counter in greenhouse facility. Minor housekeeping issue only. Clean modern workstation otherwise. Realistic photography, harmless item out of place.
```
**Expected Classification:** False Positive (housekeeping only), Dismiss

### Photo 5: Torn Packaging Material (REAL - Severity 2)
**Prompt:**
```
Ripped plastic packaging film roll at packing station in greenhouse. Quality control minor concern. Can be replaced easily. Modern facility. Realistic photography showing supply issue.
```
**Expected Classification:** Minor Quality, Severity 2, Log Only

### Photo 6: Unlabeled Chemical Container (REAL - Severity 4)
**Prompt:**
```
Spray bottle without proper labeling on packing station in greenhouse. Chemical safety violation. Clean modern facility. Compliance issue. Realistic photography showing safety protocol breach.
```
**Expected Classification:** Safety Compliance, Severity 4, Route to Escalation

### Photo 7: Normal Workstation Setup (FALSE POSITIVE)
**Prompt:**
```
Well-organized packing station in greenhouse facility. Supplies neatly arranged. Scale, labels, packaging materials properly positioned. Clean modern workspace. Everything in order. Realistic professional photography.
```
**Expected Classification:** False Positive (normal operations), Dismiss

---

## Image Style Guidelines for AI Generation

**General Style:**
- Realistic photography, not illustrated or cartoon
- Natural lighting (mix of LED grow lights + daylight through greenhouse panels)
- Modern, clean industrial environment
- Big Marble Farms aesthetic (professional, well-maintained facilities)
- Perspective: Eye-level, slightly documentary style
- No people in photos (focus on incidents)

**Environment Details:**
- Controlled Environment Agriculture (CEA) greenhouse
- Visible elements: LED grow lights, white/light gray walls, epoxy floors
- Background: Rows of plants on benches or vertical racks
- Equipment: Industrial, modern, well-maintained (except for incident)
- Cleanliness: High standard except where incident occurs

**Color Palette:**
- Greens from plants
- Whites/grays from walls and equipment
- Purples/pinks from LED grow lights
- Industrial metal finishes

**Quality:**
- High resolution (1024x1024 minimum)
- Sharp focus on incident area
- Realistic textures and materials
- Professional photography style

---

## Expected AI Analysis Results Summary

| Location | Photo | Type | Severity | Classification | Routing |
|----------|-------|------|----------|----------------|---------|
| Z3-R12 | Conveyor Jam | Equipment | 4 | Real | Escalation |
| Z3-R12 | Wet Floor | Safety | 3 | Real | Review |
| Z3-R12 | Loose Guard | Safety | 4 | Real | Escalation |
| Z3-R12 | Dropped Pen | N/A | N/A | False Positive | Dismiss |
| Z3-R12 | Normal Operation | N/A | N/A | False Positive | Dismiss |
| Z3-R12 | Oil Leak | Maintenance | 3 | Real | Review |
| Z3-R12 | Frayed Cord | Safety | 5 | Real | Escalation |
| Z2-R08 | Ice Buildup | Equipment | 4 | Real | Escalation |
| Z2-R08 | Display Error | System | 3 | Real | Review |
| Z2-R08 | Mold | Health | 4 | Real | Escalation |
| Z2-R08 | Condensation | Ambiguous | 3 | Ambiguous | Review |
| Z2-R08 | Blocked Intake | Operational | 3 | Real | Review |
| Z2-R08 | Clean Filter | N/A | N/A | False Positive | Dismiss |
| Z2-R08 | Vibration | Maintenance | 2 | Real | Log |
| A4 | Spilled Sanitizer | Safety | 2 | Real | Log |
| A4 | Pest Droppings | Food Safety | 5 | Real | Escalation |
| A4 | Broken Scale | Equipment | 3 | Real | Review |
| A4 | Coffee Cup | N/A | N/A | False Positive | Dismiss |
| A4 | Torn Packaging | Quality | 2 | Real | Log |
| A4 | Unlabeled Chemical | Safety | 4 | Real | Escalation |
| A4 | Normal Workstation | N/A | N/A | False Positive | Dismiss |

**Summary Statistics:**
- Total Photos: 21
- Real Incidents: 15 (71%)
- False Positives: 5 (24%)
- Ambiguous: 1 (5%)
- Severity 5 (Critical): 2
- Severity 4 (High): 6
- Severity 3 (Moderate): 6
- Severity 2 (Minor): 2
- Route to Escalation: 8 (38%)
- Route to Review: 7 (33%)
- Log Only: 2 (10%)
- Dismiss: 5 (24%)
