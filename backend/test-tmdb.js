import dotenv from 'dotenv';
import { fetchPersonImageUrl } from './services/tmdbService.js';

dotenv.config();

async function rodarTeste() {
  console.log('🔍 Buscando imagem para Meryl Streep na API do TMDB...');
  const url = await fetchPersonImageUrl('Meryl Streep');
  
  if (url) {
    console.log('✅ Sucesso! URL retornada:', url);
  } else {
    console.log('❌ Não foi possível obter a URL.');
  }
}

rodarTeste();