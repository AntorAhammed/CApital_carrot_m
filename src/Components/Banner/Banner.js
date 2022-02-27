import React from 'react'
import { AiTwotoneFire,  } from "react-icons/ai";
import { IoIosArrowDropleft } from "react-icons/io";
import BannerImg from '../Image/Rectangle 59.png'

const Banner = () => {
  return (
    <div className="container banner">
      <div className="banner_content">
        <div className="adranaline_box">
            <img src={BannerImg} alt="" />
            <div className="adranaline_box_content">
              <p>Adranaline Box <span className="new">New</span><span className="hot"><AiTwotoneFire/> Hot</span></p>
              <p className="fee">25 items | open fee : 0%</p>
              <p>5.00<sup> USDC</sup></p>
            </div>
        </div>
        <div className="go_back">
          <p><span><IoIosArrowDropleft/></span> Go Back</p>
        </div>
      </div>
    </div>
  )
}

export default Banner