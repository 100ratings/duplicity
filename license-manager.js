// Gerenciador de Licenças (Versão Desbloqueada)
class LicenseManager {
  constructor() {
    this.token = 'unlocked';
    this.deviceId = 'unlocked-device';
    this.isActivated = true;
    this.customerName = 'Usuário';
  }

  async checkActivation() {
    this.isActivated = true;
    return true;
  }

  async activate(licenseKey, force = false) {
    this.isActivated = true;
    return { success: true, message: 'Ativado com sucesso!' };
  }

  clearActivation() {
    // Não faz nada na versão desbloqueada
  }

  getCustomerName() {
    return this.customerName;
  }
}

const licenseManager = new LicenseManager();
