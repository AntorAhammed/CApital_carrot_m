import React, { useState } from "react";
import "./admin.css";
function Admin() {
  const [rows, setRows] = useState([
    {
      price: "",
      walletAddress: "",
      winningPercentage: "",
      type: "nft",
    },
  ]);

  const OnChange = (e, index) => {
    setRows((prev) =>
      Object.values({
        ...prev,
        [index]: { ...prev[index], [e.target.name]: e.target.value },
      })
    );
  };

  const AddRow = () => {
    if (rows.length < 15) {
      setRows((prev) => [
        ...prev,
        {
          price: "",
          walletAddress: "",
          winningPercentage: "",
          type: "nft",
        },
      ]);
    }
  };

  const RemoveRow = (index) => {
    if (rows.length > 1) {
      var rowsTemp = [...rows];
      rowsTemp.splice(index, 1);
      setRows(rowsTemp);
    }
  };

  return (
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
        onClick={() => console.log(rows)}
      >
        Submit
      </button>
    </div>
  );
}

export default Admin;
