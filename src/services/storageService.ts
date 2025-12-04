import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Converte uma imagem base64 em Blob
 */
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Upload de foto de perfil do usuário
 * @param userId - ID do usuário
 * @param imageBase64 - Imagem em formato base64
 * @returns URL pública da imagem no Firebase Storage
 */
export async function uploadProfilePhoto(userId: string, imageBase64: string): Promise<string> {
  try {
    // Converter base64 para Blob
    const blob = base64ToBlob(imageBase64);

    // Criar referência única para a imagem
    const timestamp = Date.now();
    const storageRef = ref(storage, `users/${userId}/profile/avatar_${timestamp}.jpg`);

    // Upload da imagem
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });

    // Obter URL pública
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('✅ Upload de foto de perfil concluído:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Erro ao fazer upload da foto de perfil:', error);
    throw new Error('Falha ao fazer upload da foto de perfil');
  }
}

/**
 * Upload de foto de capa do usuário
 * @param userId - ID do usuário
 * @param imageBase64 - Imagem em formato base64
 * @returns URL pública da imagem no Firebase Storage
 */
export async function uploadCoverPhoto(userId: string, imageBase64: string): Promise<string> {
  try {
    // Converter base64 para Blob
    const blob = base64ToBlob(imageBase64);

    // Criar referência única para a imagem
    const timestamp = Date.now();
    const storageRef = ref(storage, `users/${userId}/profile/cover_${timestamp}.jpg`);

    // Upload da imagem
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });

    // Obter URL pública
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('✅ Upload de foto de capa concluído:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Erro ao fazer upload da foto de capa:', error);
    throw new Error('Falha ao fazer upload da foto de capa');
  }
}

/**
 * Deleta uma imagem do Storage (usado ao atualizar foto)
 * @param imageUrl - URL completa da imagem no Firebase Storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extrair o caminho da imagem da URL
    const urlObj = new URL(imageUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)\?/);

    if (!pathMatch) {
      throw new Error('URL de imagem inválida');
    }

    const imagePath = decodeURIComponent(pathMatch[1]);
    const imageRef = ref(storage, imagePath);

    await deleteObject(imageRef);
    console.log('✅ Imagem deletada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao deletar imagem:', error);
    // Não lançar erro pois a imagem pode já ter sido deletada
  }
}
