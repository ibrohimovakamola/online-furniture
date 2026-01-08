import React from "react";

const Modal = ({ text, icon }) => {
  return (
    <div className="modal">
      <h3>
        <i className={icon}></i> {text}
      </h3>
    </div>
  );
};

export default Modal;
