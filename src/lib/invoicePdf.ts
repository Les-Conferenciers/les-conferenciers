import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/** Renders the public invoice page in a hidden iframe and returns a one-page A4 PDF as base64. */
export async function renderInvoicePdfBase64(token: string): Promise<string> {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:900px;height:1400px;border:0;";
  iframe.src = `${window.location.origin}/facture/${token}`;
  document.body.appendChild(iframe);
  try {
    const root = await new Promise<HTMLElement>((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        const el = iframe.contentDocument?.querySelector(".invoice-root") as HTMLElement | null;
        if (el && el.innerText.trim().length > 50) return setTimeout(() => resolve(el), 800);
        if (Date.now() - start > 20000) return reject(new Error("Chargement de la facture trop long"));
        setTimeout(tick, 300);
      };
      tick();
    });
    const canvas = await html2canvas(root, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    let w = pw, h = (canvas.height * pw) / canvas.width;
    if (h > ph) { w = (w * ph) / h; h = ph; }
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", (pw - w) / 2, 0, w, h, undefined, "FAST");
    const buf = new Uint8Array(pdf.output("arraybuffer"));
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(bin);
  } finally {
    iframe.remove();
  }
}
