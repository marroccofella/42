// Utility functions for generating thumbnails and previews for timeline clips

export const generateVideoThumbnail = (file: File, timeOffset: number = 0): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      // Set canvas size to maintain aspect ratio
      const aspectRatio = video.videoWidth / video.videoHeight;
      canvas.width = 160; // Fixed width for thumbnail
      canvas.height = 160 / aspectRatio;
      
      // Seek to the specified time offset (or middle of video)
      const seekTime = timeOffset > 0 ? timeOffset : video.duration / 2;
      video.currentTime = Math.min(seekTime, video.duration - 0.1);
    };
    
    video.onseeked = () => {
      try {
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailUrl);
      } catch (error) {
        reject(error);
      } finally {
        // Clean up
        video.src = '';
        video.load();
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video for thumbnail generation'));
    };
    
    // Set video source
    video.src = URL.createObjectURL(file);
  });
};

export const generateAudioWaveform = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    canvas.width = 160;
    canvas.height = 80;
    
    // Create a simple waveform visualization
    const createWaveform = () => {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw waveform bars
      ctx.fillStyle = '#ffffff';
      const barWidth = 2;
      const barSpacing = 3;
      const numBars = Math.floor(canvas.width / (barWidth + barSpacing));
      
      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + barSpacing);
        const height = Math.random() * canvas.height * 0.8 + canvas.height * 0.1;
        const y = (canvas.height - height) / 2;
        
        ctx.fillRect(x, y, barWidth, height);
      }
      
      // Add audio icon
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🎵', canvas.width / 2, canvas.height / 2 + 7);
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    audio.onloadedmetadata = createWaveform;
    audio.onerror = createWaveform; // Fallback to generic waveform
    
    audio.src = URL.createObjectURL(file);
  });
};

export const generateTextPreview = (text: string, color?: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 160;
    canvas.height = 80;
    
    // Background
    const bgColor = color || '#8b5cf6';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Word wrap text
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > canvas.width - 20 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // Draw lines
    const lineHeight = 14;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    
    lines.slice(0, 4).forEach((line, index) => { // Max 4 lines
      ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });
    
    // Add text icon
    ctx.font = '16px Arial';
    ctx.fillText('📝', canvas.width - 15, 15);
    
    resolve(canvas.toDataURL('image/png'));
  });
};

// Cache for generated thumbnails
const thumbnailCache = new Map<string, string>();

export const getCachedThumbnail = (cacheKey: string): string | null => {
  return thumbnailCache.get(cacheKey) || null;
};

export const setCachedThumbnail = (cacheKey: string, thumbnailUrl: string): void => {
  thumbnailCache.set(cacheKey, thumbnailUrl);
};

// Generate fallback thumbnail for errors
const generateFallbackThumbnail = (type: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Set background based on type
      const colors = {
        video: '#ef4444',
        audio: '#10b981', 
        text: '#8b5cf6'
      };
      
      ctx.fillStyle = colors[type as keyof typeof colors] || '#6b7280';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add icon
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const icons = {
        video: '🎥',
        audio: '🎵',
        text: '📝'
      };
      
      ctx.fillText(icons[type as keyof typeof icons] || '❓', canvas.width / 2, canvas.height / 2);
    }
    
    resolve(canvas.toDataURL('image/png'));
  });
};

// Main function to generate thumbnail based on clip type
export const generateClipThumbnail = async (clip: any): Promise<string> => {
  console.log('Generating thumbnail for clip:', clip.type, clip.id);
  
  const cacheKey = `${clip.id}-${clip.type}`;
  
  // Check cache first
  if (thumbnailCache.has(cacheKey)) {
    console.log('Using cached thumbnail for:', cacheKey);
    return thumbnailCache.get(cacheKey)!;
  }
  
  let thumbnailUrl: string;
  
  try {
    switch (clip.type) {
      case 'video':
        if (!clip.file) {
          throw new Error('Video clip missing file');
        }
        thumbnailUrl = await generateVideoThumbnail(clip.file, clip.duration / 2);
        break;
      case 'audio':
        if (!clip.file) {
          throw new Error('Audio clip missing file');
        }
        thumbnailUrl = await generateAudioWaveform(clip.file);
        break;
      case 'text':
        if (!clip.text) {
          throw new Error('Text clip missing text');
        }
        thumbnailUrl = await generateTextPreview(clip.text, clip.color);
        break;
      default:
        throw new Error(`Unsupported clip type: ${clip.type}`);
    }
    
    console.log('Generated thumbnail for:', cacheKey);
    // Cache the result
    thumbnailCache.set(cacheKey, thumbnailUrl);
    return thumbnailUrl;
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    // Return a fallback thumbnail
    const fallbackUrl = await generateFallbackThumbnail(clip.type);
    thumbnailCache.set(cacheKey, fallbackUrl);
    return fallbackUrl;
  }
};
