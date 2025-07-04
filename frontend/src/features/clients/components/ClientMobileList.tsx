import { memo } from "react";
import { ClientMobileCard } from "./ClientMobileCard";
import type { Client } from "@/shared/types/Client";

interface ClientMobileListProps {
  clients: Client[];
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

/**
 * Lista de tarjetas de clientes para dispositivos móviles
 * Memoizada para optimizar performance
 */
export const ClientMobileList = memo<ClientMobileListProps>(({ clients, onEdit, onDelete }) => {
  return (
    <div className="md:hidden space-y-4">
      {clients.map((client) => (
        <ClientMobileCard 
          key={client.id} 
          client={client} 
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});

ClientMobileList.displayName = "ClientMobileList";
