/**
 * Media processing utilities for SimulationInterface
 * Extracted to reduce complexity
 */

export const prepareMediaItems = (nodeData) => {
  const mediaItems = nodeData.mediaItems || [];
  const hasSingleMedia = nodeData.url || nodeData.src;

  // Si hay un solo medio, convertirlo al formato de mediaItems
  if (hasSingleMedia && mediaItems.length === 0) {
    mediaItems.push({
      type: nodeData.type || nodeData.mediaType || 'image',
      url: nodeData.url || nodeData.src,
      caption: nodeData.caption || nodeData.title,
      altText: nodeData.altText || nodeData.alt,
    });
  }

  return mediaItems;
};

export const extractMediaProperties = (item) => {
  const { type, url, src, caption, title, altText, alt } = item;
  return {
    mediaUrl: url || src,
    mediaCaption: caption || title,
    mediaAltText: altText || alt,
    mediaType: type || 'image',
  };
};
