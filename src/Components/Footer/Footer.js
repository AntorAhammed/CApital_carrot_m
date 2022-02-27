import React from 'react'
import load from '../Image/load.png'


const Footer = () => {
  return (
    <div className="container footer">
        <img src={load} alt="" />
        <div className="detail">
        <p>Try for free</p>
        <button>Open Box</button>
        </div>
    </div>
  )
}

export default Footer