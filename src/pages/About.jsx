import React from "react";
import MainImg from "../assets/images/aboutMain.jpg"
import "../assets/styles/about.scss"

const About = () => {
  const aboutCard = [
    {
      icon: 'fa-solid fa-shop',
      title: '10.5k',
      desc: 'Sallers active our site'
    },
    {
      icon: 'fa-solid fa-shop',
      title: '10.5k',
      desc: 'Sallers active our site'
    },
    {
      icon: 'fa-solid fa-shop',
      title: '10.5k',
      desc: 'Sallers active our site'
    },
    {
      icon: 'fa-solid fa-shop',
      title: '10.5k',
      desc: 'Sallers active our site'
    },
  ]
  return (
    <div className="about-wrapper">
      <div className="container">
        <div className="about-contain">
        <div className="about">
          <div className="about-info">
            <h2 className="about-title">Our story</h2>
            <p className="about-text">Lorem ipsum dolor sit amet consectetur adipisicing elit. Laudantium recusandae minus, reprehenderit facere beatae sequi vel laboriosam eum assumenda, earum fugit, delectus autem quasi suscipit expedita quidem illo culpa rem corporis. Odit, blanditiis sapiente est nobis fuga minus modi accusantium.
            </p>
            <p className="about-text">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quis aut nostrum sunt, molestiae officia suscipit. Placeat consectetur eaque laborum nulla.</p>
          </div>
          <div className="about-img">
            <img src={MainImg} alt="" />
          </div>
        </div>
        </div>
        <div className="about-cards">
          {
            aboutCard.map((card)=>{
              return <div className="about-card">
                <button><i className={card.icon}></i></button>
                <h4>{card.title}</h4>
                <p>{card.desc}</p>
              </div>
            })
          }
        </div>
      </div>
    </div>
  );
};

export default About;
