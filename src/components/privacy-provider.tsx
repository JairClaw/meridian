'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PrivacyContextType {
  hideValues: boolean;
  toggleHideValues: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hideValues, setHideValues] = useState(false);

  const toggleHideValues = () => setHideValues(!hideValues);

  return (
    <PrivacyContext.Provider value={{ hideValues, toggleHideValues }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}

// Helper component to mask values
export function PrivateValue({ children, className }: { children: ReactNode; className?: string }) {
  const { hideValues } = usePrivacy();
  
  if (hideValues) {
    return <span className={className}>••••••</span>;
  }
  
  return <>{children}</>;
}
