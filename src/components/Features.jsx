import React from "react";

const Features = () => {
    const fetaureList = [
        {
          img: "fa-regular fa-headphones",
          title: "Free and fast delivery",
          text: "Free delivery for all orders over $140",
        },
        {
          img: "fa-regular fa-headphones",
          title: "Free and fast delivery",
          text: "Free delivery for all orders over $140",
        },
        {
          img: "fa-regular fa-headphones",
          title: "Free and fast delivery",
          text: "Free delivery for all orders over $140",
        },
      ];
  return (
    <div className="container">
        <div className="about-features">
          {fetaureList.map((feature) => {
            return (
              <div className="about-feature--card">
                <div className="about-feature--icon">
                  <i className={feature.img}></i>
                </div>

                <h4>{feature.title}</h4>
                <p>{feature.text}</p>
              </div>
            );
          })}
        </div>
      </div>
  );
};

export default Features;
