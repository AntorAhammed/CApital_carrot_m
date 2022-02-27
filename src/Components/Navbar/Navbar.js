import React from 'react'
import  logo from "../Image/lootboxlogo.PNG"
import { BsFillAwardFill } from "react-icons/bs";
import { MdLightbulbOutline } from "react-icons/md";

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
          <div className="connect_metamsk">
            <button className="eth_mainnet_btn">SOL Mainnet</button>
            <div className="light"><MdLightbulbOutline/></div>
            <button className="connect_metamsk_btn">Connect Phantom</button>
          </div>
      </div>
    </div>
  )
}

export default Navbar