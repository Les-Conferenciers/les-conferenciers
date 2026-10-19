import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const A4_PX = 794; // largeur A4 à 96 dpi

export const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

/**
 * Rend un élément en PDF A4 avec une mise en page "bureau" fixe, quel que soit l'appareil :
 * l'élément est cloné dans un conteneur hors écran de 794 px, puis découpé en pages
 * sur les limites des blocs [data-pdf-block] pour éviter de couper un paragraphe.
 */
export async function renderElementToPdfBase64(element: HTMLElement): Promise<string> {
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${A4_PX}px;background:#fff;z-index:-1;`;
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${A4_PX}px`;
  clone.style.maxWidth = "none";
  clone.style.borderRadius = "0";
  clone.style.boxShadow = "none";
  clone.style.border = "none";
  clone.querySelectorAll("details").forEach((d) => ((d as HTMLDetailsElement).open = true));
  clone.querySelectorAll("[data-pdf-hide]").forEach((n) => n.remove());
  host.appendChild(clone);
  document.body.appendChild(host);
  try {
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)));
    const scale = 2;
    const canvas = await html2canvas(clone, { scale, useCORS: true, backgroundColor: "#ffffff", logging: false, width: A4_PX, windowWidth: A4_PX });

    // Points de coupure possibles (en px CSS, relatifs au clone)
    const baseTop = clone.getBoundingClientRect().top;
    const breaks = Array.from(clone.querySelectorAll<HTMLElement>("[data-pdf-block], p, li, h1, h2, h3, tr"))
      .map((el) => el.getBoundingClientRect().bottom - baseTop)
      .filter((y) => y > 0)
      .sort((a, b) => a - b);

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWmm = pageW - margin * 2;
    const pxPerMm = A4_PX / contentWmm; // px CSS par mm
    const pageContentPx = (pageH - margin * 2) * pxPerMm;
    const totalPx = canvas.height / scale;

    let start = 0;
    let first = true;
    while (start < totalPx - 1) {
      let end = Math.min(start + pageContentPx, totalPx);
      if (end < totalPx) {
        const candidates = breaks.filter((y) => y > start + pageContentPx * 0.5 && y <= end);
        if (candidates.length) end = candidates[candidates.length - 1];
      }
      const sliceH = Math.ceil((end - start) * scale);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceH;
      slice.getContext("2d")!.drawImage(canvas, 0, Math.floor(start * scale), canvas.width, sliceH, 0, 0, canvas.width, sliceH);
      if (!first) pdf.addPage();
      pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, contentWmm, (end - start) / pxPerMm, undefined, "FAST");
      first = false;
      start = end;
    }
    return arrayBufferToBase64(pdf.output("arraybuffer"));
  } finally {
    host.remove();
  }
}
