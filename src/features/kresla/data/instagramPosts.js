/**
 * Instagram feed posts — swap `embedHtml` with official embed code from Instagram
 * (Post → ⋯ → Embed) when iframes are blocked in your environment.
 */

function postEntry(postId, thumbnailColor) {
  const permalink = `https://www.instagram.com/p/${postId}/`
  return {
    id: postId,
    postId,
    permalink,
    embedSrc: `${permalink}embed`,
    /** Paste Instagram oEmbed / blockquote HTML here to replace iframe */
    embedHtml: null,
    /** Fallback visual while iframe loads or if cross-origin blocks embed */
    thumbnailPlaceholder: thumbnailColor,
  }
}

export const INSTAGRAM_POSTS = [
  postEntry('DO1BrlJDRtu', '#c8e6d9'),
  postEntry('DO6MJ3qiAY2', '#d4e4f0'),
  postEntry('DO8wSnhDXb1', '#f0e6d4'),
  postEntry('DQzDk0Qjbpk', '#e8d4f0'),
  postEntry('DTMZUaICF9h', '#d4f0e8'),
]
