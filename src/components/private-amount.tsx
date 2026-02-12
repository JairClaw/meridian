'use client';

import { usePrivacy } from '@/components/privacy-provider';

interface PrivateAmountProps {
  children: React.ReactNode;
  className?: string;
}

export function PrivateAmount({ children, className }: PrivateAmountProps) {
  const { hideValues } = usePrivacy();
  
  if (hideValues) {
    return <span className={className}>*****</span>;
  }
  
  return <span className={className}>{children}</span>;
}
