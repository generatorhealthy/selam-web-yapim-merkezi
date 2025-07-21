import React from 'react';

const OrderManagement = () => {
  // Force alert to show component loaded
  console.error("🚨 NEW SIMPLE COMPONENT LOADED! 🚨");
  
  return (
    <div style={{
      background: 'red', 
      color: 'white', 
      padding: '50px', 
      fontSize: '30px',
      textAlign: 'center',
      minHeight: '100vh'
    }}>
      <h1>🚨 YENİ SİPARİŞ YÖNETİMİ 🚨</h1>
      <p>Bu yeni sayfa!</p>
      <p>Eğer bunu görüyorsanız, component çalışıyor!</p>
      
      <div style={{marginTop: '50px'}}>
        <h2>Çöp Kutusu Sekmesi Test</h2>
        <button style={{
          background: 'white',
          color: 'red', 
          padding: '20px',
          fontSize: '20px',
          border: 'none',
          margin: '10px',
          cursor: 'pointer'
        }}>
          Siparişler
        </button>
        <button style={{
          background: 'white',
          color: 'red', 
          padding: '20px',
          fontSize: '20px',
          border: 'none',
          margin: '10px',
          cursor: 'pointer'
        }}>
          ÇÖP KUTUSU
        </button>
        <button style={{
          background: 'white',
          color: 'red', 
          padding: '20px',
          fontSize: '20px',
          border: 'none',
          margin: '10px',
          cursor: 'pointer'
        }}>
          Otomatik Siparişler
        </button>
      </div>
    </div>
  );
};

export default OrderManagement;