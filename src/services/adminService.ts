import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { AdminUserSummary } from '../types';
import { SavedCloudDesign } from './designStorage';

function formatTimestampOrDate(val: any): string {
  if (!val) return 'Fecha no disponible';
  if (val instanceof Timestamp) {
    return val.toDate().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return val;
  }
  return 'Fecha no disponible';
}

import { ADMIN_UID, ADMIN_EMAILS, isUserAdmin } from '../types';

export async function fetchAllUsersForAdmin(): Promise<AdminUserSummary[]> {
  const usersMap = new Map<string, AdminUserSummary>();

  // Helper to safely upsert user into map
  const registerUser = (
    uid: string,
    email: string,
    displayName?: string,
    photoURL?: string | null,
    createdAt?: any,
    lastLoginAt?: any,
    uploadedCount = 0
  ) => {
    if (!uid) return;
    const existing = usersMap.get(uid);
    if (existing) {
      if (uploadedCount > 0) existing.uploadedFilesCount += uploadedCount;
      if (email && (!existing.email || existing.email.includes('Sin correo'))) existing.email = email;
      if (displayName && (!existing.displayName || existing.displayName.startsWith('Usuario '))) existing.displayName = displayName;
      if (photoURL && !existing.photoURL) existing.photoURL = photoURL;
      if (lastLoginAt && !existing.lastLoginAt) existing.lastLoginAt = formatTimestampOrDate(lastLoginAt);
    } else {
      usersMap.set(uid, {
        uid,
        email: email || 'Sin correo registrado',
        displayName: displayName || email?.split('@')[0] || `Usuario ${uid.slice(0, 6)}`,
        photoURL: photoURL || null,
        createdAt: formatTimestampOrDate(createdAt),
        lastLoginAt: lastLoginAt ? formatTimestampOrDate(lastLoginAt) : undefined,
        uploadedFilesCount: uploadedCount,
      });
    }
  };

  // 1. Fetch from possible Firestore user collections
  const userCollections = ['users', 'usuarios', 'profiles', 'user_profiles', 'accounts', 'clientes', 'clients'];
  for (const collName of userCollections) {
    try {
      const snap = await getDocs(collection(db, collName));
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const uid = docSnap.id || data.uid || data.userId;
        registerUser(
          uid,
          data.email,
          data.displayName || data.name,
          data.photoURL,
          data.createdAt,
          data.lastLoginAt
        );
      });
    } catch (err) {
      // Continue to next collection if one is restricted
    }
  }

  // 2. Fetch from Firestore design collections to discover creator users & count designs
  const designCollections = ['custom_designs', 'designs', 'disenos', 'pedidos', 'orders'];
  for (const collName of designCollections) {
    try {
      const designsSnap = await getDocs(collection(db, collName));
      designsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const userId = data.userId || data.uid;
        if (userId) {
          registerUser(
            userId,
            data.userEmail || data.email,
            data.userDisplayName || data.userName,
            null,
            data.createdAt,
            undefined,
            1
          );
        }
      });
    } catch (err) {
      // Continue
    }
  }

  // 3. Known System Administrator account from project config
  if (!usersMap.has(ADMIN_UID)) {
    registerUser(
      ADMIN_UID,
      'admin@MalaTinta Studio.com',
      'Administrador MalaTinta Studio',
      null,
      '10 sep 2026, 00:00',
      'Sesión verificada'
    );
  }

  // 4. Currently authenticated Firebase user (e.g. Dramzii23@gmail.com)
  if (auth.currentUser) {
    const curr = auth.currentUser;
    registerUser(
      curr.uid,
      curr.email || 'Admin',
      curr.displayName || curr.email?.split('@')[0] || 'Super Administrador',
      curr.photoURL,
      new Date().toISOString(),
      'Ahora mismo'
    );
  }

  // 5. Check LocalStorage for accounts registered on this browser instance
  try {
    const localUsersRaw = localStorage.getItem('MalaTinta Studio_known_users');
    if (localUsersRaw) {
      const localUsers = JSON.parse(localUsersRaw);
      if (Array.isArray(localUsers)) {
        localUsers.forEach((u: any) => {
          if (u && u.uid) {
            registerUser(
              u.uid,
              u.email,
              u.displayName,
              u.photoURL,
              u.createdAt,
              u.lastLoginAt || u.lastSeen,
              u.uploadedFilesCount || 0
            );
          }
        });
      }
    }
  } catch (localErr) {
    console.warn('Aviso leyendo localStorage:', localErr);
  }

  // 6. Merge backend synced active and registered accounts (persisted on disk in synced_users.json)
  try {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.users)) {
        json.users.forEach((u: any) => {
          registerUser(
            u.uid,
            u.email,
            u.displayName,
            null,
            u.createdAt,
            u.lastLoginAt,
            u.uploadedFilesCount || 0
          );
        });
      }
    }
  } catch (backendErr) {
    console.warn('Aviso consultando /api/admin/users:', backendErr);
  }

  const userList = Array.from(usersMap.values());

  // Sort users: Admins first, then by uploaded files count, then newest
  userList.sort((a, b) => {
    const aIsAdmin = isUserAdmin(a.uid, a.email, null);
    const bIsAdmin = isUserAdmin(b.uid, b.email, null);
    if (aIsAdmin && !bIsAdmin) return -1;
    if (!aIsAdmin && bIsAdmin) return 1;
    return (b.uploadedFilesCount || 0) - (a.uploadedFilesCount || 0);
  });

  return userList;
}

export async function fetchUserFilesForAdmin(userId: string): Promise<SavedCloudDesign[]> {
  const collections = ['custom_designs', 'designs', 'disenos'];
  const results: SavedCloudDesign[] = [];
  const seenIds = new Set<string>();

  for (const collName of collections) {
    try {
      const q = query(
        collection(db, collName),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      snapshot.docs.forEach((docSnap) => {
        if (!seenIds.has(docSnap.id)) {
          seenIds.add(docSnap.id);
          const data = docSnap.data();
          results.push({
            id: docSnap.id,
            name: data.name || 'Diseño de Sublimación',
            imageName: data.imageName || 'diseno_taza.png',
            dataUrl: data.dataUrl,
            fitMode: data.fitMode || 'contain',
            userId: data.userId || userId,
            dimensions: data.dimensions || { width: 2000, height: 950, sizeFormatted: 'Optimizada' },
            createdAt: formatTimestampOrDate(data.createdAt),
            updatedAt: formatTimestampOrDate(data.updatedAt),
          });
        }
      });
    } catch (err) {
      // Continue checking next collection
    }
  }

  // Check local storage for designs saved by this user
  try {
    const localDesignsRaw = localStorage.getItem('MalaTinta Studio_cloud_designs');
    if (localDesignsRaw) {
      const localDesigns = JSON.parse(localDesignsRaw);
      if (Array.isArray(localDesigns)) {
        localDesigns.forEach((d: any) => {
          if (d.userId === userId && !seenIds.has(d.id)) {
            seenIds.add(d.id);
            results.push(d);
          }
        });
      }
    }
  } catch (e) {
    // ignore
  }

  return results;
}

export async function deleteFileByAdmin(designId: string): Promise<void> {
  const docPath = `custom_designs/${designId}`;
  try {
    await deleteDoc(doc(db, 'custom_designs', designId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
