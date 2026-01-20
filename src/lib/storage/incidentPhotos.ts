import { supabase } from '../supabase';

export interface IncidentPhoto {
  name: string;
  publicUrl: string;
  createdAt: string;
}

/**
 * List all incident photos from the demo-assets bucket
 */
export async function listIncidentPhotos(): Promise<IncidentPhoto[]> {
  try {
    const { data: files, error } = await supabase.storage
      .from('demo-assets')
      .list('incidents', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      console.error('Error listing incident photos:', error);
      return [];
    }

    if (!files || files.length === 0) {
      // Return placeholder photos if none exist
      return getMockIncidentPhotos();
    }

    // Get public URLs for all photos
    const photos: IncidentPhoto[] = files
      .filter((file) => file.name.match(/\.(jpg|jpeg|png|webp)$/i))
      .map((file) => {
        const { data } = supabase.storage
          .from('demo-assets')
          .getPublicUrl(`incidents/${file.name}`);

        return {
          name: file.name,
          publicUrl: data.publicUrl,
          createdAt: file.created_at || new Date().toISOString(),
        };
      });

    return photos;
  } catch (error) {
    console.error('Error fetching incident photos:', error);
    return getMockIncidentPhotos();
  }
}

/**
 * Get a single incident photo URL
 */
export async function getIncidentPhotoUrl(fileName: string): Promise<string | null> {
  try {
    const { data } = supabase.storage
      .from('demo-assets')
      .getPublicUrl(`incidents/${fileName}`);

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting photo URL:', error);
    return null;
  }
}

/**
 * Upload a new incident photo (for participants taking photos with camera)
 */
export async function uploadIncidentPhoto(
  sessionCode: string,
  photoData: string, // Base64
  fileName: string
): Promise<string | null> {
  try {
    // Convert base64 to blob
    const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
    const blob = base64ToBlob(base64Data, 'image/jpeg');

    const filePath = `sessions/${sessionCode}/${fileName}`;

    const { error } = await supabase.storage
      .from('uploads')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading photo:', error);
      return null;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading incident photo:', error);
    return null;
  }
}

// Helper to convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// Mock photos for demo when bucket is empty
function getMockIncidentPhotos(): IncidentPhoto[] {
  return [
    {
      name: 'conveyor-jam.jpg',
      publicUrl: 'https://placehold.co/600x400/orange/white?text=Conveyor+Jam',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'wet-floor.jpg',
      publicUrl: 'https://placehold.co/600x400/blue/white?text=Wet+Floor+Hazard',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'aphid-infestation.jpg',
      publicUrl: 'https://placehold.co/600x400/green/white?text=Pest+Infestation',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'dropped-pen.jpg',
      publicUrl: 'https://placehold.co/600x400/gray/white?text=Dropped+Pen+(False+Positive)',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'possible-mold.jpg',
      publicUrl: 'https://placehold.co/600x400/brown/white?text=Unclear+-+Needs+Review',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'hvac-ice.jpg',
      publicUrl: 'https://placehold.co/600x400/cyan/white?text=HVAC+Ice+Buildup',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'cracked-panel.jpg',
      publicUrl: 'https://placehold.co/600x400/red/white?text=Cracked+Glass+Panel',
      createdAt: new Date().toISOString(),
    },
  ];
}
