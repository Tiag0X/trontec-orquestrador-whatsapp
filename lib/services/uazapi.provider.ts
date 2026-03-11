import axios from 'axios';
import { 
  WhatsAppProvider, 
  WhatsAppMessage, 
  WhatsAppGroup, 
  ContactDetails 
} from './whatsapp.provider';

export interface UazapiConfig {
  apiUrl: string;
  token: string;
  instanceName?: string;
}

export class UazapiProvider implements WhatsAppProvider {
  private baseUrl: string;
  private token: string;

  constructor(config: UazapiConfig) {
    let url = config.apiUrl.replace(/\/$/, '');
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    this.baseUrl = url;
    this.token = config.token;
  }

  async sendMessage(to: string, text: string): Promise<any> {
    const url = `${this.baseUrl}/send/text`;
    const response = await axios.post(
      url,
      {
        number: to,
        text: text,
        linkPreview: false,
      },
      {
        headers: { token: this.token },
      }
    );
    return response.data;
  }

  async fetchMessages(chatId: string, limit: number = 100): Promise<WhatsAppMessage[]> {
    const url = `${this.baseUrl}/message/find`;
    const response = await axios.post(
      url,
      {
        chatid: chatId,
        limit: limit,
        offset: 0
      },
      {
        headers: { token: this.token },
        timeout: 10000
      }
    );

    const messages = response.data?.messages || [];
    return messages.map((m: any) => this.mapMessage(m));
  }

  async fetchAllGroups(): Promise<WhatsAppGroup[]> {
    const url = `${this.baseUrl}/group/list`;
    const response = await axios.post(url, {
      page: 1,
      pageSize: 1000,
      noParticipants: true
    }, {
      headers: { token: this.token }
    });

    const groups = (response.data?.groups || []) as any[];
    return groups.map(g => ({
      id: g.JID || g.id,
      subject: g.Name || g.Subject || g.subject || g.name,
      creation: g.GroupCreated || g.creation,
      owner: g.OwnerJID || g.owner || g.OwnerPN
    }));
  }

  async fetchGroupsWithParticipants(): Promise<any[]> {
    const url = `${this.baseUrl}/group/list`;
    const response = await axios.post(url, {
      page: 1,
      pageSize: 1000,
      noParticipants: false
    }, {
      headers: { token: this.token }
    });

    return (response.data?.groups || []) as any[];
  }

  async getContactDetails(jid: string): Promise<ContactDetails> {
    const url = `${this.baseUrl}/chat/details`;
    const response = await axios.post(
      url,
      { chatid: jid },
      { headers: { token: this.token } }
    );

    const data = response.data || {};
    
    return {
      jid,
      name: data.wa_contactName || data.name,
      pushName: data.pushName,
      profilePictureUrl: data.profilePicUrl,
      isBusiness: !!data.isBusiness,
      description: data.business_description || data.description,
      website: data.business_website || data.website,
      email: data.business_email || data.email,
    };
  }

  async fetchAllContacts(): Promise<ContactDetails[]> {
    const allContactsMap = new Map<string, ContactDetails>();

    // 1. Try GET /contacts (Full list according to user docs)
    try {
      const url = `${this.baseUrl}/contacts`;
      const response = await axios.get(url, {
        headers: { token: this.token },
        timeout: 20000
      });

      const contacts = (response.data?.contacts || response.data || []) as any[];
      contacts.forEach(c => {
        const jid = c.jid || c.JID;
        if (!jid) return;
        if (!allContactsMap.has(jid)) {
          allContactsMap.set(jid, {
            jid,
            name: c.contact_name || c.contactName || c.contact_FirstName || c.name || c.wa_name || c.wa_contactName,
            isBusiness: !!c.isBusiness,
          });
        }
      });
    } catch (error: any) {
      console.warn(`[Uazapi] Failed to fetch from /contacts (GET):`, error.response?.status || error.message);
    }

    // 2. Try Paginated Endpoint to complement
    try {
      let page = 1;
      let hasMore = true;
      const pageSize = 1000;

      while (hasMore) {
        const url = `${this.baseUrl}/contacts/list`;
        const response = await axios.post(url, {
          page,
          pageSize,
          force: false,
        }, {
          headers: { token: this.token },
          timeout: 20000
        });

        const contacts = (response.data?.contacts || response.data || []) as any[];
        if (contacts.length === 0) {
          hasMore = false;
        } else {
          contacts.forEach(c => {
            const jid = c.jid || c.JID;
            if (!jid) return;
            if (!allContactsMap.has(jid)) {
              allContactsMap.set(jid, {
                jid,
                name: c.contact_name || c.contactName || c.contact_FirstName || c.name || c.wa_name || c.wa_contactName,
                isBusiness: !!c.isBusiness,
              });
            }
          });
          
          if (contacts.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        }
        
        if (page > 50) break; // Hard limit
      }
    } catch (error: any) {
      console.warn(`[Uazapi] Failed to fetch from /contacts/list (POST):`, error.response?.status || error.message);
    }

    if (allContactsMap.size === 0) {
      throw new Error("Failed to fetch contacts from all available endpoints");
    }

    return Array.from(allContactsMap.values());
  }

  private mapMessage(m: any): WhatsAppMessage {
    const from = m.Sender || m.sender || m.from || m.key?.remoteJid || m.RemoteJid || "";
    const chatId = m.ChatId || m.chatid || m.to || m.key?.remoteJid || m.RemoteJid || "";
    const isGroup = from.endsWith('@g.us') || chatId.endsWith('@g.us') || !!m.IsGroup || !!m.isGroup;
    const type = m.MessageType || m.messageType || m.type || 'text';
    
    // Uazapi often uses "Body" or "Text" in PascalCase
    let textContent = m.Text || m.Body || m.text || m.body || m.message?.conversation || m.message?.extendedTextMessage?.text || "";

    // Refinement based on message type
    if (!textContent || textContent === "") {
        if (type === 'LocationMessage' && m.content) {
            const name = m.content.name || m.content.Name || "";
            const address = m.content.address || m.content.Address || "";
            const lat = m.content.degreesLatitude || m.content.lat || "";
            const long = m.content.degreesLongitude || m.content.long || "";
            textContent = `📍 Localização: ${name} ${address} (${lat}, ${long})`.trim();
        } else if (type === 'LiveLocationMessage' && m.content) {
            const caption = m.content.caption || m.content.Caption || "";
            const lat = m.content.degreesLatitude || "";
            const long = m.content.degreesLongitude || "";
            textContent = `📍 Localização em Tempo Real: ${caption} (${lat}, ${long})`.trim();
        } else if (type === 'ReactionMessage') {
            textContent = m.reaction || m.Text || m.text || m.content?.text || "Reação";
        } else if (m.content?.text) {
            textContent = m.content.text;
        } else if (m.content?.caption) {
            textContent = m.content.caption;
        }
    }

    return {
      id: m.MessageId || m.messageid || m.id || m.key?.id || m.ID,
      from: from,
      to: chatId,
      text: typeof textContent === 'string' ? textContent : JSON.stringify(textContent),
      timestamp: m.messageTimestamp ? (m.messageTimestamp > 1e12 ? m.messageTimestamp : m.messageTimestamp * 1000) : (m.MessageTimestamp || m.timestamp || Date.now()),
      pushName: m.SenderName || m.senderName || m.pushName || m.PushName,
      isGroup: isGroup,
      participant: m.Sender || m.sender || m.participant || m.key?.participant,
      type: type
    };
  }
}
