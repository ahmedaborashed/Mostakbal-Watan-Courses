// src/shared/validators/url.validator.js

/**
 * Validates whether a URL is a safe, valid web URL using http or https protocol.
 * Rejects javascript:, data:, vbscript: and any unsafe or malformed protocols.
 * @param {string} url
 * @returns {boolean}
 */
export function isValidSafeUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Block dangerous pseudo-protocols explicitly
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Extracts the file ID from a Google Drive URL if present.
 * @param {string} url
 * @returns {string|null}
 */
export function extractGoogleDriveId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Pattern 1: /file/d/FILE_ID/
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // Pattern 2: ?id=FILE_ID or &id=FILE_ID
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  return null;
}

/**
 * Converts a Google Drive URL into an embeddable preview URL.
 * @param {string} url
 * @returns {string|null}
 */
export function extractGoogleDriveEmbedUrl(url) {
  const driveId = extractGoogleDriveId(url);
  if (!driveId) return null;
  return `https://drive.google.com/file/d/${driveId}/preview`;
}

/**
 * Extracts a YouTube Video ID from standard watch or short URLs.
 * @param {string} url
 * @returns {string|null}
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Pattern 1: youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // Pattern 2: youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // Pattern 3: youtube.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // Pattern 4: Plain 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  return null;
}

/**
 * Converts a YouTube URL or video ID into an embed URL.
 * @param {string} urlOrId
 * @returns {string|null}
 */
export function extractYouTubeEmbedUrl(urlOrId) {
  const ytId = extractYouTubeId(urlOrId);
  if (!ytId) return null;
  return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
}

/**
 * Detects whether a URL is embeddable (Google Drive or YouTube) and returns the embed URL.
 * @param {string} url
 * @returns {{ isEmbeddable: boolean, embedUrl: string|null, type: "youtube"|"drive"|"external", externalUrl: string }}
 */
export function resolveMediaEmbed(url) {
  if (!url || typeof url !== "string") {
    return { isEmbeddable: false, embedUrl: null, type: "external", externalUrl: "" };
  }

  const trimmed = url.trim();

  // Try YouTube
  const ytEmbed = extractYouTubeEmbedUrl(trimmed);
  if (ytEmbed) {
    return {
      isEmbeddable: true,
      embedUrl: ytEmbed,
      type: "youtube",
      externalUrl: trimmed.startsWith("http") ? trimmed : `https://www.youtube.com/watch?v=${trimmed}`
    };
  }

  // Try Google Drive
  const driveEmbed = extractGoogleDriveEmbedUrl(trimmed);
  if (driveEmbed) {
    return {
      isEmbeddable: true,
      embedUrl: driveEmbed,
      type: "drive",
      externalUrl: trimmed
    };
  }

  return {
    isEmbeddable: false,
    embedUrl: null,
    type: "external",
    externalUrl: trimmed
  };
}

/**
 * Validates complete lesson form payload.
 * @param {object} data
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateLessonInput(data = {}) {
  const errors = {};

  if (!data.title || !String(data.title).trim()) {
    errors.title = "عنوان المحاضرة مطلوب.";
  } else if (String(data.title).trim().length < 3) {
    errors.title = "يجب أن يتكون عنوان المحاضرة من 3 أحرف على الأقل.";
  }

  if (!data.group || !String(data.group).trim()) {
    errors.group = "يرجى تحديد المجموعة المستهدفة للمحاضرة.";
  }

  if (data.videoUrl && String(data.videoUrl).trim()) {
    const trimmed = String(data.videoUrl).trim();
    // Allow valid URL or plain YouTube ID
    if (!isValidSafeUrl(trimmed) && !extractYouTubeId(trimmed)) {
      errors.videoUrl = "رابط الفيديو غير صالح. يرجى إدخال رابط Google Drive أو YouTube صحيح.";
    }
  }

  if (data.fileUrl && String(data.fileUrl).trim()) {
    const trimmed = String(data.fileUrl).trim();
    if (!isValidSafeUrl(trimmed)) {
      errors.fileUrl = "رابط الملف غير صالح. يرجى إدخال رابط Google Drive صحيح يبدأ بـ https://";
    }
  }

  if (Array.isArray(data.resources)) {
    data.resources.forEach((res, index) => {
      if (res.url && String(res.url).trim()) {
        if (!isValidSafeUrl(String(res.url).trim())) {
          errors[`resource_${index}_url`] = `رابط المصدر "${res.title || index + 1}" غير صالح.`;
        }
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
