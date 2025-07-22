import { useState, useEffect } from "react";
import AdminBackButton from "@/components/AdminBackButton";

const CustomerManagement = () => {
  const [message, setMessage] = useState("Component yüklendi!");

  useEffect(() => {
    console.log("🔥🔥🔥 CUSTOMER MANAGEMENT ÇALIŞIYOR! 🔥🔥🔥");
    console.warn("🔥🔥🔥 CUSTOMER MANAGEMENT ÇALIŞIYOR! 🔥🔥🔥");
    console.error("🔥🔥🔥 CUSTOMER MANAGEMENT ÇALIŞIYOR! 🔥🔥🔥");
    
    setTimeout(() => {
      setMessage("useState de çalışıyor!");
    }, 2000);
  }, []);

  const testFunction = () => {
    alert("BUTTON ÇALIŞIYOR!");
    console.log("🔥 BUTTON CLICKED! 🔥");
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "red", color: "white", fontSize: "24px" }}>
      <AdminBackButton />
      
      <h1>🔥 CUSTOMER MANAGEMENT TEST 🔥</h1>
      <p>Mesaj: {message}</p>
      
      <button 
        onClick={testFunction}
        style={{ 
          padding: "10px 20px", 
          fontSize: "18px", 
          backgroundColor: "yellow", 
          color: "black",
          border: "2px solid black",
          cursor: "pointer"
        }}
      >
        TEST BUTONU - TIKLA!
      </button>
      
      <div style={{ marginTop: "20px" }}>
        <p>Eğer bu sayfayı görüyorsanız React çalışıyor.</p>
        <p>Console'a bakın ve butona tıklayın!</p>
      </div>
    </div>
  );
};

export default CustomerManagement;