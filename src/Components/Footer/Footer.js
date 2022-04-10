import React from 'react'
import load from '../Image/load.png'
// import { useWallet } from "@solana/wallet-adapter-react";
import { spinWheel } from "../../contexts/helpers";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";


const Footer = (props) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const OnClickSpin = async () => {
    // const wallet = window["curWallet"];
    const res = spinWheel(wallet, connection);
    // props.onEndSpin(res);
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