/**
 * CONSUMO DE API CON FETCH (requisito de la consigna)
 *
 * Todos los fetch de datos de la app están en este archivo. Se consume DolarAPI, que no pide
 * clave y permite llamadas desde el navegador (CORS). Los datos se muestran en la barra
 * superior (TDPNavbar.vue): cotización del dólar tarjeta. Si la API falla, queda un texto fijo.
 */

const DOLAR_URL = 'https://dolarapi.com/v1/dolares';

// Si la API no responde en este tiempo, se cancela y se muestra el error.
const TIMEOUT_MS = 8000;

export interface DolarQuote {
  casa: string; // identificador: oficial, blue, tarjeta...
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

/**
 * Hace el fetch, controla el estado HTTP y convierte la respuesta a JSON.
 * fetch solo falla por problemas de red: un 404 o un 500 hay que detectarlos con response.ok.
 */
export async function fetchDolarQuotes(): Promise<DolarQuote[]> {
  const response = await fetch(DOLAR_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }
  return (await response.json()) as DolarQuote[];
}
