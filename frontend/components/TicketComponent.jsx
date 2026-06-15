'use client';

import React from 'react';

/**
 * Renders a ticket as an HTML element that can be screenshotted
 * Designed to match the ticket.png dimensions and layout
 */
export default function TicketComponent({ 
  name = 'Test Player', 
  user_id = 'test_user',
  team = 'Brazil',
  domain = 'Coder',
  created_at = new Date().toISOString()
}) {
  // Format the date
  const dateObj = new Date(created_at);
  const issuedOn = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div 
      id="ticket-container"
      style={{
        position: 'relative',
        width: '2128px',
        height: '1177px',
        backgroundImage: 'url(/ticket.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Player Name - Top */}
      <div
        style={{
          position: 'absolute',
          left: '510px',
          top: '522px',
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#2A1E17',
          maxWidth: '600px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {name}
      </div>

      {/* User ID - Middle */}
      <div
        style={{
          position: 'absolute',
          left: '470px',
          top: '700px',
          fontSize: '38px',
          fontWeight: 'bold',
          color: '#E53935',
          maxWidth: '700px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {user_id}
      </div>

      {/* Issue Date - Bottom */}
      <div
        style={{
          position: 'absolute',
          left: '430px',
          top: '869px',
          fontSize: '30px',
          fontWeight: 'bold',
          color: '#2A1E17',
          maxWidth: '800px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {issuedOn}
      </div>
    </div>
  );
}
