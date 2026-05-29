import React from "react";
import MainImg from "../assets/images/photo_2026-02-14_22-23-52.jpg";
import "../assets/styles/about.scss";
import Worker from "../assets/images/worker.png";
import BreadCrumbs from "../components/BreadCrumbs";

const About = () => {
  const aboutCard = [
    {
      icon: "fa-solid fa-shop",
      title: "10.5k",
      desc: "Sallers active our site",
    },
    {
      icon: "fa-solid fa-shop",
      title: "10.5k",
      desc: "Sallers active our site",
    },
    {
      icon: "fa-solid fa-shop",
      title: "10.5k",
      desc: "Sallers active our site",
    },
    {
      icon: "fa-solid fa-shop",
      title: "10.5k",
      desc: "Sallers active our site",
    },
  ];

  const workersList = [
    {
      img: Worker,
      name: "Tom Cruise",
      position: "Founder & Chairman",
    },
    {
      img: Worker,
      name: "Tom Cruise",
      position: "Founder & Chairman",
    },
    {
      img: Worker,
      name: "Tom Cruise",
      position: "Founder & Chairman",
    },
  ];
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
    <div className="about-wrapper">
      <div className="container">
        <div className="about-contain">
          <BreadCrumbs/>
          <div className="about">
            <div className="about-info">
              <h2 className="about-title">Our story</h2>
              <p className="about-text">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Laudantium recusandae minus, reprehenderit facere beatae sequi
                vel laboriosam eum assumenda, earum fugit, delectus autem quasi
                suscipit expedita quidem illo culpa rem corporis. Odit,
                blanditiis sapiente est nobis fuga minus modi accusantium.
              </p>
              <p className="about-text">
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quis
                aut nostrum sunt, molestiae officia suscipit. Placeat
                consectetur eaque laborum nulla.
              </p>
            </div>
            <div className="about-img">
              <img src={MainImg} alt="" />
            </div>
          </div>
        </div>
        <div className="about-cards">
          {aboutCard.map((card) => {
            return (
              <div className="about-card">
                <button>
                  <i className={card.icon}></i>
                </button>
                <h4>{card.title}</h4>
                <p>{card.desc}</p>
              </div>
            );
          })}
        </div>
        <div className="about-workers">
          {workersList.map((worker) => {
            return (
              <div className="about-worker--card">
                <div className="about-worker--img">
                  <img src={worker.img} alt="" />
                </div>
                <h4>{worker.name}</h4>
                <p>{worker.position}</p>
                <div className="about-worker--social">
                  <i class="fa-brands fa-twitter"></i>
                  <i class="fa-brands fa-instagram"></i>
                  <i class="fa-brands fa-linkedin-in"></i>
                </div>
              </div>
            );
          })}
        </div>
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
    </div>
  );
};

export default About;
