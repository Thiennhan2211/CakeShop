import React, { Component } from 'react';
import MyContext from './MyContext';

class MyProvider extends Component {
  constructor(props) {
    super(props);
    this.state = { // global state
      // variables
      token: '',
      customer: null,
      mycart: [],
      appliedVoucher: null,
      // functions
      setToken: this.setToken,
      setCustomer: this.setCustomer,
      setMycart: this.setMycart,
      setAppliedVoucher: this.setAppliedVoucher
    };
  }

  setToken = (value) => {
    this.setState({ token: value });
  }

  setCustomer = (value) => {
    this.setState({ customer: value });
  }
  setMycart = (value) => {
    this.setState({ mycart: value });
  }

  setAppliedVoucher = (value) => {
    this.setState({ appliedVoucher: value });
  }

  render() {
    return (
      <MyContext.Provider value={this.state}>
        {this.props.children}
      </MyContext.Provider>
    );
  }
}

export default MyProvider;
