import React from 'react'
import load from '../Image/load.png'
// import { useWallet } from "@solana/wallet-adapter-react";
import { spinWheel } from "../../contexts/helpers";


const Footer = () => {
  const OnClickSpin = async () => {
    const wallet = window["curWallet"];
    spinWheel(wallet);
  }

  return (
    <div className="container footer">
      <img src={load} alt="" />
      <div className="detail">
        <p>Try for free</p>
        <button onClick={OnClickSpin}>Open Box</button>
      </div>
    </div>
  )
}

export default Footer