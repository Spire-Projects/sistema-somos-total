export const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'default';
    case 'cashier':
      return 'secondary';
    default:
      return 'outline';
  }
};

export const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'cashier':
      return 'Caja';
    default:
      return role;
  }
};
  