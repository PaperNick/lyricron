const MEDIA_EXTENSION = /\.(mp3|wav|m4a|aac|ogg|oga|opus|flac|weba|webm|mp4|m4v|mov|mkv|ogv|3gp)$/i;

/** Returns true when the file can be played by the audio element. */
export function isPlayableMedia(file: File): boolean {
  return (
    file.type.startsWith('audio/') ||
    file.type.startsWith('video/') ||
    MEDIA_EXTENSION.test(file.name)
  );
}
