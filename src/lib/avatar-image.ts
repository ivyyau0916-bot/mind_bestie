export const AVATAR_MAX_EDGE_PX = 512;
export const AVATAR_JPEG_QUALITY = 0.82;

export type PreparedAvatarImage = {
  blob: Blob;
  contentType: "image/jpeg";
  extension: "jpg";
};

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("無法讀取圖片"));
    };
    img.src = url;
  });
}

/** Resize & compress profile photos in-browser before upload. */
export async function prepareAvatarImageForUpload(file: File): Promise<PreparedAvatarImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("請選擇圖片檔案（JPG、PNG 等）。");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("圖片太大，請選擇小於 12MB 的檔案。");
  }

  const img = await loadImageFromFile(file);
  const scale = Math.min(1, AVATAR_MAX_EDGE_PX / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法處理圖片");
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("圖片壓縮失敗"))),
      "image/jpeg",
      AVATAR_JPEG_QUALITY,
    );
  });

  return { blob, contentType: "image/jpeg", extension: "jpg" };
}
