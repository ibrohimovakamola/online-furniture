import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "../assets/styles/product-detail-skeleton.scss";

const ProductDetailSkeleton = () => {
  return (
    <div className="detail-skeleton">
      <div className="detail-skeleton--main">
        <div className="detail-skeleton--images">
          <Skeleton className="detail-skeleton--big-img" />
          <div className="detail-skeleton--thumbs">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="detail-skeleton--thumb" />
              ))}
          </div>
        </div>
        <div className="detail-skeleton--info">
          <Skeleton width="70%" height={30} />
          <Skeleton width="40%" height={20} />
          <Skeleton width="30%" height={30} />
          <Skeleton count={3} />
          <Skeleton width="100%" height={1} />

          <div className="detail-skeleton--buttons">
            <Skeleton width={120} height={45} />
            <Skeleton width={160} height={45} />
            <Skeleton width={45} height={45} />
          </div>

          <Skeleton height={80} />
          <Skeleton height={80} />
        </div>
      </div>
      <div className="detail-skeleton--related">
        <Skeleton width={200} height={25} />
        <div className="detail-skeleton--related-list">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="related-skeleton-card" />
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
