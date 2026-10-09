const MEDIA_EXTENSION = /\.(mp3|wav|m4a|aac|ogg|oga|opus|flac|weba|webm|mp4|m4v|mov|mkv|ogv|3gp)$/i;
const MP3_EXTENSION = /\.mp3$/i;
const MP3_MIME_TYPES = new Set(['audio/mpeg', 'audio/mp3', 'audio/x-mpeg']);

/** Returns true when the file can be played by the audio element. */
export function isPlayableMedia(file: File): boolean {
  return (
    file.type.startsWith('audio/') ||
    file.type.startsWith('video/') ||
    MEDIA_EXTENSION.test(file.name)
  );
}

/** Returns true for MP3 files, the only container we read embedded ID3 lyrics from. */
export function isMp3(file: File): boolean {
  return MP3_EXTENSION.test(file.name) || MP3_MIME_TYPES.has(file.type.toLowerCase());
}
