# Project preview assets

Add matching screenshots (WebP) and animated recordings (GIF) here:

| Project | Thumbnail | Hover preview |
| --- | --- | --- |
| Terra Guard | terra-guard-thumbnail.webp | terra-guard-preview.gif |
| Project Two | project-two-thumbnail.webp | project-two-preview.gif |
| Project Three | project-three-thumbnail.webp | project-three-preview.gif |
| Project Four | project-four-thumbnail.webp | project-four-preview.gif |

Use 1920 × 1080 (16:9) thumbnails and GIF previews. Both layers fit inside a fixed 16:9 frame without stretching or cropping. Other image formats are supported: update the corresponding img src in index.html. Update data-preview to change the GIF path.

The placeholder is shown until a thumbnail is provided. A missing GIF leaves the thumbnail visible. GIFs load on first hover or keyboard focus within a card; the GIF fades in over the thumbnail in 350 ms, and leaving the card fades back to the thumbnail. Touch devices and reduced-motion users keep the static thumbnail.

Each new hover restarts the GIF from the beginning. The GIF is fetched once and reused through a fresh blob URL for each playback, without downloading it again. Serve the portfolio over HTTP (for example, Live Server) so preview fetching works.
