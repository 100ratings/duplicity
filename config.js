// Configuração do App (Versão Desbloqueada)
const API_CONFIG = {
  BASE_URL: '',
  ENDPOINTS: {}
};

// Helpers mantidos para compatibilidade se necessário
function generateDeviceId() {
  return 'unlocked-device';
}

function getDeviceInfo() {
  return JSON.stringify({ unlocked: true });
}
