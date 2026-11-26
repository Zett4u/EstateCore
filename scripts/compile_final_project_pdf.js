/**
 * ESTATECORE FINAL PROJECT: PDF COMPILER
 *
 * Compiles documentation/final-project/EstateCore_Final_Project_Documentation.md
 * into documentation/final-project/EstateCore_Final_Project_Documentation.html
 * and documentation/final-project/EstateCore_Final_Project_Documentation.pdf
 * using marked and headless Chrome.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { marked } = require(path.join(__dirname, '../backend/node_modules/marked'));

async function buildPdf() {
  console.log('--- Generating Standalone HTML & PDF Documentation for Final Project ---');

  const baseDir = path.resolve(__dirname, '../documentation/final-project');
  const mdPath = path.join(baseDir, 'EstateCore_Final_Project_Documentation.md');
  const htmlPath = path.join(baseDir, 'EstateCore_Final_Project_Documentation.html');
  const pdfPath = path.join(baseDir, 'EstateCore_Final_Project_Documentation.pdf');

  if (!fs.existsSync(mdPath)) {
    console.error('File not found:', mdPath);
    process.exit(1);
  }

  const markdownContent = fs.readFileSync(mdPath, 'utf8');
  const parsedHtml = marked.parse(markdownContent);

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EstateCore — Final Project Technical Documentation</title>
  <style>
    @page {
      size: letter;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1e293b;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      max-width: 850px;
      margin: 0 auto;
      padding: 24px 32px;
    }
    h1 {
      font-size: 22pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      margin-top: 24px;
      margin-bottom: 16px;
      page-break-after: avoid;
    }
    h2 {
      font-size: 15pt;
      font-weight: 700;
      color: #1e3a8a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 12pt;
      font-weight: 600;
      color: #334155;
      margin-top: 16px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    p, li {
      font-size: 10pt;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #0f172a;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    code {
      font-family: Consolas, Monaco, "Courier New", monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      padding: 2px 4px;
      border-radius: 4px;
      color: #0969da;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 16px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: Consolas, Monaco, "Courier New", monospace;
      font-size: 8pt;
      line-height: 1.4;
      page-break-inside: avoid;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #2563eb;
      margin: 12px 0;
      padding: 6px 12px;
      background: #eff6ff;
      color: #1e40af;
    }
    hr {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 24px 0;
    }
    .print-bar {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: #fff;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-radius: 8px;
    }
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 0; }
      .wrapper { max-width: 100%; margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="print-bar no-print">
      <span style="font-weight: 600;">EstateCore — ITEC 116 Final Project Documentation</span>
      <button onclick="window.print()" style="background:#2563eb; color:#fff; border:none; padding:6px 14px; border-radius:4px; font-weight:600; cursor:pointer;">
        Print / Save as PDF
      </button>
    </div>
    <div class="content">
      ${parsedHtml}
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, fullHtml, 'utf8');
  console.log('Saved self-contained HTML to:', htmlPath);

  // Print to PDF using Headless Chrome
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (fs.existsSync(chromePath)) {
    const tempProfile = path.join(process.env.TEMP || 'C:\\temp', 'chrome_final_pdf_' + Date.now());
    const fileUri = 'file:///' + htmlPath.replace(/\\/g, '/');
    const cmd = `"${chromePath}" --headless=new --disable-gpu --no-sandbox --user-data-dir="${tempProfile}" --print-to-pdf="${pdfPath}" "${fileUri}"`;

    console.log('Compiling PDF with Headless Chrome...');
    try {
      execSync(cmd, { stdio: 'inherit' });
      if (fs.existsSync(pdfPath)) {
        const stats = fs.statSync(pdfPath);
        console.log(`=== SUCCESS: PDF Generated at ${pdfPath} (${(stats.size / 1024).toFixed(1)} KB) ===`);
      }
    } catch (e) {
      console.error('PDF compilation encountered warning:', e.message);
    }
  } else {
    console.warn('Chrome executable not found. HTML file is ready for browser printing.');
  }
}

buildPdf();
