import React from "react";
import "./css/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login/Login";
import NotFound from "./pages/error/NotFound";
import Perform from "./pages/perform/Perform";
import Reserve from "./pages/reserve/Reserve";
import Box from "./pages/box/Box";
import Ticket from "./pages/ticket/Ticket";
import Sponsor from "./pages/sponsor/Sponsor";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<Login />}></Route>
          <Route path="/home/*" element={<Ticket />}></Route>
          <Route path="/perform/*" element={<Perform />}></Route>
          <Route path="/reserve/*" element={<Reserve />}></Route>
          <Route path="/box/*" element={<Box />}></Route>
          <Route path="/sponsor/*" element={<Sponsor />}></Route>

          {/* 상단에 위치하는 라우트들의 규칙을 모두 확인, 일치하는 라우트가 없는경우 처리 */}
          <Route path="*" element={<NotFound />}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
