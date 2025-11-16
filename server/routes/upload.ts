import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { storagePut } from '../storage';
import { randomBytes } from 'crypto';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (will compress to smaller)
  },
  fileFilter: (_req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
    return;
  },
});

router.post('/', upload.single('file'), async (req, res): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Compress and resize image using sharp
    const processedImage = await sharp(req.file.buffer)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    // Generate unique filename
    const randomSuffix = randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const fileKey = `inspections/${timestamp}-${randomSuffix}.jpg`;

    // Upload to S3
    const { url } = await storagePut(fileKey, processedImage, 'image/jpeg');

    res.json({
      url,
      fileKey,
      size: processedImage.length,
    });
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
});

export default router;
