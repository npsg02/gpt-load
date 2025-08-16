/**
 * 复制文本
 */
export async function copy(text: string): Promise<boolean> {
  // navigator.clipboard is only available in secure contexts (HTTPS) or localhost
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.error("Copy failed using navigator.clipboard:", e);
    }
  }

  // Fallback: use deprecated but more compatible execCommand
  try {
    const input = document.createElement("input");
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.value = text;
    document.body.appendChild(input);
    input.select();
    const result = document.execCommand("copy");
    document.body.removeChild(input);

    if (!result) {
      console.error("Copy failed using execCommand");
      return false;
    }
    return true;
  } catch (e) {
    console.error("Fallback copy method execution error:", e);
    return false;
  }
}
