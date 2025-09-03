import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function saveUploadedImage(file: File, type: 'group' | 'user'): Promise<string> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', type)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return the public URL
    return `/uploads/${type}/${filename}`
  } catch (error) {
    console.error('Error saving uploaded image:', error)
    throw new Error('Failed to save image')
  }
}

export function getImageUrl(imagePath: string | null, type: 'group' | 'user'): string {
  if (!imagePath) {
    return type === 'group' ? '/default-group.png' : '/default-avatar.png'
  }
  
  // If it's already a full URL or starts with /, return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
    return imagePath
  }
  
  // Otherwise, assume it's a relative path in uploads
  return `/uploads/${type}/${imagePath}`
}
