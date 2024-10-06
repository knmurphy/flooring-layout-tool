import React, { useState, useCallback, useEffect } from 'react';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';

function App() {
  const [pdfBackground, setPdfBackground] = useState(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  useEffect(() => {
    // Load PDF.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';
    };
    document.body.appendChild(script);
  }, []);

  const handleFileChange = async (file) => {
    if (file && window.pdfjsLib) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const pdfData = new Uint8Array(e.target.result);
        const pdf = await window.pdfjsLib.getDocument({ data: pdfData }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
        const backgroundImage = canvas.toDataURL();
        setPdfBackground(backgroundImage);
        
        if (excalidrawAPI) {
          excalidrawAPI.updateScene({
            appState: {
              viewBackgroundColor: '#ffffff',
            },
            files: [{ dataURL: backgroundImage, mimeType: 'image/png' }],
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const renderTopRightUI = useCallback(() => {
    return (
      <button onClick={() => document.getElementById('pdf-input').click()}>
        Load PDF
      </button>
    );
  }, []);

  const renderFooter = useCallback(() => {
    return (
      <button
        onClick={async () => {
          if (excalidrawAPI) {
            const blob = await exportToBlob({
              elements: excalidrawAPI.getSceneElements(),
              appState: excalidrawAPI.getAppState(),
              files: excalidrawAPI.getFiles(),
              getDimensions: () => ({ width: 1920, height: 1080 }),
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'floor-plan.png';
            link.click();
          }
        }}
      >
        Export as PNG
      </button>
    );
  }, [excalidrawAPI]);

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <input
        id="pdf-input"
        type="file"
        accept=".pdf"
        onChange={(e) => handleFileChange(e.target.files[0])}
        style={{ display: 'none' }}
      />
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={{
          appState: { viewBackgroundColor: '#ffffff' },
          files: pdfBackground ? [{ dataURL: pdfBackground, mimeType: 'image/png' }] : [],
        }}
        UIOptions={{
          canvasActions: {
            export: false,
            loadScene: false,
            saveAsImage: false,
            saveToActiveFile: false,
          },
        }}
        renderTopRightUI={renderTopRightUI}
        renderFooter={renderFooter}
      />
    </div>
  );
}

export default App;
