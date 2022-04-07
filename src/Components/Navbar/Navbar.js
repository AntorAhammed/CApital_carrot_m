import React from 'react'
import logo from "../Image/lootboxlogo.PNG"
import { BsFillAwardFill } from "react-icons/bs";
import { MdLightbulbOutline } from "react-icons/md";
import { useEffect, useState } from "react";
import ConnectToPhantom from "./ConnectToPhantom";
import { WalletConnect } from './wallet'

const Navbar = () => {

  return (
    <div className="navbar">
      <div className="container nav">
        <div className="logo">
          <img src={logo} alt="" />
          <div className="menu">
            <li><a href="#">Provabily Fair</a></li>
            <li><a href="#">Boxes</a></li>
            {/* <li><a href="#"><BsFillAwardFill/>Award winning platform</a></li> */}
          </div>
        </div>

        <div className="connect_metamsk11">
          {/* <div className="light"><MdLightbulbOutline /></div> */}
          <WalletConnect />
        </div>
      </div>
    </div>
  )
}

export default Navbar