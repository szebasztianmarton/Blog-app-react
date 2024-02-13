import React from "react";
import "./App.css";
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';

//Import Components

import AddBlog from "./component/AddBlog/AddBlog";



/*POCKET */
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// list and filter "example" collection records
const result = await pb.collection('example').getList(1, 20, {
    filter: 'status = true && created > "2022-08-01 10:00:00"'
});

// authenticate as auth collection record
const userData = await pb.collection('users').authWithPassword('test@example.com', '123456');

// or as super-admin
const adminData = await pb.admins.authWithPassword('test@example.com', '123456');

// and much more...



  
const App = () => {
  return (
    <div className="main-container">
      <h1 className="main-heading">
        Blog App using React Js 
      </h1>
      <Posts />
    </div>
  );
};
  
export default App;