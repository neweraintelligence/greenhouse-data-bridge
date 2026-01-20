import { supabase } from '../supabase';

/**
 * Seed incident reporting mock data for a session
 * Creates 3 equipment locations with 5-7 pre-seeded photos each
 * Photos include mix of real incidents, false positives, and ambiguous cases
 */

export interface LocationSeedData {
  location_code: string;
  location_name: string;
  zone: string;
  equipment_type: string;
  description: string;
  photos: PhotoSeedData[];
}

export interface PhotoSeedData {
  photo_url: string;
  incident_category: string;
  expected_severity?: number;
  is_false_positive: boolean;
  is_ambiguous: boolean;
  description: string;
}

// Mock data for 3 locations
const LOCATION_SEED_DATA: LocationSeedData[] = [
  {
    location_code: 'Z3-R12',
    location_name: 'Conveyor Belt Z3-R12',
    zone: 'Zone 3',
    equipment_type: 'Conveyor',
    description: 'Primary sorting conveyor for Zone 3 operations',
    photos: [
      {
        photo_url: 'https://placehold.co/800x600/e74c3c/white?text=Conveyor+Jam',
        incident_category: 'Equipment Malfunction',
        expected_severity: 4,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Conveyor jam with stacked trays blocking belt movement'
      },
      {
        photo_url: 'https://placehold.co/800x600/f39c12/white?text=Wet+Floor',
        incident_category: 'Safety Hazard',
        expected_severity: 3,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Water puddle on floor creating slip hazard'
      },
      {
        photo_url: 'https://placehold.co/800x600/e74c3c/white?text=Loose+Guard',
        incident_category: 'Safety Equipment',
        expected_severity: 4,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Safety guard panel hanging open, exposing moving parts'
      },
      {
        photo_url: 'https://placehold.co/800x600/95a5a6/white?text=Dropped+Pen',
        incident_category: 'False Positive',
        expected_severity: 0,
        is_false_positive: true,
        is_ambiguous: false,
        description: 'Pen dropped on floor - not a safety hazard'
      },
      {
        photo_url: 'https://placehold.co/800x600/27ae60/white?text=Normal+Operation',
        incident_category: 'False Positive',
        expected_severity: 0,
        is_false_positive: true,
        is_ambiguous: false,
        description: 'Conveyor operating normally, no issues'
      },
      {
        photo_url: 'https://placehold.co/800x600/f39c12/white?text=Oil+Leak',
        incident_category: 'Maintenance',
        expected_severity: 3,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Oil leak beneath motor housing'
      },
      {
        photo_url: 'https://placehold.co/800x600/c0392b/white?text=Frayed+Cord',
        incident_category: 'Critical Safety',
        expected_severity: 5,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Electrical cord with exposed wiring - critical hazard'
      }
    ]
  },
  {
    location_code: 'Z2-R08',
    location_name: 'HVAC Unit Z2-R08',
    zone: 'Zone 2',
    equipment_type: 'HVAC',
    description: 'Climate control system for Zone 2 growing area',
    photos: [
      {
        photo_url: 'https://placehold.co/800x600/e74c3c/white?text=Ice+Buildup',
        incident_category: 'Equipment Failure',
        expected_severity: 4,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Excessive ice formation on HVAC coils'
      },
      {
        photo_url: 'https://placehold.co/800x600/f39c12/white?text=Error+E-03',
        incident_category: 'System Error',
        expected_severity: 3,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Temperature control error code displayed'
      },
      {
        photo_url: 'https://placehold.co/800x600/e74c3c/white?text=Mold+Growth',
        incident_category: 'Health Hazard',
        expected_severity: 4,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Mold visible around air vent'
      },
      {
        photo_url: 'https://placehold.co/800x600/3498db/white?text=Condensation',
        incident_category: 'Ambiguous',
        expected_severity: 3,
        is_false_positive: false,
        is_ambiguous: true,
        description: 'Water droplets on pipe - normal or leak?'
      },
      {
        photo_url: 'https://placehold.co/800x600/f39c12/white?text=Blocked+Intake',
        incident_category: 'Operational Issue',
        expected_severity: 3,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Air intake partially blocked by supplies'
      },
      {
        photo_url: 'https://placehold.co/800x600/27ae60/white?text=Clean+Filter',
        incident_category: 'False Positive',
        expected_severity: 0,
        is_false_positive: true,
        is_ambiguous: false,
        description: 'Routine filter replacement - not an incident'
      },
      {
        photo_url: 'https://placehold.co/800x600/f1c40f/white?text=Vibration',
        incident_category: 'Minor Maintenance',
        expected_severity: 2,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Loose mounting bracket causing minor vibration'
      }
    ]
  },
  {
    location_code: 'A4',
    location_name: 'Packing Station A4',
    zone: 'Packing Area',
    equipment_type: 'Workstation',
    description: 'Primary packing station for finished goods',
    photos: [
      {
        photo_url: 'https://placehold.co/800x600/f1c40f/white?text=Spilled+Sanitizer',
        incident_category: 'Minor Safety',
        expected_severity: 2,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Small sanitizer spill on counter'
      },
      {
        photo_url: 'https://placehold.co/800x600/c0392b/white?text=Pest+Droppings',
        incident_category: 'Critical Food Safety',
        expected_severity: 5,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Rodent droppings found on shelf'
      },
      {
        photo_url: 'https://placehold.co/800x600/f39c12/white?text=Broken+Scale',
        incident_category: 'Equipment',
        expected_severity: 3,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Digital scale display cracked and unreadable'
      },
      {
        photo_url: 'https://placehold.co/800x600/95a5a6/white?text=Coffee+Cup',
        incident_category: 'False Positive',
        expected_severity: 0,
        is_false_positive: true,
        is_ambiguous: false,
        description: 'Empty cup left on counter - housekeeping only'
      },
      {
        photo_url: 'https://placehold.co/800x600/f1c40f/white?text=Torn+Packaging',
        incident_category: 'Minor Quality',
        expected_severity: 2,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Packaging film torn and needs replacement'
      },
      {
        photo_url: 'https://placehold.co/800x600/e74c3c/white?text=Unlabeled+Chemical',
        incident_category: 'Safety Compliance',
        expected_severity: 4,
        is_false_positive: false,
        is_ambiguous: false,
        description: 'Spray bottle without proper safety labeling'
      },
      {
        photo_url: 'https://placehold.co/800x600/27ae60/white?text=Normal+Workstation',
        incident_category: 'False Positive',
        expected_severity: 0,
        is_false_positive: true,
        is_ambiguous: false,
        description: 'Well-organized workstation, no issues'
      }
    ]
  }
];

/**
 * Seed all incident locations and photos for a session
 */
export async function seedIncidentLocations(sessionCode: string): Promise<void> {
  console.log(`[Seed] Starting incident data seed for session: ${sessionCode}`);

  for (const locationData of LOCATION_SEED_DATA) {
    // Insert location
    const { data: location, error: locationError } = await supabase
      .from('equipment_locations')
      .insert({
        session_code: sessionCode,
        location_code: locationData.location_code,
        location_name: locationData.location_name,
        zone: locationData.zone,
        equipment_type: locationData.equipment_type,
        description: locationData.description
      })
      .select()
      .single();

    if (locationError) {
      console.error(`[Seed] Error creating location ${locationData.location_code}:`, locationError);
      continue;
    }

    console.log(`[Seed] Created location: ${location.location_name}`);

    // Insert photos for this location
    const photosToInsert = locationData.photos.map((photo, idx) => ({
      location_id: location.id,
      photo_url: photo.photo_url,
      incident_category: photo.incident_category,
      expected_severity: photo.expected_severity || null,
      is_false_positive: photo.is_false_positive,
      is_ambiguous: photo.is_ambiguous,
      description: photo.description,
      display_order: idx
    }));

    const { error: photosError } = await supabase
      .from('location_incident_photos')
      .insert(photosToInsert);

    if (photosError) {
      console.error(`[Seed] Error inserting photos for ${locationData.location_code}:`, photosError);
    } else {
      console.log(`[Seed] Inserted ${photosToInsert.length} photos for ${location.location_name}`);
    }
  }

  console.log(`[Seed] Completed incident data seed for session: ${sessionCode}`);
}

/**
 * Seed sample incident reports with AI analysis results (mock data for demo)
 */
export async function seedSampleIncidentReports(sessionCode: string): Promise<void> {
  console.log(`[Seed] Starting sample incident reports for session: ${sessionCode}`);

  // Get all locations for this session
  const { data: locations, error: locError } = await supabase
    .from('equipment_locations')
    .select('*, location_incident_photos(*)')
    .eq('session_code', sessionCode);

  if (locError || !locations || locations.length === 0) {
    console.error('[Seed] No locations found for sample reports');
    return;
  }

  // Create 3 sample reports (one per location) showing different routing paths
  const sampleReports = [
    {
      // Escalation path (Severity 5)
      location: locations.find(l => l.location_code === 'A4'),
      selectedPhotos: ['pest_droppings', 'unlabeled_chemical'], // Severity 5 + 4
      analysis: {
        incident_type: 'Critical Food Safety',
        severity: 5,
        ai_classification: 'real_incident',
        ai_confidence: 95,
        ai_description: 'Rodent droppings detected on food preparation surface. Critical health code violation requiring immediate action.',
        ai_suggested_action: 'Immediate sanitization, pest control deployment, and health department notification',
        routed_to: 'Safety Team',
        routing_reason: 'Critical severity (5/5) requires immediate Safety Team attention'
      }
    },
    {
      // Review queue path (Severity 3 + Ambiguous)
      location: locations.find(l => l.location_code === 'Z2-R08'),
      selectedPhotos: ['condensation', 'blocked_intake'], // Ambiguous + Severity 3
      analysis: {
        incident_type: 'Equipment/Operational',
        severity: 3,
        ai_classification: 'ambiguous',
        ai_confidence: 68,
        ai_description: 'Possible leak or normal condensation detected. Air intake partially obstructed.',
        ai_suggested_action: 'Human review recommended to determine if condensation is normal or indicates leak',
        routed_to: 'Review Queue',
        routing_reason: 'Ambiguous classification requires human verification'
      }
    },
    {
      // Log only path (Severity 2)
      location: locations.find(l => l.location_code === 'Z3-R12'),
      selectedPhotos: ['wet_floor'], // Severity 3 but we'll downgrade
      analysis: {
        incident_type: 'Minor Safety',
        severity: 2,
        ai_classification: 'real_incident',
        ai_confidence: 88,
        ai_description: 'Small water spill on floor. Easily cleanable, no immediate hazard with caution signage present.',
        ai_suggested_action: 'Routine cleanup, monitor irrigation system for drips',
        routed_to: 'Log Only',
        routing_reason: 'Minor severity (2/5) logged for tracking, no immediate action required'
      }
    }
  ];

  for (const report of sampleReports) {
    if (!report.location) continue;

    const { error: reportError } = await supabase
      .from('incident_reports')
      .insert({
        session_code: sessionCode,
        location_id: report.location.id,
        location_code: report.location.location_code,
        location_name: report.location.location_name,
        reported_by: 'Demo User',
        selected_photo_ids: JSON.stringify(report.selectedPhotos),
        ai_analysis: JSON.stringify(report.analysis),
        incident_type: report.analysis.incident_type,
        severity: report.analysis.severity,
        ai_classification: report.analysis.ai_classification,
        ai_confidence: report.analysis.ai_confidence,
        ai_description: report.analysis.ai_description,
        ai_suggested_action: report.analysis.ai_suggested_action,
        routed_to: report.analysis.routed_to,
        routing_reason: report.analysis.routing_reason,
        status: 'pending_review'
      });

    if (reportError) {
      console.error('[Seed] Error creating sample report:', reportError);
    }
  }

  console.log(`[Seed] Created ${sampleReports.length} sample incident reports`);
}

/**
 * Main seed function - call this to populate all incident data
 */
export async function seedIncidentData(sessionCode: string): Promise<void> {
  await seedIncidentLocations(sessionCode);
  await seedSampleIncidentReports(sessionCode);
  console.log(`[Seed] Incident data seeding complete for session: ${sessionCode}`);
}
