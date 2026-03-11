import axios from 'axios';
import { 
  WhatsAppProvider, 
  WhatsAppMessage, 
  WhatsAppGroup, 
  ContactDetails 
} from './whatsapp.provider';

export interface EvolutionConfig {
  apiUrl: string;
  token: string;
  instanceName: string;
}

export class EvolutionProvider implements WhatsAppProvider {
  private baseUrl: string;
  private token: string;
  private instanceName: string;

  constructor(config: EvolutionConfig) {
    let url = config.apiUrl.replace(/\/$/, '');
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    this.baseUrl = url;
    this.token = config.token;
    this.instanceName = config.instanceName;
  }

  async sendMessage(to: string, text: string): Promise<any> {
    const url = `${this.baseUrl}/message/sendText/${encodeURIComponent(this.instanceName)}`;
    const response = await axios.post(
      url,
      {
        number: to,
        text: text,
        delay: 1200,
        linkPreview: false,
      },
      {
        headers: { apikey: this.token },
      }
    );
    return response.data;
  }

  async fetchMessages(chatId: string, limit: number = 50): Promise<WhatsAppMessage[]> {
    const url = `${this.baseUrl}/chat/findMessages/${encodeURIComponent(this.instanceName)}`;
    const response = await axios.post(
      url,
      {
        where: { key: { remoteJid: chatId } },
        page: 1,
        limit: limit,
        sort: "desc"
      },
      {
        headers: { apikey: this.token },
        timeout: 10000
      }
    );

    const records = response.data?.messages?.records || [];
    return records.map((m: any) => this.mapMessage(m));
  }

  async fetchAllGroups(): Promise<WhatsAppGroup[]> {
    const response = await axios.get(
      `${this.baseUrl}/group/fetchAllGroups/${encodeURIComponent(this.instanceName)}?getParticipants=false`,
      {
        headers: { apikey: this.token },
      }
    );

    const groups = (response.data || []) as any[];
    return groups.map(g => ({
      id: g.id,
      subject: g.subject,
      creation: g.creation,
      owner: g.owner
    }));
  }

  async fetchGroupsWithParticipants(): Promise<any[]> {
    const response = await axios.get(
      `${this.baseUrl}/group/fetchAllGroups/${encodeURIComponent(this.instanceName)}?getParticipants=true`,
      {
        headers: { apikey: this.token },
      }
    );

    return (response.data as any[]) || [];
  }

  async getContactDetails(jid: string): Promise<ContactDetails> {
    // Evolution does this in two calls
    const [picUrl, business] = await Promise.all([
      this.fetchProfilePictureUrl(jid),
      this.fetchBusinessProfile(jid)
    ]);

    return {
      jid,
      profilePictureUrl: picUrl ?? undefined,
      isBusiness: !!business,
      description: (business as any)?.description || undefined,
      website: (business as any)?.website || undefined,
      email: (business as any)?.email || undefined,
      // Name usually comes from pushName or chat details if we had them saved, 
      // but here we just return what we can fetch in one go
    };
  }

  async fetchAllContacts(): Promise<ContactDetails[]> {
    // Implementation for Evolution if needed
    return [];
  }

  private async fetchProfilePictureUrl(jid: string): Promise<string | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/findProfilePicture/${encodeURIComponent(this.instanceName)}`,
        { number: jid },
        { headers: { apikey: this.token } }
      );
      return response.data?.profilePictureUrl || null;
    } catch {
      return null;
    }
  }

  private async fetchBusinessProfile(jid: string): Promise<any | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/fetchBusinessProfile/${encodeURIComponent(this.instanceName)}`,
        { number: jid },
        { headers: { apikey: this.token } }
      );
      return response.data || null;
    } catch {
      return null;
    }
  }

  private mapMessage(m: any): WhatsAppMessage {
    const text = m.message?.conversation || 
                 m.message?.extendedTextMessage?.text || 
                 m.message?.imageMessage?.caption || 
                 m.message?.videoMessage?.caption || "";

    return {
      id: m.key.id,
      from: m.key.remoteJid,
      to: m.key.remoteJid, // For evolution, we often get messages in the context of a remoteJid
      text,
      timestamp: Number(m.messageTimestamp),
      pushName: m.pushName,
      isGroup: m.key.remoteJid.endsWith('@g.us'),
      participant: m.key.participant,
      type: this.inferType(m.message)
    };
  }

  private inferType(message: any): string {
    if (message?.conversation || message?.extendedTextMessage) return 'text';
    if (message?.imageMessage) return 'image';
    if (message?.videoMessage) return 'video';
    if (message?.audioMessage) return 'audio';
    if (message?.documentMessage) return 'document';
    if (message?.reactionMessage) return 'reaction';
    return 'unknown';
  }
}
