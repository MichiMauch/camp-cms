import React from "react";

interface CardProps {
  title: string;
  image: string;
  location: string;
  country: string;
  dateFrom: string;
  dateTo: string;
}

const Card: React.FC<CardProps> = ({
  title,
  image,
  location,
  country,
  dateFrom,
  dateTo,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-600">
          {location}, {country}
        </p>
        <p className="text-sm text-gray-600">
          {dateFrom} - {dateTo}
        </p>
      </div>
    </div>
  );
};

export default Card;
