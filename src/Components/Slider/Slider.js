import React, { useEffect, useRef, useState } from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import SliderData from "./SliderData";
import SliderJS from "react-slick";
import { GetIndex, ReturnRepeatedData } from "../../utils/Util";
import { spinWheel, getItemInfos } from "../../contexts/helpers";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AiOutlineConsoleSql } from "react-icons/ai";

import Modal from "react-modal";
import { setTokenSourceMapRange } from "typescript";
import Loader from "../Loader/Loader";

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

Modal.setAppElement("#root");

const Slider = (props) => {
  const sliderRef = useRef();

  const config = {
    className: "center",
    infinite: true,
    centerMode: true,
    speed: 2500,
    // rtl: true,
    slidesToShow: 3,
    cssEase: "linear",
    afterChange: (e) => {
      setCurrentIndex(e);
    },
    dots: false,
    infinite: true,
    // speed: 500,
    slidesToShow: 5,
    // slidesToScroll: 1,
    centerMode: true,
    centerPadding: "20px",
    responsive: [
      {
        breakpoint: 1400,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 3,
          infinite: true,
          dots: false,
        },
      },
      {
        breakpoint: 1000,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
          initialSlide: 2,
        },
      },
      {
        breakpoint: 680,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  let slider;

  // useEffect(() => {

  //   this.slider.slickGoTo(props.jumpItem);

  // }, [props.jumpItem]);

  const { connection } = useConnection();
  const wallet = useWallet();

  const [arraytoLoop, setarraytoLoop] = useState(SliderData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stopIndex, setStopIndex] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [winnerItem, setWinnerItem] = useState(arraytoLoop[stopIndex]);
  // let stopIndex = 10;

  useEffect(async () => {
    let sData = await getItemInfos(wallet);
    var repeatedData = null;
    if (sData) {
      let tmpData = [...arraytoLoop];
      for (let i = 0; i < sData.ratioList.length; i++) {
        tmpData[i].percent = sData.ratioList[i] + "%";
        tmpData[i].price = "" + sData.amountList[i];
      }
      repeatedData = ReturnRepeatedData(tmpData);
    } else {
      repeatedData = ReturnRepeatedData(arraytoLoop);
    }
    setarraytoLoop(repeatedData);
  }, []);

  let subtitle;

  const [modalIsOpen, setIsOpen] = React.useState(false);
  function openModal() {
    setIsOpen(true);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
    subtitle.style.color = "#000000";
  }

  function closeModal() {
    setIsOpen(false);
    spinTheWheel();
  }

  const GetIndex = () => {
    var times = 0;
    var i = currentIndex;
    while (times < 6) {
      if (arraytoLoop[i].id && arraytoLoop[i].id == stopIndex) {
        times++;
      }
      i++;
      if (i === 120) {
        i = 0;
      }
    }
    return i - 1;
  };

  const spinTheWheel = async () => {
    var pauseIndex = GetIndex();
    setCurrentIndex(pauseIndex);
    sliderRef.current.slickGoTo(pauseIndex, false);
  };

  const OnClickSpin = async () => {
    setIsLoading(true);
    const itemIndex = await spinWheel(wallet, connection);
    setStopIndex(itemIndex + 1);
    setIsLoading(false);
    openModal();
  };

  return (
    <div className="container" style={{ marginTop: "50px" }}>
      {isLoading && <Loader />}
      <div>
        <Modal
          isOpen={modalIsOpen}
          onAfterOpen={afterOpenModal}
          onRequestClose={closeModal}
          style={customStyles}
          contentLabel="Example Modal"
        >
          <h2 ref={(_subtitle) => (subtitle = _subtitle)}>You've won</h2>
          <h3>{winnerItem.price} </h3>
          <img src={winnerItem.imgae} alt="" />
        </Modal>
      </div>
      <SliderJS {...config} ref={sliderRef}>
        {arraytoLoop &&
          arraytoLoop.map((val, ind) => {
            return (
              <div className="slider" key={ind}>
                <img className="slider_bg" src={val.backgroundImage} alt="" />
                <div className="slider_box_content">
                  <div className="percent_and_desc_box">
                    <div className="percent">{val.percent}</div>
                    <div className="desc">{val.desc}</div>
                  </div>
                  <img className="slider_img" src={val.imgae} alt="" />
                  <div className="price">
                    <p>
                      {val.price}
                      <sup>USDC</sup>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
      </SliderJS>
      <div className="detail">
        {/* <p onClick={spinTheWheel}>Try for free</p> */}
        <button onClick={OnClickSpin}>Open Box</button>
      </div>
    </div>
  );
};

export default Slider;
