'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ContractSigningContextType {
  legalName: string;
  setLegalName: (name: string) => void;
  signatureDataUrl: string;
  setSignatureDataUrl: (url: string) => void;
  orgName: string;
  setOrgName: (name: string) => void;
}

const ContractSigningContext = createContext<ContractSigningContextType | null>(null);

export function ContractSigningProvider({ children }: { children: ReactNode }) {
  const [legalName, setLegalName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [orgName, setOrgName] = useState('Service Provider');

  return (
    <ContractSigningContext.Provider value={{
      legalName,
      setLegalName,
      signatureDataUrl,
      setSignatureDataUrl,
      orgName,
      setOrgName,
    }}>
      {children}
    </ContractSigningContext.Provider>
  );
}

export function useContractSigning() {
  const context = useContext(ContractSigningContext);
  if (!context) {
    throw new Error('useContractSigning must be used within ContractSigningProvider');
  }
  return context;
}
