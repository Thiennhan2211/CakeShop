import './App.css';
import React, { Component } from 'react';
import MyProvider from './contexts/MyProvider';
import AppToastHost from './components/AppToastHost';
import Login from './components/LoginComponent';
import Main from './components/MainComponent';

class App extends Component {
  render() {
    return (
      <MyProvider>
          <AppToastHost />
          <Login />
          <Main />
      </MyProvider>
    );
  }
}

export default App;
