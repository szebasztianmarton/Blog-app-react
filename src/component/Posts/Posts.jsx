import React from 'react';

const Posts = () => {
    const posts = [
        { id: 1, title: 'Post 1', content: 'This is the content of post 1' },
        { id: 2, title: 'Post 2', content: 'This is the content of post 2' },
        { id: 3, title: 'Post 3', content: 'This is the content of post 3' },
    ];

    return (
        <div>
            {posts.map((post) => (
                <div key={post.id}>
                    <h2>{post.title}</h2>
                    <p>{post.content}</p>
                </div>
            ))}
        </div>
    );
};

export default Posts;
