import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { UploadedImage, FitMode } from '../types';

export interface SavedCloudDesign {
  id: string;
  name: string;
  imageName: string;
  dataUrl: string;
  fitMode: FitMode;
  userId: string;
  dimensions: {
    width: number;
    height: number;
    sizeFormatted: string;
  };
  createdAt?: string | Timestamp;
  updatedAt?: string | Timestamp;
}

/**
 * Compresses and scales an image base64 data URL to ensure the Firestore document
 * stays strictly below Firestore's 1,048,576 bytes limit (target < 600 KB).
 */
export async function compressImageForStorage(dataUrl: string, maxCharLength = 600000): Promise<string> {
  // If already under ~450 KB, it easily fits with metadata inside 1MB document
  if (dataUrl.length <= 450000) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Target max dimension 1600px (standard sublimation canvas preview)
          const MAX_DIM = 1600;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Fill white background for transparent PNG converted to JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Progressive compression
          let quality = 0.82;
          let compressedUrl = canvas.toDataURL('image/jpeg', quality);

          while (compressedUrl.length > maxCharLength && quality > 0.35) {
            quality -= 0.12;
            compressedUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // If still over limit, downsample canvas resolution
          if (compressedUrl.length > maxCharLength) {
            const smallerCanvas = document.createElement('canvas');
            smallerCanvas.width = Math.round(canvas.width * 0.75);
            smallerCanvas.height = Math.round(canvas.height * 0.75);
            const smallerCtx = smallerCanvas.getContext('2d');
            if (smallerCtx) {
              smallerCtx.fillStyle = '#ffffff';
              smallerCtx.fillRect(0, 0, smallerCanvas.width, smallerCanvas.height);
              smallerCtx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
              compressedUrl = smallerCanvas.toDataURL('image/jpeg', 0.65);
            }
          }

          resolve(compressedUrl);
        } catch (e) {
          console.warn('Error compressing image, falling back to original:', e);
          resolve(dataUrl);
        }
      };

      img.onerror = (e) => {
        console.warn('Could not load image for compression:', e);
        resolve(dataUrl);
      };

      img.src = dataUrl;
    } catch (e) {
      console.warn('Canvas compression error:', e);
      resolve(dataUrl);
    }
  });
}

export const saveDesignToCloud = async (
  designName: string,
  image: UploadedImage,
  fitMode: FitMode
): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Debes iniciar sesión para guardar diseños en la nube.');
  }

  const collectionPath = 'custom_designs';
  try {
    // Ensure image fits within Firestore's 1MB document limit
    const optimizedDataUrl = await compressImageForStorage(image.dataUrl, 600000);

    const docRef = await addDoc(collection(db, collectionPath), {
      name: designName.trim() || `Taza - ${image.name}`,
      imageName: image.name,
      dataUrl: optimizedDataUrl,
      fitMode,
      userId: currentUser.uid,
      dimensions: {
        width: image.width,
        height: image.height,
        sizeFormatted: image.sizeFormatted,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
  }
};

export const fetchUserDesigns = async (userId: string): Promise<SavedCloudDesign[]> => {
  const collectionPath = 'custom_designs';
  try {
    const q = query(
      collection(db, collectionPath),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const designs: SavedCloudDesign[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        imageName: data.imageName,
        dataUrl: data.dataUrl,
        fitMode: data.fitMode,
        userId: data.userId,
        dimensions: data.dimensions,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    return designs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
};

export const deleteCloudDesign = async (designId: string): Promise<void> => {
  const docPath = `custom_designs/${designId}`;
  try {
    await deleteDoc(doc(db, 'custom_designs', designId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
};
