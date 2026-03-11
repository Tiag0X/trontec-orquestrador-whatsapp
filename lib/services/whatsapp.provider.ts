export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  text?: string;
  timestamp: number;
  pushName?: string;
  isGroup: boolean;
  participant?: string;
  type: string;
}

export interface WhatsAppGroup {
  id: string; // JID
  subject: string;
  creation?: number;
  owner?: string;
  size?: number;
}

export interface ContactDetails {
  jid: string;
  name?: string;
  pushName?: string;
  profilePictureUrl?: string;
  isBusiness: boolean;
  description?: string;
  website?: string;
  email?: string;
}

export interface WhatsAppProvider {
  /**
   * Envia uma mensagem de texto simples
   */
  sendMessage(to: string, text: string): Promise<any>;

  /**
   * Busca mensagens recentes de um chat/grupo
   */
  fetchMessages(chatId: string, limit?: number): Promise<WhatsAppMessage[]>;

  /**
   * Lista todos os grupos disponíveis
   */
  fetchAllGroups(): Promise<WhatsAppGroup[]>;

  /**
   * Lista grupos incluindo a lista de participantes
   */
  fetchGroupsWithParticipants(): Promise<any[]>;

  /**
   * Obtém detalhes de um contato (foto, bio, nome, etc)
   */
  getContactDetails(jid: string): Promise<ContactDetails>;

  /**
   * Lista todos os contatos do WhatsApp
   */
  fetchAllContacts(): Promise<ContactDetails[]>;
}
