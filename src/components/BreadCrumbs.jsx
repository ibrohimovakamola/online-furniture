import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../assets/styles/breadcrumbs.scss";

const BreadCrumbs = ({ currentName }) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  return (
    <div className="breadcrumbs">
      <Link to="/" className="breadcrumbs-link">
        Home
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;
        const label =
          isLast && currentName ? currentName : decodeURIComponent(name);

        return (
          <span key={index}>
            <span className="breadcrumbs-separator"> / </span>

            {isLast ? (
              <span className="breadcrumbs-current">{label}</span>
            ) : (
              <Link to={routeTo} className="breadcrumbs-link">
                {decodeURIComponent(name)}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default BreadCrumbs;
