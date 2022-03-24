import React, { useEffect, useState } from "react";
import "./admin.css";
import { initialize, setAdminInfos } from "../../contexts/helpers";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { NotificationManager } from "react-notifications";
import { getItemInfos } from "../../contexts/helpers";

let isInitialized = false;


function Admin() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const REWARD_TOKEN_COUNT_PER_ITEM = 10;
  const MAX_ITEM_COUNT = 15;

  const [isLoaded, setLoaded] = useState(false);

  const [rows, setRows] = useState([
    {
      price: "",
      walletAddress: "",
      winningPercentage: "",
      type: "nft",
    },
  ]);

  useEffect(() => {
    const asyncGetItemInfos = async () => {
      setLoaded(false);

      await initialize(wallet, connection);

      let sData = null;
      try {
        sData = await getItemInfos(connection);
      } catch (error) {
        console.log('error to getItemInfos from admin', error);
      }
      console.log('tttttttttttttttt', sData);

      let tmpRows = [];
      if (sData) {
        for (let i = 0; i < sData.ratioList.length; i++) {
          let row = {
            price: "" + sData.amountList[i].toNumber(),
            winningPercentage: "" + sData.ratioList[i],
            type: "nft",
          };

          let tokenList = sData.rewardMintList[i];
          let walletAddress = "";
          for (let k = 0; k < tokenList.count; k++) {
            walletAddress += tokenList.itemMintList[k].toBase58();
            if (k != tokenList.count - 1) {
              walletAddress += ",";
            }
          }
          row.walletAddress = walletAddress;
          tmpRows.push(row);
        }
        if (tmpRows.length != 0) {
          setRows(tmpRows);
        }
      }
      setLoaded(true);
      isInitialized = true;
    }

    if (isInitialized == false) {
      asyncGetItemInfos();
    }
  }, []);

  const OnChange = (e, index) => {
    setRows((prev) =>
      Object.values({
        ...prev,
        [index]: { ...prev[index], [e.target.name]: e.target.value },
      })
    );
  };

  const AddRow = () => {
    if (rows.length < MAX_ITEM_COUNT) {
      setRows((prev) => [
        ...prev,
        {
          price: "",
          walletAddress: "",
          winningPercentage: "",
          type: "nft",
        },
      ]);
    } else {
      NotificationManager.warning('max count is 15.');
    }
  };

  const RemoveRow = (index) => {
    if (rows.length > 1) {
      var rowsTemp = [...rows];
      rowsTemp.splice(index, 1);
      setRows(rowsTemp);
    }
  };

  const onSetRows = async (e) => {
    let itemInfos = [];
    for (let i = 0; i < rows.length; i++) {
      let strAddrList = rows[i].walletAddress.split(',');
      let addrCnt = strAddrList.length;
      if (addrCnt > REWARD_TOKEN_COUNT_PER_ITEM) {
        addrCnt = REWARD_TOKEN_COUNT_PER_ITEM;
        let msgTitle = i + 1 + " item's token count is over flow";
        let msgCont = "Max Token Count is " + REWARD_TOKEN_COUNT_PER_ITEM + ". ";
        NotificationManager.warning(msgTitle, msgCont, 3000);
      }
      let tokenAddrList = [];
      for (let k = 0; k < addrCnt; k++) {
        let addr = strAddrList[k].trim();
        tokenAddrList.push(addr);
        console.log('token address : ', addr);
      }
      itemInfos.push({
        tokenAddrList: tokenAddrList,
        price: rows[i].type === "nft" ? 1 : rows[i].price,
        winningPercentage: rows[i].winningPercentage,
      });
    }

    // for (let i = 0; i < MAX_ITEM_COUNT; i++) {
    //   let tokenAddrList = ["FNY5Bb9bsYc2cJCrXt28WtjqgxFbEk5Gsc4cvHzUtHXd"];
    //   itemInfos.push({
    //     tokenAddrList: tokenAddrList,
    //     price: i,
    //     winningPercentage: i == 14 ? 2 : 7,
    //   });
    // }

    console.log('item infos : ', itemInfos);

    setAdminInfos(wallet, connection, itemInfos);
  }

  return !isLoaded ? (
    <div><h1>Loading...</h1></div>) :
    (
    <div className="admin">
      <div className="admin-header">
        <button className="custom-btn add-btn" onClick={AddRow}>
          {" "}
          Add{" "}
        </button>
      </div>
      {rows &&
        rows.map((row, index) => {
          return (
            <div key={index} className="admin-flex">
              <div className="admin-div">
                <div className="input-group">
                  <label htmlFor="">Select NFT/Token</label>
                  <select
                    className="custom-input"
                    onChange={(e) => OnChange(e, index)}
                    name="type"
                  >
                    <option selected value="nft">
                      NFT
                    </option>
                    <option value="token">Token</option>
                  </select>
                </div>
                <div className="input-group">
                  <label htmlFor="">Wallet Address</label>
                  <input
                    onChange={(e) => OnChange(e, index)}
                    name="walletAddress"
                    type="text"
                    className="custom-input"
                    placeholder="Wallet Address"
                    value={row.walletAddress}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="">Price</label>
                  <input
                    onChange={(e) => OnChange(e, index)}
                    name="price"
                    type="text"
                    className="custom-input"
                    placeholder="Price"
                    value={row.price}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="">Winning Percentage</label>
                  <input
                    onChange={(e) => OnChange(e, index)}
                    type="text"
                    name="winningPercentage"
                    className="custom-input"
                    placeholder="Winning Percentage"
                    value={row.winningPercentage}
                  />
                </div>
              </div>
              <button
                className="custom-btn remove-btn"
                onClick={() => RemoveRow(index)}
              >
                Remove
              </button>
            </div>
          );
        })}

      <hr />
      <button
        className="submit-btn custom-btn"
        onClick={onSetRows}
      >
        Submit
      </button>
    </div>
  );
}

export default Admin;
