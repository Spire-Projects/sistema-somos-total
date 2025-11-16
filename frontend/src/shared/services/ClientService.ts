import type { Client, ClientFilter, CreateClientData, UpdateClientData } from '../types/Client';
import { getClientRepository } from '../db/repositories/client.repository';
import { BaseService } from './BaseService';

class ClientService extends BaseService<
  Client,
  Client,
  CreateClientData,
  UpdateClientData,
  ClientFilter
>  {
  constructor() {
    super(getClientRepository());
  }

  protected async toView(entity: Client): Promise<Client> {
    return entity;
  }
}

export const clientService = new ClientService();