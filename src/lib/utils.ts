export function parseVideoUrl(url: string): { type: 'youtube' | 'tiktok' | 'tiktok_native' | 'image' | null, id: string | null } {
  if (!url) return { type: null, id: null };

  // YouTube Parser
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch && ytMatch[1]) {
    return { type: 'youtube', id: ytMatch[1] };
  }

  // TikTok Parser
  const tiktokMatch = url.match(/tiktok\.com\/.*\/video\/(\d+)/);
  if (tiktokMatch && tiktokMatch[1]) {
    return { type: 'tiktok', id: tiktokMatch[1] };
  }
  // Image Parser (Pinterest, Imgur, general images)
  // Check if it ends with an image extension or contains known image domains
  if (url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) || url.includes('pinimg.com/')) {
    return { type: 'image', id: url }; // For images, we use the full url as the ID
  }

  return { type: null, id: null };
}
