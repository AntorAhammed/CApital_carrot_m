
import React, { useEffect } from 'react'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import SliderData from "./SliderData"
import SliderJS from "react-slick";

const Slider = (props) => {
  const config = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: '20px',
    responsive: [
      {
        breakpoint: 1400,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 3,
          infinite: true,
          dots: false
        }
      },
      {
        breakpoint: 1000,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
          initialSlide: 2
        }
      },
      {
        breakpoint: 680,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  let slider;

  // useEffect(() => {

  //   this.slider.slickGoTo(props.jumpItem);

  // }, [props.jumpItem]);

  return (
    <div className="container" style={{marginTop: "50px"}}>
        <SliderJS {...config}>
          {
            SliderData.map((val, ind)=>{
              return (
                <div className="slider"  key={ind}>
                  <img className='slider_bg' src={val.backgroundImage} alt="" />
                       <div className="slider_box_content">
                          <div className="percent_and_desc_box">
                              <div className="percent">{val.percent}</div>
                              <div className="desc">{val.desc}</div>
                          </div>
                          <img className="slider_img" src={val.imgae} alt="" />
                          <div className="price">
                            <p>{val.price}<sup>USDC</sup></p>
                          </div>  
                       </div>
                </div>
              )
            })
          }
        </SliderJS>
    </div>
  )
}

export default Slider