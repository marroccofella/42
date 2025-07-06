/// <reference lib="dom" />
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { MediaClip, ExportPreset } from '../types';

let ffmpeg: FFmpeg | null = null;

export async function loadFFmpeg(logCallback: (message: string) => void): Promise<void> {
    if (ffmpeg) {
        return;
    }
    ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => {
        if (message.includes('panic')) return; // Filter out panic messages
        logCallback(message);
    });
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    try {
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    } catch (e) {
        console.error("FFMPEG load error", e);
        ffmpeg = null; // Reset on failure
        throw e;
    }
}


export async function stitchAndExport(
  clips: MediaClip[],
  preset: ExportPreset,
  progressCallback: (progress: number) => void
): Promise<string> {
  if (!ffmpeg || !ffmpeg.loaded) {
    throw new Error('FFmpeg not loaded.');
  }

  // 1. Write all files to FFmpeg's virtual file system
  for (const clip of clips) {
    await ffmpeg.writeFile(clip.file.name, await fetchFile(clip.file));
  }

  // 2. Create a file list for concatenation
  const fileList = clips.map(clip => `file '${clip.file.name.replace(/'/g, "'\\''")}'`).join('\n');
  await ffmpeg.writeFile('filelist.txt', fileList);
  
  // 3. Set up progress tracking
  ffmpeg.on('progress', ({ progress }) => {
    progressCallback(Math.max(0, Math.min(progress, 1)));
  });

  // 4. Run the FFmpeg command
  const outputFileName = `output.${preset.format}`;
  const command = [
    '-f', 'concat',
    '-safe', '0',
    '-i', 'filelist.txt',
    '-vf', `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease,pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`,
    '-c:v', preset.vcodec,
    '-crf', String(preset.crf),
    '-preset', 'ultrafast',
    '-movflags', '+faststart',
    '-y', // Overwrite output file if it exists
    outputFileName
  ];

  await ffmpeg.exec(command);
  
  // 5. Read the output file
  const data = await ffmpeg.readFile(outputFileName);

  // 6. Create a blob URL to be used as a download link
  const blob = new Blob([(data as Uint8Array).buffer], { type: `video/${preset.format}` });
  
  // 7. Cleanup files from virtual FS
  for (const clip of clips) {
    await ffmpeg.deleteFile(clip.file.name);
  }
  await ffmpeg.deleteFile('filelist.txt');
  await ffmpeg.deleteFile(outputFileName);


  return URL.createObjectURL(blob);
}