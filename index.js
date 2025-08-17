import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import fs from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const GEMINI_MODEL = 'gemini-2.5-flash';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function extractText(resp) {
  try {
    const text = 
      resp.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp.candidates?.[0]?.content?.parts?.[0]?.text ??
      resp.response?.candidates?.[0]?.content?.text;

    return text ?? JSON.stringify(resp, null, 2);
    
  } catch (error) {
    console.error('Error extracting text:', error);
    return JSON.stringify(resp, null, 2);
  }
}

const imageToGenerativePart = (filePath) => ({
    inlineData: {
      data: fs.readFileSync(filePath).toString('base64'),
      mimeType: 'image/png',
    },
});

const upload = multer({ dest: 'public/src/uploads/' });

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) throw new Error('Messages must be an array');
    
    const contents = messages.map(message => ({
      role: message.role,
      parts: [{ text: message.content }],    
    }));

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
    });

    res.json({
      result: extractText(result),
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/api/image', upload.single('image'), async (req, res) => {
  try {
    let { prompt } = req.body;
    if (!req.file) throw new Error('Image is required');
    const filePath = req.file.path;

    if (!prompt) prompt = 'Describe the following image';

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            imageToGenerativePart(filePath),
          ],
        },
      ],
    });

    res.json({
      result: extractText(result),
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/api/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) throw new Error('Audio is required');
    const filePath = req.file.path;
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: fs.readFileSync(filePath).toString('base64'),
                mimeType: 'audio/mpeg',
              },
            },
            { text: 'Transcribe this audio' },
          ],
        },
      ],
    });

    res.json({
      result: extractText(result),
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/api/document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) throw new Error('Document is required');
    const filePath = req.file.path;

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: fs.readFileSync(filePath).toString('base64'),
                mimeType: 'application/pdf',
              },
            },
            { text: 'Summarize this document' },
          ],
        },
      ],
    });

    res.json({
      result: extractText(result),
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});