import React, { useState } from 'react';
import { Excalidraw, Footer } from "@excalidraw/excalidraw";

function App() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file && excalidrawAPI) {
      try {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await fetch('/.netlify/functions/pdf-to-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('PDF conversion failed');
        }

        const { imageBase64 } = await response.json();

        const imageFile = new File(
          [Buffer.from(imageBase64, 'base64')],
          "pdf-background.png",
          { type: "image/png" }
        );

        excalidrawAPI.addFiles([imageFile]);
      } catch (error) {
        console.error("Error converting PDF:", error);
      }
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
      >
        <Footer>
          <label 
            htmlFor="pdf-upload" 
            style={{ 
              cursor: 'pointer', 
              background: '#6965db', 
              color: 'white', 
              padding: '0.5rem', 
              borderRadius: '0.3rem',
              fontWeight: 'bold'
            }}
          >
            Load PDF
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </Footer>
      </Excalidraw>
    </div>
  );
}

export default App;
