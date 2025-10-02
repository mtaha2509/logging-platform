/**
 * Sort Button Component
 * Industry standard sorting UI with clear visual feedback
 */
import { h } from 'preact';

interface SortButtonProps {
  label: string;
  currentSort: 'asc' | 'desc';
  onSortChange: (sort: 'asc' | 'desc') => void;
}

export function SortButton({ label, currentSort, onSortChange }: SortButtonProps) {
  
  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: '2px solid #000',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    transition: 'all 0.2s ease',
    userSelect: 'none' as const,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const iconContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1px',
    fontSize: '12px'
  };

  const arrowStyle = (active: boolean) => ({
    lineHeight: '1',
    fontWeight: 'bold' as const,
    color: active ? '#000' : '#ccc',
    fontSize: active ? '14px' : '12px',
    transition: 'all 0.2s ease'
  });

  const labelStyle = {
    color: '#000',
    fontSize: '14px',
    fontWeight: '600' as const,
    padding: '2px 8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '3px'
  };

  const handleClick = () => {
    onSortChange(currentSort === 'asc' ? 'desc' : 'asc');
  };

  const sortLabel = currentSort === 'desc' ? 'Newest First' : 'Oldest First';
  const tooltipText = `Currently: ${sortLabel}. Click to switch to ${currentSort === 'desc' ? 'Oldest First' : 'Newest First'}`;

  return (
    <div 
      style={containerStyle} 
      onClick={handleClick}
      title={tooltipText}
    >
      <span>{label}:</span>
      <div style={iconContainerStyle}>
        <span style={arrowStyle(currentSort === 'asc')}>▲</span>
        <span style={arrowStyle(currentSort === 'desc')}>▼</span>
      </div>
      <span style={labelStyle}>
        {sortLabel}
      </span>
    </div>
  );
}
