import { Settings } from "@prisma/client";
import { WhatsAppProvider } from "./whatsapp.provider";
import { EvolutionProvider } from "./evolution.provider";
import { UazapiProvider } from "./uazapi.provider";

export class WhatsAppFactory {
  static getProvider(settings: Settings): WhatsAppProvider {
    const providerType = settings.whatsappProvider || 'EVOLUTION';

    switch (providerType.toUpperCase()) {
      case 'UAZAPI':
        return new UazapiProvider({
          apiUrl: settings.whatsappApiUrl,
          token: settings.whatsappToken,
          instanceName: settings.whatsappInstanceName
        });
      case 'EVOLUTION':
      default:
        // Se as novas configurações estiverem vazias, usa as legadas
        const apiUrl = settings.whatsappApiUrl || settings.evolutionApiUrl;
        const token = settings.whatsappToken || settings.evolutionToken;
        const instanceName = settings.whatsappInstanceName || settings.evolutionInstanceName;

        return new EvolutionProvider({
          apiUrl,
          token,
          instanceName
        });
    }
  }
}
