export function parseVideoUrl(url: string): { type: 'youtube' | 'tiktok' | null, id: string | null } {
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
  // Short tiktok urls (vm.tiktok.com) would ideally need server-side resolution, 
  // but for now we'll just handle standard ones or let the user know.

  return { type: null, id: null };
}
