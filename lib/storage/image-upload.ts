import { createClient } from '@/lib/supabase/client';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const STORAGE_BUCKET = 'article-images';

export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadError {
  message: string;
  code?: string;
}

/**
 * Validates an image file before upload
 */
export function validateImageFile(file: File): UploadError | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      code: 'FILE_TOO_LARGE',
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      message: `File type ${file.type} not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
      code: 'INVALID_FILE_TYPE',
    };
  }

  return null;
}

/**
 * Compresses an image file before upload
 * Returns a compressed blob or the original file if compression fails
 */
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new window.Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file);
          return;
        }

        // Calculate new dimensions (max 1920px width while maintaining aspect ratio)
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;
        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          } else {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          file.type,
          0.85 // 85% quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  userId: string
): Promise<UploadResult> {
  // Validate file
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  // Compress image
  const compressedBlob = await compressImage(file);

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Upload to Supabase Storage
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, compressedBlob, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteImage(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Gets the public URL for a stored image
 */
export function getImageUrl(path: string): string {
  const supabase = createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return publicUrl;
}
