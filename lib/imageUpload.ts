export async function saveUploadedImage(file: File, type: 'group' | 'user'): Promise<string> {
  try {
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.')
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.')
    }

    // Convert file to base64 data URL for storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Return the data URL (this will be stored directly in the database)
    return dataUrl
  } catch (error) {
    console.error('Error processing uploaded image:', error)
    throw error
  }
}

export function getImageUrl(imagePath: string | null, type: 'group' | 'user'): string {
  if (!imagePath) {
    return type === 'group' ? '/default-group.png' : '/default-avatar.png'
  }
  
  // If it's a base64 data URL, return as is
  if (imagePath.startsWith('data:')) {
    return imagePath
  }
  
  // If it's already a full URL or starts with /, return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
    return imagePath
  }
  
  // Otherwise, assume it's a relative path in uploads
  return `/uploads/${type}/${imagePath}`
}
