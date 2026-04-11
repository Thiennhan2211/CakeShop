import './App.css';
import './customer-overrides.css';
import { BrowserRouter } from 'react-router-dom';
import React, { Component } from 'react';
import Main from './components/MainComponent';
import AppToastHost from './components/AppToastHost';
import MyProvider from './contexts/MyProvider';

class App extends Component {
  render() {
    return (
      <MyProvider>
        <BrowserRouter>
          <AppToastHost />
          <Main />
        </BrowserRouter>
      </MyProvider>
    );
  }
}

export default App;
