// Helper function to download a file
function downloadFile(blob, fileName) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}

// Merge PDFs
document.getElementById("merge-btn").addEventListener("click", async () => {
    const input = document.getElementById("merge-input");
    if (input.files.length < 2) {
        alert("Please select at least two PDF files.");
        return;
    }

    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();

    for (const file of input.files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
    downloadFile(blob, "merged.pdf");
});

// Split PDF
document.getElementById("split-btn").addEventListener("click", async () => {
    const file = document.getElementById("split-input").files[0];
    if (!file) {
        alert("Please select a PDF file.");
        return;
    }

    const { PDFDocument } = PDFLib;
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const pages = pdf.getPages();

    for (let i = 0; i < pages.length; i++) {
        const pdfPart = await PDFDocument.create();
        const [page] = await pdfPart.copyPages(pdf, [i]);
        pdfPart.addPage(page);
        const pdfBytes = await pdfPart.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        downloadFile(blob, `split_page_${i + 1}.pdf`);
    }
});

// Convert PDF to Images
document.getElementById("pdf-to-images-btn").addEventListener("click", async () => {
    const file = document.getElementById("pdf-to-images-input").files[0];
    if (!file) {
        alert("Please select a PDF file.");
        return;
    }

    const pdfjsLib = window["pdfjs-dist/build/pdf"];
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js";

    const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
    const outputDiv = document.getElementById("pdf-to-images-output");
    outputDiv.innerHTML = ""; // Clear previous output

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
        outputDiv.appendChild(canvas);

        canvas.toBlob(
            (blob) => {
                downloadFile(blob, `page_${i}.png`);
            },
            "image/png"
        );
    }
});

// Add Watermark
document.getElementById("watermark-btn").addEventListener("click", async () => {
    const file = document.getElementById("watermark-input").files[0];
    const text = document.getElementById("watermark-text").value;
    const angle = parseInt(document.getElementById("watermark-angle").value);

    if (!file || !text || isNaN(angle)) {
        alert("Please select a PDF file, enter watermark text, and specify a valid angle.");
        return;
    }

    const { PDFDocument, rgb, degrees } = PDFLib;
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const pages = pdf.getPages();

    pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(text, {
            x: width / 4,
            y: height / 4,
            size: 150,
            color: rgb(0.5, 0.5, 0.5),
            opacity: 0.3,
            rotate: degrees(angle),
        });
    });

    const watermarkedPdfBytes = await pdf.save();
    const blob = new Blob([watermarkedPdfBytes], { type: "application/pdf" });
    downloadFile(blob, "watermarked.pdf");
});


// Compress PDF
document.getElementById("compress-btn").addEventListener("click", async () => {
    const file = document.getElementById("compress-input").files[0];
    if (!file) {
        alert("Please select a PDF file.");
        return;
    }

    const { PDFDocument } = PDFLib;
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const pages = pdf.getPages();

    for (const page of pages) {
        const { width, height } = page.getSize();
        page.setSize(width * 0.75, height * 0.75); // Compress by resizing
    }

    const compressedPdfBytes = await pdf.save();
    const blob = new Blob([compressedPdfBytes], { type: "application/pdf" });
    downloadFile(blob, "compressed.pdf");
});

// Unlock PDF (Remove Permissions)
// document.getElementById("unlock-btn").addEventListener("click", async () => {
//     const file = document.getElementById("unlock-input").files[0];
//     if (!file) {
//         alert("Please select a PDF file.");
//         return;
//     }

//     const { PDFDocument } = PDFLib;
//     const pdf = await PDFDocument.load(await file.arrayBuffer());
//     const unlockedPdfBytes = await pdf.save();
//     const blob = new Blob([unlockedPdfBytes], { type: "application/pdf" });
//     downloadFile(blob, "unlocked.pdf");
// });

// Rotate PDF Pages
document.getElementById("rotate-btn").addEventListener("click", async () => {
    const file = document.getElementById("rotate-input").files[0];
    const degree = parseInt(document.getElementById("rotate-degree").value);

    if (!file || isNaN(degree) || degree % 90 !== 0) {
        alert("Please select a PDF file and enter a valid degree (multiples of 90).");
        return;
    }

    const { PDFDocument, degrees } = PDFLib;
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const pages = pdf.getPages();

    pages.forEach((page) => {
        page.setRotation(degrees(degree));
    });

    const rotatedPdfBytes = await pdf.save();
    const blob = new Blob([rotatedPdfBytes], { type: "application/pdf" });
    downloadFile(blob, "rotated.pdf");
});

// Rearrange PDF Pages
document.getElementById("rearrange-btn").addEventListener("click", async () => {
    const file = document.getElementById("rearrange-input").files[0];
    const order = document
        .getElementById("rearrange-order")
        .value.split(",")
        .map(Number);

    if (!file || order.length === 0) {
        alert("Please select a PDF file and enter a valid order.");
        return;
    }

    const { PDFDocument } = PDFLib;
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const newPdf = await PDFDocument.create();

    for (const index of order) {
        const [page] = await newPdf.copyPages(pdf, [index - 1]);
        newPdf.addPage(page);
    }

    const rearrangedPdfBytes = await newPdf.save();
    const blob = new Blob([rearrangedPdfBytes], { type: "application/pdf" });
    downloadFile(blob, "rearranged.pdf");
});

// Add Page Numbers
document.getElementById("page-numbers-btn").addEventListener("click", async () => {
    const file = document.getElementById("page-numbers-input").files[0];
    const position = document.getElementById("page-number-position").value;

    if (!file) {
        alert("Please select a PDF file.");
        return;
    }

    const { PDFDocument, rgb } = PDFLib;
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const pages = pdf.getPages();

    pages.forEach((page, idx) => {
        const { width, height } = page.getSize();
        let x, y;
        switch (position) {
            case "bottom-middle":
                x = width / 2 - 10;
                y = 20;
                break;
            case "bottom-right":
                x = width - 50;
                y = 20;
                break;
            case "top-right":
                x = width - 50;
                y = height - 30;
                break;
            default:
                x = width / 2;
                y = 20;
        }
        page.drawText(`${idx + 1}.`, {
            x,
            y,
            size: 12,
            color: rgb(0, 0, 0),
        });
    });

    const numberedPdfBytes = await pdf.save();
    const blob = new Blob([numberedPdfBytes], { type: "application/pdf" });
    downloadFile(blob, "page_numbers.pdf");
});

// Flatten PDF
document.getElementById("flatten-btn").addEventListener("click", async () => {
    const file = document.getElementById("flatten-input").files[0];
    if (!file) {
        alert("Please select a PDF file.");
        return;
    }

    const { PDFDocument } = PDFLib;
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const flattenedPdfBytes = await pdf.save({ useObjectStreams: false });
    const blob = new Blob([flattenedPdfBytes], { type: "application/pdf" });
    downloadFile(blob, "flattened.pdf");
});

// Images to PDF
document.getElementById("image-to-pdf-btn").addEventListener("click", async () => {
    const files = document.getElementById("image-to-pdf-input").files;
    if (files.length === 0) {
        alert("Please select image files.");
        return;
    }

    const { PDFDocument } = PDFLib;
    const pdf = await PDFDocument.create();

    for (const file of files) {
        const imgBytes = await file.arrayBuffer();
        const imgExt = file.type.split("/")[1];
        const embedImg =
            imgExt === "jpeg" || imgExt === "jpg"
                ? await pdf.embedJpg(imgBytes)
                : await pdf.embedPng(imgBytes);

        const page = pdf.addPage([embedImg.width, embedImg.height]);
        page.drawImage(embedImg, { x: 0, y: 0, width: embedImg.width, height: embedImg.height });
    }

    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    downloadFile(blob, "images_to_pdf.pdf");
});
// Remove Pages
document.getElementById("remove-pages-btn").addEventListener("click", async () => {
    const file = document.getElementById("remove-pages-input").files[0];
    const pagesToRemove = document.getElementById("remove-pages-list").value
        .split(",")
        .map((p) => parseInt(p.trim()) - 1);

    if (!file || pagesToRemove.some(isNaN)) {
        alert("Please select a PDF file and specify valid page numbers.");
        return;
    }

    const { PDFDocument } = PDFLib;
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    const newPdf = await PDFDocument.create();
    const totalPages = pdf.getPageCount();

    for (let i = 0; i < totalPages; i++) {
        if (!pagesToRemove.includes(i)) {
            const [page] = await newPdf.copyPages(pdf, [i]);
            newPdf.addPage(page);
        }
    }

    const updatedPdfBytes = await newPdf.save();
    const blob = new Blob([updatedPdfBytes], { type: "application/pdf" });
    downloadFile(blob, "removed_pages.pdf");
});



//for qr code
// Handle QR code scanning
// document.addEventListener("DOMContentLoaded", () => {
//     const qrInput = document.getElementById("qrInput");
//     const qrCanvas = document.getElementById("qrCanvas");
//     const qrContent = document.getElementById("qrContent");
//     const preview = document.getElementById("preview");

//     qrInput.addEventListener("change", async (event) => {
//         const file = event.target.files[0];
//         if (file) {
//             const reader = new FileReader();

//             reader.onload = (e) => {
//                 preview.src = e.target.result; // Show preview of the image

//                 const img = new Image();
//                 img.src = e.target.result;

//                 img.onload = () => {
//                     const canvas = qrCanvas;
//                     const ctx = canvas.getContext("2d");
//                     canvas.width = img.width;
//                     canvas.height = img.height;
//                     ctx.drawImage(img, 0, 0);

//                     const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//                     const code = jsQR(imageData.data, canvas.width, canvas.height);

//                     if (code) {
//                         qrContent.value = code.data; // Output QR code content
//                     } else {
//                         qrContent.value = "No QR code detected.";
//                     }
//                 };
//             };

//             reader.readAsDataURL(file);
//         }
//     });
// });