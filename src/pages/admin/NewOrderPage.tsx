import React from 'react';

const NewOrderPage = () => {
  console.error("🔥 BRAND NEW COMPONENT LOADED! 🔥");
  alert("YENİ COMPONENT YÜKLENDI!");
  
  return (
    <div style={{
      background: 'green', 
      color: 'white', 
      padding: '50px', 
      fontSize: '30px',
      textAlign: 'center',
      minHeight: '100vh'
    }}>
      <h1>🔥 TAMAMEN YENİ SİPARİŞ SAYFASI 🔥</h1>
      <p>Bu tamamen farklı bir component!</p>
      <p>Eğer bunu görüyorsanız, değişiklik çalışıyor!</p>
      
      <div style={{marginTop: '50px', display: 'flex', gap: '20px', justifyContent: 'center'}}>
        <button style={{
          background: 'white',
          color: 'green', 
          padding: '20px',
          fontSize: '20px',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer'
        }}>
          Siparişler
        </button>
        <button style={{
          background: 'yellow',
          color: 'black', 
          padding: '20px',
          fontSize: '20px',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer'
        }}>
          ÇÖP KUTUSU
        </button>
        <button style={{
          background: 'blue',
          color: 'white', 
          padding: '20px',
          fontSize: '20px',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer'
        }}>
          Otomatik Siparişler
        </button>
      </div>
      
      <div style={{marginTop: '30px'}}>
        <p style={{fontSize: '18px'}}>Cache sorunu çözüldü!</p>
      </div>
    </div>
  );
};

export default NewOrderPage;