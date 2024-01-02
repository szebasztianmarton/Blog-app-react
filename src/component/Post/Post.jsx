import React from "react";

const PostCard = ({ title, content }) => {
  return (
    <div className="bg-gray-200 p-4 blog-card">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p>{content}</p>
    </div>
  );
};

export default PostCard;
