'use client';

interface ChatHeaderProps {
  clientName: string;
  clientEmail?: string;
  clientImageUrl?: string;
  isClientView?: boolean;
  adminName?: string;
  adminEmail?: string;
}

export default function ChatHeader({
  clientName,
  clientEmail,
  clientImageUrl,
  isClientView = false,
  adminName,
  adminEmail,
}: ChatHeaderProps) {
  const displayName = isClientView ? (adminName || adminEmail || 'Admin') : clientName;
  const displayEmail = isClientView ? adminEmail : clientEmail;
  const displayImageUrl = isClientView ? undefined : clientImageUrl;
  
  // Truncate email if too long
  const truncatedEmail = displayEmail && displayEmail.length > 25 
    ? `${displayEmail.substring(0, 22)}...` 
    : displayEmail;

  // Render avatar
  const renderAvatar = () => {
    if (displayImageUrl) {
      return (
        <img
          src={displayImageUrl}
          alt={displayName}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    const fallbackChar = displayName?.[0]?.toUpperCase() || 'C';
    return (
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.92)'
        }}
      >
        {fallbackChar}
      </div>
    );
  };

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-light mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>
        Messages
      </h1>
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>
          Communication with: <span style={{ color: 'rgba(255,255,255,0.92)' }}>{displayName}</span>
        </p>
        <div className="flex items-center gap-3">
          {/* Email chip */}
          {displayEmail && (
            <span 
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ 
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.62)'
              }}
            >
              {truncatedEmail}
            </span>
          )}
          
          {/* Profile picture */}
          {renderAvatar()}
        </div>
      </div>
    </div>
  );
}

