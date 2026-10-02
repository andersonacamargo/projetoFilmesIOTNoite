import dotenv from 'dotenv';
dotenv.config();

export async function fetchPersonImageUrl(personName) {
  const apiKey = process.env.TMDB_API_KEY;
  const baseUrl = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500';

  if (!apiKey) {
    console.error("TMDB_API_KEY não configurada no .env");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(personName)}&language=pt-BR`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0 && data.results[0].profile_path) {
      return `${baseUrl}${data.results[0].profile_path}`;
    }
    return null;
  } catch (error) {
    console.error("Erro ao consultar a API do TMDB:", error.message);
    return null;
  }
}