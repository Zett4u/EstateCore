import React from 'react';
import { Badge } from './ui/Badge';

interface StatusBadgeProps {
  status: string;
  type?: 'property' | 'inquiry' | 'appointment' | 'role' | 'boolean';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  const getVariant = (): 'default' | 'forest' | 'amber' | 'blue' | 'stone' | 'danger' => {
    switch (status) {
      case 'AVAILABLE':
      case 'CONFIRMED':
      case 'QUALIFIED':
      case 'true':
      case 'Active':
        return 'forest';
      case 'PENDING':
        return 'amber';
      case 'RESERVED':
      case 'CONTACTED':
        return 'blue';
      case 'COMPLETED':
      case 'CLOSED':
      case 'SOLD':
      case 'RENTED':
        return 'stone';
      case 'CANCELLED':
      case 'false':
      case 'Inactive':
        return 'danger';
      case 'ADMIN':
        return 'amber';
      case 'AGENT':
        return 'forest';
      case 'CLIENT':
        return 'stone';
      default:
        return 'default';
    }
  };

  const displayText = status === 'true' ? 'Active' : status === 'false' ? 'Inactive' : status;

  return (
    <Badge variant={getVariant()}>
      {displayText}
    </Badge>
  );
};
