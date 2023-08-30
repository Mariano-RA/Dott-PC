import React from "react";
import { Outlet } from "react-router-dom";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

function App() {
  // const { state } = useContext(ContextGlobal);
  return (
    <div
      className={`App`}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div style={{ marginBottom: "100px" }}>
        <Navbar />
      </div>

      <div
        className="d-flex flex-fill justify-content-center expandContainer"
        style={{ width: "80%" }}
      >
        <Outlet />
      </div>

      <Footer />
    </div>
  );
}

export default App;
