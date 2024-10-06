const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const busboy = require('busboy');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: event.headers });
    let fileBuffer;

    bb.on('file', (name, file, info) => {
      const chunks = [];
      file.on('data', (data) => chunks.push(data));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('finish', async () => {
      try {
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const page = await pdfDoc.getPage(0);

        const pngImage = await page.render({
          width: 2048,
          height: 2048,
        }).toBuffer();

        const optimizedImage = await sharp(pngImage)
          .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
          .png({ quality: 90, compressionLevel: 9 })
          .toBuffer();

        const imageBase64 = optimizedImage.toString('base64');

        resolve({
          statusCode: 200,
          body: JSON.stringify({ imageBase64 }),
        });
      } catch (error) {
        console.error('PDF conversion error:', error);
        reject({
          statusCode: 500,
          body: JSON.stringify({ error: 'PDF conversion failed' }),
        });
      }
    });

    bb.write(event.body);
  });
};
